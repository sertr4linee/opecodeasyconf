import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "../mcp/tools.ts";
import { registerResources } from "../mcp/resources.ts";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "opconf",
    version: "0.1.0",
  });

  registerTools(server);
  registerResources(server);

  return server;
}

export async function startMcpStdio(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
