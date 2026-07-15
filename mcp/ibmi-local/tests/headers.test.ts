import { describe, expect, it } from "vitest";
import { createIbmiHeader } from "../src/core/headers.js";

describe("cabeceras IBM i", () => {
  it("genera cabecera RPGLE con autor, fecha, proposito y requerimiento", () => {
    const header = createIbmiHeader({
      language: "RPGLE",
      createdAt: new Date("2026-06-24T12:00:00-05:00"),
      author: "DEV123 USUARIO EJEMPLO",
      purpose: "Consultar informacion de cliente",
      requirement: "REQ-123"
    });

    expect(header).toContain("Fecha creacion : 24/06/2026");
    expect(header).toContain("Autor          : DEV123 USUARIO EJEMPLO");
    expect(header).toContain("Proposito      : Consultar informacion de cliente");
    expect(header).toContain("Requerimiento  : REQ-123");
  });

  it("rechaza una cabecera sin autor explicito", () => {
    expect(() =>
      createIbmiHeader({
        language: "CLLE",
        author: "   ",
        purpose: "Ejecutar un proceso de ejemplo",
        requirement: "REQ-124"
      })
    ).toThrow("author es obligatorio");
  });
});
