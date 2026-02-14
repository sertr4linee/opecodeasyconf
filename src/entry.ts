import { startMcpStdio } from "./server/mcp-server.ts";
import { startHttpServer } from "./server/http-server.ts";

const DEFAULT_PORT = 3100;

async function main(): Promise<void> {
  const isStdio = !process.stdin.isTTY;

  if (isStdio) {
    // Piped mode — AI assistant is calling us via MCP stdio
    await startMcpStdio();
  } else {
    // Interactive mode — start HTTP server with web dashboard
    const port = parseInt(process.env["OPCONF_PORT"] ?? String(DEFAULT_PORT), 10);
    startHttpServer(port);
  }
}

main().catch((err) => {
  console.error("opconf fatal error:", err);
  process.exit(1);
});
