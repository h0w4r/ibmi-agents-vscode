const SECRET_PATTERNS = [
  /\b(PWD|PASSWORD|PASS|TOKEN|API_KEY|SECRET)\s*=\s*(\{(?:[^}]|}})*\}|[^;\s]+)/gi,
  /\b(Bearer)\s+([A-Za-z0-9._~+/=-]+)/gi
];

const SECRET_KEYS = /^(pwd|password|pass|token|api[_-]?key|secret|ibmi_password)$/i;

export function redactSecrets(value: unknown): string {
  let text: string;

  if (typeof value === "string") {
    text = value;
  } else {
    text =
      JSON.stringify(
        value,
        (key, item) => (SECRET_KEYS.test(key) ? "***" : item),
        2
      ) ?? String(value);
  }

  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, (_match, key) => `${key}=***`);
  }

  return text;
}
