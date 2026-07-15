export type IbmiSourceLanguage = "RPGLE" | "SQLRPGLE" | "CLLE" | "DDS";

export interface IbmiHeaderInput {
  language: IbmiSourceLanguage;
  createdAt?: Date;
  author: string;
  purpose: string;
  requirement: string;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${day}/${month}/${year}`;
}

function commentLines(language: IbmiSourceLanguage, lines: string[]): string {
  if (language === "DDS") {
    return lines.map((line) => `     A* ${line}`).join("\n");
  }

  if (language === "CLLE") {
    return ["/*", ...lines.map((line) => ` * ${line}`), " */"].join("\n");
  }

  return lines.map((line) => `// ${line}`).join("\n");
}

export function createIbmiHeader(input: IbmiHeaderInput): string {
  const createdAt = input.createdAt ?? new Date();
  const author = input.author.trim();
  if (!author) {
    throw new Error("author es obligatorio para generar una cabecera IBM i.");
  }
  const lines = [
    "============================================================",
    `Fecha creacion : ${formatDate(createdAt)}`,
    `Autor          : ${author}`,
    `Proposito      : ${input.purpose}`,
    `Requerimiento  : ${input.requirement}`,
    "============================================================"
  ];

  return commentLines(input.language, lines);
}
