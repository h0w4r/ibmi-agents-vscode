import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { DocsConnector } from "../src/connectors/docs.js";
import { loadConfig } from "../src/config.js";

let tempRoot: string | undefined;

describe("DocsConnector", () => {
  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
      tempRoot = undefined;
    }
  });

  it("busca documentos markdown por terminos y devuelve snippets", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "ibmi-docs-"));
    await writeFile(
      join(tempRoot, "apis-sistema.md"),
      "# APIs Del Sistema\n\n## QCMDEXC\n\nQCMDEXC ejecuta comandos CL.\n\nFuente: https://www.ibm.com/docs/example"
    );
    const docs = new DocsConnector(
      loadConfig({ IBMI_PROFILE: "test", IBMI_WORKSPACE_ROOT: tempRoot, IBMI_DOCS_ROOT: tempRoot })
    );

    const results = await docs.search("QCMDEXC comandos");

    expect(results[0]).toMatchObject({
      path: "apis-sistema.md",
      title: "APIs Del Sistema",
      section: "QCMDEXC"
    });
    expect(results[0]?.snippet).toContain("QCMDEXC");
    expect(results[0]?.score).toBeGreaterThan(0);
    expect(results[0]?.sources).toContain("https://www.ibm.com/docs/example");
  });

  it("normaliza acentos, ordena por relevancia y bloquea traversal de categorias", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "ibmi-docs-"));
    await writeFile(join(tempRoot, "catalogo.md"), "# Catálogo Db2\n\n## Índices\n\nÍndices y claves de tabla.");
    await writeFile(join(tempRoot, "general.md"), "# General\n\nEl catálogo contiene varios objetos e índices.");
    const docs = new DocsConnector(
      loadConfig({ IBMI_WORKSPACE_ROOT: tempRoot, IBMI_DOCS_ROOT: tempRoot })
    );

    const results = await docs.search("catalogo indices");

    expect(results[0]?.path).toBe("catalogo.md");
    await expect(docs.readCategory("../secreto")).rejects.toThrow(/categoria documental/i);
  });
});
