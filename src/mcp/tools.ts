import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerTools(server: McpServer): void {
  server.tool(
    "list_mcp_servers",
    "List all configured MCP servers across all config scopes",
    async () => {
      // TODO: Phase 2 — implement with config-engine
      return {
        content: [{ type: "text" as const, text: "MCP server listing not yet implemented" }],
      };
    },
  );

  server.tool(
    "get_config",
    "Read the merged OpenCode configuration",
    async () => {
      // TODO: Phase 2
      return {
        content: [{ type: "text" as const, text: "Config reading not yet implemented" }],
      };
    },
  );

  server.tool(
    "set_config_value",
    "Set a configuration value in a specific scope",
    {
      scope: z.string().describe("Config scope to write to"),
      path: z.string().describe("JSON path (dot-separated)"),
      value: z.string().describe("JSON value to set"),
    },
    async () => {
      // TODO: Phase 2
      return {
        content: [{ type: "text" as const, text: "Config writing not yet implemented" }],
      };
    },
  );

  server.tool(
    "validate_config",
    "Validate current configuration against the OpenCode JSON Schema",
    async () => {
      // TODO: Phase 2
      return {
        content: [{ type: "text" as const, text: "Validation not yet implemented" }],
      };
    },
  );
}
