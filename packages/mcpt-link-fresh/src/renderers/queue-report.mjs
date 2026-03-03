/**
 * Queue Report Renderer
 *
 * Produces outreach-queue.json and outreach-queue.md
 * from the built queue. Follows the same pattern as
 * report.mjs (writePlan / renderPlanMd).
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Write queue to disk as JSON and Markdown.
 *
 * @param {object} queue — { items, suppressed, stats }
 * @param {string} outDir — directory to write to
 * @param {object} [meta] — optional metadata (generatedAt, policy)
 * @returns {{ jsonPath: string, mdPath: string }}
 */
export function writeQueue(queue, outDir, meta = {}) {
  fs.mkdirSync(outDir, { recursive: true });

  const fullQueue = {
    schemaVersion: "1.0.0",
    generatedAt: meta.generatedAt || new Date().toISOString(),
    policy: meta.policy || {},
    ...queue,
  };

  // outreach-queue.json
  const jsonPath = path.join(outDir, "outreach-queue.json");
  fs.writeFileSync(jsonPath, JSON.stringify(fullQueue, null, 2) + "\n", "utf8");

  // outreach-queue.md
  const mdPath = path.join(outDir, "outreach-queue.md");
  fs.writeFileSync(mdPath, renderQueueMd(fullQueue), "utf8");

  return { jsonPath, mdPath };
}

/**
 * Render queue as human-readable Markdown.
 *
 * @param {object} queue — full queue object with schemaVersion, items, suppressed, stats
 * @returns {string}
 */
export function renderQueueMd(queue) {
  const lines = [];

  lines.push("# Outreach Queue");
  lines.push("");
  lines.push("| Key | Value |");
  lines.push("|-----|-------|");
  lines.push(`| Generated | ${queue.generatedAt} |`);
  lines.push(`| Queued | ${queue.stats.queued} |`);
  lines.push(`| Suppressed | ${queue.stats.suppressed} |`);
  lines.push(`| Total evaluated | ${queue.stats.totalTriggersEvaluated} |`);
  lines.push("");

  if (queue.items.length === 0 && queue.suppressed.length === 0) {
    lines.push("> No outreach triggers detected. Everything is quiet.");
    lines.push("");
    return lines.join("\n");
  }

  // ── Queued Items ──
  if (queue.items.length > 0) {
    lines.push("## Pending Review");
    lines.push("");

    for (const item of queue.items) {
      const badge = categoryBadge(item.triggerCategory);
      const prioLabel = item.priority === "high" ? " **HIGH**" : "";
      lines.push(`### ${badge} ${item.slug}${prioLabel}`);
      lines.push("");
      lines.push(`**Trigger:** ${item.triggerSummary}`);
      lines.push("");

      // Audience
      lines.push(`**Audience:** ${item.audienceName || "General"}`);
      lines.push("");

      // Subject lines
      if (item.suggestedSubjectLines.length > 0) {
        lines.push("**Suggested subjects:**");
        for (const subj of item.suggestedSubjectLines) {
          lines.push(`- ${subj}`);
        }
        lines.push("");
      }

      // Targets
      if (item.targets.length > 0) {
        lines.push("**Top targets:**");
        lines.push("");
        lines.push("| Repo | Score | Type | Why |");
        lines.push("|------|-------|------|-----|");
        for (const t of item.targets) {
          lines.push(`| ${t.fullName} | ${t.score} | ${t.ownerType} | ${(t.whyMatched || []).join(", ")} |`);
        }
        lines.push("");
      }

      // Template + CTA
      lines.push(`**Template:** \`${item.suggestedTemplate}\``);
      if (item.goLink) {
        lines.push(`**CTA:** [${item.goLink}](${item.goLinkUrl})`);
      }
      lines.push("");

      // Claims
      if (item.claimsUsed.length > 0) {
        lines.push("**Claims used:**");
        for (const c of item.claimsUsed) {
          lines.push(`- [${c.status}] ${c.statement}`);
        }
        lines.push("");
      }

      // Resources
      lines.push("**Resources:**");
      if (item.resourceLinks.presskit) lines.push(`- [Press kit](${item.resourceLinks.presskit})`);
      if (item.resourceLinks.outreachPack) lines.push(`- [Outreach pack](${item.resourceLinks.outreachPack})`);
      if (item.resourceLinks.partnerPack) lines.push(`- [Partner pack](${item.resourceLinks.partnerPack})`);
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  // ── Suppressed Items ──
  if (queue.suppressed.length > 0) {
    lines.push("## Suppressed");
    lines.push("");
    lines.push("| Item | Reason | Trigger |");
    lines.push("|------|--------|---------|");
    for (const item of queue.suppressed) {
      lines.push(`| ${item.id} | ${item.suppressedReason} | ${item.triggerSummary} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function categoryBadge(category) {
  const badges = {
    "claim-change": "[CLAIM]",
    "evidence-added": "[EVIDENCE]",
    "release-published": "[RELEASE]",
    "presskit-material": "[PRESSKIT]",
  };
  return badges[category] || `[${category.toUpperCase()}]`;
}
