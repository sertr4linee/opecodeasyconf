import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { parse, modify, applyEdits, type ModificationOptions } from "jsonc-parser";
import { markSelfWrite } from "./file-watcher.ts";
import { resolveAllPaths, resolveScope, getInlineConfig } from "./path-resolver.ts";
import type {
  ConfigScope,
  OpenCodeConfig,
  ScopedConfig,
  MergedConfig,
} from "./types.ts";

// ─── JSONC Read ──────────────────────────────────────────────────

export function readJsoncFile(
  path: string,
): { parsed: OpenCodeConfig; raw: string } | null {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf-8");
  const parsed = parse(raw) as OpenCodeConfig;
  return { parsed, raw };
}

// ─── JSONC Edit (comment-preserving) ─────────────────────────────

const MODIFY_OPTIONS: ModificationOptions = {
  formattingOptions: {
    tabSize: 2,
    insertSpaces: true,
    eol: "\n",
  },
};

export function setJsoncValue(
  rawJsonc: string,
  jsonPath: (string | number)[],
  value: unknown,
): string {
  const edits = modify(rawJsonc, jsonPath, value, MODIFY_OPTIONS);
  return applyEdits(rawJsonc, edits);
}

// ─── Write full config file ──────────────────────────────────────

export function writeConfigFile(
  path: string,
  config: OpenCodeConfig,
): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  // If file exists, try to preserve comments by doing a full replace
  if (existsSync(path)) {
    const raw = readFileSync(path, "utf-8");
    // Replace the entire root value
    const edits = modify(raw, [], config, MODIFY_OPTIONS);
    const updated = applyEdits(raw, edits);
    markSelfWrite(path);
    writeFileSync(path, updated, "utf-8");
  } else {
    // New file — write clean JSON
    markSelfWrite(path);
    writeFileSync(path, JSON.stringify(config, null, 2) + "\n", "utf-8");
  }
}

// ─── Surgical single-value edit ──────────────────────────────────

export function writeConfigValue(
  path: string,
  jsonPath: (string | number)[],
  value: unknown,
): void {
  if (!existsSync(path)) {
    // Build the config object from the path
    const config: Record<string, unknown> = {};
    let current: Record<string, unknown> = config;
    for (let i = 0; i < jsonPath.length - 1; i++) {
      const key = jsonPath[i]!;
      current[key as string] = {};
      current = current[key as string] as Record<string, unknown>;
    }
    const lastKey = jsonPath[jsonPath.length - 1];
    if (lastKey !== undefined) {
      current[lastKey as string] = value;
    }
    writeConfigFile(path, config as OpenCodeConfig);
    return;
  }

  const raw = readFileSync(path, "utf-8");
  const updated = setJsoncValue(raw, jsonPath, value);
  markSelfWrite(path);
  writeFileSync(path, updated, "utf-8");
}

// ─── Deep Merge ──────────────────────────────────────────────────

const CONCAT_KEYS = new Set(["plugins", "instructions"]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...base };

  for (const key of Object.keys(override)) {
    const baseVal = base[key];
    const overVal = override[key];

    if (
      Array.isArray(baseVal) &&
      Array.isArray(overVal) &&
      CONCAT_KEYS.has(key)
    ) {
      result[key] = [...baseVal, ...overVal];
    } else if (isPlainObject(baseVal) && isPlainObject(overVal)) {
      result[key] = deepMerge(baseVal, overVal);
    } else {
      result[key] = overVal;
    }
  }

  return result;
}

// ─── Load single scope ──────────────────────────────────────────

export function loadScopeConfig(scope: ConfigScope): ScopedConfig | null {
  if (scope === "remote") {
    const inline = getInlineConfig();
    if (!inline) return null;
    const parsed = parse(inline) as OpenCodeConfig;
    return { config: parsed, scope, filePath: null, raw: inline };
  }

  const resolved = resolveScope(scope);
  if (!resolved.configFile) return null;

  const result = readJsoncFile(resolved.configFile);
  if (!result) return null;

  return {
    config: result.parsed,
    scope,
    filePath: resolved.configFile,
    raw: result.raw,
  };
}

// ─── Load & merge all scopes ─────────────────────────────────────

const SCOPE_ORDER: ConfigScope[] = [
  "managed",
  "global",
  "custom",
  "remote",
  "project",
  "projectDir",
];

export function loadAllConfigs(): MergedConfig {
  const scopes: ScopedConfig[] = [];
  let merged: Record<string, unknown> = {};

  for (const scope of SCOPE_ORDER) {
    const scopeConfig = loadScopeConfig(scope);
    if (scopeConfig) {
      scopes.push(scopeConfig);
      merged = deepMerge(merged, scopeConfig.config as Record<string, unknown>);
    }
  }

  return { merged: merged as OpenCodeConfig, scopes };
}
