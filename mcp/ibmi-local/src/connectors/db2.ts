import {
  IbmiAuthenticationError,
  IbmiAuthenticationLockedError,
  IbmiMcpError
} from "../core/errors.js";
import { normalizeReadonlySql } from "../core/sqlSafety.js";
import { DEFAULT_IBMI_ODBC_DRIVER, type IbmiConfig, type IbmiOdbcDriver } from "../config.js";
import { writeAuditEvent } from "../core/audit.js";

export type OdbcModule = {
  connect(options: string | { connectionString: string; connectionTimeout?: number; loginTimeout?: number }): Promise<{
    query<T = Record<string, unknown>>(
      sql: string,
      params?: unknown[],
      options?: { timeout?: number }
    ): Promise<T[]>;
    close(): Promise<void>;
  }>;
};

export type OdbcLoader = () => Promise<OdbcModule>;

async function loadOdbc(): Promise<OdbcModule> {
  try {
    // Carga tardia: permite testear/offline sin instalar driver nativo ODBC.
    const dynamicImport = new Function("specifier", "return import(specifier)") as (
      specifier: string
    ) => Promise<OdbcModule>;
    return await dynamicImport("odbc");
  } catch (error) {
    throw new IbmiMcpError(
      "No se pudo cargar el paquete npm 'odbc'. Ejecute npm install en mcp/ibmi-local. Si el paquete ya esta instalado, verifique que su version de Node sea compatible.",
      "ODBC_MODULE_NOT_AVAILABLE"
    );
  }
}

function getOdbcDiagnostics(error: unknown): Array<{ state?: string; message?: string; code?: number }> {
  if (typeof error !== "object" || error === null || !("odbcErrors" in error)) {
    return [];
  }

  const diagnostics = (error as { odbcErrors?: unknown }).odbcErrors;
  return Array.isArray(diagnostics) ? diagnostics : [];
}

function isAuthenticationFailure(error: unknown): boolean {
  const diagnostics = getOdbcDiagnostics(error);
  if (diagnostics.some((item) => /^28/.test(String(item.state ?? "")))) {
    return true;
  }

  const messages = [
    error instanceof Error ? error.message : String(error),
    ...diagnostics.map((item) => item.message ?? "")
  ].join(" ");
  return /sql30082|password verification failed|user id.*not valid|password.*not valid|authentication.*failed/i.test(
    messages
  );
}

function isMissingDriverFailure(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : error).toLowerCase();
  return /im002|data source name not found|no default driver specified|driver.*not.*found/.test(
    message
  );
}

function hasSqlState(error: unknown, pattern: RegExp): boolean {
  return getOdbcDiagnostics(error).some((item) => pattern.test(String(item.state ?? "")));
}

