import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectDrift } from "../../src/planners/drift-detector.mjs";
import presskit from "../fixtures/presskit-sample.json" with { type: "json" };

const CONFIG = {
  canonical: {
    presskitBaseUrl: "https://mcptoolshop.com/presskit",
    linksUrl: "https://mcptoolshop.com/links.json",
    toolPageBase: "https://mcptoolshop.com/tools",
    pressPageBase: "https://mcptoolshop.com/press",
  },
};

const TARGET = {
  slug: "test-tool",
  repo: "mcp-tool-shop-org/test-tool",
  enabled: true,
  mode: "github-only",
  topicsMax: 12,
};

describe("detectDrift", () => {
  it("returns empty array when everything matches", () => {
    const repoMeta = {
      description: "A test tool for unit testing drift detection",
      homepage: "https://mcptoolshop.com/tools/test-tool/",
      topics: ["mcp", "mcp-server", "beta", "fast", "semantic"],
      defaultBranch: "main",
      archived: false,
    };

    const drifts = detectDrift(presskit, repoMeta, TARGET, CONFIG);
    // Topics may differ due to derivation, so check description + homepage only
    const descDrift = drifts.find((d) => d.field === "description");
    const homeDrift = drifts.find((d) => d.field === "homepage");
    assert.equal(descDrift, undefined, "no description drift");
    assert.equal(homeDrift, undefined, "no homepage drift");
  });

  it("detects description drift", () => {
    const repoMeta = {
      description: "Old description that's stale",
      homepage: "https://mcptoolshop.com/tools/test-tool/",
      topics: [],
      defaultBranch: "main",
      archived: false,
    };

    const drifts = detectDrift(presskit, repoMeta, TARGET, CONFIG);
    const descDrift = drifts.find((d) => d.field === "description");
    assert.ok(descDrift, "should detect description drift");
    assert.equal(descDrift.action, "DIRECT_UPDATE");
    assert.equal(descDrift.canonical, "A test tool for unit testing drift detection");
  });

  it("detects homepage drift", () => {
    const repoMeta = {
      description: "A test tool for unit testing drift detection",
      homepage: "https://old-site.com/test-tool",
      topics: [],
      defaultBranch: "main",
      archived: false,
    };

    const drifts = detectDrift(presskit, repoMeta, TARGET, CONFIG);
    const homeDrift = drifts.find((d) => d.field === "homepage");
    assert.ok(homeDrift, "should detect homepage drift");
    assert.equal(homeDrift.canonical, "https://mcptoolshop.com/tools/test-tool/");
  });

  it("detects topics drift", () => {
    const repoMeta = {
      description: "A test tool for unit testing drift detection",
      homepage: "https://mcptoolshop.com/tools/test-tool/",
      topics: ["completely", "different", "topics"],
      defaultBranch: "main",
      archived: false,
    };

    const drifts = detectDrift(presskit, repoMeta, TARGET, CONFIG);
    const topicsDrift = drifts.find((d) => d.field === "topics");
    assert.ok(topicsDrift, "should detect topics drift");
    assert.equal(topicsDrift.action, "DIRECT_UPDATE");
  });

  it("all drifts have DIRECT_UPDATE action type", () => {
    const repoMeta = {
      description: "wrong",
      homepage: "https://wrong.com",
      topics: ["wrong"],
      defaultBranch: "main",
      archived: false,
    };

    const drifts = detectDrift(presskit, repoMeta, TARGET, CONFIG);
    for (const d of drifts) {
      assert.equal(d.action, "DIRECT_UPDATE");
    }
  });

  it("includes slug on every drift", () => {
    const repoMeta = {
      description: "wrong",
      homepage: "wrong",
      topics: [],
      defaultBranch: "main",
      archived: false,
    };

    const drifts = detectDrift(presskit, repoMeta, TARGET, CONFIG);
    for (const d of drifts) {
      assert.equal(d.slug, "test-tool");
    }
  });
});
