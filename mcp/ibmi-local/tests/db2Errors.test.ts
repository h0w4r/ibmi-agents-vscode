import { describe, expect, it, vi } from "vitest";
import { loadConfig } from "../src/config.js";
import {
  Db2Connector,
  buildDb2ConnectionString,
  classifyDb2ConnectionError,
  type OdbcModule
} from "../src/connectors/db2.js";
import { IbmiMcpError } from "../src/core/errors.js";

describe("clasificacion de errores Db2/ODBC", () => {
  it("convierte errores de driver faltante en mensaje accionable para IBM i ACS Application Package", () => {
    const error = classifyDb2ConnectionError(
      new Error("[IM002] Data source name not found and no default driver specified")
    );

    expect(error).toBeInstanceOf(IbmiMcpError);
    if (!(error instanceof IbmiMcpError)) {
      throw new Error("Se esperaba IbmiMcpError.");
    }
    expect(error.code).toBe("IBMI_ODBC_DRIVER_NOT_FOUND");
    expect(error.message).toContain("IBM i Access Client Solutions Windows Application Package");
  });

  it("informa el alias legado seleccionado cuando Windows no encuentra el driver", () => {
    const error = classifyDb2ConnectionError(
      new Error("[IM002] Data source name not found and no default driver specified"),
      "iSeries Access ODBC Driver"
    );

    expect(error).toBeInstanceOf(IbmiMcpError);
    expect(error.message).toContain("iSeries Access ODBC Driver");
  });

  it("construye la cadena con el driver configurado sin abrir una conexion", () => {
    const config = loadConfig({
      IBMI_HOST: "ibmi.example.com",
      IBMI_USER: "USUARIO",
      IBMI_PASSWORD: "PASSWORD",
      IBMI_ODBC_DRIVER: "iSeries Access ODBC Driver"
    });

    expect(buildDb2ConnectionString(config)).toContain(
      "Driver={iSeries Access ODBC Driver};System={ibmi.example.com}"
    );
  });

  it("escapa separadores dentro del password y habilita SSL solo cuando se configura", () => {
    const config = loadConfig({
      IBMI_HOST: "ibmi.example.com",
      IBMI_USER: "USUARIO",
      IBMI_PASSWORD: "secreto;UID=OTRO}",
      IBMI_SSL: "true"
    });
    const connectionString = buildDb2ConnectionString(config);

    expect(connectionString).toContain("PWD={secreto;UID=OTRO}}}");
    expect(connectionString).toContain(";SSL=1");
  });

  it("abre el circuito tras el primer rechazo y no vuelve a invocar odbc.connect", async () => {
    const connect = vi.fn().mockRejectedValue({
      message: "Login failed",
      odbcErrors: [{ state: "28000", code: -30082, message: "SQL30082 password not valid" }]
    });
    const loader = vi.fn(async () => ({ connect }) as unknown as OdbcModule);
    const db2 = new Db2Connector(
      loadConfig({
        IBMI_PROFILE: "DEVELOPMENT",
        IBMI_HOST: "ibmi.example.com",
        IBMI_USER: "USUARIO",
        IBMI_PASSWORD: "INVALIDA"
      }),
      loader
    );

    await expect(db2.queryReadonly("VALUES 1")).rejects.toMatchObject({
      code: "IBMI_AUTHENTICATION_FAILED"
    });
    await expect(db2.queryReadonly("VALUES 2")).rejects.toMatchObject({
      code: "IBMI_AUTHENTICATION_LOCKED"
    });
    expect(connect).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(db2.getAuthenticationState().state).toBe("open");
  });

  it("no abre el circuito por un error de red SQLSTATE 08001", () => {
    const networkError = Object.assign(new Error("Servidor no disponible"), {
      odbcErrors: [{ state: "08001", code: 10060, message: "Connection timeout" }]
    });

    expect(classifyDb2ConnectionError(networkError)).toMatchObject({
      code: "IBMI_CONNECTION_FAILED",
      category: "connection",
      retryable: true
    });
  });

  it("clasifica falta de autoridad y servicio inexistente sin confundirlos con login", () => {
    const authorityError = {
      message: "SQL0551 not authorized",
      odbcErrors: [{ state: "42501", message: "Not authorized" }]
    };
    const missingServiceError = {
      message: "SQL0204 JOBLOG_INFO not found",
      odbcErrors: [{ state: "42704", message: "Object not found" }]
    };

    expect(classifyDb2ConnectionError(authorityError)).toMatchObject({
      code: "IBMI_AUTHORITY_DENIED",
      category: "authorization"
    });
    expect(classifyDb2ConnectionError(missingServiceError)).toMatchObject({
      code: "IBMI_OBJECT_OR_SERVICE_NOT_FOUND",
      category: "not-supported"
    });
  });
});
