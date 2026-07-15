import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// Solo se inspeccionan formatos de texto que pueden llegar al repositorio o a los paquetes.
const TEXT_EXTENSIONS = new Set([
  ".json",
  ".jsonc",
  ".js",
  ".md",
  ".mjs",
  ".ps1",
  ".ts",
  ".txt",
  ".yaml",
  ".yml",
]);

const TEXT_NAMES = new Set(["LICENSE", "VERSION"]);
const EXCLUDED_DIRECTORIES = new Set([".git", "artifacts", "dist", "node_modules"]);

const RULES = [
  {
    name: "ruta absoluta de perfil Windows",
    pattern: /\b[A-Z]:[\\/]Users[\\/][^\\/\s]+/giu,
  },
  {
    name: "direccion IPv4 privada o local",
    pattern:
      /\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|127\.(?:\d{1,3}\.){2}\d{1,3}|169\.254\.(?:\d{1,3}\.)\d{1,3}|192\.168\.(?:\d{1,3}\.)\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3}\.)\d{1,3})\b/gu,
  },
  {
    name: "dominio DNS interno",
    pattern: /\b[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)*\.(?:local|internal|corp|lan)\b/giu,
  },
  {
    name: "ruta UNC",
    pattern: /\\\\[A-Z0-9][A-Z0-9._-]*\\[A-Z0-9$._-]+/giu,
  },
];

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;
const ALLOWED_EMAIL_DOMAINS = new Set(["example.com", "users.noreply.github.com"]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }

    if (TEXT_NAMES.has(entry.name) || TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function lineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function splitDenylist(value) {
  return value
    .split(/[\r\n,;]+/u)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = await collectFiles(root);
const denylist = splitDenylist(process.env.PUBLIC_CONTENT_DENYLIST ?? "");
const findings = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const relative = path.relative(root, file);

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const match of content.matchAll(rule.pattern)) {
      findings.push(`${relative}:${lineNumber(content, match.index)}: ${rule.name}`);
    }
  }

  EMAIL_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(EMAIL_PATTERN)) {
    const domain = match[0].split("@")[1].toLowerCase();
    if (!ALLOWED_EMAIL_DOMAINS.has(domain)) {
      findings.push(`${relative}:${lineNumber(content, match.index)}: correo no ficticio`);
    }
  }

  const lowerContent = content.toLocaleLowerCase("en-US");
  for (const privateTerm of denylist) {
    const index = lowerContent.indexOf(privateTerm.toLocaleLowerCase("en-US"));
    if (index >= 0) {
      findings.push(`${relative}:${lineNumber(content, index)}: termino incluido en la denylist privada`);
    }
  }
}

if (findings.length > 0) {
  console.error("Se detecto contenido que no debe publicarse:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Privacidad validada en ${files.length} archivos de texto.`);
}
