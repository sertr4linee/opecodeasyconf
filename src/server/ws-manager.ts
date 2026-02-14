import type { ServerWebSocket } from "bun";

export class WebSocketManager {
  private sockets = new Set<ServerWebSocket<unknown>>();

  add(ws: ServerWebSocket<unknown>): void {
    this.sockets.add(ws);
  }

  remove(ws: ServerWebSocket<unknown>): void {
    this.sockets.delete(ws);
  }

  broadcast(data: unknown): void {
    const message = typeof data === "string" ? data : JSON.stringify(data);
    for (const ws of this.sockets) {
      try {
        ws.send(message);
      } catch {
        this.sockets.delete(ws);
      }
    }
  }

  get count(): number {
    return this.sockets.size;
  }
}
