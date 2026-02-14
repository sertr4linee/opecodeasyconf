import { createResource, For, Show } from "solid-js";

interface Skill {
  frontmatter: {
    name: string;
    description: string;
    license?: string;
    compatibility?: string[];
  };
  body: string;
  path: string;
  scope: string;
}

async function fetchSkills(): Promise<Skill[]> {
  const res = await fetch("/api/skills");
  if (!res.ok) throw new Error("Failed to fetch skills");
  return res.json();
}

export default function Skills() {
  const [skills] = createResource(fetchSkills);

  return (
    <div>
      <h2 class="text-2xl font-semibold text-white mb-2">Skills</h2>
      <p class="text-neutral-400 text-sm">
        Agent skills across project and global scopes.
      </p>

      <Show when={skills.loading}>
        <div class="mt-6 text-neutral-500 text-sm">Loading...</div>
      </Show>

      <Show when={skills.error}>
        <div class="mt-6 rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-400 text-sm">
          Failed to load: {skills.error?.message}
        </div>
      </Show>

      <Show when={skills() && skills()!.length === 0}>
        <div class="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500 text-sm">
          No skills found.
        </div>
      </Show>

      <Show when={skills() && skills()!.length > 0}>
        <div class="mt-4 text-xs text-neutral-600">{skills()!.length} skills</div>
        <div class="mt-2 space-y-3">
          <For each={skills()}>
            {(skill) => (
              <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-white font-medium">{skill.frontmatter.name}</span>
                    <Show when={skill.frontmatter.license}>
                      <span class="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">
                        {skill.frontmatter.license}
                      </span>
                    </Show>
                  </div>
                  <span class="text-xs text-neutral-600">{skill.scope}</span>
                </div>
                <p class="mt-1.5 text-sm text-neutral-400 line-clamp-2">
                  {skill.frontmatter.description}
                </p>
                <div class="mt-2 text-xs text-neutral-600 font-mono truncate">
                  {skill.path}
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
