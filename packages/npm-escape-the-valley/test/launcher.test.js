"use strict";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

describe("escape-the-valley launcher", () => {
  it("sets MCPTOOLSHOP_LAUNCH_CONFIG with valid JSON", () => {
    // Clear any previous value
    delete process.env.MCPTOOLSHOP_LAUNCH_CONFIG;

    // Stub the launcher so require() doesn't actually run a binary
    const Module = require("node:module");
    const origResolve = Module._resolveFilename;
    Module._resolveFilename = function (request, ...args) {
      if (request === "@mcptoolshop/npm-launcher/bin/mcptoolshop-launch.js") {
        // Return a no-op module path
        return require.resolve("./stub-launcher.js");
      }
      return origResolve.call(this, request, ...args);
    };

    try {
      require("../bin/escape-the-valley.js");

      const config = JSON.parse(process.env.MCPTOOLSHOP_LAUNCH_CONFIG);
      assert.equal(config.toolName, "escape-the-valley");
      assert.equal(config.owner, "mcp-tool-shop-org");
      assert.equal(config.repo, "escape-the-valley");
      assert.equal(typeof config.version, "string");
      assert.equal(typeof config.tag, "string");
      assert.ok(config.tag.startsWith("v"), "tag should start with v");
    } finally {
      Module._resolveFilename = origResolve;
    }
  });

  it("config version and tag are consistent", () => {
    const config = JSON.parse(process.env.MCPTOOLSHOP_LAUNCH_CONFIG);
    assert.equal(config.tag, `v${config.version}`);
  });

  it("config has all required fields", () => {
    const config = JSON.parse(process.env.MCPTOOLSHOP_LAUNCH_CONFIG);
    const required = ["toolName", "owner", "repo", "version", "tag"];
    for (const field of required) {
      assert.ok(field in config, `missing required field: ${field}`);
      assert.ok(config[field].length > 0, `empty required field: ${field}`);
    }
  });
});
