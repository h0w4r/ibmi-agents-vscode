import { describe, expect, it } from "vitest";
import { assertSafeCommand, previewCommand } from "../src/core/commandSafety.js";

describe("seguridad de comandos CL", () => {
  it("permite comandos de consulta definidos en allowlist", () => {
    const result = assertSafeCommand("DSPFD FILE(APPLIB/CUSTOMERF) TYPE(*BASATR)");

    expect(result.verb).toBe("DSPFD");
    expect(result.command).toBe("DSPFD FILE(APPLIB/CUSTOMERF) TYPE(*BASATR)");
  });

  it("bloquea comandos mutantes aunque sean comandos IBM i validos", () => {
    expect(() => assertSafeCommand("DLTF FILE(APPLIB/CUSTOMERF)")).toThrow(/no esta en la allowlist/i);
    expect(() => assertSafeCommand("CRTSQLRPGI OBJ(LIB/PGM) SRCFILE(LIB/QRPGLESRC)")).toThrow(
      /no esta en la allowlist/i
    );
  });

  it("genera una vista previa sin ejecutar el comando", () => {
    const preview = previewCommand("DSPJOB JOB(123456/USR/JOB)");

    expect(preview).toEqual({
      executable: false,
      verb: "DSPJOB",
      normalizedCommand: "DSPJOB JOB(123456/USR/JOB)",
      reason: "Vista previa generada. Use ibmi.command.run_safe para solicitar ejecucion controlada.",
      sideEffects: []
    });
  });

  it("bloquea parametros mutantes aunque el verbo este permitido", () => {
    expect(() => assertSafeCommand("DSPMSG MSGQ(QSYSOPR) RMV(*YES)")).toThrow(/retirar mensajes/i);
    expect(() =>
      assertSafeCommand("DSPFFD FILE(APPLIB/CUSTOMERF) OUTPUT(*OUTFILE) OUTFILE(QTEMP/FIELDS)")
    ).toThrow(/OUTFILE/i);
  });

  it("declara cuando un comando de consulta puede crear spool", () => {
    const preview = previewCommand("DSPJOBLOG JOB(123456/USR/JOB) OUTPUT(*PRINT)");

    expect(preview.sideEffects).toContain(
      "Puede crear un archivo spool en el job servidor de base de datos."
    );
  });
});
