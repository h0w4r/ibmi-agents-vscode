import { z } from "zod";
import { createIbmiHeader } from "./core/headers.js";
import { buildCompilePlan } from "./core/compilePlan.js";
import { getSafeCommands } from "./core/commandSafety.js";
import { toIbmiMcpError } from "./core/errors.js";
import { redactSecrets } from "./core/redaction.js";
import type { Db2Connector } from "./connectors/db2.js";
import type { CommandConnector } from "./connectors/command.js";
import type { SpoolConnector } from "./connectors/spool.js";
import type { DocsConnector } from "./connectors/docs.js";

export interface ToolContext {
  db2: Db2Connector;
  command: CommandConnector;
  spool: SpoolConnector;
  docs: DocsConnector;
}

const COMPILE_LANGUAGES = [
  "RPGLE",
  "RPGMOD",
  "SQLRPGLE",
  "SQLRPGMOD",
  "CLLE",
  "DSPF",
  "PF",
  "LF",
  "CMD",
  "PGM",
  "SRVPGM"
] as const;

const TOOL_OUTPUT_SCHEMA = {
  data: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      category: z.string(),
      message: z.string(),
      retryable: z.boolean(),
      details: z.record(z.unknown()).optional()
    })
    .optional()
};

function asResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: { data }
  };
}

function asError(error: unknown) {
  const typed = toIbmiMcpError(error);
  const payload = {
    code: typed.code,
    category: typed.category,
    message: redactSecrets(typed.message),
    retryable: typed.retryable,
    details: typed.details
  };

  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: payload }, null, 2) }],
    structuredContent: { error: payload },
    isError: true
  };
}

function registerSafeTool(
  server: {
    registerTool: (
      name: string,
      config: Record<string, unknown>,
      handler: (args: any) => Promise<any>
    ) => void;
  },
  name: string,
  config: Record<string, unknown>,
  handler: (args: any) => Promise<unknown>
): void {
  server.registerTool(name, { ...config, outputSchema: TOOL_OUTPUT_SCHEMA }, async (args) => {
    try {
      return asResult(await handler(args));
    } catch (error) {
      return asError(error);
    }
  });
}

