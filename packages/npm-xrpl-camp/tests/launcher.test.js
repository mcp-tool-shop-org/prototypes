const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

describe("xrpl-camp launcher", () => {
  const binPath = path.join(__dirname, "..", "bin", "xrpl-camp.js");

  it("bin/xrpl-camp.js exists", () => {
    assert.ok(fs.existsSync(binPath));
  });

  it("bin/xrpl-camp.js is valid JavaScript", () => {
    const source = fs.readFileSync(binPath, "utf-8");
    new Function(source.replace("#!/usr/bin/env node", "").replace(/require\([^)]+\)/g, "(() => {})"));
  });

  it("MCPTOOLSHOP_LAUNCH_CONFIG is valid JSON with required fields", () => {
    const source = fs.readFileSync(binPath, "utf-8");
    const match = source.match(/JSON\.stringify\((\{[\s\S]*?\})\)/);
    assert.ok(match, "Should contain JSON.stringify with config object");

    const config = new Function(`return ${match[1]}`)();
    assert.equal(typeof config.toolName, "string");
    assert.equal(typeof config.owner, "string");
    assert.equal(typeof config.repo, "string");
    assert.equal(typeof config.version, "string");
    assert.equal(typeof config.tag, "string");
    assert.ok(config.toolName.length > 0);
  });

  it("config version is valid semver", () => {
    const source = fs.readFileSync(binPath, "utf-8");
    const match = source.match(/JSON\.stringify\((\{[\s\S]*?\})\)/);
    const config = new Function(`return ${match[1]}`)();
    assert.match(config.version, /^\d+\.\d+\.\d+$/);
  });

  it("config tag follows v-prefix convention", () => {
    const source = fs.readFileSync(binPath, "utf-8");
    const match = source.match(/JSON\.stringify\((\{[\s\S]*?\})\)/);
    const config = new Function(`return ${match[1]}`)();
    assert.ok(config.tag.startsWith("v"));
    assert.equal(config.tag, `v${config.version}`);
  });

  it("npm-launcher dependency is declared", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
    assert.ok(pkg.dependencies["@mcptoolshop/npm-launcher"]);
  });

  it("bin field points to xrpl-camp.js", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
    assert.equal(pkg.bin["xrpl-camp"], "bin/xrpl-camp.js");
  });

  it("xrpl-camp.js has shebang line", () => {
    const source = fs.readFileSync(binPath, "utf-8");
    assert.ok(source.startsWith("#!/usr/bin/env node"));
  });

  it("--version prints wrapper version and exits 0", () => {
    const out = execFileSync(process.execPath, [binPath, "--version"], {
      encoding: "utf-8",
    });
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
    assert.match(out.trim(), new RegExp(`^xrpl-camp ${pkg.version.replace(/\./g, "\\.")} \\(wrapper\\)$`));
  });

  it("-V prints wrapper version and exits 0", () => {
    const out = execFileSync(process.execPath, [binPath, "-V"], {
      encoding: "utf-8",
    });
    assert.match(out.trim(), /^xrpl-camp \d+\.\d+\.\d+ \(wrapper\)$/);
  });
});
