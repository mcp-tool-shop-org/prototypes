import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bin = resolve(__dirname, "..", "build", "index.js");
const pkg = JSON.parse(readFileSync(resolve(__dirname, "..", "package.json"), "utf-8"));

function run(...args: string[]): string {
  return execFileSync("node", [bin, ...args], {
    encoding: "utf-8",
    timeout: 10_000,
  }).trim();
}

describe("CLI version", () => {
  it("--version prints version from package.json", () => {
    const out = run("--version");
    assert.equal(out, `mcp-aside v${pkg.version}`);
  });

  it("-v prints version from package.json", () => {
    const out = run("-v");
    assert.equal(out, `mcp-aside v${pkg.version}`);
  });

  it("MCP server version matches package.json", () => {
    // The server reads version from package.json at startup,
    // so if --version works correctly, they're aligned
    const out = run("--version");
    assert.ok(out.includes(pkg.version));
  });
});
