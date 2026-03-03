/**
 * Clearance Hook — reads COE clearance summaries for target slugs.
 *
 * When enabled, scans published clearance artifacts and annotates the
 * sync plan with tier/score data. In strict mode, RED-tier slugs block
 * the sync run.
 *
 * @module clearance-hook
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Read clearance summaries for a list of slugs.
 *
 * @param {string} artifactPath — Path to published clearance artifacts (e.g. site/public/lab/clearance)
 * @param {string[]} slugs — Target slugs to look up
 * @param {{ strict?: boolean }} opts
 * @returns {{ entries: Array<{ slug: string, tier: string, score: number|null, date: string|null }>, blocked: boolean, blockedReason: string|null } | null}
 */
export function readClearanceSummaries(artifactPath, slugs, opts = {}) {
  const { strict = false } = opts;

  if (!artifactPath || !existsSync(artifactPath)) {
    return null;
  }

  const entries = [];

  for (const slug of slugs) {
    const summaryPath = join(artifactPath, slug, "summary.json");
    if (!existsSync(summaryPath)) continue;

    try {
      const raw = JSON.parse(readFileSync(summaryPath, "utf8"));

      // Validate schema version
      if (raw.schemaVersion !== "1.0.0") continue;
      if (!raw.tier) continue;

      entries.push({
        slug,
        tier: raw.tier,
        score: raw.score ?? null,
        date: raw.date ?? null,
      });
    } catch {
      // Invalid JSON — skip silently
      continue;
    }
  }

  if (entries.length === 0) {
    return null;
  }

  // Check for blocking conditions
  let blocked = false;
  let blockedReason = null;

  if (strict) {
    const redEntries = entries.filter((e) => e.tier.toUpperCase() === "RED");
    if (redEntries.length > 0) {
      blocked = true;
      blockedReason = `${redEntries.length} slug(s) have RED tier: ${redEntries.map((e) => e.slug).join(", ")}`;
    }
  }

  return { entries, blocked, blockedReason };
}
