import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerTools(server: McpServer): void {
  server.tool(
    "list_mcp_servers",
    "List all configured MCP servers across all config scopes",
    {},
    async () => {
      // TODO: Phase 2 — implement with config-engine
      return {
        content: [{ type: "text", text: "MCP server listing not yet implemented" }],
      };
    },
  );

  server.tool(
    "get_config",
    "Read the merged OpenCode configuration",
    {},
    async () => {
      // TODO: Phase 2
      return {
        content: [{ type: "text", text: "Config reading not yet implemented" }],
      };
    },
  );

  server.tool(
    "set_config_value",
    "Set a configuration value in a specific scope",
    {
      scope: { type: "string", description: "Config scope to write to" },
      path: { type: "string", description: "JSON path (dot-separated)" },
      value: { type: "string", description: "JSON value to set" },
    },
    async () => {
      // TODO: Phase 2
      return {
        content: [{ type: "text", text: "Config writing not yet implemented" }],
      };
    },
  );

  server.tool(
    "validate_config",
    "Validate current configuration against the OpenCode JSON Schema",
    {},
    async () => {
      // TODO: Phase 2
      return {
        content: [{ type: "text", text: "Validation not yet implemented" }],
      };
    },
  );
}
