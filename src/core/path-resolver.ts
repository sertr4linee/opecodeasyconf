import { existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { homedir, platform } from "os";
import type { ConfigScope, ResolvedPaths } from "./types.ts";

const CONFIG_FILENAMES = ["opencode.jsonc", "opencode.json"] as const;
const PROJECT_DIR_NAME = ".opencode";

// ─── Platform-aware directory resolution ─────────────────────────

export function getGlobalConfigDir(): string {
  const xdg = process.env["XDG_CONFIG_HOME"];
  if (xdg) return join(xdg, "opencode");

  const plat = platform();
  if (plat === "darwin") {
    return join(homedir(), "Library", "Application Support", "opencode");
  }
  if (plat === "win32") {
    return join(process.env["APPDATA"] ?? join(homedir(), "AppData", "Roaming"), "opencode");
  }
  // Linux / other
  return join(homedir(), ".config", "opencode");
}

export function getManagedConfigDir(): string {
  const plat = platform();
  if (plat === "win32") {
    return join(process.env["ProgramData"] ?? "C:\\ProgramData", "opencode");
  }
  if (plat === "darwin") {
    return join("/Library", "Application Support", "opencode");
  }
  return "/etc/opencode";
}

// ─── Git root detection ──────────────────────────────────────────

export function findGitRoot(startDir?: string): string | null {
  let dir = resolve(startDir ?? process.cwd());
  const root = resolve("/");

  while (dir !== root) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// ─── Config file detection ───────────────────────────────────────

export function findConfigFile(dir: string): string | null {
  for (const name of CONFIG_FILENAMES) {
    const full = join(dir, name);
    if (existsSync(full)) return full;
  }
  return null;
}

// ─── Single scope lookup ─────────────────────────────────────────

export function resolveScope(scope: ConfigScope): ResolvedPaths {
  switch (scope) {
    case "managed": {
      const dir = getManagedConfigDir();
      const file = findConfigFile(dir);
      return { scope, configDir: dir, configFile: file, exists: file !== null };
    }
    case "global": {
      const dir = getGlobalConfigDir();
      const file = findConfigFile(dir);
      return { scope, configDir: dir, configFile: file, exists: file !== null };
    }
    case "custom": {
      const envPath = process.env["OPENCODE_CONFIG"];
      if (!envPath) return { scope, configDir: "", configFile: null, exists: false };
      const dir = dirname(resolve(envPath));
      const exists = existsSync(resolve(envPath));
      return { scope, configDir: dir, configFile: exists ? resolve(envPath) : null, exists };
    }
    case "remote": {
      // Remote scope uses inline content, no file path
      const has = !!process.env["OPENCODE_CONFIG_CONTENT"];
      return { scope, configDir: "", configFile: null, exists: has };
    }
    case "project": {
      const gitRoot = findGitRoot();
      if (!gitRoot) return { scope, configDir: "", configFile: null, exists: false };
      const file = findConfigFile(gitRoot);
      return { scope, configDir: gitRoot, configFile: file, exists: file !== null };
    }
    case "projectDir": {
      const gitRoot = findGitRoot();
      if (!gitRoot) return { scope, configDir: "", configFile: null, exists: false };
      const dir = join(gitRoot, PROJECT_DIR_NAME);
      const file = findConfigFile(dir);
      return { scope, configDir: dir, configFile: file, exists: file !== null };
    }
  }
}

// ─── Resolve all scopes ──────────────────────────────────────────

const SCOPE_ORDER: ConfigScope[] = [
  "managed",
  "global",
  "custom",
  "remote",
  "project",
  "projectDir",
];

export function resolveAllPaths(): ResolvedPaths[] {
  return SCOPE_ORDER.map(resolveScope);
}

// ─── Inline config from env ──────────────────────────────────────

export function getInlineConfig(): string | null {
  return process.env["OPENCODE_CONFIG_CONTENT"] ?? null;
}

// ─── Skill & Agent scan directories ──────────────────────────────

export function getSkillScanDirs(): string[] {
  const dirs: string[] = [];
  const globalDir = getGlobalConfigDir();
  dirs.push(join(globalDir, "skills"));

  // Also check ~/.claude/skills for compatibility
  dirs.push(join(homedir(), ".claude", "skills"));

  const gitRoot = findGitRoot();
  if (gitRoot) {
    dirs.push(join(gitRoot, ".opencode", "skills"));
    dirs.push(join(gitRoot, ".claude", "skills"));
  }

  return dirs;
}

export function getAgentScanDirs(): string[] {
  const dirs: string[] = [];
  const globalDir = getGlobalConfigDir();
  dirs.push(join(globalDir, "agents"));

  const gitRoot = findGitRoot();
  if (gitRoot) {
    dirs.push(join(gitRoot, ".opencode", "agents"));
  }

  return dirs;
}
