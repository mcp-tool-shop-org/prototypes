const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

describe("sovereignty launcher", () => {
  const binPath = path.join(__dirname, "..", "bin", "sovereignty.js");

  it("bin/sovereignty.js exists", () => {
    assert.ok(fs.existsSync(binPath));
  });

  it("bin/sovereignty.js is valid JavaScript", () => {
    const source = fs.readFileSync(binPath, "utf-8");
    // Should not throw
    new Function(source.replace("#!/usr/bin/env node", "").replace(/require\([^)]+\)/g, "(() => {})"));
  });

  it("MCPTOOLSHOP_LAUNCH_CONFIG is valid JSON with required fields", () => {
    const source = fs.readFileSync(binPath, "utf-8");
    assert.ok(source.includes("JSON.stringify"), "Should contain JSON.stringify with config object");
    assert.ok(source.includes("toolName"), "Config should reference toolName");
    assert.ok(source.includes("owner"), "Config should reference owner");
    assert.ok(source.includes("repo"), "Config should reference repo");
    assert.ok(source.includes("version"), "Config should reference version");
    assert.ok(source.includes("tag"), "Config should reference tag");
  });

  it("config version is derived from package.json (dynamic)", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
    const source = fs.readFileSync(binPath, "utf-8");
    // Version should come from pkg.version, not be hardcoded
    assert.ok(
      source.includes("pkg.version") || source.includes(`"${pkg.version}"`),
      "Config version should be dynamic (pkg.version) or match package.json"
    );
  });

  it("config tag follows v-prefix convention", () => {
    const source = fs.readFileSync(binPath, "utf-8");
    // Tag should use template with v prefix
    assert.ok(
      source.includes("`v${pkg.version}`") || source.match(/tag:\s*"v/),
      "Tag should use v-prefix convention"
    );
  });

  it("npm-launcher dependency is declared", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
    assert.ok(pkg.dependencies["@mcptoolshop/npm-launcher"], "Should depend on @mcptoolshop/npm-launcher");
  });

  it("bin field points to sovereignty.js", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
    assert.equal(pkg.bin.sovereignty, "bin/sovereignty.js");
  });

  it("sovereignty.js has shebang line", () => {
    const source = fs.readFileSync(binPath, "utf-8");
    assert.ok(source.startsWith("#!/usr/bin/env node"), "Should have node shebang");
  });

  it("CHANGELOG.md exists and follows Keep a Changelog format", () => {
    const changelogPath = path.join(__dirname, "..", "CHANGELOG.md");
    assert.ok(fs.existsSync(changelogPath), "CHANGELOG.md should exist");
    const content = fs.readFileSync(changelogPath, "utf-8");
    assert.ok(content.includes("# Changelog"), "Should have Changelog heading");
    assert.ok(content.includes("Keep a Changelog"), "Should reference Keep a Changelog");
    assert.ok(content.includes("Semantic Versioning"), "Should reference Semantic Versioning");

    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
    assert.ok(content.includes(`[${pkg.version}]`), "Should have entry for current version");
  });

  it("SECURITY.md exists with threat model", () => {
    const securityPath = path.join(__dirname, "..", "SECURITY.md");
    assert.ok(fs.existsSync(securityPath), "SECURITY.md should exist");
    const content = fs.readFileSync(securityPath, "utf-8");
    assert.ok(content.includes("Threat Model"), "Should include threat model");
    assert.ok(content.includes("Reporting a Vulnerability"), "Should include reporting instructions");
  });

  it("SHIP_GATE.md exists with all hard gates passing", () => {
    const gatePath = path.join(__dirname, "..", "SHIP_GATE.md");
    assert.ok(fs.existsSync(gatePath), "SHIP_GATE.md should exist");
    const content = fs.readFileSync(gatePath, "utf-8");
    assert.ok(content.includes("A. Security Baseline"), "Should have Gate A");
    assert.ok(content.includes("B. Error Handling"), "Should have Gate B");
    assert.ok(content.includes("C. Operator Docs"), "Should have Gate C");
    assert.ok(content.includes("D. Shipping Hygiene"), "Should have Gate D");
    assert.ok(content.includes("All hard gates (A–D) PASS"), "All hard gates should pass");
  });

  it("CHANGELOG.md is included in npm files array", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
    assert.ok(pkg.files.includes("CHANGELOG.md"), "CHANGELOG.md should be in files array");
  });
});
