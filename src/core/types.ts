// ─── Config Scopes ───────────────────────────────────────────────

export type ConfigScope =
  | "remote"
  | "global"
  | "custom"
  | "project"
  | "projectDir"
  | "managed";

export interface ResolvedPaths {
  scope: ConfigScope;
  configFile: string | null;
  configDir: string;
  exists: boolean;
}

// ─── MCP Server Types ────────────────────────────────────────────

export interface McpServerLocal {
  type: "local";
  command: string[];
  environment?: Record<string, string>;
  enabled?: boolean;
}

export interface McpServerRemote {
  type: "remote";
  url: string;
  headers?: Record<string, string>;
  enabled?: boolean;
}

export type McpServerConfig = McpServerLocal | McpServerRemote;

// ─── Provider Types ──────────────────────────────────────────────

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  models?: string[];
  options?: Record<string, unknown>;
}

// ─── Agent Config ────────────────────────────────────────────────

export interface AgentConfig {
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
}

// ─── Permission Config ──────────────────────────────────────────

export interface PermissionConfig {
  autoApprove?: string[];
  deny?: string[];
}

// ─── TUI Config ─────────────────────────────────────────────────

export interface TuiConfig {
  theme?: string;
  keymap?: Record<string, string>;
}

// ─── Full OpenCode Config ────────────────────────────────────────

export interface OpenCodeConfig {
  $schema?: string;
  mcp?: Record<string, McpServerConfig>;
  provider?: Record<string, ProviderConfig>;
  agent?: AgentConfig;
  permission?: PermissionConfig;
  tui?: TuiConfig;
  instructions?: string[];
  plugins?: string[];
  [key: string]: unknown;
}

// ─── Scoped Config ───────────────────────────────────────────────

export interface ScopedConfig {
  config: OpenCodeConfig;
  scope: ConfigScope;
  filePath: string | null;
  raw: string | null;
}

// ─── Merged Config ───────────────────────────────────────────────

export interface MergedConfig {
  merged: OpenCodeConfig;
  scopes: ScopedConfig[];
}

// ─── Skills ──────────────────────────────────────────────────────

export interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string[];
  metadata?: Record<string, unknown>;
}

export interface Skill {
  frontmatter: SkillFrontmatter;
  body: string;
  path: string;
  scope: ConfigScope;
}

// ─── Agents (markdown-defined) ───────────────────────────────────

export interface AgentFrontmatter {
  description?: string;
  mode?: string;
  model?: string;
  temperature?: number;
  maxSteps?: number;
  permission?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface Agent {
  name: string;
  frontmatter: AgentFrontmatter;
  body: string;
  path: string;
  scope: ConfigScope;
}

// ─── Change Events ───────────────────────────────────────────────

export type ChangeType = "config" | "skill" | "agent";
export type FileChangeType = "created" | "modified" | "deleted";

export interface ConfigChangeEvent {
  type: ChangeType;
  scope: ConfigScope;
  filePath: string;
  changeType: FileChangeType;
  timestamp: number;
}

// ─── Validation ──────────────────────────────────────────────────

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationError {
  path: string;
  message: string;
  severity: ValidationSeverity;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ─── File Watcher Listener ───────────────────────────────────────

export type ChangeListener = (event: ConfigChangeEvent) => void;
