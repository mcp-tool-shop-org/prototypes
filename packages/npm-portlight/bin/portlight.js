#!/usr/bin/env node
"use strict";

// version/tag refer to the source repo binary release, not the npm wrapper version.
// Update these when a new GitHub Release is published for portlight.
process.env.MCPTOOLSHOP_LAUNCH_CONFIG = JSON.stringify({
  toolName: "portlight",
  owner: "mcp-tool-shop-org",
  repo: "portlight",
  version: "2.0.0",
  tag: "v2.0.0",
});

require("@mcptoolshop/npm-launcher/bin/mcptoolshop-launch.js");
