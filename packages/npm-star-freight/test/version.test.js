"use strict";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const root = join(__dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

describe("version consistency", () => {
  it("package.json version is semver", () => {
    assert.match(pkg.version, /^\d+\.\d+\.\d+/);
  });

  it("package.json version is >= 1.0.0", () => {
    const major = parseInt(pkg.version.split(".")[0], 10);
    assert.ok(major >= 1, `expected major >= 1, got ${major}`);
  });

  it("CHANGELOG.md mentions current version", () => {
    const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
    assert.ok(
      changelog.includes(pkg.version),
      `CHANGELOG missing ${pkg.version}`
    );
  });

  it("--version flag prints wrapper version", () => {
    const out = execFileSync("node", [join(root, "bin/star-freight.js"), "--version"], {
      encoding: "utf8",
    }).trim();
    assert.ok(out.includes(pkg.version), `expected ${pkg.version} in: ${out}`);
  });

  it("-V flag prints wrapper version", () => {
    const out = execFileSync("node", [join(root, "bin/star-freight.js"), "-V"], {
      encoding: "utf8",
    }).trim();
    assert.ok(out.includes(pkg.version), `expected ${pkg.version} in: ${out}`);
  });
});
