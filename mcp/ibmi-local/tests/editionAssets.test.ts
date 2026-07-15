import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";

const testRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(testRoot, "..", "..", "..");
const fullAgentRoot = join(workspaceRoot, ".github", "agents");
const atlasRoot = join(workspaceRoot, ".github", "editions", "atlas");
const atlasAgentRoot = join(atlasRoot, "agents");
const atlasPromptRoot = join(atlasRoot, "prompts");
const skillRoot = join(workspaceRoot, ".github", "skills");
const scriptRoot = join(workspaceRoot, "scripts");
const forbiddenAtlasPattern = /\bMCP\b|ibmi-local|IBMI_[A-Z_]+/i;

function files(root: string, suffix: string): string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => join(root, entry.name));
}

function frontmatter(path: string): Record<string, unknown> {
  const text = readFileSync(path, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Frontmatter ausente: ${path}`);
  return (parseYaml(match[1]) ?? {}) as Record<string, unknown>;
}

describe("ediciones de agentes", () => {
  it("fija Sol en orquestadores y Terra en subagentes", () => {
    const agentPaths = [...files(fullAgentRoot, ".agent.md"), ...files(atlasAgentRoot, ".agent.md")];
    expect(agentPaths).toHaveLength(12);

    for (const path of agentPaths) {
      const metadata = frontmatter(path);
      const main = metadata.name === "ibmi-senior" || metadata.name === "ibmi-atlas";
      expect(metadata.model).toBe(main ? "GPT-5.6 Sol (copilot)" : "GPT-5.6 Terra (copilot)");
      if (!main) expect(metadata["user-invocable"]).toBe(false);
    }
  });

  it("mantiene Atlas autocontenido y con nombres coexistentes", () => {
    const agentPaths = files(atlasAgentRoot, ".agent.md");
    const promptPaths = files(atlasPromptRoot, ".prompt.md");
    expect(agentPaths).toHaveLength(6);
    expect(promptPaths).toHaveLength(14);

    for (const path of [...agentPaths, ...promptPaths]) {
      expect(readFileSync(path, "utf8")).not.toMatch(forbiddenAtlasPattern);
    }
    for (const path of promptPaths) {
      expect(String(frontmatter(path).name)).toMatch(/^atlas-/);
    }
  });

  it("mantiene neutrales las skills compartidas", () => {
    const skillPaths = readdirSync(skillRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(skillRoot, entry.name, "SKILL.md"));
    expect(skillPaths).toHaveLength(14);
    for (const path of skillPaths) {
      expect(readFileSync(path, "utf8")).not.toMatch(forbiddenAtlasPattern);
    }
  });

  it("expone ciclos de vida independientes para Senior y Atlas", () => {
    const seniorScripts = ["Install", "Update", "Uninstall", "Test"].map((verb) =>
      join(scriptRoot, `${verb}-IbmiSenior.ps1`),
    );
    const atlasScripts = ["Install", "Update", "Uninstall", "Test"].map((verb) =>
      join(scriptRoot, `${verb}-IbmiAtlas.ps1`),
    );

    for (const path of [...seniorScripts, ...atlasScripts]) expect(existsSync(path)).toBe(true);
    for (const path of atlasScripts) expect(readFileSync(path, "utf8")).not.toMatch(forbiddenAtlasPattern);
    for (const legacy of ["Install", "Update", "Uninstall", "Test"]) {
      expect(existsSync(join(scriptRoot, `${legacy}-IbmiAgent.ps1`))).toBe(false);
    }
  });
});
