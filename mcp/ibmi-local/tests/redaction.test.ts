import { describe, expect, it } from "vitest";
import { redactSecrets } from "../src/core/redaction.js";

describe("redaccion de secretos", () => {
  it("oculta password, token y connection string en auditoria y errores", () => {
    const text = "UID=USR;PWD=secreto;password=otro;token=abc123;Database=HOST";

    expect(redactSecrets(text)).toBe("UID=USR;PWD=***;password=***;token=***;Database=HOST");
  });

  it("oculta secretos estructurados y valores ODBC entre llaves", () => {
    const text = redactSecrets({
      user: "USR",
      password: "secreto",
      connectionString: "UID={USR};PWD={abc;def};System={HOST}"
    });

    expect(text).not.toContain("secreto");
    expect(text).not.toContain("abc;def");
    expect(text).toContain('"password": "***"');
    expect(text).toContain("PWD=***");
  });
});
