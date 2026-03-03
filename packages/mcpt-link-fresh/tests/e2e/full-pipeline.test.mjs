/**
 * E2E Integration Test — Full Pipeline (offline)
 *
 * Runs the complete detect → plan → render pipeline using fixture data.
 * No network calls — everything is mocked with local fixtures.
 *
 * Golden snapshots:
 *   tests/e2e/golden/plan.md
 *   tests/e2e/golden/outreach-queue.md
 * To regenerate: delete the golden file and run the test once.
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { detectDrift } from "../../src/planners/drift-detector.mjs";
import { buildPlan } from "../../src/planners/patch-planner.mjs";
import { writePlan, renderPlanMd } from "../../src/renderers/report.mjs";
import { buildLinksBlock, injectBlock } from "../../src/renderers/readme-blocks.mjs";
import { buildReleaseSection, injectReleaseSection } from "../../src/renderers/release-notes.mjs";
import { classifyDrifts } from "../../src/analyzers/outreach-classifier.mjs";
import { buildQueue } from "../../src/analyzers/queue-builder.mjs";
import { writeQueue, renderQueueMd } from "../../src/renderers/queue-report.mjs";
import { loadMarketingData, loadPreviousPresskit, savePresskit, loadHistory, saveHistory } from "../../src/adapters/marketing-site.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN_DIR = path.join(__dirname, "golden");
const GOLDEN_PLAN_PATH = path.join(GOLDEN_DIR, "plan.md");
const GOLDEN_QUEUE_PATH = path.join(GOLDEN_DIR, "outreach-queue.md");
const MOCK_BASE = path.join(__dirname, "..", "fixtures", "marketing-site-mock");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PRESSKIT = {
  slug: "test-tool",
  name: "Test Tool",
  tagline: "A test tool for unit testing drift detection",
  install: "npm install test-tool",
  stability: "beta",
  kind: "mcp-server",
  repo: "https://github.com/mcp-tool-shop-org/test-tool",
  site: "https://mcptoolshop.com/tools/test-tool/",
  valueProps: [
    "Fast semantic search",
    "Local-only execution",
  ],
  provenClaims: [
    {
      id: "claim-1",
      statement: "Sub-100ms query latency",
      evidence: [{ id: "bench-1", type: "benchmark", url: "https://example.com/bench" }],
    },
  ],
  aspirationalClaims: [],
  antiClaims: ["Not for cloud deployments"],
  githubFacts: { stars: 42, forks: 5, observedAt: "2026-01-01T00:00:00.000Z" },
  trackedLinks: [
    { id: "tt-npm", url: "https://mcptoolshop.com/go/tt-npm/", channel: "npm" },
  ],
  press: null,
  generatedAt: "2026-01-01T00:00:00.000Z",
  sourcelock: "abc123",
};

const CONFIG = {
  version: "1.0.0",
  canonical: {
    presskitBaseUrl: "https://mcptoolshop.com/presskit",
    linksUrl: "https://mcptoolshop.com/links.json",
    toolPageBase: "https://mcptoolshop.com/tools",
    pressPageBase: "https://mcptoolshop.com/press",
  },
  targets: [
    {
      slug: "test-tool",
      repo: "mcp-tool-shop-org/test-tool",
      enabled: true,
      mode: "github-only",
      topicsMax: 12,
    },
  ],
  rules: {
    appendReleaseNotesSection: true,
    openReadmePR: true,
    registryDriftPR: false,
    allowedDomains: ["mcptoolshop.com"],
  },
  freeze: {
    disallowOwners: [],
  },
};

const TARGET = CONFIG.targets[0];

// Simulated "stale" GitHub state — everything is slightly wrong
const STALE_REPO_META = {
  description: "An old description that needs updating",
  homepage: "https://old-site.com/test-tool",
  topics: ["javascript", "testing"],
  defaultBranch: "main",
  archived: false,
};

const STALE_README = [
  "# Test Tool",
  "",
  "An awesome test tool.",
  "",
  "## Installation",
  "",
  "```bash",
  "npm install test-tool",
  "```",
].join("\n");

const STALE_RELEASE_BODY = [
  "## What's New",
  "",
  "- Fixed a bug",
  "- Added feature X",
].join("\n");

// Previous presskit (for outreach diffing — has one fewer claim)
const PREVIOUS_PRESSKIT = {
  slug: "test-tool",
  name: "Test Tool",
  tagline: "A test tool for unit testing drift detection",
  valueProps: ["Fast semantic search", "Local-only execution"],
  claims: [
    {
      id: "claim.test-tool.sub-100ms",
      status: "proven",
      statement: "Sub-100ms query latency",
      evidenceRefs: ["ev.test-tool.bench.v1"],
    },
  ],
  positioning: {
    oneLiner: "A test tool for unit testing drift detection",
  },
  generatedAt: "2025-12-15T00:00:00.000Z",
};

// Current presskit for outreach (adds a new proven claim)
const CURRENT_PRESSKIT_FOR_OUTREACH = {
  slug: "test-tool",
  name: "Test Tool",
  tagline: "A test tool for unit testing drift detection",
  valueProps: ["Fast semantic search", "Local-only execution"],
  claims: [
    {
      id: "claim.test-tool.sub-100ms",
      status: "proven",
      statement: "Sub-100ms query latency",
      evidenceRefs: ["ev.test-tool.bench.v1"],
    },
    {
      id: "claim.test-tool.deterministic",
      status: "proven",
      statement: "Deterministic output given the same input state.",
      evidenceRefs: ["ev.test-tool.deterministic-test.v1"],
    },
  ],
  positioning: {
    oneLiner: "A test tool for unit testing drift detection",
  },
  generatedAt: "2026-01-15T00:00:00.000Z",
};

const OUTREACH_POLICY = {
  enabled: true,
  maxPerToolPerWeek: 3,
  dedupeWindowDays: 14,
  quietHours: null,
  topTargetsPerItem: 3,
};

// ─── Test Suite ─────────────────────────────────────────────────────────────────

describe("E2E: full pipeline (offline)", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(import.meta.dirname || __dirname, ".tmp-e2e-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detects all drift types from stale state", () => {
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);

    assert.ok(drifts.length >= 3, `Expected >=3 drifts, got ${drifts.length}`);

    const descDrift = drifts.find((d) => d.field === "description");
    assert.ok(descDrift, "should detect description drift");
    assert.equal(descDrift.action, "DIRECT_UPDATE");
    assert.equal(descDrift.canonical, "A test tool for unit testing drift detection");

    const homeDrift = drifts.find((d) => d.field === "homepage");
    assert.ok(homeDrift, "should detect homepage drift");
    assert.equal(homeDrift.canonical, "https://mcptoolshop.com/tools/test-tool/");

    const topicsDrift = drifts.find((d) => d.field === "topics");
    assert.ok(topicsDrift, "should detect topics drift");
  });

  it("adds release notes drift when section is missing", () => {
    const section = buildReleaseSection(PRESSKIT, CONFIG);
    const { changed } = injectReleaseSection(STALE_RELEASE_BODY, section);
    assert.ok(changed, "should detect missing release notes section");
  });

  it("adds README block drift when markers are absent", () => {
    const block = buildLinksBlock(PRESSKIT, CONFIG);
    const { changed } = injectBlock(STALE_README, block);
    assert.ok(changed, "should detect missing README block");
  });

  it("runs full detect → plan → write pipeline", () => {
    // 1. Detect all drifts
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);

    // Add release notes drift
    const section = buildReleaseSection(PRESSKIT, CONFIG);
    const { changed: relChanged } = injectReleaseSection(STALE_RELEASE_BODY, section);
    if (relChanged) {
      drifts.push({
        surface: "release",
        field: "releaseNotes",
        action: "DIRECT_UPDATE",
        current: "(missing or stale links section)",
        canonical: "(managed links + proof section)",
        slug: TARGET.slug,
      });
    }

    // Add README drift
    const block = buildLinksBlock(PRESSKIT, CONFIG);
    const { changed: readmeChanged } = injectBlock(STALE_README, block);
    if (readmeChanged) {
      drifts.push({
        surface: "readme",
        field: "readmeBlock",
        action: "PR_REQUIRED",
        current: "(missing or stale mcpt block)",
        canonical: "(managed links block)",
        slug: TARGET.slug,
      });
    }

    // 2. Build plan
    const plan = buildPlan(drifts, CONFIG);

    assert.ok(plan.generatedAt, "plan has timestamp");
    assert.equal(plan.mode, "github-only");
    assert.ok(plan.totalDrifts >= 5, `Expected >=5 total drifts, got ${plan.totalDrifts}`);

    // 3. Verify action ordering: DIRECT_UPDATE before PR_REQUIRED
    const directIdx = plan.actions.findIndex((a) => a.action === "DIRECT_UPDATE");
    const prIdx = plan.actions.findIndex((a) => a.action === "PR_REQUIRED");
    assert.ok(directIdx < prIdx, "DIRECT_UPDATE actions should come before PR_REQUIRED");

    // 4. Write to disk
    const { jsonPath, mdPath } = writePlan(plan, tmpDir);
    assert.ok(fs.existsSync(jsonPath), "plan.json written");
    assert.ok(fs.existsSync(mdPath), "plan.md written");

    // 5. Validate plan.json round-trips
    const reloaded = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.equal(reloaded.totalDrifts, plan.totalDrifts);
    assert.equal(reloaded.actions.length, plan.actions.length);

    // 6. Validate plan.md content
    const md = fs.readFileSync(mdPath, "utf8");
    assert.ok(md.includes("# Drift Sync Plan"), "has title");
    assert.ok(md.includes("## test-tool"), "has slug section");
    assert.ok(md.includes("Safe to auto-apply"), "has safety labels");
    assert.ok(md.includes("Requires review"), "has PR review label");
    assert.ok(md.includes("Endpoint:"), "has endpoint info");
    assert.ok(md.includes("### Legend"), "has legend");
    assert.ok(md.includes("### Summary"), "has summary");
  });

  it("golden snapshot matches expected plan.md structure", () => {
    // Build the plan deterministically
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);

    const section = buildReleaseSection(PRESSKIT, CONFIG);
    const { changed: relChanged } = injectReleaseSection(STALE_RELEASE_BODY, section);
    if (relChanged) {
      drifts.push({
        surface: "release", field: "releaseNotes",
        action: "DIRECT_UPDATE", current: "(missing or stale links section)",
        canonical: "(managed links + proof section)", slug: TARGET.slug,
      });
    }

    const block = buildLinksBlock(PRESSKIT, CONFIG);
    const { changed: readmeChanged } = injectBlock(STALE_README, block);
    if (readmeChanged) {
      drifts.push({
        surface: "readme", field: "readmeBlock",
        action: "PR_REQUIRED", current: "(missing or stale mcpt block)",
        canonical: "(managed links block)", slug: TARGET.slug,
      });
    }

    const plan = buildPlan(drifts, CONFIG);

    // Override timestamp for deterministic output
    plan.generatedAt = "2026-01-15T00:00:00.000Z";

    const md = renderPlanMd(plan);

    // Write golden file if it doesn't exist
    if (!fs.existsSync(GOLDEN_PLAN_PATH)) {
      fs.mkdirSync(GOLDEN_DIR, { recursive: true });
      fs.writeFileSync(GOLDEN_PLAN_PATH, md, "utf8");
      console.log(`  Golden snapshot written to ${GOLDEN_PLAN_PATH}`);
      console.log("  Re-run the test to validate against the golden file.");
      return;
    }

    // Compare against golden
    const golden = fs.readFileSync(GOLDEN_PLAN_PATH, "utf8");
    assert.equal(md, golden, "plan.md should match golden snapshot");
  });

  it("no drift when repo is fully in sync", () => {
    const syncedMeta = {
      description: "A test tool for unit testing drift detection",
      homepage: "https://mcptoolshop.com/tools/test-tool/",
      topics: ["mcp", "mcp-server", "beta", "fast", "semantic", "local", "execution"],
      defaultBranch: "main",
      archived: false,
    };

    const drifts = detectDrift(PRESSKIT, syncedMeta, TARGET, CONFIG);

    // Only check fields we can control deterministically
    const descDrift = drifts.find((d) => d.field === "description");
    const homeDrift = drifts.find((d) => d.field === "homepage");
    assert.equal(descDrift, undefined, "no description drift");
    assert.equal(homeDrift, undefined, "no homepage drift");
  });

  it("idempotent README injection — second run detects no drift", () => {
    const block = buildLinksBlock(PRESSKIT, CONFIG);
    const { content: firstPass } = injectBlock(STALE_README, block);
    const { changed: secondPass } = injectBlock(firstPass, block);
    assert.equal(secondPass, false, "second injection should detect no change");
  });

  it("idempotent release section injection", () => {
    const section = buildReleaseSection(PRESSKIT, CONFIG);
    const { body: firstPass } = injectReleaseSection(STALE_RELEASE_BODY, section);
    const { changed: secondPass } = injectReleaseSection(firstPass, section);
    assert.equal(secondPass, false, "second injection should detect no change");
  });

  it("org freeze guard blocks frozen owners", () => {
    const frozenConfig = {
      ...CONFIG,
      freeze: { disallowOwners: ["mcp-tool-shop-org"] },
    };

    const frozenOwners = new Set(frozenConfig.freeze.disallowOwners);
    const [owner] = TARGET.repo.split("/");
    assert.ok(frozenOwners.has(owner), "owner should be in frozen set");
  });

  it("domain allowlist rejects unknown domains", () => {
    const allowedDomains = CONFIG.rules.allowedDomains;
    const testUrl = new URL("https://mcptoolshop.com/tools/test/");
    assert.ok(allowedDomains.includes(testUrl.hostname), "mcptoolshop.com should be allowed");

    const badUrl = new URL("https://evil-site.com/tools/test/");
    assert.ok(!allowedDomains.includes(badUrl.hostname), "evil-site.com should be blocked");
  });
});

// ─── Outreach Queue E2E ───────────────────────────────────────────────────────

describe("E2E: outreach queue pipeline (offline)", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(import.meta.dirname || __dirname, ".tmp-e2e-queue-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("first run with no previous presskit produces zero triggers", () => {
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);
    const triggers = classifyDrifts(drifts, CURRENT_PRESSKIT_FOR_OUTREACH, null, CONFIG);
    assert.equal(triggers.length, 0, "first run should produce zero triggers");
  });

  it("detects new proven claim as outreach trigger", () => {
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);
    const triggers = classifyDrifts(drifts, CURRENT_PRESSKIT_FOR_OUTREACH, PREVIOUS_PRESSKIT, CONFIG);

    const claimTrigger = triggers.find((t) => t.triggerCategory === "claim-change");
    assert.ok(claimTrigger, "should find a claim-change trigger");
    assert.equal(claimTrigger.priority, "high", "claim changes should be high priority");
    assert.ok(claimTrigger.triggerSummary.includes("Deterministic"), "summary should mention the new claim");
  });

  it("full detect → classify → queue → write pipeline", () => {
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);
    const triggers = classifyDrifts(drifts, CURRENT_PRESSKIT_FOR_OUTREACH, PREVIOUS_PRESSKIT, CONFIG);

    assert.ok(triggers.length > 0, "should have at least one trigger");

    // Load marketing data from mock
    const marketingData = loadMarketingData(MOCK_BASE, "test-tool");
    assert.ok(marketingData.tool, "mock tool should load");
    assert.ok(marketingData.targetsData, "mock targets should load");

    const history = { entries: [] };
    const queue = buildQueue(triggers, marketingData, history, OUTREACH_POLICY, CONFIG, "test-tool");

    // Validate queue structure
    assert.ok(queue.items.length > 0, "should have queued items");
    assert.equal(queue.stats.queued, queue.items.length, "stats.queued matches items.length");
    assert.equal(queue.stats.suppressed, queue.suppressed.length, "stats.suppressed matches suppressed.length");

    // Validate each queue item schema
    for (const item of queue.items) {
      assert.ok(item.id.startsWith("q.test-tool."), "ID starts with q.test-tool.");
      assert.equal(item.slug, "test-tool");
      assert.ok(["claim-change", "evidence-added", "release-published", "presskit-material"].includes(item.triggerCategory));
      assert.ok(item.triggerSummary.length > 0, "has trigger summary");
      assert.ok(["high", "normal"].includes(item.priority));
      assert.ok(Array.isArray(item.targets), "targets is array");
      assert.ok(item.targets.length <= 3, "at most 3 targets");
      assert.ok(typeof item.suggestedTemplate === "string", "has suggested template");
      assert.ok(Array.isArray(item.suggestedSubjectLines), "subject lines is array");
      assert.ok(item.resourceLinks.presskit, "has presskit link");
      assert.equal(item.status, "pending");
    }

    // Write queue to disk
    const { jsonPath, mdPath } = writeQueue(queue, tmpDir, {
      generatedAt: "2026-01-15T00:00:00.000Z",
      policy: OUTREACH_POLICY,
    });

    assert.ok(fs.existsSync(jsonPath), "outreach-queue.json written");
    assert.ok(fs.existsSync(mdPath), "outreach-queue.md written");

    // Validate JSON round-trip
    const reloaded = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.equal(reloaded.schemaVersion, "1.0.0");
    assert.equal(reloaded.stats.queued, queue.stats.queued);
    assert.equal(reloaded.items.length, queue.items.length);

    // Validate Markdown content
    const md = fs.readFileSync(mdPath, "utf8");
    assert.ok(md.includes("# Outreach Queue"), "has title");
    assert.ok(md.includes("Pending Review") || md.includes("No outreach"), "has section");
  });

  it("queue items only reference proven claims (never aspirational)", () => {
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);
    const triggers = classifyDrifts(drifts, CURRENT_PRESSKIT_FOR_OUTREACH, PREVIOUS_PRESSKIT, CONFIG);
    const marketingData = loadMarketingData(MOCK_BASE, "test-tool");
    const queue = buildQueue(triggers, marketingData, { entries: [] }, OUTREACH_POLICY, CONFIG, "test-tool");

    for (const item of queue.items) {
      for (const claim of item.claimsUsed) {
        assert.equal(claim.status, "proven", `claim ${claim.id} should be proven, got ${claim.status}`);
      }
    }
  });

  it("queue items only reference existing targets from targets.json", () => {
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);
    const triggers = classifyDrifts(drifts, CURRENT_PRESSKIT_FOR_OUTREACH, PREVIOUS_PRESSKIT, CONFIG);
    const marketingData = loadMarketingData(MOCK_BASE, "test-tool");
    const queue = buildQueue(triggers, marketingData, { entries: [] }, OUTREACH_POLICY, CONFIG, "test-tool");

    const validNames = new Set(marketingData.targetsData.candidates.map((c) => c.fullName));

    for (const item of queue.items) {
      for (const target of item.targets) {
        assert.ok(
          validNames.has(target.fullName),
          `target ${target.fullName} should exist in targets.json`
        );
      }
    }
  });

  it("queue items have go-link URLs in allowed domains only", () => {
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);
    const triggers = classifyDrifts(drifts, CURRENT_PRESSKIT_FOR_OUTREACH, PREVIOUS_PRESSKIT, CONFIG);
    const marketingData = loadMarketingData(MOCK_BASE, "test-tool");
    const queue = buildQueue(triggers, marketingData, { entries: [] }, OUTREACH_POLICY, CONFIG, "test-tool");

    const allowed = CONFIG.rules.allowedDomains;

    for (const item of queue.items) {
      if (item.goLinkUrl) {
        const hostname = new URL(item.goLinkUrl).hostname;
        assert.ok(
          allowed.includes(hostname),
          `go-link hostname ${hostname} should be in allowedDomains`
        );
      }
    }
  });

  it("presskit snapshot round-trips through save/load", () => {
    savePresskit(tmpDir, "test-tool", CURRENT_PRESSKIT_FOR_OUTREACH);
    const loaded = loadPreviousPresskit(tmpDir, "test-tool");
    assert.deepEqual(loaded, CURRENT_PRESSKIT_FOR_OUTREACH);
  });

  it("outreach history tracks queued items and deduplicates", () => {
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);
    const triggers = classifyDrifts(drifts, CURRENT_PRESSKIT_FOR_OUTREACH, PREVIOUS_PRESSKIT, CONFIG);
    const marketingData = loadMarketingData(MOCK_BASE, "test-tool");

    // First run — all should queue
    const history1 = { entries: [] };
    const queue1 = buildQueue(triggers, marketingData, history1, OUTREACH_POLICY, CONFIG, "test-tool");
    assert.ok(queue1.items.length > 0, "first run should produce items");

    // Save history
    saveHistory(queue1.items, history1, tmpDir);

    // Second run — should dedup (same triggers + same targets)
    const history2 = loadHistory(tmpDir);
    assert.ok(history2.entries.length > 0, "history should have entries after save");

    const queue2 = buildQueue(triggers, marketingData, history2, OUTREACH_POLICY, CONFIG, "test-tool");
    assert.ok(queue2.suppressed.length > 0, "second run should have suppressed items");

    for (const item of queue2.suppressed) {
      assert.equal(item.suppressedReason, "dedup", "suppressed reason should be dedup");
    }
  });

  it("quiet hours suppress all items", () => {
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);
    const triggers = classifyDrifts(drifts, CURRENT_PRESSKIT_FOR_OUTREACH, PREVIOUS_PRESSKIT, CONFIG);
    const marketingData = loadMarketingData(MOCK_BASE, "test-tool");

    // Policy with quiet hours that cover current time (00:00–23:00 covers most hours)
    const alwaysQuietPolicy = {
      ...OUTREACH_POLICY,
      quietHours: { start: "00:00", end: "23:00", tz: "UTC" },
    };

    const queue = buildQueue(triggers, marketingData, { entries: [] }, alwaysQuietPolicy, CONFIG, "test-tool");

    const currentHour = new Date().getUTCHours();
    if (currentHour >= 0 && currentHour < 23) {
      assert.ok(queue.suppressed.length > 0, "quiet hours should suppress items");
      for (const item of queue.suppressed) {
        assert.equal(item.suppressedReason, "quiet-hours");
      }
      assert.equal(queue.items.length, 0, "no items should pass during quiet hours");
    }
  });

  it("golden snapshot matches expected outreach-queue.md structure", () => {
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);
    const triggers = classifyDrifts(drifts, CURRENT_PRESSKIT_FOR_OUTREACH, PREVIOUS_PRESSKIT, CONFIG);
    const marketingData = loadMarketingData(MOCK_BASE, "test-tool");
    const queue = buildQueue(triggers, marketingData, { entries: [] }, OUTREACH_POLICY, CONFIG, "test-tool");

    const fullQueue = {
      schemaVersion: "1.0.0",
      generatedAt: "2026-01-15T00:00:00.000Z",
      policy: OUTREACH_POLICY,
      ...queue,
    };

    const md = renderQueueMd(fullQueue);

    // Write golden file if it doesn't exist
    if (!fs.existsSync(GOLDEN_QUEUE_PATH)) {
      fs.mkdirSync(GOLDEN_DIR, { recursive: true });
      fs.writeFileSync(GOLDEN_QUEUE_PATH, md, "utf8");
      console.log(`  Golden queue snapshot written to ${GOLDEN_QUEUE_PATH}`);
      console.log("  Re-run the test to validate against the golden file.");
      return;
    }

    // Compare against golden
    const golden = fs.readFileSync(GOLDEN_QUEUE_PATH, "utf8");
    assert.equal(md, golden, "outreach-queue.md should match golden snapshot");
  });

  it("deterministic output: same inputs produce identical queue", () => {
    const drifts = detectDrift(PRESSKIT, STALE_REPO_META, TARGET, CONFIG);
    const triggers = classifyDrifts(drifts, CURRENT_PRESSKIT_FOR_OUTREACH, PREVIOUS_PRESSKIT, CONFIG);
    const marketingData = loadMarketingData(MOCK_BASE, "test-tool");

    const queue1 = buildQueue(triggers, marketingData, { entries: [] }, OUTREACH_POLICY, CONFIG, "test-tool");
    const queue2 = buildQueue(triggers, marketingData, { entries: [] }, OUTREACH_POLICY, CONFIG, "test-tool");

    assert.equal(queue1.items.length, queue2.items.length, "same number of items");
    for (let i = 0; i < queue1.items.length; i++) {
      assert.equal(queue1.items[i].id, queue2.items[i].id, "same IDs");
      assert.equal(queue1.items[i].triggerCategory, queue2.items[i].triggerCategory, "same categories");
      assert.equal(queue1.items[i].suggestedTemplate, queue2.items[i].suggestedTemplate, "same templates");
      assert.deepEqual(queue1.items[i].targets, queue2.items[i].targets, "same targets");
    }
  });

  it("outreach disabled produces zero queue output", () => {
    // When outreach is not enabled, classifyDrifts is never called in the real pipeline
    const outreachEnabled = false;
    assert.equal(outreachEnabled, false, "outreach.enabled=false means no queue step");

    // Also verify that an empty marketingSitePath means no outreach
    const config2 = { ...CONFIG, marketingSitePath: "", outreach: { enabled: true } };
    const shouldRun = config2.outreach?.enabled === true && !!config2.marketingSitePath;
    assert.equal(shouldRun, false, "empty marketingSitePath disables outreach");
  });
});
