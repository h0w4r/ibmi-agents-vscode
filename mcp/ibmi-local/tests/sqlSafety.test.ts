import { describe, expect, it } from "vitest";
import { assertReadonlySql, normalizeReadonlySql } from "../src/core/sqlSafety.js";

describe("seguridad SQL read-only", () => {
  it("permite SELECT y agrega FETCH FIRST 200 ROWS ONLY cuando no hay limite explicito", () => {
    const sql = normalizeReadonlySql("select * from qsys2.systables");

    expect(sql).toBe("select * from qsys2.systables FETCH FIRST 200 ROWS ONLY");
  });

  it("permite WITH y conserva un limite existente", () => {
    const sql = normalizeReadonlySql(
      "with x as (select * from qsys2.systables) select * from x fetch first 25 rows only"
    );

    expect(sql.toLowerCase()).toContain("fetch first 25 rows only");
  });

  it("bloquea DML y DDL aunque aparezcan despues de espacios o comentarios", () => {
    expect(() => assertReadonlySql("/* no */ update lib.tab set campo = 1")).toThrow(
      /sentencia SQL no permitida/i
    );
    expect(() => assertReadonlySql("drop table lib.tab")).toThrow(/sentencia SQL no permitida/i);
  });

  it("bloquea multiples sentencias para evitar encadenar una lectura con una mutacion", () => {
    expect(() => assertReadonlySql("select * from qsys2.systables; delete from lib.tab")).toThrow(
      /multiples sentencias/i
    );
  });

  it("ignora palabras peligrosas dentro de literales y comentarios internos", () => {
    const sql = assertReadonlySql("select 'update delete' as texto from sysibm.sysdummy1 -- drop");

    expect(sql).toContain("'update delete'");
  });

  it("bloquea secuencias y QCMDEXC aunque la sentencia comience como lectura", () => {
    expect(() => assertReadonlySql("values next value for lib.secuencia")).toThrow(/efectos laterales/i);
    expect(() => assertReadonlySql("select qsys2.qcmdexc('DLTLIB X') from sysibm.sysdummy1")).toThrow(
      /efectos laterales/i
    );
  });

  it("rechaza limites explicitos mayores al maximo configurado", () => {
    expect(() => normalizeReadonlySql("select * from qsys2.systables limit 500", 200)).toThrow(
      /maximo configurado es 200/i
    );
  });

  it("inserta el limite antes de una clausula terminal WITH UR", () => {
    expect(normalizeReadonlySql("select * from qsys2.systables with ur", 25)).toMatch(
      /FETCH FIRST 25 ROWS ONLY with ur$/i
    );
  });
});
