import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildQueue,
  selectAudience,
  selectTargets,
  selectTemplate,
  generateSubjectLines,
  selectGoLink,
} from "../../src/analyzers/queue-builder.mjs";
import { loadMarketingData } from "../../src/adapters/marketing-site.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_BASE = path.join(__dirname, "..", "fixtures", "marketing-site-mock");

// Load fixture data
const MARKETING_DATA = loadMarketingData(MOCK_BASE, "test-tool");

const CONFIG = {
  canonical: {
    presskitBaseUrl: "https://mcptoolshop.com/presskit",
    toolPageBase: "https://mcptoolshop.com/tools",
  },
  rules: { allowedDomains: ["mcptoolshop.com"] },
};

const POLICY = {
  maxPerToolPerWeek: 3,
  dedupeWindowDays: 14,
  topTargetsPerItem: 3,
};

const CLAIM_TRIGGER = {
  triggerCategory: "claim-change",
  triggerSummary: "Proven claim added: Sub-100ms latency",
  priority: "high",
  driftRef: null,
  claimIds: ["claim.test-tool.sub-100ms"],
};

const EMPTY_HISTORY = { entries: [] };

describe("buildQueue", () => {
  it("builds queue items with correct schema", () => {
    const result = buildQueue([CLAIM_TRIGGER], MARKETING_DATA, EMPTY_HISTORY, POLICY, CONFIG, "test-tool");

    assert.equal(result.items.length, 1);
    const item = result.items[0];
    assert.ok(item.id.startsWith("q.test-tool.claim-change."));
    assert.equal(item.slug, "test-tool");
    assert.equal(item.triggerCategory, "claim-change");
    assert.equal(item.priority, "high");
    assert.equal(item.status, "pending");
    assert.ok(item.targets.length <= 3);
    assert.ok(item.suggestedSubjectLines.length >= 1);
    assert.ok(item.suggestedTemplate);
  });

  it("selects top 3 targets by score", () => {
    const result = buildQueue([CLAIM_TRIGGER], MARKETING_DATA, EMPTY_HISTORY, POLICY, CONFIG, "test-tool");
    const item = result.items[0];
    assert.equal(item.targets.length, 3);
    assert.ok(item.targets[0].score >= item.targets[1].score, "targets sorted by score");
    assert.ok(item.targets[1].score >= item.targets[2].score, "targets sorted by score");
  });

  it("only uses proven claims in claimsUsed", () => {
    const result = buildQueue([CLAIM_TRIGGER], MARKETING_DATA, EMPTY_HISTORY, POLICY, CONFIG, "test-tool");
    const item = result.items[0];
    for (const claim of item.claimsUsed) {
      assert.equal(claim.status, "proven", `claim ${claim.id} should be proven`);
    }
  });

  it("enforces rate limit suppression", () => {
    const recentHistory = {
      entries: [
        { slug: "test-tool", triggerCategory: "x", targetFullNames: [], queuedAt: new Date().toISOString() },
        { slug: "test-tool", triggerCategory: "y", targetFullNames: [], queuedAt: new Date().toISOString() },
        { slug: "test-tool", triggerCategory: "z", targetFullNames: [], queuedAt: new Date().toISOString() },
      ],
    };

    const result = buildQueue([CLAIM_TRIGGER], MARKETING_DATA, recentHistory, POLICY, CONFIG, "test-tool");
    assert.equal(result.items.length, 0);
    assert.equal(result.suppressed.length, 1);
    assert.equal(result.suppressed[0].suppressedReason, "rate-limit");
  });

  it("enforces dedup suppression", () => {
    const recentHistory = {
      entries: [
        {
          slug: "test-tool",
          triggerCategory: "claim-change",
          targetFullNames: ["acme-org/ci-toolkit"],
          queuedAt: new Date().toISOString(),
        },
      ],
    };

    const result = buildQueue([CLAIM_TRIGGER], MARKETING_DATA, recentHistory, POLICY, CONFIG, "test-tool");
    assert.equal(result.items.length, 0);
    assert.equal(result.suppressed.length, 1);
    assert.equal(result.suppressed[0].suppressedReason, "dedup");
  });

  it("does not suppress when dedup window has passed", () => {
    const oldHistory = {
      entries: [
        {
          slug: "test-tool",
          triggerCategory: "claim-change",
          targetFullNames: ["acme-org/ci-toolkit"],
          queuedAt: new Date(Date.now() - 20 * 86400000).toISOString(), // 20 days ago
        },
      ],
    };

    const result = buildQueue([CLAIM_TRIGGER], MARKETING_DATA, oldHistory, POLICY, CONFIG, "test-tool");
    assert.equal(result.items.length, 1, "should not be deduped after window");
  });

  it("deterministic: same inputs produce same output", () => {
    const r1 = buildQueue([CLAIM_TRIGGER], MARKETING_DATA, EMPTY_HISTORY, POLICY, CONFIG, "test-tool");
    const r2 = buildQueue([CLAIM_TRIGGER], MARKETING_DATA, EMPTY_HISTORY, POLICY, CONFIG, "test-tool");

    assert.equal(r1.items.length, r2.items.length);
    assert.equal(r1.items[0].id, r2.items[0].id);
    assert.deepEqual(r1.items[0].targets, r2.items[0].targets);
    assert.deepEqual(r1.items[0].suggestedSubjectLines, r2.items[0].suggestedSubjectLines);
  });

  it("stats are correct", () => {
    const result = buildQueue([CLAIM_TRIGGER], MARKETING_DATA, EMPTY_HISTORY, POLICY, CONFIG, "test-tool");
    assert.equal(result.stats.totalTriggersEvaluated, 1);
    assert.equal(result.stats.queued, 1);
    assert.equal(result.stats.suppressed, 0);
  });
});

