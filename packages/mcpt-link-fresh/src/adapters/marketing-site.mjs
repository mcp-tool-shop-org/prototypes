/**
 * Marketing Site Adapter
 *
 * Reads MarketIR data, target lists, outreach files, and links
 * from the marketing site's local filesystem.
 *
 * Returns null for any missing data (fail-soft).
 * Zero network calls — pure filesystem reads.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * @typedef {object} MarketingData
 * @property {object|null} tool        — MarketIR tool definition
 * @property {object[]} audiences      — resolved audience objects
 * @property {object|null} targetsData — targets.json for this slug
 * @property {string[]} outreachFiles  — available outreach template filenames
 * @property {object|null} linksData   — links.json (go-links registry)
 */

/**
 * Safely read and parse a JSON file. Returns null on any error.
 */
function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * List files in a directory. Returns empty array on error.
 */
function listDir(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

/**
 * Load marketing site data for a given tool slug.
 *
 * @param {string} basePath — root of the mcp-tool-shop checkout
 * @param {string} slug     — tool slug (e.g., "zip-meta-map")
 * @returns {MarketingData}
 */
export function loadMarketingData(basePath, slug) {
  const resolved = path.resolve(basePath);

  // 1. Load MarketIR tool definition
  const toolPath = path.join(resolved, "site", "src", "data", "marketir", "data", "tools", `${slug}.json`);
  const tool = readJson(toolPath);

  // 2. Load audiences referenced by the tool
  const audiences = [];
  if (tool?.audienceRefs) {
    const audiencesDir = path.join(resolved, "site", "src", "data", "marketir", "data", "audiences");
    for (const ref of tool.audienceRefs) {
      // ref format: "aud.ci-maintainers" → filename: "ci-maintainers.json"
      const audienceId = ref.replace(/^aud\./, "");
      const audienceData = readJson(path.join(audiencesDir, `${audienceId}.json`));
      if (audienceData) {
        audiences.push(audienceData);
      }
    }
  }

  // 3. Load target list
  const targetsPath = path.join(resolved, "site", "public", "targets", slug, "targets.json");
  const targetsData = readJson(targetsPath);

  // 4. List outreach template files
  const outreachDir = path.join(resolved, "site", "public", "outreach", slug);
  const outreachFiles = listDir(outreachDir).filter((f) => f.endsWith(".md"));

  // 5. Load go-links registry
  const linksPath = path.join(resolved, "site", "src", "data", "links.json");
  const linksData = readJson(linksPath);

  return { tool, audiences, targetsData, outreachFiles, linksData };
}

/**
 * Load the previous presskit snapshot for a slug.
 *
 * Looks in the reports directory for the most recent presskit snapshot.
 *
 * @param {string} reportsBase — base reports directory
 * @param {string} slug
 * @returns {object|null}
 */
export function loadPreviousPresskit(reportsBase, slug) {
  const snapshotPath = path.join(reportsBase, "presskit-snapshots", `${slug}.json`);
  return readJson(snapshotPath);
}

/**
 * Save a presskit snapshot for future comparison.
 *
 * @param {string} reportsBase — base reports directory
 * @param {string} slug
 * @param {object} presskit
 */
export function savePresskit(reportsBase, slug, presskit) {
  const snapshotDir = path.join(reportsBase, "presskit-snapshots");
  fs.mkdirSync(snapshotDir, { recursive: true });
  const snapshotPath = path.join(snapshotDir, `${slug}.json`);
  fs.writeFileSync(snapshotPath, JSON.stringify(presskit, null, 2) + "\n", "utf8");
}

/**
 * Load outreach history for dedup and rate limiting.
 *
 * @param {string} reportsBase — base reports directory
 * @returns {{ entries: object[] }}
 */
export function loadHistory(reportsBase) {
  const historyPath = path.join(reportsBase, "outreach-history.json");
  const data = readJson(historyPath);
  return data && Array.isArray(data.entries) ? data : { entries: [] };
}

/**
 * Save updated outreach history (append new items, prune old).
 *
 * @param {object[]} newItems — queue items that were queued (not suppressed)
 * @param {{ entries: object[] }} history
 * @param {string} reportsBase
 * @param {number} [retentionDays=90]
 */
export function saveHistory(newItems, history, reportsBase, retentionDays = 90) {
  const cutoff = new Date(Date.now() - retentionDays * 86400000).toISOString();

  // Prune old entries
  const pruned = history.entries.filter((e) => e.queuedAt > cutoff);

  // Add new entries
  const now = new Date().toISOString();
  for (const item of newItems) {
    const targetFullNames = (item.targets || []).map((t) => `${t.owner}/${t.repo}`);
    pruned.push({
      id: item.id,
      slug: item.slug,
      triggerCategory: item.triggerCategory,
      targetFullNames,
      queuedAt: now,
    });
  }

  const historyPath = path.join(reportsBase, "outreach-history.json");
  fs.writeFileSync(historyPath, JSON.stringify({ entries: pruned }, null, 2) + "\n", "utf8");
}
