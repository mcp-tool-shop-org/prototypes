import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VERSION, NAME } from "../src/version.js";

describe("version", () => {
  it("exports a semver string", () => {
    assert.match(VERSION, /^\d+\.\d+\.\d+/);
  });

  it("is at least 1.0.0", () => {
    const major = parseInt(VERSION.split(".")[0], 10);
    assert.ok(major >= 1, `expected major >= 1, got ${major}`);
  });

  it("exports the package name", () => {
    assert.equal(NAME, "@mcptoolshop/claude-session-copilot");
  });
});
