#!/usr/bin/env node
"use strict";

const { version: wrapperVersion } = require("../package.json");

const arg = process.argv[2];
if (arg === "--version" || arg === "-V") {
  console.log(`star-freight (npm wrapper) ${wrapperVersion}`);
  process.exit(0);
}

// version/tag refer to the source repo binary release, not the npm wrapper version.
// Update these when a new GitHub Release is published for star-freight.
process.env.MCPTOOLSHOP_LAUNCH_CONFIG = JSON.stringify({
  toolName: "star-freight",
  owner: "mcp-tool-shop-org",
  repo: "star-freight",
  version: "1.0.3",
  tag: "v1.0.3",
});

require("@mcptoolshop/npm-launcher/bin/mcptoolshop-launch.js");
