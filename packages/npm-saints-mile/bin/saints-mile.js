#!/usr/bin/env node
"use strict";

const path = require("node:path");
const pkg = require(path.join(__dirname, "..", "package.json"));

const BINARY_VERSION = "1.0.0";

// Handle --version before delegating to launcher
if (process.argv.includes("--version") || process.argv.includes("-V")) {
  console.log(`${pkg.name} ${pkg.version} (binary: saints-mile ${BINARY_VERSION})`);
  process.exit(0);
}

// version/tag refer to the source repo binary release, not the npm wrapper version.
// Update these when a new GitHub Release is published for saints-mile.
process.env.MCPTOOLSHOP_LAUNCH_CONFIG = JSON.stringify({
  toolName: "saints-mile",
  owner: "mcp-tool-shop-org",
  repo: "saints-mile",
  version: BINARY_VERSION,
  tag: `v${BINARY_VERSION}`,
});

require("@mcptoolshop/npm-launcher/bin/mcptoolshop-launch.js");
