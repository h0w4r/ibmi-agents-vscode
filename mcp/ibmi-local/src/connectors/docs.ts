import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import type { IbmiConfig } from "../config.js";

export interface DocSearchResult {
  path: string;
  title: string;
  section: string;
  score: number;
  snippet: string;
  sources: string[];
}

interface MarkdownSection {
  heading: string;
  body: string;
}

async function collectMarkdownFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function splitSections(text: string): MarkdownSection[] {
  const matches = [...text.matchAll(/^#{1,6}\s+(.+)$/gm)];
  if (matches.length === 0) {
    return [{ heading: "Documento", body: text }];
  }

  return matches.map((match, index) => ({
    heading: match[1].trim(),
    body: text.slice(match.index ?? 0, matches[index + 1]?.index ?? text.length)
  }));
}

function extractSources(text: string): string[] {
  return [...new Set([...text.matchAll(/https?:\/\/[^\s)>]+/g)].map((match) => match[0]))].slice(0, 5);
}

function scoreSection(query: string, terms: string[], title: string, section: MarkdownSection): number {
  const normalizedTitle = normalizeSearchText(title);
  const normalizedHeading = normalizeSearchText(section.heading);
  const normalizedBody = normalizeSearchText(section.body);
  let score = 0;

  if (normalizedHeading.includes(query)) score += 16;
  if (normalizedTitle.includes(query)) score += 12;
  if (normalizedBody.includes(query)) score += 8;

  for (const term of terms) {
    if (normalizedTitle.includes(term)) score += 5;
    if (normalizedHeading.includes(term)) score += 7;
    const occurrences = normalizedBody.split(term).length - 1;
    score += Math.min(occurrences, 5);
  }

  // Exige que cada termino aparezca al menos en el titulo, encabezado o cuerpo.
  return terms.every((term) => `${normalizedTitle} ${normalizedHeading} ${normalizedBody}`.includes(term))
    ? score
    : 0;
}

function createSnippet(section: MarkdownSection, firstTerm: string): string {
  const normalized = normalizeSearchText(section.body);
  const index = firstTerm ? Math.max(0, normalized.indexOf(firstTerm) - 90) : 0;
  return section.body.slice(index, index + 420).replace(/\s+/g, " ").trim();
}

export class DocsConnector {
  constructor(private readonly config: IbmiConfig) {}

  async search(query: string, limit = 8): Promise<DocSearchResult[]> {
    const normalizedQuery = normalizeSearchText(query.trim());
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    if (terms.length === 0) {
      return [];
    }

    const files = await collectMarkdownFiles(this.config.docsRoot);
    const results: DocSearchResult[] = [];

    for (const file of files) {
      const text = await readFile(file, "utf8");
      const title = text.match(/^#\s+(.+)$/m)?.[1] ?? relative(this.config.docsRoot, file);
      const documentSources = extractSources(text);

      for (const section of splitSections(text)) {
        const score = scoreSection(normalizedQuery, terms, title, section);
        if (score === 0) continue;

        results.push({
          path: relative(this.config.workspaceRoot, file),
          title,
          section: section.heading,
          score,
          snippet: createSnippet(section, terms[0] ?? ""),
          sources: extractSources(section.body).length ? extractSources(section.body) : documentSources
        });
      }
    }

    return results.sort((left, right) => right.score - left.score || left.path.localeCompare(right.path)).slice(0, limit);
  }

  async readCategory(category: string): Promise<string> {
    if (!/^[a-z0-9-]+$/i.test(category)) {
      throw new Error("La categoria documental solo puede contener letras, numeros y guiones.");
    }
    const file = join(this.config.docsRoot, `${category}.md`);
    return readFile(file, "utf8");
  }
}
