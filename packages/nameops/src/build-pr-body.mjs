#!/usr/bin/env node
/**
 * NameOps PR body builder — build-pr-body.mjs
 *
 * Reads batch output + published artifacts and produces a Markdown PR body
 * suitable for cross-repo PRs to the marketing site.
 *
 * Usage:
 *   node src/build-pr-body.mjs <output-dir>
 *
 * Writes: <output-dir>/pr-body.md
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Safely parse a JSON file. Returns null on error.
 * @param {string} filePath
 * @returns {*}
 */
function safeParseJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * List subdirectories.
 * @param {string} dir
 * @returns {string[]}
 */
function listSubdirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

// ── Core ────────────────────────────────────────────────────────

/**
 * Build the PR body from a NameOps output directory.
 *
 * @param {string} outputDir - The top-level output directory (contains batch/, published/, metadata.json)
 * @returns {string} Markdown PR body
 */
export function buildPrBody(outputDir) {
  const absDir = resolve(outputDir);

  // Load metadata
  const metadata = safeParseJson(join(absDir, "metadata.json")) || {};
  const date = metadata.date ? metadata.date.slice(0, 10) : new Date().toISOString().slice(0, 10);

  // Find the batch results directory
  const batchDir = metadata.batchOutputDir || join(absDir, "batch");
  const batchResultsPath = join(batchDir, "batch", "results.json");

  // Load batch results
  const results = safeParseJson(batchResultsPath) || [];

  // Load published runs.json for tier/score data
  const publishDir = metadata.publishDir || join(absDir, "published");
  const runsIndex = safeParseJson(join(publishDir, "runs.json")) || [];

  // Classify by tier
  const green = [];
  const yellow = [];
  const red = [];
  const errors = [];

  for (const entry of runsIndex) {
    const tier = (entry.tier || "unknown").toLowerCase();
    if (tier === "green") green.push(entry);
    else if (tier === "yellow") yellow.push(entry);
    else if (tier === "red") red.push(entry);
    else errors.push(entry);
  }

  // Also count results that may have errored (not in runs.json)
  const resultNames = new Set(results.map((r) => r.name));
  const indexNames = new Set(runsIndex.map((r) => r.name));
  for (const r of results) {
    if (r.error && !indexNames.has(r.name)) {
      errors.push({ name: r.name, tier: "error", score: null, date, error: r.error });
    }
  }

  // Load collision cards from per-slug summaries
  const collisionData = [];
  for (const entry of [...yellow, ...red]) {
    const summaryPath = join(publishDir, entry.slug || entry.name, "summary.json");
    const summary = safeParseJson(summaryPath);
    if (summary?.collisionCards?.length > 0) {
      collisionData.push({
        name: entry.name,
        tier: entry.tier,
        cards: summary.collisionCards.slice(0, 3),
      });
    }
  }

  // Cost stats (from batch results if available)
  let costSection = "";
  if (results.length > 0) {
    // Aggregate adapter call counts from individual runs
    const adapterStats = {};
    for (const r of results) {
      if (!r.run?.checks) continue;
      for (const check of r.run.checks) {
        const ns = check.namespace || "unknown";
        if (!adapterStats[ns]) adapterStats[ns] = { calls: 0, cached: 0 };
        adapterStats[ns].calls++;
        if (check.cacheHit) adapterStats[ns].cached++;
      }
    }

    if (Object.keys(adapterStats).length > 0) {
      const rows = Object.entries(adapterStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([ns, s]) => `| ${ns} | ${s.calls} | ${s.cached} |`)
        .join("\n");

      const totalCalls = Object.values(adapterStats).reduce((s, v) => s + v.calls, 0);
      const totalCached = Object.values(adapterStats).reduce((s, v) => s + v.cached, 0);
      const hitRate = totalCalls > 0 ? Math.round((totalCached / totalCalls) * 100) : 0;

      costSection = `### Cost Stats
| Adapter | Calls | Cached |
|---------|-------|--------|
${rows}
| **Total** | **${totalCalls}** | **${totalCached} (${hitRate}%)** |`;
    }
  }

  // Build the Markdown
  const lines = [];

  lines.push(`## Clearance Run: ${date}`);
  lines.push("");
  lines.push("### Summary");
  lines.push(`- **Names checked:** ${runsIndex.length + errors.filter((e) => e.error).length}`);
  lines.push(`- **GREEN:** ${green.length} | **YELLOW:** ${yellow.length} | **RED:** ${red.length} | **Errors:** ${errors.filter((e) => e.error).length}`);
  if (metadata.durationHuman) {
    lines.push(`- **Runtime:** ${metadata.durationHuman}`);
  }
  lines.push("");

  // GREEN candidates
  if (green.length > 0) {
    lines.push("### Top GREEN Candidates");
    lines.push("| Name | Score |");
    lines.push("|------|-------|");
    for (const entry of green.sort((a, b) => (b.score || 0) - (a.score || 0))) {
      lines.push(`| ${entry.name} | ${entry.score ?? "—"}/100 |`);
    }
    lines.push("");
  }

  // Risky names
  if (yellow.length > 0 || red.length > 0) {
    lines.push("### Risky Names (YELLOW/RED)");
    lines.push("| Name | Tier | Score |");
    lines.push("|------|------|-------|");
    for (const entry of [...red, ...yellow]) {
      const tierBadge = entry.tier.toUpperCase();
      lines.push(`| ${entry.name} | ${tierBadge} | ${entry.score ?? "—"}/100 |`);
    }
    lines.push("");
  }

  // Collision cards
  if (collisionData.length > 0) {
    lines.push("### Collision Cards");
    for (const { name, tier, cards } of collisionData) {
      lines.push(`<details><summary>${name} — ${tier.toUpperCase()}</summary>`);
      lines.push("");
      for (const card of cards) {
        lines.push(`- **${card.title}**: ${card.whyItMatters}`);
      }
      lines.push("");
      lines.push("</details>");
      lines.push("");
    }
  }

  // Cost stats
  if (costSection) {
    lines.push(costSection);
    lines.push("");
  }

  // Errors
  if (errors.filter((e) => e.error).length > 0) {
    lines.push("### Errors");
    for (const e of errors.filter((e) => e.error)) {
      lines.push(`- **${e.name}**: ${e.error}`);
    }
    lines.push("");
  }

  // Review checklist
  lines.push("### Review Checklist");
  lines.push("- [ ] Review GREEN candidates — ready to claim?");
  lines.push("- [ ] Review RED/YELLOW collision cards — names to drop?");
  lines.push("- [ ] Merge to update lab clearance pages");
  lines.push("- [ ] Spot-check any stale entries for freshness");
  lines.push("");

  return lines.join("\n");
}

// ── Entry point ─────────────────────────────────────────────────

const isMain = process.argv[1] &&
  resolve(process.argv[1]) === resolve(import.meta.dirname, "..", "src", "build-pr-body.mjs");

if (isMain) {
  if (process.argv[2]) {
    const outputDir = resolve(process.argv[2]);
    const body = buildPrBody(outputDir);
    const prBodyPath = join(outputDir, "pr-body.md");
    writeFileSync(prBodyPath, body, "utf8");
    console.log(`PR body written to ${prBodyPath}`);
    console.log(`\n${body}`);
  } else {
    console.error("Usage: node src/build-pr-body.mjs <output-dir>");
    process.exit(1);
  }
}
