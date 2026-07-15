export type IbmiErrorCategory =
  | "authentication"
  | "configuration"
  | "connection"
  | "authorization"
  | "validation"
  | "not-supported"
  | "internal";

export interface IbmiErrorOptions {
  category?: IbmiErrorCategory;
  retryable?: boolean;
  details?: Record<string, unknown>;
}

export class IbmiMcpError extends Error {
  public readonly category: IbmiErrorCategory;
  public readonly retryable: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    public readonly code: string,
    options: IbmiErrorOptions = {}
  ) {
    super(message);
    this.name = "IbmiMcpError";
    this.category = options.category ?? "internal";
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

export class IbmiAuthenticationError extends IbmiMcpError {
  constructor(message: string) {
    super(message, "IBMI_AUTHENTICATION_FAILED", {
      category: "authentication",
      retryable: false
    });
    this.name = "IbmiAuthenticationError";
  }
}

export class IbmiAuthenticationLockedError extends IbmiMcpError {
  constructor(details: { profile: string; host?: string; lockedAt: string }) {
    super(
      "Conexion IBM i bloqueada localmente despues de un rechazo de autenticacion. Corrija las credenciales y reinicie manualmente el MCP; no se realizo un nuevo intento ODBC.",
      "IBMI_AUTHENTICATION_LOCKED",
      {
        category: "authentication",
        retryable: false,
        details
      }
    );
    this.name = "IbmiAuthenticationLockedError";
  }
}

export function toIbmiMcpError(error: unknown): IbmiMcpError {
  if (error instanceof IbmiMcpError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new IbmiMcpError(message, "IBMI_UNEXPECTED_ERROR", {
    category: "internal",
    retryable: false
  });
}
