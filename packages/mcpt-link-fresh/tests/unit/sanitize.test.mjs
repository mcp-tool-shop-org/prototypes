import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateUrl, sanitizeText, sanitizeTopic } from "../../src/lib/sanitize.mjs";

describe("validateUrl", () => {
  it("accepts https URLs", () => {
    assert.equal(validateUrl("https://example.com"), "https://example.com/");
  });

  it("accepts http URLs", () => {
    assert.equal(validateUrl("http://example.com"), "http://example.com/");
  });

  it("rejects javascript: protocol", () => {
    assert.throws(() => validateUrl("javascript:alert(1)"), /disallowed protocol/);
  });

  it("rejects data: protocol", () => {
    assert.throws(() => validateUrl("data:text/html,<h1>hi</h1>"), /disallowed protocol/);
  });

  it("throws on garbage input", () => {
    assert.throws(() => validateUrl("not a url"));
  });

  it("includes custom label in error", () => {
    assert.throws(
      () => validateUrl("javascript:x", { label: "my-field" }),
      /my-field/
    );
  });
});

describe("sanitizeText", () => {
  it("trims whitespace", () => {
    assert.equal(sanitizeText("  hello  "), "hello");
  });

  it("strips control characters", () => {
    assert.equal(sanitizeText("hello\x00world"), "helloworld");
  });

  it("enforces max length", () => {
    const long = "a".repeat(500);
    assert.equal(sanitizeText(long).length, 350);
  });

  it("respects custom max length", () => {
    assert.equal(sanitizeText("hello world", { maxLength: 5 }), "hello");
  });

  it("coerces non-strings", () => {
    assert.equal(sanitizeText(42), "42");
  });
});

describe("sanitizeTopic", () => {
  it("lowercases", () => {
    assert.equal(sanitizeTopic("MCP-Server"), "mcp-server");
  });

  it("replaces invalid chars with hyphens", () => {
    assert.equal(sanitizeTopic("hello world!"), "hello-world");
  });

  it("collapses multiple hyphens", () => {
    assert.equal(sanitizeTopic("a---b"), "a-b");
  });

  it("strips leading/trailing hyphens", () => {
    assert.equal(sanitizeTopic("-hello-"), "hello");
  });

  it("enforces 50 char max", () => {
    const long = "a".repeat(60);
    assert.equal(sanitizeTopic(long).length, 50);
  });
});
