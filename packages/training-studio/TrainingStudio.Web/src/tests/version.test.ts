import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(__dirname, "../..");
const repoRoot = resolve(root, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const changelog = readFileSync(join(repoRoot, "CHANGELOG.md"), "utf-8");

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

  it("package name has @mikeyfrilot scope", () => {
    expect(pkg.name).toMatch(/^@mikeyfrilot\//);
  });
});
