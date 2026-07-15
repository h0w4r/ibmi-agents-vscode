#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createIbmiMcpServer } from "./server.js";
import { redactSecrets } from "./core/redaction.js";

async function main(): Promise<void> {
  const server = createIbmiMcpServer(loadConfig());
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error(redactSecrets(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
