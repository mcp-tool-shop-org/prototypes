import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildLinksBlock, injectBlock } from "../../src/renderers/readme-blocks.mjs";
import presskit from "../fixtures/presskit-sample.json" with { type: "json" };

const CONFIG = {
  canonical: {
    presskitBaseUrl: "https://mcptoolshop.com/presskit",
    linksUrl: "https://mcptoolshop.com/links.json",
    toolPageBase: "https://mcptoolshop.com/tools",
    pressPageBase: "https://mcptoolshop.com/press",
  },
};

describe("buildLinksBlock", () => {
  it("includes tool page link", () => {
    const block = buildLinksBlock(presskit, CONFIG);
    assert.ok(block.includes("https://mcptoolshop.com/tools/test-tool/"));
  });

  it("includes press kit link", () => {
    const block = buildLinksBlock(presskit, CONFIG);
    assert.ok(block.includes("https://mcptoolshop.com/presskit/test-tool/"));
  });

  it("includes tracked links", () => {
    const block = buildLinksBlock(presskit, CONFIG);
    assert.ok(block.includes("tt-npm"));
    assert.ok(block.includes("mcptoolshop.com/go/tt-npm/"));
  });

  it("omits press page when press is null", () => {
    const block = buildLinksBlock(presskit, CONFIG);
    assert.ok(!block.includes("/press/test-tool/"));
  });

  it("includes press page when press is present", () => {
    const withPress = { ...presskit, press: { boilerplate: "test" } };
    const block = buildLinksBlock(withPress, CONFIG);
    assert.ok(block.includes("/press/test-tool/"));
  });
});

describe("injectBlock", () => {
  it("appends block when no markers exist", () => {
    const readme = "# My Tool\n\nSome content.";
    const block = "### Links\n- [Tool page](https://example.com)";
    const { content, changed } = injectBlock(readme, block);

    assert.ok(changed);
    assert.ok(content.includes("<!-- mcpt:links:start -->"));
    assert.ok(content.includes("<!-- mcpt:links:end -->"));
    assert.ok(content.includes("### Links"));
    // Original content preserved
    assert.ok(content.includes("# My Tool"));
    assert.ok(content.includes("Some content."));
  });

  it("replaces block when markers exist", () => {
    const readme = [
      "# My Tool",
      "",
      "Some content.",
      "",
      "<!-- mcpt:links:start -->",
      "### Links",
      "- [Old link](https://old.com)",
      "<!-- mcpt:links:end -->",
      "",
      "Footer content.",
    ].join("\n");

    const block = "### Links\n- [New link](https://new.com)";
    const { content, changed } = injectBlock(readme, block);

    assert.ok(changed);
    assert.ok(content.includes("New link"));
    assert.ok(!content.includes("Old link"));
    // Surrounding content preserved
    assert.ok(content.includes("# My Tool"));
    assert.ok(content.includes("Footer content."));
  });

  it("returns changed=false when block is identical", () => {
    const block = "### Links\n- [Same](https://same.com)";
    const readme = [
      "# My Tool",
      "",
      "<!-- mcpt:links:start -->",
      block,
      "<!-- mcpt:links:end -->",
    ].join("\n");

    const { changed } = injectBlock(readme, block);
    assert.ok(!changed);
  });
});
