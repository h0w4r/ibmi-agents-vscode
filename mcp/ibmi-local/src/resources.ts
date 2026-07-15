import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "./tools.js";

export function registerIbmiResources(server: McpServer, context: ToolContext): void {
  server.registerResource(
    "ibmi-docs",
    new ResourceTemplate("ibmi://docs/{categoria}", { list: undefined }),
    {
      title: "Documentacion IBM i local",
      description: "Guias locales por categoria IBM i.",
      mimeType: "text/markdown"
    },
    async (uri, variables) => {
      const category = String(variables.categoria);
      const text = await context.docs.readCategory(category);
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text }] };
    }
  );

  server.registerResource(
    "ibmi-catalog",
    new ResourceTemplate("ibmi://catalog/{schema}/{object}", { list: undefined }),
    {
      title: "Catalogo Db2 for i",
      description: "Descripcion de columnas de un objeto Db2 for i.",
      mimeType: "application/json"
    },
    async (uri, variables) => {
      const schema = String(variables.schema).toUpperCase();
      const object = String(variables.object).toUpperCase();
      const columns = await context.db2.queryReadonly(
        "SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, SYSTEM_COLUMN_NAME, ORDINAL_POSITION, DATA_TYPE, LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, CCSID, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TEXT FROM QSYS2.SYSCOLUMNS2 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
        [schema, object]
      );
      const indexes = await context.db2.queryReadonly(
        "SELECT INDEX_SCHEMA, INDEX_NAME, SYSTEM_INDEX_SCHEMA, SYSTEM_INDEX_NAME, IS_UNIQUE, COLUMN_COUNT, INDEX_TEXT FROM QSYS2.SYSINDEXES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY INDEX_SCHEMA, INDEX_NAME",
        [schema, object]
      );
      const keys = await context.db2.queryReadonly(
        `SELECT K.INDEX_SCHEMA, K.INDEX_NAME, K.COLUMN_NAME, K.SYSTEM_COLUMN_NAME,
                K.ORDINAL_POSITION, K.ORDERING, K.COLUMN_IS_EXPRESSION, K.KEY_EXPRESSION
           FROM QSYS2.SYSKEYS K
           JOIN QSYS2.SYSINDEXES I
             ON I.INDEX_SCHEMA = K.INDEX_SCHEMA AND I.INDEX_NAME = K.INDEX_NAME
          WHERE I.TABLE_SCHEMA = ? AND I.TABLE_NAME = ?
          ORDER BY K.INDEX_SCHEMA, K.INDEX_NAME, K.ORDINAL_POSITION`,
        [schema, object]
      );
      const description = { schema, object, columns, indexes, keys };
      return {
        contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(description, null, 2) }]
      };
    }
  );

  server.registerResource(
    "ibmi-joblog",
    new ResourceTemplate("ibmi://joblog/{job}", { list: undefined }),
    {
      title: "Job log IBM i",
      description: "Job log por nombre calificado.",
      mimeType: "application/json"
    },
    async (uri, variables) => {
      const rows = await context.db2.queryReadonly(
        "SELECT ORDINAL_POSITION, MESSAGE_ID, MESSAGE_TYPE, MESSAGE_TEXT, MESSAGE_SECOND_LEVEL_TEXT FROM TABLE(QSYS2.JOBLOG_INFO(?)) ORDER BY ORDINAL_POSITION",
        [String(variables.job)]
      );
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(rows, null, 2) }] };
    }
  );

  server.registerResource(
    "ibmi-spool",
    new ResourceTemplate("ibmi://spool/{job}/{file}", { list: undefined }),
    {
      title: "Archivo spool IBM i",
      description: "Datos de spool por job y archivo.",
      mimeType: "application/json"
    },
    async (uri, variables) => {
      const rows = await context.spool.get(String(variables.job), String(variables.file));
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(rows, null, 2) }] };
    }
  );

  server.registerResource(
    "ibmi-source",
    new ResourceTemplate("ibmi://source/{library}/{file}/{member}", { list: undefined }),
    {
      title: "Miembro fuente IBM i",
      description: "Contenido de miembro fuente via /QSYS.LIB.",
      mimeType: "application/json"
    },
    async (uri, variables) => {
      const path = `/QSYS.LIB/${String(variables.library).toUpperCase()}.LIB/${String(variables.file).toUpperCase()}.FILE/${String(variables.member).toUpperCase()}.MBR`;
      const rows = await context.db2.queryReadonly("SELECT LINE FROM TABLE(QSYS2.IFS_READ(PATH_NAME => ?))", [path]);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(rows, null, 2) }] };
    }
  );
}
