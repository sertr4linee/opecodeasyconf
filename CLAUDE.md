# opconf

Hybrid MCP server + SolidJS web dashboard for configuring OpenCode.

## Stack

- Runtime: Bun
- Frontend: SolidJS + @solidjs/router + @kobalte/core + TailwindCSS v4
- Backend: Bun.serve() (HTTP + WebSocket)
- MCP: @modelcontextprotocol/sdk v1.x (stdio + HTTP transports)
- Config parsing: jsonc-parser (comment-preserving edits)
- Validation: Ajv 2020-12 against opencode.ai/config.json schema
- Skills/Agents: gray-matter (frontmatter + markdown)

## Commands

- `bun run dev:server` — backend with watch mode (port 3100)
- `bun run dev:client` — Vite dev server (port 5173, proxies to 3100)
- `bun run build` — production Vite build
- `bun run typecheck` — tsc --noEmit
- `bun run start` — production backend

## Architecture

- `src/entry.ts` — mode detection: stdio (piped) → MCP server, TTY → HTTP server
- `src/core/` — config engine: types, path-resolver, config-engine, schema-validator, file-watcher, parsers
- `src/server/` — mcp-server, http-server, ws-manager
- `src/mcp/` — MCP tool and resource definitions
- `src/web/` — SolidJS SPA (Vite root)

## OpenCode Config Details

- MCP servers use `type: "local" | "remote"`, `command` is a full array, env key is `"environment"`
- Config files: `opencode.jsonc` or `opencode.json`
- 6 scopes: managed < global < custom < remote < project < projectDir
