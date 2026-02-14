import { existsSync } from "fs";
import { join, extname } from "path";
import { WebSocketManager } from "./ws-manager.ts";
import { loadAllConfigs } from "../core/config-engine.ts";
import { resolveAllPaths } from "../core/path-resolver.ts";
import { listAllSkills, listAllAgents } from "../core/parsers.ts";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const JSON_HEADERS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

export const wsManager = new WebSocketManager();

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

// ─── API Router ──────────────────────────────────────────────────

function handleApi(pathname: string): Response {
  switch (pathname) {
    case "/api/config": {
      const { merged, scopes } = loadAllConfigs();
      return json({
        merged,
        scopes: scopes.map((s) => ({
          scope: s.scope,
          filePath: s.filePath,
          config: s.config,
        })),
      });
    }
    case "/api/config/paths": {
      return json(resolveAllPaths());
    }
    case "/api/mcp": {
      const { merged, scopes } = loadAllConfigs();
      const servers = merged.mcp ?? {};
      // Attach source scope to each server
      const enriched = Object.entries(servers).map(([name, config]) => {
        const sourceScope = scopes.find((s) => s.config.mcp?.[name])?.scope ?? "unknown";
        return { name, ...config, sourceScope };
      });
      return json(enriched);
    }
    case "/api/skills": {
      return json(listAllSkills());
    }
    case "/api/agents": {
      return json(listAllAgents());
    }
    default:
      return json({ error: "Not found" }, 404);
  }
}

// ─── HTTP Server ─────────────────────────────────────────────────

export function startHttpServer(port: number): void {
  const staticDir = join(import.meta.dir, "../../dist/web");

  Bun.serve({
    port,
    fetch(req, server) {
      const url = new URL(req.url);

      // WebSocket upgrade
      if (url.pathname === "/ws") {
        const upgraded = server.upgrade(req);
        if (upgraded) return undefined;
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      // MCP HTTP endpoint (Phase 2)
      if (url.pathname.startsWith("/mcp")) {
        return json({ status: "not implemented" }, 501);
      }

      // REST API
      if (url.pathname.startsWith("/api/")) {
        return handleApi(url.pathname);
      }

      // Static files / SPA fallback
      return serveStatic(url.pathname, staticDir);
    },
    websocket: {
      open(ws) {
        wsManager.add(ws);
      },
      close(ws) {
        wsManager.remove(ws);
      },
      message(_ws, _message) {
        // Phase 2: handle incoming WS messages
      },
    },
  });

  console.log(`opconf server listening on http://localhost:${port}`);
}

function serveStatic(pathname: string, staticDir: string): Response {
  let filePath = join(staticDir, pathname);
  if (existsSync(filePath) && !Bun.file(filePath).name?.endsWith("/")) {
    const ext = extname(filePath);
    return new Response(Bun.file(filePath), {
      headers: { "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream" },
    });
  }

  filePath = join(staticDir, "index.html");
  if (existsSync(filePath)) {
    return new Response(Bun.file(filePath), {
      headers: { "Content-Type": "text/html" },
    });
  }

  return new Response("Not found — run `bun run build` first", { status: 404 });
}
