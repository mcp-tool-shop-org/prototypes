"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const BIN = path.join(__dirname, "..", "bin", "saints-mile.js");

describe("launch config", () => {
  it("sets valid MCPTOOLSHOP_LAUNCH_CONFIG", () => {
    // Clear any previous config
    delete process.env.MCPTOOLSHOP_LAUNCH_CONFIG;

    // Mock the launcher require so it doesn't actually run
    const Module = require("node:module");
    const originalResolve = Module._resolveFilename;
    Module._resolveFilename = function (request, ...args) {
      if (request === "@mcptoolshop/npm-launcher/bin/mcptoolshop-launch.js") {
        return require.resolve("./mock-launcher.js");
      }
      return originalResolve.call(this, request, ...args);
    };

    try {
      // Re-require fresh
      delete require.cache[require.resolve("../bin/saints-mile.js")];
      // Fake no --version flag
      const origArgv = process.argv;
      process.argv = ["node", "saints-mile.js"];
      require("../bin/saints-mile.js");
      process.argv = origArgv;

      const config = JSON.parse(process.env.MCPTOOLSHOP_LAUNCH_CONFIG);

      assert.equal(config.toolName, "saints-mile");
      assert.equal(config.owner, "mcp-tool-shop-org");
      assert.equal(config.repo, "saints-mile");
      assert.equal(config.version, "1.0.0");
      assert.equal(config.tag, "v1.0.0");
    } finally {
      Module._resolveFilename = originalResolve;
    }
  });

  it("has all required fields", () => {
    const config = JSON.parse(process.env.MCPTOOLSHOP_LAUNCH_CONFIG);
    const required = ["toolName", "owner", "repo", "version", "tag"];
    for (const key of required) {
      assert.ok(config[key], `Missing required field: ${key}`);
    }
  });
});

describe("--version flag", () => {
  it("prints wrapper and binary version", () => {
    const out = execFileSync(process.execPath, [BIN, "--version"], {
      encoding: "utf-8",
    }).trim();
    assert.match(out, /^@mcptoolshop\/saints-mile \d+\.\d+\.\d+/);
    assert.match(out, /\(binary: saints-mile \d+\.\d+\.\d+\)/);
  });

  it("prints version with -V shorthand", () => {
    const out = execFileSync(process.execPath, [BIN, "-V"], {
      encoding: "utf-8",
    }).trim();
    assert.match(out, /@mcptoolshop\/saints-mile/);
  });

  it("wrapper version matches package.json", () => {
    const pkg = require("../package.json");
    const out = execFileSync(process.execPath, [BIN, "--version"], {
      encoding: "utf-8",
    }).trim();
    assert.ok(out.includes(pkg.version), `Output should contain ${pkg.version}`);
  });
});
