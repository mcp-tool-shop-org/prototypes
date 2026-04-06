import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf-8");

function readPkg(dir: string) {
  return JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
}

const packageDirs = readdirSync(join(root, "packages"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => ({ name: d.name, pkg: readPkg(join(root, "packages", d.name)) }));

describe("version consistency", () => {
  for (const { name, pkg } of packageDirs) {
    it(`${name}: version is semver`, () => {
      assert.match(pkg.version, /^\d+\.\d+\.\d+/);
    });

    it(`${name}: version is >= 1.0.0`, () => {
      const major = parseInt(pkg.version.split(".")[0], 10);
      assert.ok(major >= 1, `expected major >= 1, got ${major}`);
    });
  }

  it("all packages share the same version", () => {
    const versions = packageDirs.map((d) => d.pkg.version);
    const unique = [...new Set(versions)];
    assert.equal(unique.length, 1, `expected 1 version, got: ${unique.join(", ")}`);
  });

  it("CHANGELOG mentions the current version", () => {
    const version = packageDirs[0].pkg.version;
    assert.ok(
      changelog.includes(version),
      `CHANGELOG missing ${version}`
    );
  });
});
