import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptRoot, "..");
const requireFromMcp = createRequire(join(workspaceRoot, "mcp", "ibmi-local", "package.json"));
const { parse: parseYaml } = requireFromMcp("yaml");
const errors = [];

function markdownFiles(root, suffix) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? markdownFiles(path, suffix) : entry.name.endsWith(suffix) ? [path] : [];
  });
}

function parseFrontmatter(path) {
  const text = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    errors.push(`${relative(workspaceRoot, path)}: frontmatter ausente o invalido.`);
    return { metadata: {}, text };
  }
  try {
    return { metadata: parseYaml(match[1]) ?? {}, text };
  } catch (error) {
    errors.push(`${relative(workspaceRoot, path)}: YAML invalido: ${error.message}`);
    return { metadata: {}, text };
  }
}

const fullAgentRoot = join(workspaceRoot, ".github", "agents");
const fullPromptRoot = join(workspaceRoot, ".github", "prompts");
const atlasRoot = join(workspaceRoot, ".github", "editions", "atlas");
const atlasAgentRoot = join(atlasRoot, "agents");
const atlasPromptRoot = join(atlasRoot, "prompts");
const skillRoot = join(workspaceRoot, ".github", "skills");
const fullAgentFiles = markdownFiles(fullAgentRoot, ".agent.md");
const atlasAgentFiles = markdownFiles(atlasAgentRoot, ".agent.md");
const fullPromptFiles = markdownFiles(fullPromptRoot, ".prompt.md");
const atlasPromptFiles = markdownFiles(atlasPromptRoot, ".prompt.md");
const agentFiles = [...fullAgentFiles, ...atlasAgentFiles];
const agents = new Map();

for (const path of agentFiles) {
  const name = parseFrontmatter(path).metadata.name;
  if (agents.has(name)) errors.push(`${relative(workspaceRoot, path)}: nombre de agente duplicado '${name}'.`);
  agents.set(name, path);
}

for (const path of agentFiles) {
  const { metadata, text } = parseFrontmatter(path);
  const isAtlas = path.startsWith(atlasRoot);
  const isMain = metadata.name === "ibmi-senior" || metadata.name === "ibmi-atlas";
  const expectedModel = isMain ? "GPT-5.6 Sol (copilot)" : "GPT-5.6 Terra (copilot)";

  if (!metadata.name || !metadata.description) errors.push(`${relative(workspaceRoot, path)}: name/description requeridos.`);
  if (!Array.isArray(metadata.tools)) errors.push(`${relative(workspaceRoot, path)}: tools debe ser una lista.`);
  if (metadata.model !== expectedModel) errors.push(`${relative(workspaceRoot, path)}: modelo esperado '${expectedModel}'.`);
  if (!isMain && metadata["user-invocable"] !== false) errors.push(`${relative(workspaceRoot, path)}: el subagente debe usar user-invocable: false.`);
  if (metadata.agents?.includes("*")) errors.push(`${relative(workspaceRoot, path)}: no se permite agents: ['*'].`);

  for (const agent of metadata.agents ?? []) {
    if (!agents.has(agent)) errors.push(`${relative(workspaceRoot, path)}: subagente inexistente '${agent}'.`);
  }
  for (const handoff of metadata.handoffs ?? []) {
    if (!agents.has(handoff.agent)) errors.push(`${relative(workspaceRoot, path)}: handoff inexistente '${handoff.agent}'.`);
  }
  if (metadata.tools?.some((tool) => String(tool).startsWith("ibmi-local/")) && !/autenticacion/i.test(text)) {
    errors.push(`${relative(workspaceRoot, path)}: falta regla explicita de autenticacion.`);
  }
  if (isAtlas && /\bMCP\b|ibmi-local|IBMI_[A-Z_]+/i.test(text)) {
    errors.push(`${relative(workspaceRoot, path)}: Atlas contiene una dependencia no permitida.`);
  }
}

for (const path of [...fullPromptFiles, ...atlasPromptFiles]) {
  const { metadata, text } = parseFrontmatter(path);
  const isAtlas = path.startsWith(atlasRoot);
  if (!metadata.name || !metadata.description) errors.push(`${relative(workspaceRoot, path)}: name/description requeridos.`);
  if (metadata.agent && !["agent", "ask", "plan"].includes(metadata.agent) && !agents.has(metadata.agent)) {
    errors.push(`${relative(workspaceRoot, path)}: agente inexistente '${metadata.agent}'.`);
  }
  if (isAtlas) {
    if (!metadata.name.startsWith("atlas-")) errors.push(`${relative(workspaceRoot, path)}: name debe usar prefijo atlas-.`);
    if (!String(metadata.agent).startsWith("ibmi-atlas-")) errors.push(`${relative(workspaceRoot, path)}: agente Atlas invalido.`);
    if (metadata.model !== "GPT-5.6 Terra (copilot)") errors.push(`${relative(workspaceRoot, path)}: modelo Terra requerido.`);
    if (/\bMCP\b|ibmi-local|IBMI_[A-Z_]+/i.test(text)) errors.push(`${relative(workspaceRoot, path)}: Atlas contiene una dependencia no permitida.`);
  }
}

