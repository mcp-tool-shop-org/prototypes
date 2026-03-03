import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildReleaseSection, injectReleaseSection } from "../../src/renderers/release-notes.mjs";
import presskit from "../fixtures/presskit-sample.json" with { type: "json" };

const CONFIG = {
  canonical: {
    presskitBaseUrl: "https://mcptoolshop.com/presskit",
    linksUrl: "https://mcptoolshop.com/links.json",
    toolPageBase: "https://mcptoolshop.com/tools",
    pressPageBase: "https://mcptoolshop.com/press",
  },
};

describe("buildReleaseSection", () => {
  it("includes tool page link", () => {
    const section = buildReleaseSection(presskit, CONFIG);
    assert.ok(section.includes("https://mcptoolshop.com/tools/test-tool/"));
  });

  it("includes press kit link", () => {
    const section = buildReleaseSection(presskit, CONFIG);
    assert.ok(section.includes("https://mcptoolshop.com/presskit/test-tool/"));
  });

  it("includes tracked links with channel", () => {
    const section = buildReleaseSection(presskit, CONFIG);
    assert.ok(section.includes("tt-npm"));
    assert.ok(section.includes("(npm)"));
  });

  it("includes proven claims", () => {
    const section = buildReleaseSection(presskit, CONFIG);
    assert.ok(section.includes("Sub-100ms query latency"));
    assert.ok(section.includes("Verified claims"));
  });

  it("has Links + Proof heading", () => {
    const section = buildReleaseSection(presskit, CONFIG);
    assert.ok(section.startsWith("### Links + Proof (mcptoolshop.com)"));
  });
});

describe("injectReleaseSection", () => {
  it("creates section from empty body", () => {
    const { body, changed } = injectReleaseSection("", "### Test");
    assert.ok(changed);
    assert.ok(body.includes("<!-- mcpt:links:start -->"));
    assert.ok(body.includes("### Test"));
    assert.ok(body.includes("<!-- mcpt:links:end -->"));
  });

  it("creates section from null body", () => {
    const { body, changed } = injectReleaseSection(null, "### Test");
    assert.ok(changed);
    assert.ok(body.includes("<!-- mcpt:links:start -->"));
  });

  it("appends when no markers exist", () => {
    const original = "## What's New\n\n- Bug fixes\n- Performance improvements";
    const { body, changed } = injectReleaseSection(original, "### Links");

    assert.ok(changed);
    assert.ok(body.includes("## What's New"));
    assert.ok(body.includes("<!-- mcpt:links:start -->"));
  });

  it("replaces existing section", () => {
    const original = [
      "## What's New",
      "",
      "- Bug fixes",
      "",
      "<!-- mcpt:links:start -->",
      "### Old links",
      "- [old](https://old.com)",
      "<!-- mcpt:links:end -->",
    ].join("\n");

    const { body, changed } = injectReleaseSection(original, "### New links\n- [new](https://new.com)");

    assert.ok(changed);
    assert.ok(body.includes("New links"));
    assert.ok(!body.includes("Old links"));
    assert.ok(body.includes("## What's New"));
  });

  it("returns changed=false when section is identical", () => {
    const section = "### Links\n- [Same](https://same.com)";
    const original = [
      "## Release",
      "",
      "<!-- mcpt:links:start -->",
      section,
      "<!-- mcpt:links:end -->",
    ].join("\n");

    const { changed } = injectReleaseSection(original, section);
    assert.ok(!changed);
  });
});
