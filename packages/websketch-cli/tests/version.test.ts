import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(__dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf-8");

describe("version consistency", () => {
  it("package.json version is semver", () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("package.json version is >= 1.0.0", () => {
    const major = parseInt(pkg.version.split(".")[0], 10);
    expect(major).toBeGreaterThanOrEqual(1);
  });

  it("CHANGELOG mentions current version", () => {
    expect(changelog).toContain(pkg.version);
  });

  it("package name is @mcptoolshop scoped", () => {
    expect(pkg.name).toMatch(/^@mcptoolshop\//);
  });

  it("--version flag outputs current version", () => {
    const out = execFileSync("node", [join(root, "dist/index.js"), "--version"], {
      encoding: "utf-8",
    });
    expect(out).toContain(pkg.version);
  });
});
