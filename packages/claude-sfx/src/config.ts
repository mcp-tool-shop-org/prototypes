/**
 * Global configuration — persisted to ~/.claude-sfx/config.json.
 * Controls profile, volume, quiet hours, mute state, per-verb toggles,
 * and per-repo profile overrides.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { SfxError } from "./errors.js";

// --- Config directory ---

const CONFIG_DIR = join(homedir(), ".claude-sfx");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

// --- Schema ---

export interface QuietHours {
  /** Start time in HH:MM format (24h). */
  start: string;
  /** End time in HH:MM format (24h). */
  end: string;
}

export interface SfxConfig {
  /** Active profile name or path. */
  profile: string;
  /** Master volume 0–100 (maps to gain 0.0–1.0). */
  volume: number;
  /** Global mute toggle. */
  muted: boolean;
  /** Quiet hours (sounds suppressed). */
  quietHours: QuietHours | null;
  /** Per-verb enable/disable. Missing = enabled. */
  disabledVerbs: string[];
  /** Per-repo profile overrides. Key = absolute repo path, value = profile name. */
  repoProfiles: Record<string, string>;
}

const DEFAULT_CONFIG: SfxConfig = {
  profile: "minimal",
  volume: 80,
  muted: false,
  quietHours: null,
  disabledVerbs: [],
  repoProfiles: {},
};

// --- Read/Write ---

export function loadConfig(): SfxConfig {
  if (!existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    // Merge with defaults so new fields are always present
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: SfxConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n");
}

// --- Convenience setters ---

export function setMuted(muted: boolean): SfxConfig {
  const cfg = loadConfig();
  cfg.muted = muted;
  saveConfig(cfg);
  return cfg;
}

export function setVolume(volume: number): SfxConfig {
  const cfg = loadConfig();
  cfg.volume = Math.max(0, Math.min(100, Math.round(volume)));
  saveConfig(cfg);
  return cfg;
}

export function setProfile(profile: string): SfxConfig {
  const cfg = loadConfig();
  cfg.profile = profile;
  saveConfig(cfg);
  return cfg;
}

/** Validate a time string in HH:MM 24-hour format. Returns true if valid. */
export function isValidTimeFormat(time: string): boolean {
  if (!/^\d{1,2}:\d{2}$/.test(time)) return false;
  const [h, m] = time.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function setQuietHours(start: string, end: string): SfxConfig {
  if (!isValidTimeFormat(start)) {
    throw new SfxError({
      code: "CONFIG_INVALID_VALUE",
      message: `Invalid quiet hours start time: "${start}"`,
      hint: "Use HH:MM format in 24-hour time (e.g., 22:00)",
    });
  }
  if (!isValidTimeFormat(end)) {
    throw new SfxError({
      code: "CONFIG_INVALID_VALUE",
      message: `Invalid quiet hours end time: "${end}"`,
      hint: "Use HH:MM format in 24-hour time (e.g., 07:00)",
    });
  }
  const cfg = loadConfig();
  cfg.quietHours = { start, end };
  saveConfig(cfg);
  return cfg;
}

export function clearQuietHours(): SfxConfig {
  const cfg = loadConfig();
  cfg.quietHours = null;
  saveConfig(cfg);
  return cfg;
}

// --- Quiet hours check ---

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function isQuietTime(config: SfxConfig): boolean {
  if (!config.quietHours) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = parseTime(config.quietHours.start);
  const end = parseTime(config.quietHours.end);

  // Handle overnight ranges (e.g., 22:00 → 07:00)
  if (start > end) {
    return currentMinutes >= start || currentMinutes < end;
  }
  return currentMinutes >= start && currentMinutes < end;
}

/** Resolve the effective profile name for the current working directory. */
export function resolveProfileName(config: SfxConfig, cwd?: string): string {
  if (cwd && config.repoProfiles[cwd]) {
    return config.repoProfiles[cwd];
  }
  return config.profile;
}

/** Convert volume (0–100) to gain (0.0–1.0). */
export function volumeToGain(volume: number): number {
  return Math.max(0, Math.min(1, volume / 100));
}

export { CONFIG_DIR, CONFIG_FILE };
