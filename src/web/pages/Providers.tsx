import { createResource, For, Show } from "solid-js";

interface ConfigData {
  merged: Record<string, unknown>;
  scopes: Array<{
    scope: string;
    filePath: string | null;
    config: Record<string, unknown>;
  }>;
}

async function fetchConfig(): Promise<ConfigData> {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error("Failed to fetch config");
  return res.json();
}

export default function Providers() {
  const [config] = createResource(fetchConfig);

  const providers = () => {
    const cfg = config();
    if (!cfg) return [];
    const prov = (cfg.merged as Record<string, unknown>).provider as Record<string, unknown> | undefined;
    if (!prov) return [];
    return Object.entries(prov).map(([name, value]) => ({
      name,
      ...(value as Record<string, unknown>),
    }));
  };

  const scopes = () => config()?.scopes ?? [];

  return (
    <div>
      <h2 class="text-2xl font-semibold text-white mb-2">Providers</h2>
      <p class="text-neutral-400 text-sm">
        AI provider settings and API keys.
      </p>

      <Show when={config.loading}>
        <div class="mt-6 text-neutral-500 text-sm">Loading...</div>
      </Show>

      <Show when={config.error}>
        <div class="mt-6 rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-400 text-sm">
          Failed to load: {config.error?.message}
        </div>
      </Show>

      <Show when={config() && providers().length === 0}>
        <div class="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <p class="text-neutral-400 text-sm">
            No providers configured in your OpenCode config.
          </p>
          <p class="mt-2 text-neutral-500 text-xs">
            OpenCode reads provider API keys from environment variables (e.g. <code class="text-neutral-400">ANTHROPIC_API_KEY</code>, <code class="text-neutral-400">OPENAI_API_KEY</code>).
            You can also set them explicitly in your config file.
          </p>
        </div>
      </Show>

      <Show when={providers().length > 0}>
        <div class="mt-6 space-y-3">
          <For each={providers()}>
            {(prov) => (
              <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                <span class="text-white font-medium">{prov.name}</span>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Config sources */}
      <Show when={scopes().length > 0}>
        <div class="mt-8">
          <h3 class="text-sm font-medium text-neutral-400 mb-3">Config sources</h3>
          <div class="space-y-2">
            <For each={scopes()}>
              {(s) => (
                <div class="flex items-center gap-3 text-xs">
                  <span class="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 w-20 text-center">
                    {s.scope}
                  </span>
                  <span class="text-neutral-600 font-mono truncate">{s.filePath}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
