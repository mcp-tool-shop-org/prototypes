#!/usr/bin/env node
"use strict";

const pkg = require("../package.json");

// Handle --version / -V before delegating to launcher
const arg = process.argv[2];
if (arg === "--version" || arg === "-V") {
  console.log(`sovereignty ${pkg.version}`);
  process.exit(0);
}

// Pure JSON config — npm-launcher derives asset names from convention:
//   binary:    sovereignty-<ver>-<platform>-<arch>
//   checksums: checksums-<ver>.txt
process.env.MCPTOOLSHOP_LAUNCH_CONFIG = JSON.stringify({
  toolName: "sovereignty",
  owner: "mcp-tool-shop-org",
  repo: "sovereignty",
  version: pkg.version,
  tag: `v${pkg.version}`,
});

require("@mcptoolshop/npm-launcher/bin/mcptoolshop-launch.js");
