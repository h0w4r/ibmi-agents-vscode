import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { IbmiConfig } from "./config.js";
import { Db2Connector } from "./connectors/db2.js";
import { CommandConnector } from "./connectors/command.js";
import { SpoolConnector } from "./connectors/spool.js";
import { DocsConnector } from "./connectors/docs.js";
import { registerIbmiResources } from "./resources.js";
import { registerIbmiTools } from "./tools.js";

export function createIbmiMcpServer(config: IbmiConfig): McpServer {
  const server = new McpServer({
    name: "ibmi-local",
    version: "0.2.0"
  });
  const db2 = new Db2Connector(config);
  const context = {
    db2,
    command: new CommandConnector(config, db2),
    spool: new SpoolConnector(db2),
    docs: new DocsConnector(config)
  };

  registerIbmiTools(server, context);
  registerIbmiResources(server, context);

  return server;
}
