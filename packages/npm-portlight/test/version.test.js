"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8")
);

describe("version alignment", () => {
  it("package.json version is semver", () => {
    assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  });

  it("CHANGELOG mentions current version", () => {
    const changelog = readFileSync(
      join(__dirname, "..", "CHANGELOG.md"),
      "utf-8"
    );
    assert.ok(
      changelog.includes(pkg.version),
      `CHANGELOG missing entry for v${pkg.version}`
    );
  });

  it("launcher config version matches package major version", () => {
    const launcher = readFileSync(
      join(__dirname, "..", "bin", "portlight.js"),
      "utf-8"
    );
    const versionMatch = launcher.match(/version:\s*"([^"]+)"/);
    assert.ok(versionMatch, "launcher config must have version field");
    const launcherMajor = versionMatch[1].split(".")[0];
    const pkgMajor = pkg.version.split(".")[0];
    assert.equal(
      launcherMajor,
      pkgMajor,
      `launcher major (${launcherMajor}) != package major (${pkgMajor})`
    );
  });

  it("launcher config has matching tag", () => {
    const launcher = readFileSync(
      join(__dirname, "..", "bin", "portlight.js"),
      "utf-8"
    );
    const versionMatch = launcher.match(/version:\s*"([^"]+)"/);
    const tagMatch = launcher.match(/tag:\s*"([^"]+)"/);
    assert.ok(tagMatch, "launcher config must have tag field");
    assert.equal(
      tagMatch[1],
      `v${versionMatch[1]}`,
      "tag must be v-prefixed version"
    );
  });
});
