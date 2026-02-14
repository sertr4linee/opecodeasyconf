import { createResource, For, Show } from "solid-js";

interface McpServer {
  name: string;
  type: "local" | "remote";
  command?: string[];
  url?: string;
  environment?: Record<string, string>;
  headers?: Record<string, string>;
  enabled?: boolean;
  sourceScope: string;
}

async function fetchMcpServers(): Promise<McpServer[]> {
  const res = await fetch("/api/mcp");
  if (!res.ok) throw new Error("Failed to fetch MCP servers");
  return res.json();
}

export default function MCPManager() {
  const [servers] = createResource(fetchMcpServers);

  return (
    <div>
      <h2 class="text-2xl font-semibold text-white mb-2">MCP Servers</h2>
      <p class="text-neutral-400 text-sm">
        Model Context Protocol servers across all config scopes.
      </p>

      <Show when={servers.loading}>
        <div class="mt-6 text-neutral-500 text-sm">Loading...</div>
      </Show>

      <Show when={servers.error}>
        <div class="mt-6 rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-400 text-sm">
          Failed to load: {servers.error?.message}
        </div>
      </Show>

      <Show when={servers() && servers()!.length === 0}>
        <div class="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500 text-sm">
          No MCP servers configured yet.
        </div>
      </Show>

      <Show when={servers() && servers()!.length > 0}>
        <div class="mt-6 space-y-3">
          <For each={servers()}>
            {(server) => (
              <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span
                      class={`w-2 h-2 rounded-full ${
                        server.enabled === false ? "bg-neutral-600" : "bg-emerald-500"
                      }`}
                    />
                    <span class="text-white font-medium">{server.name}</span>
                    <span class="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                      {server.type}
                    </span>
                  </div>
                  <span class="text-xs text-neutral-600">{server.sourceScope}</span>
                </div>

                <div class="mt-2 text-sm text-neutral-500 font-mono">
                  <Show when={server.type === "local" && server.command}>
                    {server.command!.join(" ")}
                  </Show>
                  <Show when={server.type === "remote" && server.url}>
                    {server.url}
                  </Show>
                </div>

                <Show when={server.enabled === false}>
                  <div class="mt-2 text-xs text-neutral-600">Disabled</div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
