import { join } from "node:path";

// Nombres oficiales registrados por las distintas generaciones de IBM i Access.
export const IBMI_ODBC_DRIVERS = [
  "IBM i Access ODBC Driver",
  "iSeries Access ODBC Driver",
  "Client Access ODBC Driver (32-bit)"
] as const;

export type IbmiOdbcDriver = (typeof IBMI_ODBC_DRIVERS)[number];

export const DEFAULT_IBMI_ODBC_DRIVER: IbmiOdbcDriver = "IBM i Access ODBC Driver";

export interface IbmiConfig {
  profile: string;
  host?: string;
  user?: string;
  password?: string;
  naming: "system" | "sql";
  odbcDriver: IbmiOdbcDriver;
  ssl: boolean;
  queryTimeoutSeconds: number;
  connectionTimeoutSeconds: number;
  loginTimeoutSeconds: number;
  maxRows: number;
  workspaceRoot: string;
  docsRoot: string;
  auditLog?: string;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  if (/^(1|true|yes|si)$/i.test(value.trim())) {
    return true;
  }

  if (/^(0|false|no)$/i.test(value.trim())) {
    return false;
  }

  throw new Error(`Valor booleano no valido: "${value}".`);
}

function parseInteger(
  name: string,
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} debe ser un entero entre ${minimum} y ${maximum}.`);
  }

  return parsed;
}

// Valida el nombre antes de interpolarlo en la cadena ODBC.
export function resolveOdbcDriver(value?: string): IbmiOdbcDriver {
  const driver = value?.trim() || DEFAULT_IBMI_ODBC_DRIVER;

  if (IBMI_ODBC_DRIVERS.includes(driver as IbmiOdbcDriver)) {
    return driver as IbmiOdbcDriver;
  }

  throw new Error(
    `IBMI_ODBC_DRIVER no soportado: "${driver}". Valores permitidos: ${IBMI_ODBC_DRIVERS.join(
      ", "
    )}.`
  );
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): IbmiConfig {
  const workspaceRoot = env.IBMI_WORKSPACE_ROOT ?? process.cwd();

  return {
    profile: env.IBMI_PROFILE ?? "default",
    host: env.IBMI_HOST,
    user: env.IBMI_USER,
    password: env.IBMI_PASSWORD,
    naming: env.IBMI_NAMING === "sql" ? "sql" : "system",
    odbcDriver: resolveOdbcDriver(env.IBMI_ODBC_DRIVER),
    ssl: parseBoolean(env.IBMI_SSL, false),
    queryTimeoutSeconds: parseInteger("IBMI_QUERY_TIMEOUT", env.IBMI_QUERY_TIMEOUT, 30, 1, 600),
    connectionTimeoutSeconds: parseInteger(
      "IBMI_CONNECTION_TIMEOUT",
      env.IBMI_CONNECTION_TIMEOUT,
      15,
      1,
      120
    ),
    loginTimeoutSeconds: parseInteger("IBMI_LOGIN_TIMEOUT", env.IBMI_LOGIN_TIMEOUT, 15, 1, 120),
    maxRows: parseInteger("IBMI_MAX_ROWS", env.IBMI_MAX_ROWS, 200, 1, 1000),
    workspaceRoot,
    docsRoot: env.IBMI_DOCS_ROOT ?? join(workspaceRoot, "docs", "ibmi"),
    auditLog: env.IBMI_AUDIT_LOG
  };
}
