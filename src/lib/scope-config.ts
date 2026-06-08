import fs from "node:fs";
import path from "node:path";
import { EMPTY_OVERRIDES, type ScopeOverrides } from "./kloudbean-capabilities";

/**
 * Persisted scope configuration (set from the Scope settings screen).
 * Lets the user narrow/widen what the system is allowed to write about, so the
 * scope stays 100% crystal clear and under their control.
 */

const CONFIG_DIR = path.join(process.cwd(), ".local");
const CONFIG_FILE = path.join(CONFIG_DIR, "scope-config.json");

export type ScopeConfig = ScopeOverrides & {
  updatedAt: string;
};

let cache: ScopeConfig | null = null;

export function getScopeConfig(): ScopeConfig {
  if (cache) return cache;
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) as Partial<ScopeConfig>;
      cache = {
        disabledSupported: parsed.disabledSupported ?? [],
        extraUnsupported: parsed.extraUnsupported ?? [],
        allowedUnsupported: parsed.allowedUnsupported ?? [],
        updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      };
      return cache;
    }
  } catch {
    /* fall through to default */
  }
  cache = { ...EMPTY_OVERRIDES, updatedAt: new Date().toISOString() };
  return cache;
}

export function saveScopeConfig(next: Partial<ScopeOverrides>): ScopeConfig {
  const current = getScopeConfig();
  const merged: ScopeConfig = {
    disabledSupported: next.disabledSupported ?? current.disabledSupported,
    extraUnsupported: next.extraUnsupported ?? current.extraUnsupported,
    allowedUnsupported: next.allowedUnsupported ?? current.allowedUnsupported,
    updatedAt: new Date().toISOString(),
  };
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), "utf8");
  } catch {
    /* best effort */
  }
  cache = merged;
  return merged;
}

/** Convenience: the overrides object for capability functions. */
export function scopeOverrides(): ScopeOverrides {
  const c = getScopeConfig();
  return {
    disabledSupported: c.disabledSupported,
    extraUnsupported: c.extraUnsupported,
    allowedUnsupported: c.allowedUnsupported,
  };
}
