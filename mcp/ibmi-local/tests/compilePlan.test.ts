import { describe, expect, it } from "vitest";
import { buildCompilePlan } from "../src/core/compilePlan.js";

describe("plan de compilacion IBM i", () => {
  it("genera CRTSQLRPGI para SQLRPGLE y no lo marca como ejecutado", () => {
    const plan = buildCompilePlan({
      language: "SQLRPGLE",
      library: "APPLIB",
      object: "PGMORDER",
      sourceFile: "QRPGLESRC",
      sourceMember: "PGMORDER",
      debugView: "*SOURCE",
      commit: "*NONE"
    });

    expect(plan.command).toContain("CRTSQLRPGI OBJ(APPLIB/PGMORDER)");
    expect(plan.command).toContain("COMMIT(*NONE)");
    expect(plan.executed).toBe(false);
    expect(plan.notes.join(" ")).toMatch(/RPGPPOPT/i);
  });

  it("genera un modulo RPGLE y un programa ILE con modulos calificados", () => {
    const modulePlan = buildCompilePlan({
      language: "RPGMOD",
      library: "LIBAPP",
      object: "PEDIDOS",
      sourceFile: "QRPGLESRC",
      sourceMember: "PEDIDOS"
    });
    const programPlan = buildCompilePlan({
      language: "PGM",
      library: "LIBAPP",
      object: "PEDIDOS",
      modules: ["PEDIDOS", "LIBCOM/UTIL"]
    });

    expect(modulePlan.command).toContain("CRTRPGMOD MODULE(LIBAPP/PEDIDOS)");
    expect(programPlan.command).toContain("MODULE(LIBAPP/PEDIDOS LIBCOM/UTIL)");
    expect(programPlan.command).toContain("ACTGRP(*ENTMOD)");
  });

  it("genera un service program y advierte sobre binder language", () => {
    const plan = buildCompilePlan({
      language: "SRVPGM",
      library: "LIBAPP",
      object: "SRVUTIL",
      modules: ["MODUTIL"],
      bindingDirectories: ["LIBAPP/BNDDIR"]
    });

    expect(plan.command).toContain("CRTSRVPGM SRVPGM(LIBAPP/SRVUTIL)");
    expect(plan.command).toContain("BNDDIR(LIBAPP/BNDDIR)");
    expect(plan.notes.join(" ")).toMatch(/binder language/i);
  });

  it("rechaza nombres que podrian inyectar parametros CL", () => {
    expect(() =>
      buildCompilePlan({
        language: "RPGLE",
        library: "LIB) OPTION(*SRCSTMT",
        object: "PGM1",
        sourceFile: "QRPGLESRC",
        sourceMember: "PGM1"
      })
    ).toThrow(/nombre de sistema IBM i/i);
  });
});
