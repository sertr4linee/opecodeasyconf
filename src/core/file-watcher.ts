import { watch, existsSync, type FSWatcher } from "fs";
import { resolveAllPaths, getSkillScanDirs, getAgentScanDirs } from "./path-resolver.ts";
import type { ChangeListener, ConfigChangeEvent, ChangeType } from "./types.ts";

// ─── Self-write tracking ─────────────────────────────────────────

const selfWrites = new Map<string, number>();
const SELF_WRITE_WINDOW_MS = 500;

export function markSelfWrite(path: string): void {
  selfWrites.set(path, Date.now());
}

function isSelfWrite(path: string): boolean {
  const ts = selfWrites.get(path);
  if (!ts) return false;
  if (Date.now() - ts < SELF_WRITE_WINDOW_MS) return true;
  selfWrites.delete(path);
  return false;
}

// ─── FileWatcher class ───────────────────────────────────────────

export class FileWatcher {
  private watchers: FSWatcher[] = [];
  private listeners: Set<ChangeListener> = new Set();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  onChange(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  start(): void {
    this.stop();

    // Watch config files
    for (const resolved of resolveAllPaths()) {
      if (resolved.configFile && existsSync(resolved.configFile)) {
        this.watchPath(resolved.configFile, "config", resolved.scope);
      }
    }

    // Watch skill directories
    for (const dir of getSkillScanDirs()) {
      if (existsSync(dir)) {
        this.watchDir(dir, "skill");
      }
    }

    // Watch agent directories
    for (const dir of getAgentScanDirs()) {
      if (existsSync(dir)) {
        this.watchDir(dir, "agent");
      }
    }
  }

  stop(): void {
    for (const w of this.watchers) {
      w.close();
    }
    this.watchers = [];
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  private watchPath(filePath: string, type: ChangeType, scope: string): void {
    try {
      const watcher = watch(filePath, () => {
        this.debouncedEmit(filePath, type, scope);
      });
      this.watchers.push(watcher);
    } catch {
      // File may have been deleted between check and watch
    }
  }

  private watchDir(dir: string, type: ChangeType): void {
    try {
      const watcher = watch(dir, { recursive: true }, (_event, filename) => {
        if (filename) {
          const fullPath = `${dir}/${filename}`;
          this.debouncedEmit(fullPath, type, "project");
        }
      });
      this.watchers.push(watcher);
    } catch {
      // Directory may not exist
    }
  }

  private debouncedEmit(
    filePath: string,
    type: ChangeType,
    scope: string,
  ): void {
    const existing = this.debounceTimers.get(filePath);
    if (existing) clearTimeout(existing);

    this.debounceTimers.set(
      filePath,
      setTimeout(() => {
        this.debounceTimers.delete(filePath);
        if (isSelfWrite(filePath)) return;

        const event: ConfigChangeEvent = {
          type,
          scope: scope as ConfigChangeEvent["scope"],
          filePath,
          changeType: "modified",
          timestamp: Date.now(),
        };

        for (const listener of this.listeners) {
          listener(event);
        }
      }, 100),
    );
  }
}
