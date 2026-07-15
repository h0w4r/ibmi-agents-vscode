const SAFE_COMMANDS = new Set([
  "DSPJOBLOG",
  "DSPFD",
  "DSPFFD",
  "DSPPGMREF",
  "DSPOBJD",
  "DSPDBR",
  "DSPMSG",
  "DSPJOB",
  "DSPDTAARA",
  "DSPPFM"
]);

const FORBIDDEN_PARAMETER_PATTERNS = [
  { pattern: /\bRMV\s*\(\s*\*YES\s*\)/i, reason: "no se permite retirar mensajes" },
  { pattern: /\bOUTPUT\s*\(\s*\*OUTFILE\s*\)/i, reason: "no se permite escribir en OUTFILE" },
  { pattern: /\bOUTFILE\s*\(/i, reason: "no se permite crear o reemplazar archivos de salida" },
  { pattern: /\bOUTMBR\s*\(/i, reason: "no se permite escribir miembros de salida" },
  { pattern: /\bMBROPT\s*\(/i, reason: "no se permite modificar miembros" },
  { pattern: /\bREPLACE\s*\(\s*\*YES\s*\)/i, reason: "no se permite reemplazar objetos" }
];

export interface SafeCommand {
  verb: string;
  command: string;
}

export interface CommandPreview {
  executable: false;
  verb: string;
  normalizedCommand: string;
  reason: string;
  sideEffects: string[];
}

function normalizeCommand(command: string): string {
  return command.replace(/\s+/g, " ").trim();
}

export function extractCommandVerb(command: string): string {
  const normalized = normalizeCommand(command);
  const match = normalized.match(/^([A-Z][A-Z0-9]{1,9})\b/i);

  if (!match) {
    throw new Error("No se pudo identificar el comando CL solicitado.");
  }

  return match[1].toUpperCase();
}

export function assertSafeCommand(command: string): SafeCommand {
  const normalized = normalizeCommand(command);

  if (!normalized) {
    throw new Error("El comando CL esta vacio.");
  }

  if (normalized.length > 3000) {
    throw new Error("El comando CL supera el maximo permitido de 3000 caracteres.");
  }

  if (/[;\r\n]/.test(normalized)) {
    throw new Error("No se permiten separadores, saltos de linea ni encadenamiento de comandos CL.");
  }

  const verb = extractCommandVerb(normalized);
  if (!SAFE_COMMANDS.has(verb)) {
    throw new Error(`El comando ${verb} no esta en la allowlist de comandos seguros.`);
  }

  for (const rule of FORBIDDEN_PARAMETER_PATTERNS) {
    if (rule.pattern.test(normalized)) {
      throw new Error(`El comando ${verb} fue bloqueado: ${rule.reason}.`);
    }
  }

  return { verb, command: normalized };
}

export function previewCommand(command: string): CommandPreview {
  const safe = assertSafeCommand(command);
  const sideEffects = /\bOUTPUT\s*\(\s*\*PRINT\s*\)/i.test(safe.command)
    ? ["Puede crear un archivo spool en el job servidor de base de datos."]
    : [];

  return {
    executable: false,
    verb: safe.verb,
    normalizedCommand: safe.command,
    reason: "Vista previa generada. Use ibmi.command.run_safe para solicitar ejecucion controlada.",
    sideEffects
  };
}

export function getSafeCommands(): string[] {
  return [...SAFE_COMMANDS].sort();
}
