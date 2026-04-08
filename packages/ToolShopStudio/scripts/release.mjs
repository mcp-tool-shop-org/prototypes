#!/usr/bin/env node

/**
 * Release script for ToolShopStudio.
 *
 * 1. Bumps version in package.json
 * 2. Runs typecheck + tests + smoke
 * 3. Builds dist
 * 4. Publishes to npm (public access)
 * 5. Creates git tag
 *
 * Usage: node scripts/release.mjs
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PKG_PATH = resolve(ROOT, "package.json");
const VERSION = "1.7.0-toolshop";

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

function main() {
  console.log(`=== ToolShopStudio Release: v${VERSION} ===\n`);

  // 1. Bump version
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8"));
  pkg.version = VERSION;
  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  console.log(`Version bumped to ${VERSION}`);

  // 2. Typecheck
  run("npm run typecheck");

  // 3. Tests
  run("npm test");

  // 4. Build
  run("npm run build");

  // 5. Smoke
  run("npm run smoke");

  // 6. Publish to npm
  console.log("\nAll checks passed. Publishing to npm...");
  run("npm publish --access public");

  // 7. Tag + push instructions
  console.log(`\nPublished to npm. Now tag and push:`);
  console.log(`  git add -A && git commit -m "Release v${VERSION}"`);
  console.log(`  git tag v${VERSION}`);
  console.log(`  git push && git push --tags`);

  console.log(`\n=== Release v${VERSION} complete ===`);
}

main();
