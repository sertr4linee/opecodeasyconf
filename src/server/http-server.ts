import { existsSync } from "fs";
import { join, extname } from "path";
import { WebSocketManager } from "./ws-manager.ts";

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

export const wsManager = new WebSocketManager();

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
        return new Response(JSON.stringify({ status: "not implemented" }), {
          status: 501,
          headers: { "Content-Type": "application/json" },
        });
      }

      // REST API (Phase 2)
      if (url.pathname.startsWith("/api/")) {
        return new Response(JSON.stringify({ status: "not implemented" }), {
          status: 501,
          headers: { "Content-Type": "application/json" },
        });
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
  // Try exact file
  let filePath = join(staticDir, pathname);
  if (existsSync(filePath) && !Bun.file(filePath).name?.endsWith("/")) {
    const ext = extname(filePath);
    return new Response(Bun.file(filePath), {
      headers: { "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream" },
    });
  }

  // SPA fallback — serve index.html
  filePath = join(staticDir, "index.html");
  if (existsSync(filePath)) {
    return new Response(Bun.file(filePath), {
      headers: { "Content-Type": "text/html" },
    });
  }

  return new Response("Not found — run `bun run build` first", { status: 404 });
}
