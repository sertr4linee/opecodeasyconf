import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerResources(server: McpServer): void {
  server.resource(
    "config",
    "opencode://config/merged",
    { description: "The fully merged OpenCode configuration" },
    async () => {
      // TODO: Phase 2 — return actual merged config
      return {
        contents: [
          {
            uri: "opencode://config/merged",
            mimeType: "application/json",
            text: "{}",
          },
        ],
      };
    },
  );

  server.resource(
    "skills",
    "opencode://skills",
    { description: "List of all discovered skills" },
    async () => {
      // TODO: Phase 2
      return {
        contents: [
          {
            uri: "opencode://skills",
            mimeType: "application/json",
            text: "[]",
          },
        ],
      };
    },
  );

  server.resource(
    "agents",
    "opencode://agents",
    { description: "List of all discovered agents" },
    async () => {
      // TODO: Phase 2
      return {
        contents: [
          {
            uri: "opencode://agents",
            mimeType: "application/json",
            text: "[]",
          },
        ],
      };
    },
  );
}