for (const directory of readdirSync(skillRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
  const path = join(skillRoot, directory.name, "SKILL.md");
  if (!existsSync(path)) {
    errors.push(`${relative(workspaceRoot, path)}: SKILL.md ausente.`);
    continue;
  }
  const { metadata, text } = parseFrontmatter(path);
  if (metadata.name !== directory.name) errors.push(`${relative(workspaceRoot, path)}: name no coincide con directorio.`);
  if (!metadata.description || metadata.description.length > 1024) errors.push(`${relative(workspaceRoot, path)}: description invalida.`);
  if (/\bTODO\b/.test(text)) errors.push(`${relative(workspaceRoot, path)}: contiene TODO de scaffold.`);
  if (/\bMCP\b|ibmi-local|IBMI_[A-Z_]+/i.test(text)) errors.push(`${relative(workspaceRoot, path)}: la skill compartida no es neutral.`);
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (!/^[a-z]+:/i.test(match[1]) && !existsSync(resolve(dirname(path), match[1]))) {
      errors.push(`${relative(workspaceRoot, path)}: referencia inexistente '${match[1]}'.`);
    }
  }
}

if (fullAgentFiles.length !== 6 || atlasAgentFiles.length !== 6) {
  errors.push(`Se esperaban 6 agentes por edicion; Full=${fullAgentFiles.length}, Atlas=${atlasAgentFiles.length}.`);
}
if (fullPromptFiles.length !== 14 || atlasPromptFiles.length !== 14) {
  errors.push(`Se esperaban 14 prompts por edicion; Full=${fullPromptFiles.length}, Atlas=${atlasPromptFiles.length}.`);
}

const textRoots = [join(workspaceRoot, ".github"), join(workspaceRoot, "docs"), join(workspaceRoot, "scripts")];
for (const root of textRoots) {
  for (const path of markdownFiles(root, ".md")) {
    if (/[\uFFFD]|Ãƒ|Ã‚/.test(readFileSync(path, "utf8"))) {
      errors.push(`${relative(workspaceRoot, path)}: posible texto mal codificado.`);
    }
  }
}

if (existsSync(join(workspaceRoot, ".vscode", "mcp.json"))) {
  errors.push(".vscode/mcp.json no debe existir: la distribucion soportada es global/de usuario.");
}
const lifecycleVerbs = ["Install", "Update", "Uninstall", "Test"];
const seniorScripts = lifecycleVerbs.map((verb) => join(workspaceRoot, "scripts", `${verb}-IbmiSenior.ps1`));
const atlasScripts = lifecycleVerbs.map((verb) => join(workspaceRoot, "scripts", `${verb}-IbmiAtlas.ps1`));
for (const path of [...seniorScripts, ...atlasScripts]) {
  if (!existsSync(path)) errors.push(`${relative(workspaceRoot, path)}: script de ciclo de vida ausente.`);
}
for (const verb of lifecycleVerbs) {
  const legacy = join(workspaceRoot, "scripts", `${verb}-IbmiAgent.ps1`);
  if (existsSync(legacy)) errors.push(`${relative(workspaceRoot, legacy)}: el script generico retirado no debe reaparecer.`);
}
for (const path of atlasScripts) {
  if (existsSync(path) && /\bMCP\b|ibmi-local|IBMI_[A-Z_]+/i.test(readFileSync(path, "utf8"))) {
    errors.push(`${relative(workspaceRoot, path)}: Atlas contiene una referencia no autocontenida.`);
  }
}
const atlasReadme = join(workspaceRoot, "LEEME-ATLAS.md");
if (!existsSync(atlasReadme) || /\bMCP\b|ibmi-local|IBMI_[A-Z_]+/i.test(readFileSync(atlasReadme, "utf8"))) {
  errors.push("LEEME-ATLAS.md debe conservar una experiencia Atlas autocontenida.");
}

if (errors.length) {
  process.stderr.write(errors.map((error) => `- ${error}`).join("\n") + "\n");
  process.exit(1);
}

process.stdout.write(
  `Customizaciones validas: ${agentFiles.length} agentes, ${fullPromptFiles.length + atlasPromptFiles.length} prompts y ${readdirSync(skillRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length} skills compartidas.\n`
);
