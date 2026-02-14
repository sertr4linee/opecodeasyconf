import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from "fs";
import { join, basename, extname } from "path";
import matter from "gray-matter";
import { markSelfWrite } from "./file-watcher.ts";
import { getSkillScanDirs, getAgentScanDirs } from "./path-resolver.ts";
import type { Skill, SkillFrontmatter, Agent, AgentFrontmatter, ConfigScope } from "./types.ts";

// ─── Helpers ─────────────────────────────────────────────────────

function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function inferScope(dir: string): ConfigScope {
  if (dir.includes(".opencode") || dir.includes(".claude")) return "project";
  return "global";
}

// ─── Skill Parsing ───────────────────────────────────────────────

export function parseSkillFile(path: string, scope: ConfigScope): Skill | null {
  try {
    const raw = readFileSync(path, "utf-8");
    const { data, content } = matter(raw);
    const fm = data as SkillFrontmatter;
    if (!fm.name || !fm.description) return null;
    return { frontmatter: fm, body: content.trim(), path, scope };
  } catch {
    return null;
  }
}

function scanSkillDir(dir: string, seen: Map<string, Skill>): void {
  if (!existsSync(dir)) return;
  const scope = inferScope(dir);

  try {
    const entries = readdirSync(dir);
    for (const name of entries) {
      if (name.startsWith(".")) continue;
      const fullPath = join(dir, name);

      // Use statSync to follow symlinks
      if (isDir(fullPath)) {
        const skillFile = join(fullPath, "SKILL.md");
        if (existsSync(skillFile)) {
          const skill = parseSkillFile(skillFile, scope);
          if (skill) {
            const existing = seen.get(skill.frontmatter.name);
            if (!existing || scope === "project") {
              seen.set(skill.frontmatter.name, skill);
            }
          }
        }
      } else if (name.endsWith(".md")) {
        const skill = parseSkillFile(fullPath, scope);
        if (skill) {
          const existing = seen.get(skill.frontmatter.name);
          if (!existing || scope === "project") {
            seen.set(skill.frontmatter.name, skill);
          }
        }
      }
    }
  } catch {
    // Directory unreadable
  }
}

export function listAllSkills(): Skill[] {
  const seen = new Map<string, Skill>();
  for (const dir of getSkillScanDirs()) {
    scanSkillDir(dir, seen);
  }
  return Array.from(seen.values());
}

export function writeSkillFile(
  dir: string,
  frontmatter: SkillFrontmatter,
  body: string,
): string {
  const skillDir = join(dir, frontmatter.name);
  if (!existsSync(skillDir)) mkdirSync(skillDir, { recursive: true });

  const filePath = join(skillDir, "SKILL.md");
  const content = matter.stringify(body, frontmatter);
  markSelfWrite(filePath);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

// ─── Agent Parsing ───────────────────────────────────────────────

export function parseAgentFile(path: string, scope: ConfigScope): Agent | null {
  try {
    const raw = readFileSync(path, "utf-8");
    const { data, content } = matter(raw);
    const name = basename(path, extname(path));
    return {
      name,
      frontmatter: data as AgentFrontmatter,
      body: content.trim(),
      path,
      scope,
    };
  } catch {
    return null;
  }
}

export function listAllAgents(): Agent[] {
  const seen = new Map<string, Agent>();
  const dirs = getAgentScanDirs();

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    const scope = inferScope(dir);

    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (!entry.endsWith(".md")) continue;
        const fullPath = join(dir, entry);
        try {
          if (!statSync(fullPath).isFile()) continue;
        } catch { continue; }

        const agent = parseAgentFile(fullPath, scope);
        if (agent) {
          const existing = seen.get(agent.name);
          if (!existing || scope === "project") {
            seen.set(agent.name, agent);
          }
        }
      }
    } catch {
      // Directory unreadable
    }
  }

  return Array.from(seen.values());
}

export function writeAgentFile(
  dir: string,
  name: string,
  frontmatter: AgentFrontmatter,
  body: string,
): string {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const filePath = join(dir, `${name}.md`);
  const content = matter.stringify(body, frontmatter);
  markSelfWrite(filePath);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}
