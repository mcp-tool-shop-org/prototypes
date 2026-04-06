"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

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
      require("../bin/portlight.js");
      const config = JSON.parse(process.env.MCPTOOLSHOP_LAUNCH_CONFIG);

      assert.equal(config.toolName, "portlight");
      assert.equal(config.owner, "mcp-tool-shop-org");
      assert.equal(config.repo, "portlight");
      assert.equal(config.version, "2.0.0");
      assert.equal(config.tag, "v2.0.0");
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
