import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { parse } from "jsonc-parser";

const execFileAsync = promisify(execFile);
let tempRoot: string | undefined;

describe("merge de configuracion MCP de usuario", () => {
  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
      tempRoot = undefined;
    }
  });

  it("conserva comentarios y servidores ajenos al instalar y retirar ibmi-local", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "ibmi-mcp-config-"));
    const configPath = join(tempRoot, "mcp.json");
    const backupRoot = join(tempRoot, "backup");
    const script = resolve(process.cwd(), "..", "..", "scripts", "merge-mcp-config.mjs");
    await mkdir(join(tempRoot, "docs"), { recursive: true });
    await writeFile(
      configPath,
      `{
  // Este comentario y github deben sobrevivir.
  "servers": {
    "github": { "type": "http", "url": "https://example.invalid/mcp" },
  },
}
`
    );

    await execFileAsync(process.execPath, [
      script,
      "--mode",
      "install",
      "--config",
      configPath,
      "--entry",
      join(tempRoot, "dist", "index.js"),
      "--docs",
      join(tempRoot, "docs"),
      "--audit",
      join(tempRoot, "audit.log"),
      "--driver",
      "iSeries Access ODBC Driver",
      "--backup-dir",
      backupRoot
    ]);

    const installedText = await readFile(configPath, "utf8");
    const installed = parse(installedText);
    expect(installedText).toContain("Este comentario y github deben sobrevivir");
    expect(installed.servers.github).toBeDefined();
    expect(installed.servers["ibmi-local"].env.IBMI_PASSWORD).toBe("${input:ibmi-password}");
    expect(installed.inputs.find((input: { id: string }) => input.id === "ibmi-odbc-driver").default).toBe(
      "iSeries Access ODBC Driver"
    );

    await execFileAsync(process.execPath, [
      script,
      "--mode",
      "remove",
      "--config",
      configPath,
      "--backup-dir",
      backupRoot
    ]);
    const removedText = await readFile(configPath, "utf8");
    const removed = parse(removedText);
    expect(removedText).toContain("Este comentario y github deben sobrevivir");
    expect(removed.servers.github).toBeDefined();
    expect(removed.servers["ibmi-local"]).toBeUndefined();
  });
});
