/**
 * Report Renderer
 *
 * Produces plan.json and plan.md from a PatchPlan.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Write plan to disk as JSON and Markdown.
 *
 * @param {import("../planners/patch-planner.mjs").PatchPlan} plan
 * @param {string} outDir — directory to write reports to
 * @param {{ clearanceAnnotation?: object }} opts
 */
export function writePlan(plan, outDir, opts = {}) {
  fs.mkdirSync(outDir, { recursive: true });

  // plan.json (include clearance data if present)
  const jsonData = opts.clearanceAnnotation
    ? { ...plan, clearance: opts.clearanceAnnotation }
    : plan;
  const jsonPath = path.join(outDir, "plan.json");
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2) + "\n", "utf8");

  // plan.md
  const mdPath = path.join(outDir, "plan.md");
  fs.writeFileSync(mdPath, renderPlanMd(plan, opts), "utf8");

  return { jsonPath, mdPath };
}

/**
 * Write results to disk after applying changes.
 */
export function writeResults(plan, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const resultsPath = path.join(outDir, "results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(plan, null, 2) + "\n", "utf8");
  return { resultsPath };
}

// ─── Explainability helpers ─────────────────────────────────────────────────────

const ACTION_LABELS = {
  DIRECT_UPDATE: { icon: "API", safety: "Safe to auto-apply", desc: "Updates via GitHub API (no PR needed)" },
  PR_REQUIRED: { icon: "PR", safety: "Requires review", desc: "Opens a pull request for human review" },
  RELEASE_REQUIRED: { icon: "REL", safety: "Manual release needed", desc: "Requires a versioned package release" },
};

/**
 * Map a drift action to the GitHub API endpoint it would hit.
 */
function apiEndpoint(action) {
  const { slug, surface, field } = action;
  switch (`${surface}.${field}`) {
    case "metadata.description":
    case "metadata.homepage":
      return `PATCH /repos/{owner}/{repo}`;
    case "metadata.topics":
      return `PUT /repos/{owner}/{repo}/topics`;
    case "release.releaseNotes":
      return `PATCH /repos/{owner}/{repo}/releases/{id}`;
    case "readme.readmeBlock":
      return `PUT /repos/{owner}/{repo}/contents/README.md (via branch + PR)`;
    default:
      return "(unknown endpoint)";
  }
}

/**
 * Render plan as Markdown checklist with explainability.
 *
 * @param {import("../planners/patch-planner.mjs").PatchPlan} plan
 * @param {{ clearanceAnnotation?: object }} opts
 * @returns {string}
 */
export function renderPlanMd(plan, opts = {}) {
  const lines = [];
  lines.push(`# Drift Sync Plan`);
  lines.push("");
  lines.push(`| Key | Value |`);
  lines.push(`|-----|-------|`);
  lines.push(`| Generated | ${plan.generatedAt} |`);
  lines.push(`| Mode | ${plan.mode} |`);
  lines.push(`| Total drifts | ${plan.totalDrifts} |`);
  lines.push("");

  if (plan.actions.length === 0) {
    lines.push("> No drift detected. Everything is in sync.");
    lines.push("");
    return lines.join("\n");
  }

  // Legend
  lines.push("### Legend");
  lines.push("");
  lines.push("| Badge | Meaning | Safety |");
  lines.push("|-------|---------|--------|");
  for (const [, v] of Object.entries(ACTION_LABELS)) {
    lines.push(`| **[${v.icon}]** | ${v.desc} | ${v.safety} |`);
  }
  lines.push("");

  // Group by slug
  const bySlug = new Map();
  for (const action of plan.actions) {
    if (!bySlug.has(action.slug)) bySlug.set(action.slug, []);
    bySlug.get(action.slug).push(action);
  }

  for (const [slug, actions] of bySlug) {
    lines.push(`## ${slug}`);
    lines.push("");
    for (const a of actions) {
      const label = ACTION_LABELS[a.action] || ACTION_LABELS.DIRECT_UPDATE;
      const endpoint = apiEndpoint(a);
      lines.push(`- [ ] **[${label.icon}]** \`${a.surface}.${a.field}\` — ${label.safety}`);
      lines.push(`  - Current: \`${truncate(a.current, 100)}\``);
      lines.push(`  - Canonical: \`${truncate(a.canonical, 100)}\``);
      lines.push(`  - Endpoint: \`${endpoint}\``);
    }
    lines.push("");
  }

  // Naming Clearance (if annotation present)
  if (opts.clearanceAnnotation?.entries?.length > 0) {
    lines.push("### Naming Clearance");
    lines.push("");
    lines.push("| Slug | Tier | Score | Date |");
    lines.push("|------|------|-------|------|");
    for (const entry of opts.clearanceAnnotation.entries) {
      const tier = entry.tier?.toUpperCase() || "—";
      const score = entry.score ?? "—";
      const date = entry.date || "—";
      lines.push(`| ${entry.slug} | ${tier} | ${score} | ${date} |`);
    }
    lines.push("");
  }

  // Summary
  const safe = plan.actions.filter((a) => a.action === "DIRECT_UPDATE").length;
  const review = plan.actions.filter((a) => a.action === "PR_REQUIRED").length;
  const manual = plan.actions.filter((a) => a.action === "RELEASE_REQUIRED").length;
  lines.push("### Summary");
  lines.push("");
  lines.push(`- ${safe} safe to auto-apply (API)`);
  if (review > 0) lines.push(`- ${review} require PR review`);
  if (manual > 0) lines.push(`- ${manual} require manual release`);
  lines.push("");

  return lines.join("\n");
}

function truncate(s, max) {
  if (!s) return "(empty)";
  const str = String(s);
  return str.length > max ? str.slice(0, max) + "..." : str;
}
