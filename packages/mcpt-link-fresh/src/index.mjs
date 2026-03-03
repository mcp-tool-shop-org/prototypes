#!/usr/bin/env node

/**
 * mcpt-link-fresh — Keep your public surfaces from going stale.
 *
 * Usage:
 *   node src/index.mjs --dry-run --config sync.config.json
 *   node src/index.mjs --apply  --config sync.config.json
 *   node src/index.mjs --apply  --config sync.config.json --target zip-meta-map
 *
 * Environment:
 *   GITHUB_TOKEN — required for --apply, optional for --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fail, warn } from "./lib/errors.mjs";
import { validateUrl } from "./lib/sanitize.mjs";
import { fetchPresskit, fetchLinks } from "./adapters/canonical.mjs";
import * as gh from "./adapters/github.mjs";
import { detectDrift } from "./planners/drift-detector.mjs";
import { buildPlan } from "./planners/patch-planner.mjs";
import { writePlan, writeResults } from "./renderers/report.mjs";
import { buildLinksBlock, injectBlock } from "./renderers/readme-blocks.mjs";
import { buildReleaseSection, injectReleaseSection } from "./renderers/release-notes.mjs";
import { loadMarketingData, loadPreviousPresskit, savePresskit, loadHistory, saveHistory } from "./adapters/marketing-site.mjs";
import { classifyDrifts } from "./analyzers/outreach-classifier.mjs";
import { buildQueue } from "./analyzers/queue-builder.mjs";
import { writeQueue } from "./renderers/queue-report.mjs";
import { readClearanceSummaries } from "./analyzers/clearance-hook.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Parse CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const apply = args.includes("--apply");

const configIdx = args.indexOf("--config");
const configPath = configIdx !== -1 && args[configIdx + 1]
  ? path.resolve(args[configIdx + 1])
  : path.resolve("sync.config.json");

const targetIdx = args.indexOf("--target");
const targetSlug = targetIdx !== -1 && args[targetIdx + 1]
  ? args[targetIdx + 1]
  : null;

if (!dryRun && !apply) {
  console.log("Usage: mcpt-link-fresh --dry-run|--apply [--config <path>] [--target <slug>]");
  console.log("");
  console.log("  --dry-run     Detect drift and produce a plan (no changes)");
  console.log("  --apply       Detect drift and apply fixes");
  console.log("  --config      Path to sync.config.json (default: ./sync.config.json)");
  console.log("  --target      Process only one target slug (optional)");
  process.exit(0);
}

// ── Load config ────────────────────────────────────────────────────────────────

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (err) {
  fail("MKT.SYNC.NO_CONFIG", `Failed to load config: ${err.message}`, {
    fix: "Check the --config path and ensure the file is valid JSON.",
    path: configPath,
  });
}

// ── Validate config ─────────────────────────────────────────────────────────────

// Validate canonical URLs against domain allowlist
const allowedDomains = config.rules?.allowedDomains || [];
if (allowedDomains.length > 0) {
  const canonicalUrls = [
    config.canonical.presskitBaseUrl,
    config.canonical.linksUrl,
    config.canonical.toolPageBase,
    config.canonical.pressPageBase,
  ].filter(Boolean);

  for (const url of canonicalUrls) {
    try {
      const parsed = new URL(url);
      if (!allowedDomains.includes(parsed.hostname)) {
        fail("MKT.SYNC.DOMAIN_BLOCKED", `Canonical URL hostname "${parsed.hostname}" not in allowedDomains`, {
          fix: `Add "${parsed.hostname}" to rules.allowedDomains in config, or remove the domain allowlist.`,
          path: configPath,
        });
      }
    } catch (err) {
      if (err.code) throw err; // re-throw process.exit from fail()
      fail("MKT.SYNC.NO_CONFIG", `Invalid canonical URL: ${url}`, {
        fix: "Fix the URL in your sync.config.json canonical section.",
        path: configPath,
      });
    }
  }
}

// ── Filter targets ──────────────────────────────────────────────────────────────

let enabledTargets = (config.targets || []).filter((t) => t.enabled !== false);

// --target flag filters to a single slug
if (targetSlug) {
  enabledTargets = enabledTargets.filter((t) => t.slug === targetSlug);
  if (enabledTargets.length === 0) {
    fail("MKT.SYNC.NO_TARGET", `No enabled target found with slug "${targetSlug}"`, {
      fix: "Check the --target value against your sync.config.json targets.",
      path: configPath,
    });
  }
}

if (enabledTargets.length === 0) {
  console.log("No enabled targets in config. Nothing to do.");
  process.exit(0);
}

// ── Org freeze guard ─────────────────────────────────────────────────────────────

const frozenOwners = new Set(config.freeze?.disallowOwners || []);

if (frozenOwners.size > 0) {
  for (const target of enabledTargets) {
    const [owner] = target.repo.split("/");
    if (frozenOwners.has(owner)) {
      fail("MKT.SYNC.FROZEN_OWNER", `Target "${target.slug}" belongs to frozen owner "${owner}"`, {
        fix: `Remove "${owner}" from freeze.disallowOwners, or disable this target.`,
        path: configPath,
      });
    }
  }
}

// ── Outreach config ─────────────────────────────────────────────────────────────

const outreachEnabled = config.outreach?.enabled === true && !!config.marketingSitePath;
const outreachPolicy = config.outreach || {};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`mcpt-link-fresh ${dryRun ? "(dry-run)" : "(apply)"}`);
  console.log(`Config: ${configPath}`);
  console.log(`Targets: ${enabledTargets.map((t) => t.slug).join(", ")}`);
  if (targetSlug) console.log(`Filter: --target ${targetSlug}`);
  if (outreachEnabled) console.log(`Outreach: enabled (${config.marketingSitePath})`);
  console.log("");

  // Fetch canonical links (optional)
  let linksData = null;
  try {
    linksData = await fetchLinks(config.canonical.linksUrl);
  } catch (err) {
    warn("MKT.SYNC.FETCH_FAILED", `Could not fetch links.json: ${err.message}`, {
      fix: "Check that mcptoolshop.com is live and links.json is deployed.",
    });
  }

  // Reports base directory (next to config file)
  const reportsBase = path.join(path.dirname(configPath), "reports");

  // Load outreach history once (shared across all targets)
  let outreachHistory = { entries: [] };
  if (outreachEnabled) {
    outreachHistory = loadHistory(reportsBase);
  }

  // Process each target
  const allDrifts = [];
  const presskitsBySlug = new Map();
  const allTriggers = [];

  for (const target of enabledTargets) {
    console.log(`── ${target.slug} ──`);
    const [owner, repo] = target.repo.split("/");

    // 1. Fetch canonical presskit
    let presskit;
    try {
      presskit = await fetchPresskit(config.canonical.presskitBaseUrl, target.slug);
    } catch (err) {
      warn("MKT.SYNC.FETCH_FAILED", `Could not fetch presskit for "${target.slug}": ${err.message}`, {
        fix: "Ensure the press kit is generated and the site is deployed.",
      });
      continue;
    }

    if (!presskit) {
      warn("MKT.SYNC.NO_PRESSKIT", `No presskit.json found for "${target.slug}"`, {
        fix: "Run gen-presskit.mjs in the marketing site, then deploy.",
      });
      continue;
    }

    presskitsBySlug.set(target.slug, presskit);

    // 2. Fetch current GitHub state
    let repoMeta;
    try {
      repoMeta = await gh.getRepoMeta(owner, repo);
    } catch (err) {
      warn("MKT.SYNC.API_DENIED", `Could not read repo ${target.repo}: ${err.message}`, {
        fix: "Check GITHUB_TOKEN and repo permissions.",
      });
      continue;
    }

    if (repoMeta.archived) {
      console.log(`  Skipping: repo is archived.\n`);
      continue;
    }

    // 3. Detect drift
    const drifts = detectDrift(presskit, repoMeta, target, config);

    // 4. Check release notes drift
    if (config.rules?.appendReleaseNotesSection) {
      try {
        const release = await gh.getLatestRelease(owner, repo);
        if (release) {
          const section = buildReleaseSection(presskit, config);
          const { changed } = injectReleaseSection(release.body || "", section);
          if (changed) {
            drifts.push({
              surface: "release",
              field: "releaseNotes",
              action: "DIRECT_UPDATE",
              current: "(missing or stale links section)",
              canonical: "(managed links + proof section)",
              slug: target.slug,
              _releaseId: release.id,
              _releaseBody: release.body || "",
              _section: section,
            });
          }
        }
      } catch (err) {
        warn("MKT.SYNC.FETCH_FAILED", `Could not check releases for ${target.slug}: ${err.message}`);
      }
    }

    // 5. Check README drift
    if (config.rules?.openReadmePR) {
      try {
        const { content: readmeContent, sha: readmeSha } = await gh.getFileContent(
          owner, repo, "README.md", repoMeta.defaultBranch
        );
        const block = buildLinksBlock(presskit, config);
        const { changed } = injectBlock(readmeContent, block);
        if (changed) {
          drifts.push({
            surface: "readme",
            field: "readmeBlock",
            action: "PR_REQUIRED",
            current: "(missing or stale mcpt block)",
            canonical: "(managed links block)",
            slug: target.slug,
            _readmeContent: readmeContent,
            _readmeSha: readmeSha,
            _block: block,
            _defaultBranch: repoMeta.defaultBranch,
          });
        }
      } catch (err) {
        warn("MKT.SYNC.FETCH_FAILED", `Could not check README for ${target.slug}: ${err.message}`);
      }
    }

    if (drifts.length === 0) {
      console.log("  No drift detected.\n");
    } else {
      console.log(`  ${drifts.length} drift(s) detected.\n`);
    }

    allDrifts.push(...drifts);

    // 6. Outreach classification (if enabled)
    if (outreachEnabled) {
      const previousPresskit = loadPreviousPresskit(reportsBase, target.slug);

      if (!previousPresskit) {
        console.log(`  Outreach: first run for "${target.slug}" — establishing baseline.\n`);
      } else {
        const triggers = classifyDrifts(drifts, presskit, previousPresskit, config);
        if (triggers.length > 0) {
          console.log(`  Outreach: ${triggers.length} trigger(s) classified.\n`);
          allTriggers.push({ slug: target.slug, triggers });
        } else {
          console.log(`  Outreach: no triggers.\n`);
        }
      }
    }
  }

  // Build plan
  const plan = buildPlan(allDrifts, config);

  // ── Clearance Hook (if enabled) ──────────────────────────────────────────────

  let clearanceAnnotation = null;
  const clearanceConfig = config.clearanceHook || {};

  if (clearanceConfig.enabled && clearanceConfig.artifactPath) {
    const targetSlugs = enabledTargets.map((t) => t.slug);
    const clearance = readClearanceSummaries(
      clearanceConfig.artifactPath,
      targetSlugs,
      { strict: clearanceConfig.strict === true }
    );

    if (clearance) {
      clearanceAnnotation = clearance;
      console.log(`\nClearance: ${clearance.entries.length} slug(s) checked`);

      if (clearance.blocked) {
        fail("MKT.SYNC.CLEARANCE_BLOCKED", clearance.blockedReason, {
          fix: "Resolve RED-tier clearance issues before syncing, or set clearanceHook.strict to false.",
        });
      }
    } else {
      console.log(`\nClearance: no summaries found for target slugs.`);
    }
  }

  // Write reports
  const today = new Date().toISOString().split("T")[0];
  const outDir = path.join(path.dirname(configPath), "reports", today);
  const { jsonPath, mdPath } = writePlan(plan, outDir, { clearanceAnnotation });
  console.log(`Plan written to:`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${mdPath}`);

  // ── Outreach Queue (if enabled) ──────────────────────────────────────────────

  if (outreachEnabled && allTriggers.length > 0) {
    console.log(`\nBuilding outreach queue...`);

    const allQueueItems = [];
    const allSuppressed = [];
    let totalTriggersEvaluated = 0;

    for (const { slug, triggers } of allTriggers) {
      const marketingData = loadMarketingData(config.marketingSitePath, slug);

      if (!marketingData.tool) {
        warn("MKT.SYNC.OUTREACH_SKIP", `No MarketIR data for "${slug}" — skipping outreach`, {
          fix: "Ensure a tool JSON exists in the marketing site's data/marketir/data/tools/ directory.",
        });
        continue;
      }

      if (!marketingData.targetsData) {
        warn("MKT.SYNC.OUTREACH_NO_TARGETS", `No targets.json for "${slug}" — outreach will have no targets`, {
          fix: "Run gen-targets.mjs in the marketing site for this slug.",
        });
      }

      const provenClaims = (marketingData.tool.claims || []).filter((c) => c.status === "proven");
      if (provenClaims.length === 0) {
        warn("MKT.SYNC.OUTREACH_NO_CLAIMS", `No proven claims for "${slug}" — nothing to base outreach on`, {
          fix: "Add proven claims with evidence to the tool's MarketIR definition.",
        });
      }

      const queue = buildQueue(triggers, marketingData, outreachHistory, outreachPolicy, config, slug);

      allQueueItems.push(...queue.items);
      allSuppressed.push(...queue.suppressed);
      totalTriggersEvaluated += queue.stats.totalTriggersEvaluated;
    }

    // Validate go-link domains before writing queue
    if (allowedDomains.length > 0) {
      for (const item of allQueueItems) {
        if (item.goLinkUrl) {
          try {
            const parsed = new URL(item.goLinkUrl);
            if (!allowedDomains.includes(parsed.hostname)) {
              fail("MKT.SYNC.OUTREACH_DOMAIN", `Go-link URL hostname "${parsed.hostname}" not in allowedDomains`, {
                fix: `Add "${parsed.hostname}" to rules.allowedDomains, or check the go-link URL.`,
              });
            }
          } catch (err) {
            if (err.code) throw err;
            // Malformed URL — skip validation, writeQueue will handle it
          }
        }
      }
    }

    const fullQueue = {
      items: allQueueItems,
      suppressed: allSuppressed,
      stats: {
        totalTriggersEvaluated,
        queued: allQueueItems.length,
        suppressed: allSuppressed.length,
      },
    };

    const queueMeta = {
      generatedAt: new Date().toISOString(),
      policy: outreachPolicy,
    };

    const { jsonPath: qJsonPath, mdPath: qMdPath } = writeQueue(fullQueue, outDir, queueMeta);
    console.log(`\nOutreach queue written to:`);
    console.log(`  ${qJsonPath}`);
    console.log(`  ${qMdPath}`);
    console.log(`  ${fullQueue.stats.queued} queued, ${fullQueue.stats.suppressed} suppressed`);

    // Also write to marketing site public dir (if accessible)
    if (config.marketingSitePath) {
      const marketingQueueDir = path.join(config.marketingSitePath, "site", "public", "queue");
      try {
        writeQueue(fullQueue, marketingQueueDir, queueMeta);
        console.log(`  Copied to: ${marketingQueueDir}`);
      } catch (err) {
        warn("MKT.SYNC.OUTREACH_SKIP", `Could not write queue to marketing site: ${err.message}`, {
          fix: "Check that marketingSitePath is correct and writable.",
        });
      }
    }

    // Save outreach history (queued items only)
    saveHistory(allQueueItems, outreachHistory, reportsBase);
    console.log(`  History updated: ${outreachHistory.entries.length + allQueueItems.length} entries`);
  } else if (outreachEnabled) {
    console.log(`\nOutreach: no triggers — queue empty.`);
  }

  // ── Save presskit snapshots (always, even if outreach is off) ────────────────

  if (outreachEnabled) {
    for (const [slug, presskit] of presskitsBySlug) {
      savePresskit(reportsBase, slug, presskit);
    }
    console.log(`\nPresskit snapshots saved for: ${[...presskitsBySlug.keys()].join(", ")}`);
  }

  if (dryRun) {
    console.log(`\nDry run complete. ${plan.totalDrifts} drift(s) found across ${enabledTargets.length} target(s).`);
    return;
  }

  // ── Apply mode ────────────────────────────────────────────────────────────────

  if (!process.env.GITHUB_TOKEN) {
    fail("MKT.SYNC.API_DENIED", "GITHUB_TOKEN required for --apply mode", {
      fix: "Set GITHUB_TOKEN with repo scope.",
    });
  }

  console.log(`\nApplying ${plan.actions.length} change(s)...\n`);

  for (const action of plan.actions) {
    const drift = allDrifts.find(
      (d) => d.slug === action.slug && d.field === action.field
    );
    const [owner, repo] = enabledTargets
      .find((t) => t.slug === action.slug)
      .repo.split("/");

    try {
      if (action.action === "DIRECT_UPDATE") {
        if (action.field === "description") {
          await gh.updateRepoMeta(owner, repo, { description: action.canonical });
          action.status = "applied";
          console.log(`  [OK] ${action.slug}: updated description`);
        } else if (action.field === "homepage") {
          await gh.updateRepoMeta(owner, repo, { homepage: action.canonical });
          action.status = "applied";
          console.log(`  [OK] ${action.slug}: updated homepage`);
        } else if (action.field === "topics") {
          const topics = action.canonical.split(", ").filter(Boolean);
          await gh.setRepoTopics(owner, repo, topics);
          action.status = "applied";
          console.log(`  [OK] ${action.slug}: updated topics`);
        } else if (action.field === "releaseNotes" && drift?._releaseId) {
          const { body: newBody } = injectReleaseSection(drift._releaseBody, drift._section);
          await gh.updateReleaseBody(owner, repo, drift._releaseId, newBody);
          action.status = "applied";
          console.log(`  [OK] ${action.slug}: updated release notes`);
        }
      } else if (action.action === "PR_REQUIRED") {
        if (action.field === "readmeBlock" && drift?._readmeContent) {
          const { content: newContent } = injectBlock(drift._readmeContent, drift._block);
          const branchName = `mcpt-link-fresh/${action.slug}`;
          const baseSha = await gh.getBranchSha(owner, repo, drift._defaultBranch);

          try {
            await gh.createBranch(owner, repo, branchName, baseSha);
          } catch (err) {
            if (!err.message.includes("422")) throw err;
            // Branch already exists, that's fine
          }

          await gh.putFileContent(owner, repo, "README.md", {
            content: newContent,
            sha: drift._readmeSha,
            branch: branchName,
            message: `chore: refresh mcpt links block for ${action.slug}`,
          });

          const pr = await gh.createPR(owner, repo, {
            title: `chore: refresh mcpt links for ${action.slug}`,
            body: `Automated update from [mcpt-link-fresh](https://github.com/mcp-tool-shop/mcpt-link-fresh).\n\nThis PR updates the managed links block in README.md to match canonical truth from mcptoolshop.com.`,
            head: branchName,
            base: drift._defaultBranch,
          });

          action.status = "applied";
          action.prUrl = pr.html_url;
          console.log(`  [OK] ${action.slug}: opened PR ${pr.html_url}`);
        }
      }
    } catch (err) {
      action.status = "failed";
      action.error = err.message;
      warn("MKT.SYNC.API_DENIED", `Failed to apply ${action.field} for ${action.slug}: ${err.message}`);
    }
  }

  // Write results
  const { resultsPath } = writeResults(plan, outDir);
  console.log(`\nResults written to: ${resultsPath}`);

  const applied = plan.actions.filter((a) => a.status === "applied").length;
  const failed = plan.actions.filter((a) => a.status === "failed").length;
  console.log(`\nDone. ${applied} applied, ${failed} failed, ${plan.actions.length} total.`);
}

main().catch((err) => {
  fail("MKT.SYNC.FETCH_FAILED", `Unexpected error: ${err.message}`, {
    fix: "Check the error above. Run with --dry-run to debug.",
    nerd: err.stack,
  });
});
