import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const engine = readFileSync(join(root, "prov-engine.js"), "utf-8");

describe("version alignment", () => {
  it("package.json version is semver", () => {
    const parts = pkg.version.split(".");
    assert.equal(parts.length, 3, `expected semver, got ${pkg.version}`);
    for (const part of parts) {
      assert.ok(/^\d+$/.test(part), `non-numeric version part: ${part}`);
    }
  });

  it("prov-engine.js VERSION matches package.json", () => {
    const match = engine.match(/const VERSION = "([^"]+)"/);
    assert.ok(match, "VERSION constant not found in prov-engine.js");
    assert.equal(match[1], pkg.version, `engine VERSION (${match[1]}) != package.json (${pkg.version})`);
  });

  it("CHANGELOG mentions current version", () => {
    const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf-8");
    assert.ok(changelog.includes(pkg.version), `CHANGELOG missing version ${pkg.version}`);
  });

  it("--version flag prints correct version", () => {
    const output = execFileSync("node", [join(root, "prov-engine.js"), "--version"], { encoding: "utf-8" }).trim();
    assert.ok(output.includes(pkg.version), `--version output "${output}" missing ${pkg.version}`);
  });
});

describe("CLI smoke tests", () => {
  it("describe command outputs valid JSON with capabilities", () => {
    const output = execFileSync("node", [join(root, "prov-engine.js"), "describe"], { encoding: "utf-8" });
    const manifest = JSON.parse(output);
    assert.ok(manifest.implements.includes("integrity.digest.sha256"));
    assert.ok(manifest.implements.includes("adapter.wrap.envelope_v0_1"));
  });

  it("digest command computes sha256", () => {
    const tmp = join(root, "_test_cli.json");
    writeFileSync(tmp, '{"value":"test"}');
    try {
      const output = execFileSync("node", [join(root, "prov-engine.js"), "digest", tmp], { encoding: "utf-8" });
      const result = JSON.parse(output);
      assert.equal(result.digest.alg, "sha256");
      assert.ok(result.digest.value.length === 64);
      assert.ok(result.canonical_form);
    } finally {
      unlinkSync(tmp);
    }
  });

  it("wrap command produces envelope", () => {
    const tmp = join(root, "_test_cli.json");
    writeFileSync(tmp, '{"data":"payload"}');
    try {
      const output = execFileSync("node", [join(root, "prov-engine.js"), "wrap", tmp], { encoding: "utf-8" });
      const result = JSON.parse(output);
      assert.equal(result.schema_version, "mcp.envelope.v0.1");
      assert.deepEqual(result.result, { data: "payload" });
    } finally {
      unlinkSync(tmp);
    }
  });
});
