/**
 * Sound guard — debounce, rate limiting, mute, quiet hours.
 * All "should this sound play?" logic lives here.
 *
 * State is tracked via a lightweight temp file (no daemon needed).
 * Each play call reads/writes a small JSON ledger.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { type SfxConfig, isQuietTime } from "./config.js";

// --- Constants ---

/** Debounce window: same verb within this window → skip. */
const DEBOUNCE_MS = 200;

/** Rate limit: max sounds in the sliding window. */
const RATE_LIMIT_MAX = 8;

/** Rate limit sliding window duration. */
const RATE_LIMIT_WINDOW_MS = 10_000;

/** Ledger file — tiny JSON tracking recent plays. */
const LEDGER_FILE = join(tmpdir(), "claude-sfx-ledger.json");

// --- Ledger ---

export interface LedgerEntry {
  verb: string;
  timestamp: number;
}

export interface Ledger {
  entries: LedgerEntry[];
}

export function readLedger(): Ledger {
  if (!existsSync(LEDGER_FILE)) {
    return { entries: [] };
  }
  try {
    const raw = readFileSync(LEDGER_FILE, "utf-8");
    return JSON.parse(raw) as Ledger;
  } catch {
    return { entries: [] };
  }
}

function writeLedger(ledger: Ledger): void {
  writeFileSync(LEDGER_FILE, JSON.stringify(ledger));
}

/** Prune entries older than the rate limit window. */
function pruneEntries(entries: LedgerEntry[], now: number): LedgerEntry[] {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  return entries.filter((e) => e.timestamp > cutoff);
}

// --- Guard result ---

export interface GuardResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check whether a sound should play, and record it in the ledger if allowed.
 * This is the single entry point for all anti-annoyance logic.
 */
export function guardPlay(verb: string, config: SfxConfig): GuardResult {
  // 1. Muted?
  if (config.muted) {
    return { allowed: false, reason: "muted" };
  }

  // 2. Quiet hours?
  if (isQuietTime(config)) {
    return { allowed: false, reason: "quiet hours" };
  }

  // 3. Verb disabled?
  if (config.disabledVerbs.includes(verb)) {
    return { allowed: false, reason: `verb "${verb}" disabled` };
  }

  // 4. Volume zero?
  if (config.volume <= 0) {
    return { allowed: false, reason: "volume is 0" };
  }

  const now = Date.now();
  const ledger = readLedger();
  const entries = pruneEntries(ledger.entries, now);

  // 5. Debounce — same verb within the window?
  const lastSameVerb = entries.filter((e) => e.verb === verb);
  if (lastSameVerb.length > 0) {
    const mostRecent = lastSameVerb[lastSameVerb.length - 1];
    if (now - mostRecent.timestamp < DEBOUNCE_MS) {
      writeLedger({ entries }); // still prune stale entries
      return { allowed: false, reason: "debounced" };
    }
  }

  // 6. Rate limit — too many sounds in the window?
  if (entries.length >= RATE_LIMIT_MAX) {
    writeLedger({ entries });
    return { allowed: false, reason: "rate limited" };
  }

  // All checks passed — record and allow
  entries.push({ verb, timestamp: now });
  writeLedger({ entries });

  return { allowed: true };
}

/** Reset the ledger (for testing or after mute toggle). */
export function resetLedger(): void {
  writeLedger({ entries: [] });
}