describe("selectAudience", () => {
  it("selects audience with best keyword overlap", () => {
    const trigger = {
      triggerSummary: "CI gating metadata drift quality gates",
      claimIds: [],
    };
    const { audienceRef } = selectAudience(trigger, MARKETING_DATA.tool, MARKETING_DATA.audiences);
    assert.equal(audienceRef, "aud.ci-maintainers");
  });

  it("returns first audience as fallback", () => {
    const trigger = {
      triggerSummary: "Something completely unrelated to any audience",
      claimIds: [],
    };
    const { audienceRef } = selectAudience(trigger, MARKETING_DATA.tool, MARKETING_DATA.audiences);
    assert.ok(audienceRef, "should return some audience");
  });

  it("returns General when no audiences available", () => {
    const { audienceName } = selectAudience({}, null, []);
    assert.equal(audienceName, "General");
  });
});

describe("selectTargets", () => {
  it("returns top N targets sorted by score", () => {
    const targets = selectTargets({}, null, [], MARKETING_DATA.targetsData, 3);
    assert.equal(targets.length, 3);
    assert.ok(targets[0].score >= targets[1].score);
  });

  it("returns empty array when no targets data", () => {
    const targets = selectTargets({}, null, [], null, 3);
    assert.deepEqual(targets, []);
  });

  it("respects topN limit", () => {
    const targets = selectTargets({}, null, [], MARKETING_DATA.targetsData, 2);
    assert.equal(targets.length, 2);
  });
});

describe("selectTemplate", () => {
  it("selects email-journalist for high-priority claim changes with press data", () => {
    const trigger = { priority: "high", triggerCategory: "claim-change" };
    const targets = [{ ownerType: "Organization" }];
    const dataWithJournalist = {
      ...MARKETING_DATA,
      outreachFiles: [...MARKETING_DATA.outreachFiles, "email-journalist.md"],
    };
    const template = selectTemplate(trigger, targets, dataWithJournalist);
    assert.equal(template, "email-journalist");
  });

  it("selects email-partner for org targets", () => {
    const trigger = { priority: "normal", triggerCategory: "evidence-added" };
    const targets = [{ ownerType: "Organization" }];
    const template = selectTemplate(trigger, targets, MARKETING_DATA);
    assert.equal(template, "email-partner");
  });

  it("selects dm-short for user targets", () => {
    const trigger = { priority: "normal", triggerCategory: "evidence-added" };
    const targets = [{ ownerType: "User" }];
    const template = selectTemplate(trigger, targets, MARKETING_DATA);
    assert.equal(template, "dm-short");
  });
});

describe("generateSubjectLines", () => {
  it("generates subject lines for claim-change", () => {
    const claims = [{ id: "c1", status: "proven", statement: "Sub-100ms latency" }];
    const lines = generateSubjectLines(CLAIM_TRIGGER, "test-tool", claims);
    assert.ok(lines.length >= 1 && lines.length <= 2);
    assert.ok(lines[0].includes("test-tool"));
  });

  it("generates subject lines for release-published", () => {
    const trigger = { triggerCategory: "release-published" };
    const lines = generateSubjectLines(trigger, "my-tool", []);
    assert.ok(lines.length >= 1);
    assert.ok(lines[0].includes("my-tool"));
  });

  it("always returns at least 1 line", () => {
    const lines = generateSubjectLines({ triggerCategory: "unknown" }, "tool", []);
    assert.ok(lines.length >= 1);
  });
});

describe("selectGoLink", () => {
  it("selects channel-specific go-link", () => {
    const trigger = { triggerCategory: "claim-change" };
    const { goLink } = selectGoLink(trigger, MARKETING_DATA.linksData, "test-tool", CONFIG);
    assert.equal(goLink, "tt-github"); // claim-change prefers github channel
  });

  it("falls back to first link when preferred channel missing", () => {
    const links = [{ id: "tt-npm", slug: "test-tool", channel: "npm" }];
    const trigger = { triggerCategory: "claim-change" }; // prefers github, but only npm exists
    const { goLink } = selectGoLink(trigger, links, "test-tool", CONFIG);
    assert.equal(goLink, "tt-npm");
  });

  it("returns null when no links for slug", () => {
    const { goLink } = selectGoLink({}, [], "test-tool", CONFIG);
    assert.equal(goLink, null);
  });

  it("returns null when links data is missing", () => {
    const { goLink } = selectGoLink({}, null, "test-tool", CONFIG);
    assert.equal(goLink, null);
  });
});
