/**
 * Version alignment tests.
 *
 * Ensures the version constant in source code matches package.json.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { REGISTRUM_VERSION } from "../src/version.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "..", "package.json"), "utf-8"),
);

describe("version alignment", () => {
  it("REGISTRUM_VERSION matches package.json version", () => {
    expect(REGISTRUM_VERSION).toBe(pkg.version);
  });

  it("version is valid semver", () => {
    expect(REGISTRUM_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("version is >= 1.0.0", () => {
    const [major] = REGISTRUM_VERSION.split(".").map(Number);
    expect(major).toBeGreaterThanOrEqual(1);
  });
});