export function registerIbmiTools(
  server: {
    registerTool: (
      name: string,
      config: Record<string, unknown>,
      handler: (args: any) => Promise<any>
    ) => void;
  },
  context: ToolContext
): void {
  registerSafeTool(
    server,
    "ibmi.profile.check",
    {
      description: "Valida el perfil IBM i configurado sin reintentar si falla autenticacion.",
      inputSchema: {}
    },
    async () => context.db2.checkProfile()
  );

  registerSafeTool(
    server,
    "ibmi.system.capabilities",
    {
      description: "Detecta version IBM i y disponibilidad de servicios SQL usados por el MCP.",
      inputSchema: {}
    },
    async () => {
      const system = await context.db2.queryReadonly(
        "SELECT OS_NAME, OS_VERSION, OS_RELEASE, HOST_NAME, TOTAL_CPUS, CONFIGURED_CPUS, CONFIGURED_MEMORY FROM SYSIBMADM.ENV_SYS_INFO"
      );
      const services = await context.db2.queryReadonly(
        `SELECT ROUTINE_SCHEMA AS SERVICE_SCHEMA, ROUTINE_NAME AS SERVICE_NAME, 'ROUTINE' AS SERVICE_KIND
           FROM QSYS2.SYSROUTINES
          WHERE ROUTINE_SCHEMA IN ('QSYS2', 'SYSTOOLS')
            AND ROUTINE_NAME IN ('JOBLOG_INFO', 'IFS_READ', 'OBJECT_STATISTICS', 'SPOOLED_FILE_DATA')
          UNION ALL
         SELECT TABLE_SCHEMA AS SERVICE_SCHEMA, TABLE_NAME AS SERVICE_NAME, 'VIEW' AS SERVICE_KIND
           FROM QSYS2.SYSTABLES
          WHERE TABLE_SCHEMA IN ('QSYS2', 'SYSTOOLS')
            AND TABLE_NAME IN ('OUTPUT_QUEUE_ENTRIES', 'MESSAGE_FILE_DATA')
          ORDER BY SERVICE_SCHEMA, SERVICE_NAME`
      );

      return {
        profile: await context.db2.checkProfile(),
        system: system[0] ?? null,
        services,
        note: "La disponibilidad depende de la version IBM i, Technology Refresh y PTF instalados."
      };
    }
  );

  registerSafeTool(
    server,
    "ibmi.db2.query.readonly",
    {
      description: "Ejecuta una consulta Db2 for i estrictamente read-only con limite por defecto.",
      inputSchema: { sql: z.string().min(1), params: z.array(z.unknown()).optional() }
    },
    async ({ sql, params = [] }) => {
      const normalizedSql = context.db2.normalizeReadonlySql(sql);
      return {
        sql: normalizedSql,
        rowLimitPolicy: "IBMI_MAX_ROWS",
        rows: await context.db2.queryReadonly(sql, params)
      };
    }
  );

  registerSafeTool(
    server,
    "ibmi.db2.catalog.search",
    {
      description: "Busca tablas, vistas y columnas en catalogos Db2 for i.",
      inputSchema: { term: z.string().min(1), schema: z.string().optional() }
    },
    async ({ term, schema }) => {
      const objectFilters = ["(UPPER(TABLE_NAME) LIKE ? OR UPPER(TABLE_TEXT) LIKE ?)"];
      const columnFilters = ["(UPPER(COLUMN_NAME) LIKE ? OR UPPER(COLUMN_TEXT) LIKE ?)"];
      const objectParams: unknown[] = [`%${term.toUpperCase()}%`, `%${term.toUpperCase()}%`];
      const columnParams: unknown[] = [...objectParams];
      if (schema) {
        objectFilters.push("TABLE_SCHEMA = ?");
        columnFilters.push("TABLE_SCHEMA = ?");
        objectParams.push(schema.toUpperCase());
        columnParams.push(schema.toUpperCase());
      }

      const objects = await context.db2.queryReadonly(
        `SELECT TABLE_SCHEMA, TABLE_NAME, SYSTEM_TABLE_NAME, TABLE_TYPE, TABLE_TEXT
           FROM QSYS2.SYSTABLES
          WHERE ${objectFilters.join(" AND ")}
          ORDER BY TABLE_SCHEMA, TABLE_NAME`,
        objectParams
      );
      const columns = await context.db2.queryReadonly(
        `SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, SYSTEM_COLUMN_NAME, ORDINAL_POSITION, DATA_TYPE, COLUMN_TEXT
           FROM QSYS2.SYSCOLUMNS2
          WHERE ${columnFilters.join(" AND ")}
          ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION`,
        columnParams
      );

      return { term, schema: schema?.toUpperCase(), objects, columns };
    }
  );

  registerSafeTool(
    server,
    "ibmi.db2.object.describe",
    {
      description: "Describe columnas, indices y claves de una tabla/vista Db2 for i.",
      inputSchema: { schema: z.string().min(1), object: z.string().min(1) }
    },
    async ({ schema, object }) => {
      const normalizedSchema = schema.toUpperCase();
      const normalizedObject = object.toUpperCase();
      const columns = await context.db2.queryReadonly(
        "SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, SYSTEM_COLUMN_NAME, ORDINAL_POSITION, DATA_TYPE, LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, CCSID, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TEXT FROM QSYS2.SYSCOLUMNS2 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
        [normalizedSchema, normalizedObject]
      );
      const indexes = await context.db2.queryReadonly(
        "SELECT INDEX_SCHEMA, INDEX_NAME, SYSTEM_INDEX_SCHEMA, SYSTEM_INDEX_NAME, TABLE_SCHEMA, TABLE_NAME, IS_UNIQUE, COLUMN_COUNT, INDEX_TEXT FROM QSYS2.SYSINDEXES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY INDEX_SCHEMA, INDEX_NAME",
        [normalizedSchema, normalizedObject]
      );
      const keys = await context.db2.queryReadonly(
        `SELECT K.INDEX_SCHEMA, K.INDEX_NAME, K.COLUMN_NAME, K.SYSTEM_COLUMN_NAME,
                K.ORDINAL_POSITION, K.ORDERING, K.COLUMN_IS_EXPRESSION, K.KEY_EXPRESSION
           FROM QSYS2.SYSKEYS K
           JOIN QSYS2.SYSINDEXES I
             ON I.INDEX_SCHEMA = K.INDEX_SCHEMA AND I.INDEX_NAME = K.INDEX_NAME
          WHERE I.TABLE_SCHEMA = ? AND I.TABLE_NAME = ?
          ORDER BY K.INDEX_SCHEMA, K.INDEX_NAME, K.ORDINAL_POSITION`,
        [normalizedSchema, normalizedObject]
      );

      return { schema: normalizedSchema, object: normalizedObject, columns, indexes, keys };
    }
  );

  registerSafeTool(
    server,
    "ibmi.joblog.get",
    {
      description: "Consulta job log por nombre calificado de job IBM i.",
      inputSchema: { qualifiedJobName: z.string().min(1) }
    },
    async ({ qualifiedJobName }) =>
      context.db2.queryReadonly(
        "SELECT ORDINAL_POSITION, MESSAGE_ID, MESSAGE_TYPE, MESSAGE_TEXT, MESSAGE_SECOND_LEVEL_TEXT FROM TABLE(QSYS2.JOBLOG_INFO(?)) ORDER BY ORDINAL_POSITION",
        [qualifiedJobName]
      )
  );

  registerSafeTool(
    server,
    "ibmi.spool.list",
    {
      description: "Lista archivos spool recientes por job o usuario.",
      inputSchema: { jobName: z.string().optional(), userName: z.string().optional() }
    },
    async ({ jobName, userName }) => context.spool.list(jobName, userName)
  );

  registerSafeTool(
    server,
    "ibmi.spool.get",
    {
      description: "Lee datos de un archivo spool con paginacion.",
      inputSchema: {
        jobName: z.string().min(1),
        spooledFileName: z.string().min(1),
        spooledFileNumber: z.number().int().positive().optional(),
        startLine: z.number().int().positive().default(1),
        maxLines: z.number().int().min(1).max(1000).default(200)
      }
    },
    async ({ jobName, spooledFileName, spooledFileNumber, startLine, maxLines }) =>
      context.spool.get(jobName, spooledFileName, spooledFileNumber, startLine, maxLines)
  );

  registerSafeTool(
    server,
    "ibmi.object.info",
    {
      description: "Obtiene metadata de objetos IBM i usando servicios QSYS2.",
      inputSchema: {
        library: z.string().min(1),
        object: z.string().min(1),
        objectType: z.string().default("*ALL")
      }
    },
    async ({ library, object, objectType }) =>
      context.db2.queryReadonly(
        "SELECT * FROM TABLE(QSYS2.OBJECT_STATISTICS(?, ?)) WHERE OBJNAME = ?",
        [library.toUpperCase(), objectType.toUpperCase(), object.toUpperCase()]
      )
  );

  registerSafeTool(
    server,
    "ibmi.source.member.read",
    {
      description: "Lee un miembro fuente IBM i a traves de IFS_READ sobre /QSYS.LIB.",
      inputSchema: {
        library: z.string().min(1),
        file: z.string().min(1),
        member: z.string().min(1)
      }
    },
    async ({ library, file, member }) => {
      const path = `/QSYS.LIB/${library.toUpperCase()}.LIB/${file.toUpperCase()}.FILE/${member.toUpperCase()}.MBR`;
      return context.db2.queryReadonly("SELECT LINE FROM TABLE(QSYS2.IFS_READ(PATH_NAME => ?))", [path]);
    }
  );

  registerSafeTool(
    server,
    "ibmi.compile.plan",
    {
      description: "Genera comandos de compilacion y binding IBM i sin ejecutarlos.",
      inputSchema: {
        language: z.enum(COMPILE_LANGUAGES),
        library: z.string().min(1),
        object: z.string().min(1),
        sourceFile: z.string().min(1).optional(),
        sourceMember: z.string().min(1).optional(),
        sourceLibrary: z.string().optional(),
        debugView: z.enum(["*SOURCE", "*LIST", "*STMT", "*ALL", "*NONE"]).optional(),
        commit: z.enum(["*NONE", "*CHG", "*CS", "*ALL", "*RR"]).optional(),
        targetRelease: z.enum(["*CURRENT", "*PRV"]).optional(),
        activationGroup: z.string().min(1).optional(),
        bindingDirectories: z.array(z.string().min(1)).max(50).optional(),
        modules: z.array(z.string().min(1)).max(200).optional(),
        program: z.string().min(1).optional(),
        rpgPreprocessor: z.enum(["*NONE", "*LVL1", "*LVL2"]).optional()
      }
    },
    async (args) => buildCompilePlan(args)
  );

  registerSafeTool(
    server,
    "ibmi.message.explain",
    {
      description: "Busca orientacion documental local para mensajes RNF, SQL, CPF o MCH.",
      inputSchema: { messageId: z.string().min(3) }
    },
    async ({ messageId }) => context.docs.search(messageId, 5)
  );

  registerSafeTool(
    server,
    "ibmi.message.retrieve",
    {
      description: "Recupera texto, segundo nivel y severidad de un mensaje desde un message file IBM i.",
      inputSchema: {
        messageId: z.string().regex(/^[A-Za-z0-9]{7}$/),
        messageFile: z.string().regex(/^[A-Za-z#$@][A-Za-z0-9_$#@]{0,9}$/).default("QCPFMSG"),
        messageFileLibrary: z
          .string()
          .regex(/^[A-Za-z#$@][A-Za-z0-9_$#@]{0,9}$/)
          .default("QSYS")
      }
    },
    async ({ messageId, messageFile, messageFileLibrary }) =>
      context.db2.queryReadonly(
        `SELECT MESSAGE_FILE_LIBRARY, MESSAGE_FILE, MESSAGE_ID, MESSAGE_TEXT,
                MESSAGE_SECOND_LEVEL_TEXT, SEVERITY, MESSAGE_DATA_COUNT, MESSAGE_DATA,
                CREATION_DATE, MODIFICATION_DATE, CCSID
           FROM QSYS2.MESSAGE_FILE_DATA
          WHERE MESSAGE_FILE_LIBRARY = ? AND MESSAGE_FILE = ? AND MESSAGE_ID = ?`,
        [messageFileLibrary.toUpperCase(), messageFile.toUpperCase(), messageId.toUpperCase()]
      )
  );

  registerSafeTool(
    server,
    "ibmi.system_api.lookup",
    {
      description: "Busca APIs del sistema IBM i como QCMDEXC, QCAPCMD o QMHRTVM.",
      inputSchema: { apiName: z.string().min(2) }
    },
    async ({ apiName }) => context.docs.search(apiName, 8)
  );

  registerSafeTool(
    server,
    "ibmi.docs.search",
    {
      description: "Busca por terminos en la documentacion IBM i local y devuelve secciones y fuentes.",
      inputSchema: { query: z.string().min(2), limit: z.number().int().min(1).max(20).default(8) }
    },
    async ({ query, limit }) => context.docs.search(query, limit)
  );

  registerSafeTool(
    server,
    "ibmi.command.preview",
    {
      description: `Genera vista previa de comandos CL seguros. Allowlist: ${getSafeCommands().join(", ")}.`,
      inputSchema: { command: z.string().min(1) }
    },
    async ({ command }) => context.command.preview(command)
  );

  registerSafeTool(
    server,
    "ibmi.command.run_safe",
    {
      description: "Ejecuta un comando CL de consulta definido en allowlist, con auditoria local.",
      inputSchema: { command: z.string().min(1) }
    },
    async ({ command }) => context.command.runSafe(command)
  );

  registerSafeTool(
    server,
    "ibmi.header.create",
    {
      description: "Genera cabecera obligatoria para nuevos fuentes IBM i.",
      inputSchema: {
        language: z.enum(["RPGLE", "SQLRPGLE", "CLLE", "DDS"]),
        author: z.string().min(1),
        purpose: z.string().min(1),
        requirement: z.string().min(1)
      }
    },
    async (args) => ({ header: createIbmiHeader(args) })
  );
}
