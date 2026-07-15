import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { loadConfig } from "../src/config.js";
import { createIbmiMcpServer } from "../src/server.js";

let tempRoot: string | undefined;

describe("contrato MCP offline", () => {
  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
      tempRoot = undefined;
    }
  });

  it("lista tools, ejecuta tools locales, publica recursos y serializa errores", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "ibmi-mcp-contract-"));
    const docsRoot = join(tempRoot, "docs", "ibmi");
    await mkdir(docsRoot, { recursive: true });
    await writeFile(join(docsRoot, "apis-sistema.md"), "# APIs del sistema\n\n## QCMDEXC\n\nReferencia local.");

    const server = createIbmiMcpServer(
      loadConfig({ IBMI_WORKSPACE_ROOT: tempRoot, IBMI_DOCS_ROOT: docsRoot })
    );
    const client = new Client({ name: "ibmi-local-test", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    try {
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toContain("ibmi.header.create");
      expect(tools.tools.find((tool) => tool.name === "ibmi.header.create")?.outputSchema).toBeDefined();

      const header = await client.callTool({
        name: "ibmi.header.create",
        arguments: {
          language: "RPGLE",
          author: "DEV123 USUARIO EJEMPLO",
          purpose: "Prueba",
          requirement: "REQ-1"
        }
      });
      expect(header.structuredContent).toHaveProperty("data.header");

      const templates = await client.listResourceTemplates();
      expect(templates.resourceTemplates.map((resource) => resource.uriTemplate)).toContain(
        "ibmi://docs/{categoria}"
      );
      const resource = await client.readResource({ uri: "ibmi://docs/apis-sistema" });
      expect(resource.contents[0]).toMatchObject({ mimeType: "text/markdown" });
      expect("text" in resource.contents[0] ? resource.contents[0].text : "").toContain("QCMDEXC");

      const profileError = await client.callTool({ name: "ibmi.profile.check", arguments: {} });
      expect(profileError.isError).toBe(true);
      expect(profileError.structuredContent).toMatchObject({
        error: { code: "IBMI_PROFILE_INCOMPLETE", category: "configuration", retryable: false }
      });
    } finally {
      await client.close();
      await server.close();
    }
  });
});
