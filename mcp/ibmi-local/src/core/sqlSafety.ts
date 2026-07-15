const DEFAULT_ROW_LIMIT = 200;
const ALLOWED_START = /^(select|with|values)\b/i;
const FORBIDDEN_KEYWORDS =
  /\b(insert|update|delete|merge|create|alter|drop|truncate|grant|revoke|call|replace|rename|comment|label)\b/i;
const SIDE_EFFECT_PATTERNS = /\bnext\s+value\s+for\b|\bqsys2\s*\.\s*qcmdexc\b/i;
const FETCH_LIMIT_REGEX = /\bfetch\s+(?:first|next)\s+(\d+)\s+rows?\s+only\b/i;
const LIMIT_REGEX = /\blimit\s+(\d+)\b/i;

function stripLeadingComments(sql: string): string {
  let current = sql.trim();

  // El agente acepta SQL copiado desde scripts; quitamos comentarios iniciales sin tocar el resto.
  while (true) {
    const block = current.match(/^\/\*[\s\S]*?\*\//);
    if (block) {
      current = current.slice(block[0].length).trimStart();
      continue;
    }

    const line = current.match(/^--[^\r\n]*(\r?\n|$)/);
    if (line) {
      current = current.slice(line[0].length).trimStart();
      continue;
    }

    return current;
  }
}

function containsStatementSeparator(sql: string): boolean {
  return maskCommentsAndLiterals(sql).includes(";");
}

// Conserva solo codigo SQL para que palabras dentro de literales o comentarios no alteren la politica.
function maskCommentsAndLiterals(sql: string): string {
  const output = [...sql];
  let state: "code" | "string" | "identifier" | "line-comment" | "block-comment" = "code";

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (state === "line-comment") {
      output[index] = char === "\n" || char === "\r" ? char : " ";
      if (char === "\n") {
        state = "code";
      }
      continue;
    }

    if (state === "block-comment") {
      output[index] = " ";
      if (char === "*" && next === "/") {
        output[index + 1] = " ";
        index += 1;
        state = "code";
      }
      continue;
    }

    if (state === "string") {
      output[index] = " ";
      if (char === "'" && next === "'") {
        output[index + 1] = " ";
        index += 1;
      } else if (char === "'") {
        state = "code";
      }
      continue;
    }

    if (state === "identifier") {
      output[index] = " ";
      if (char === '"' && next === '"') {
        output[index + 1] = " ";
        index += 1;
      } else if (char === '"') {
        state = "code";
      }
      continue;
    }

    if (char === "-" && next === "-") {
      output[index] = " ";
      output[index + 1] = " ";
      index += 1;
      state = "line-comment";
    } else if (char === "/" && next === "*") {
      output[index] = " ";
      output[index + 1] = " ";
      index += 1;
      state = "block-comment";
    } else if (char === "'") {
      output[index] = " ";
      state = "string";
    } else if (char === '"') {
      output[index] = " ";
      state = "identifier";
    }
  }

  return output.join("");
}

export function assertReadonlySql(sql: string): string {
  const normalized = stripLeadingComments(sql).replace(/;\s*$/, "").trim();

  if (!normalized) {
    throw new Error("La sentencia SQL esta vacia.");
  }

  const inspectedSql = maskCommentsAndLiterals(normalized);
  if (containsStatementSeparator(normalized)) {
    throw new Error("No se permiten multiples sentencias SQL en una sola invocacion.");
  }

  if (!ALLOWED_START.test(inspectedSql.trimStart())) {
    throw new Error("Sentencia SQL no permitida. Solo se permite SELECT, WITH o VALUES.");
  }

  if (FORBIDDEN_KEYWORDS.test(inspectedSql)) {
    throw new Error("Sentencia SQL no permitida: contiene una palabra reservada mutante o peligrosa.");
  }

  if (SIDE_EFFECT_PATTERNS.test(inspectedSql)) {
    throw new Error("Sentencia SQL no permitida: puede producir efectos laterales en IBM i.");
  }

  return normalized;
}

export function normalizeReadonlySql(sql: string, defaultLimit = DEFAULT_ROW_LIMIT): string {
  if (!Number.isInteger(defaultLimit) || defaultLimit < 1 || defaultLimit > 1000) {
    throw new Error("El limite SQL debe ser un entero entre 1 y 1000 filas.");
  }

  const readonlySql = assertReadonlySql(sql);
  const inspectedSql = maskCommentsAndLiterals(readonlySql);
  const explicitLimit = FETCH_LIMIT_REGEX.exec(inspectedSql) ?? LIMIT_REGEX.exec(inspectedSql);

  if (explicitLimit) {
    const requestedRows = Number(explicitLimit[1]);
    if (requestedRows > defaultLimit) {
      throw new Error(`La consulta solicita ${requestedRows} filas; el maximo configurado es ${defaultLimit}.`);
    }
    return readonlySql;
  }

  const terminalClause = /\s+(for\s+(?:read|fetch)\s+only|with\s+(?:ur|cs|rs|rr)|optimize\s+for\s+\d+\s+rows)\s*$/i;
  const match = readonlySql.match(terminalClause);
  if (!match || match.index === undefined) {
    return `${readonlySql} FETCH FIRST ${defaultLimit} ROWS ONLY`;
  }

  return `${readonlySql.slice(0, match.index)} FETCH FIRST ${defaultLimit} ROWS ONLY${readonlySql.slice(
    match.index
  )}`;
}
