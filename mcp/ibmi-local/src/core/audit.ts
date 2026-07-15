import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { redactSecrets } from "./redaction.js";

export interface AuditEvent {
  action: string;
  status: "preview" | "allowed" | "blocked" | "error";
  detail?: unknown;
}

export async function writeAuditEvent(path: string | undefined, event: AuditEvent): Promise<void> {
  if (!path) {
    return;
  }

  await mkdir(dirname(path), { recursive: true });
  const payload = {
    timestamp: new Date().toISOString(),
    action: event.action,
    status: event.status,
    detail: event.detail ? redactSecrets(event.detail) : undefined
  };

  await appendFile(path, `${JSON.stringify(payload)}\n`, "utf8");
}
