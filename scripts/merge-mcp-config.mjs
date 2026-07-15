import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const mcpRoot = resolve(scriptRoot, "..", "mcp", "ibmi-local");
const requireFromMcp = createRequire(join(mcpRoot, "package.json"));
const { applyEdits, modify, parse, printParseErrorCode } = requireFromMcp("jsonc-parser");

function readArguments(values) {
  const result = {};
  for (let index = 2; index < values.length; index += 2) {
    const key = values[index]?.replace(/^--/, "");
    const value = values[index + 1];
    if (!key || value === undefined) throw new Error(`Argumento incompleto: ${values[index] ?? ""}`);
    result[key] = value;
  }
  return result;
}

const args = readArguments(process.argv);
const mode = args.mode ?? "install";
if (!args.config) throw new Error("Falta --config.");

const configPath = resolve(args.config);
const originalExists = existsSync(configPath);
let text = originalExists ? readFileSync(configPath, "utf8").replace(/^\uFEFF/, "") : "{}\n";
const formattingOptions = {
  insertSpaces: true,
  tabSize: 2,
  eol: text.includes("\r\n") ? "\r\n" : "\n"
};

function parseConfig(source) {
  const errors = [];
  const value = parse(source, errors, { allowTrailingComma: true, disallowComments: false });
  if (errors.length) {
    const summary = errors.map((item) => `${printParseErrorCode(item.error)}@${item.offset}`).join(", ");
    throw new Error(`mcp.json contiene JSONC invalido: ${summary}. No se modifico el archivo.`);
  }
  return value ?? {};
}

function setValue(path, value) {
  const edits = modify(text, path, value, { formattingOptions });
  text = applyEdits(text, edits);
}

let config = parseConfig(text);
if (mode === "check") {
  if (!config.servers?.["ibmi-local"]) throw new Error("ibmi-local no esta registrado en mcp.json.");
  process.stdout.write(JSON.stringify({ valid: true, server: "ibmi-local" }));
  process.exit(0);
}

const managedInputIds = new Set([
  "ibmi-profile",
  "ibmi-host",
  "ibmi-user",
  "ibmi-password",
  "ibmi-naming",
  "ibmi-odbc-driver",
  "ibmi-ssl"
]);
const existingInputs = Array.isArray(config.inputs)
  ? config.inputs.filter((input) => !managedInputIds.has(input?.id))
  : [];

if (mode === "remove") {
  setValue(["inputs"], existingInputs);
  setValue(["servers", "ibmi-local"], undefined);
} else {
  for (const required of ["entry", "docs", "audit", "driver"]) {
    if (!args[required]) throw new Error(`Falta --${required}.`);
  }

  const managedInputs = [
    { id: "ibmi-profile", type: "promptString", description: "Etiqueta local del ambiente IBM i", default: "default" },
    { id: "ibmi-host", type: "promptString", description: "Host o IP del servidor IBM i" },
    { id: "ibmi-user", type: "promptString", description: "Perfil de usuario IBM i" },
    { id: "ibmi-password", type: "promptString", description: "Password IBM i", password: true },
    { id: "ibmi-naming", type: "pickString", description: "Convencion de nombres Db2 for i", options: ["system", "sql"], default: "system" },
    {
      id: "ibmi-odbc-driver",
      type: "pickString",
      description: "Driver ODBC IBM i registrado en Windows",
      options: ["IBM i Access ODBC Driver", "iSeries Access ODBC Driver", "Client Access ODBC Driver (32-bit)"],
      default: args.driver
    },
    { id: "ibmi-ssl", type: "pickString", description: "Usar SSL en la conexion ODBC", options: ["false", "true"], default: "false" }
  ];

  setValue(["inputs"], [...existingInputs, ...managedInputs]);
  setValue(["servers", "ibmi-local"], {
    type: "stdio",
    command: "node",
    args: [resolve(args.entry)],
    env: {
      IBMI_PROFILE: "${input:ibmi-profile}",
      IBMI_HOST: "${input:ibmi-host}",
      IBMI_USER: "${input:ibmi-user}",
      IBMI_PASSWORD: "${input:ibmi-password}",
      IBMI_NAMING: "${input:ibmi-naming}",
      IBMI_ODBC_DRIVER: "${input:ibmi-odbc-driver}",
      IBMI_SSL: "${input:ibmi-ssl}",
      IBMI_QUERY_TIMEOUT: "30",
      IBMI_CONNECTION_TIMEOUT: "15",
      IBMI_LOGIN_TIMEOUT: "15",
      IBMI_MAX_ROWS: "200",
      IBMI_WORKSPACE_ROOT: dirname(resolve(args.docs)),
      IBMI_DOCS_ROOT: resolve(args.docs),
      IBMI_AUDIT_LOG: resolve(args.audit)
    }
  });
}

parseConfig(text);
mkdirSync(dirname(configPath), { recursive: true });
if (originalExists && args["backup-dir"]) {
  mkdirSync(resolve(args["backup-dir"]), { recursive: true });
  copyFileSync(configPath, join(resolve(args["backup-dir"]), "mcp.json"));
}
writeFileSync(configPath, text.endsWith(formattingOptions.eol) ? text : text + formattingOptions.eol, "utf8");
process.stdout.write(JSON.stringify({ valid: true, mode, config: configPath }));
