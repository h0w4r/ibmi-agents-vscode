import { describe, expect, it } from "vitest";
import {
  DEFAULT_IBMI_ODBC_DRIVER,
  loadConfig,
  resolveOdbcDriver
} from "../src/config.js";

describe("configuracion del driver ODBC", () => {
  it("usa el driver moderno de ACS de forma predeterminada", () => {
    expect(loadConfig({}).odbcDriver).toBe(DEFAULT_IBMI_ODBC_DRIVER);
  });

  it("acepta los aliases oficiales de IBM i Access", () => {
    expect(resolveOdbcDriver("iSeries Access ODBC Driver")).toBe(
      "iSeries Access ODBC Driver"
    );
    expect(resolveOdbcDriver("Client Access ODBC Driver (32-bit)")).toBe(
      "Client Access ODBC Driver (32-bit)"
    );
  });

  it("rechaza nombres no soportados antes de construir la cadena ODBC", () => {
    expect(() => resolveOdbcDriver("Driver inventado;UID=otro")).toThrow(
      "IBMI_ODBC_DRIVER no soportado"
    );
  });

  it("aplica limites seguros y valida configuracion numerica", () => {
    const config = loadConfig({});

    expect(config.queryTimeoutSeconds).toBe(30);
    expect(config.maxRows).toBe(200);
    expect(config.ssl).toBe(false);
    expect(() => loadConfig({ IBMI_MAX_ROWS: "5000" })).toThrow(/IBMI_MAX_ROWS/i);
  });
});