export function classifyDb2ConnectionError(
  error: unknown,
  odbcDriver: IbmiOdbcDriver = DEFAULT_IBMI_ODBC_DRIVER
): Error {
  if (isAuthenticationFailure(error)) {
    return new IbmiAuthenticationError(
      "Autenticacion rechazada por IBM i. Se detiene sin reintentos automaticos para evitar bloqueo de perfil."
    );
  }

  if (isMissingDriverFailure(error)) {
    return new IbmiMcpError(
      `No se encontro el driver ODBC '${odbcDriver}'. Configure IBMI_ODBC_DRIVER con un nombre registrado en Windows o instale IBM i Access Client Solutions Windows Application Package de la misma arquitectura de Node/VS Code.`,
      "IBMI_ODBC_DRIVER_NOT_FOUND",
      { category: "configuration", retryable: false }
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  if (hasSqlState(error, /^42501$/) || /sql0551/i.test(message)) {
    return new IbmiMcpError(
      "El perfil IBM i no tiene autoridad suficiente para consultar el objeto o servicio solicitado.",
      "IBMI_AUTHORITY_DENIED",
      { category: "authorization", retryable: false }
    );
  }

  if (hasSqlState(error, /^42704$/) || /sql0204/i.test(message)) {
    return new IbmiMcpError(
      "El objeto o servicio SQL solicitado no existe en este IBM i o no esta disponible con el nivel de version/PTF actual.",
      "IBMI_OBJECT_OR_SERVICE_NOT_FOUND",
      { category: "not-supported", retryable: false }
    );
  }

  if (hasSqlState(error, /^(HYT00|HYT01)$/i) || /timeout|timed out/i.test(message)) {
    return new IbmiMcpError(
      "La operacion ODBC excedio el tiempo configurado. Revise conectividad, carga del sistema o los limites IBMI_*_TIMEOUT.",
      "IBMI_ODBC_TIMEOUT",
      { category: "connection", retryable: true }
    );
  }

  if (hasSqlState(error, /^08/)) {
    return new IbmiMcpError(
      "No se pudo establecer o mantener la conexion con IBM i. No se modifico el circuito de autenticacion.",
      "IBMI_CONNECTION_FAILED",
      { category: "connection", retryable: true }
    );
  }

  return error instanceof Error ? error : new Error(String(error));
}

function escapeOdbcValue(value: string): string {
  return `{${value.replaceAll("}", "}}")}}`;
}

// Mantiene la construccion DSN-less en una funcion comprobable sin abrir conexiones.
export function buildDb2ConnectionString(config: IbmiConfig): string {
  if (!config.host || !config.user || !config.password) {
    throw new IbmiMcpError(
      "Faltan IBMI_HOST, IBMI_USER o IBMI_PASSWORD para conectarse a Db2 for i.",
      "IBMI_PROFILE_INCOMPLETE",
      { category: "configuration", retryable: false }
    );
  }

  const naming = config.naming === "sql" ? 1 : 0;
  return [
    `Driver=${escapeOdbcValue(config.odbcDriver)}`,
    `System=${escapeOdbcValue(config.host)}`,
    `UID=${escapeOdbcValue(config.user)}`,
    `PWD=${escapeOdbcValue(config.password)}`,
    `Naming=${naming}`,
    "CommitMode=0",
    ...(config.ssl ? ["SSL=1"] : [])
  ].join(";");
}

export class Db2Connector {
  private authenticationLockedAt?: string;

  constructor(
    private readonly config: IbmiConfig,
    private readonly odbcLoader: OdbcLoader = loadOdbc
  ) {}

  private assertAuthenticationAllowed(): void {
    if (this.authenticationLockedAt) {
      throw new IbmiAuthenticationLockedError({
        profile: this.config.profile,
        host: this.config.host,
        lockedAt: this.authenticationLockedAt
      });
    }
  }

  getAuthenticationState(): { state: "closed" | "open"; lockedAt?: string } {
    return this.authenticationLockedAt
      ? { state: "open", lockedAt: this.authenticationLockedAt }
      : { state: "closed" };
  }

  async checkProfile(): Promise<Record<string, unknown>> {
    const rows = await this.queryReadonly("VALUES CURRENT SERVER, CURRENT USER, CURRENT DATE", []);
    return {
      profile: this.config.profile,
      host: this.config.host,
      naming: this.config.naming,
      odbcDriver: this.config.odbcDriver,
      ssl: this.config.ssl,
      authenticationCircuit: this.getAuthenticationState(),
      probe: rows[0] ?? null
    };
  }

  normalizeReadonlySql(sql: string): string {
    return normalizeReadonlySql(sql, this.config.maxRows);
  }

  async queryReadonly<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.query<T>(this.normalizeReadonlySql(sql), params);
  }

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.assertAuthenticationAllowed();
    // Valida el perfil antes de cargar el modulo nativo para devolver el error mas accionable.
    const connectionString = buildDb2ConnectionString(this.config);
    const odbc = await this.odbcLoader();
    let connection: Awaited<ReturnType<OdbcModule["connect"]>> | undefined;

    try {
      connection = await odbc.connect({
        connectionString,
        connectionTimeout: this.config.connectionTimeoutSeconds,
        loginTimeout: this.config.loginTimeoutSeconds
      });
      return await connection.query<T>(sql, params, { timeout: this.config.queryTimeoutSeconds });
    } catch (error) {
      const classified = classifyDb2ConnectionError(error, this.config.odbcDriver);
      if (classified instanceof IbmiAuthenticationError) {
        this.authenticationLockedAt = new Date().toISOString();
        await writeAuditEvent(this.config.auditLog, {
          action: "ibmi.authentication.lock",
          status: "blocked",
          detail: {
            profile: this.config.profile,
            host: this.config.host,
            lockedAt: this.authenticationLockedAt,
            reason: classified.code
          }
        });
      }
      throw classified;
    } finally {
      await connection?.close().catch(() => undefined);
    }
  }
}
