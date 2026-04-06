import { describe, it, expect } from "vitest";
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";

// =============================================================================
// Fixtures
// =============================================================================

const validCapture = {
  version: "0.1",
  url: "https://example.com",
  timestamp_ms: 1700000000000,
  viewport: { w_px: 1920, h_px: 1080, aspect: 1920 / 1080 },
  compiler: { name: "websketch-ir", version: "0.2.1", options_hash: "test" },
  root: {
    id: "",
    role: "PAGE",
    bbox: [0, 0, 1, 1],
    interactive: false,
    visible: true,
  },
};

// =============================================================================
// validate subcommand
// =============================================================================

describe("validate subcommand", () => {
  let tempDir: string;
  tempDir = mkdtempSync(join(tmpdir(), "websketch-subcmd-"));

  it("valid file → exit 0, stdout contains 'Valid'", () => {
    const filePath = join(tempDir, "valid.json");
    writeFileSync(filePath, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js validate "${filePath}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    expect(stdout).toContain("Valid");
    expect(stdout).toContain("https://example.com");
    unlinkSync(filePath);
  });

  it("invalid file → exit 1, stderr contains WS_INVALID_CAPTURE", () => {
    const filePath = join(tempDir, "invalid.json");
    writeFileSync(filePath, "{}");
    try {
      execSync(`node dist/index.js validate "${filePath}"`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect.fail("Should have exited with non-zero code");
    } catch (err: any) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain("WS_INVALID_CAPTURE");
    } finally {
      unlinkSync(filePath);
    }
  });

  it("--json valid → { ok: true, valid: true }", () => {
    const filePath = join(tempDir, "valid-json.json");
    writeFileSync(filePath, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js --json validate "${filePath}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const result = JSON.parse(stdout);
    expect(result.ok).toBe(true);
    expect(result.valid).toBe(true);
    unlinkSync(filePath);
  });
});

// =============================================================================
// render subcommand (promoted from render-ascii)
// =============================================================================

describe("render subcommand", () => {
  let tempDir: string;
  tempDir = mkdtempSync(join(tmpdir(), "websketch-render-"));

  it("render produces ASCII output", () => {
    const filePath = join(tempDir, "valid.json");
    writeFileSync(filePath, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js render "${filePath}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    // Should contain box-drawing chars or role abbreviations
    expect(stdout.length).toBeGreaterThan(0);
    unlinkSync(filePath);
  });

  it("render-ascii alias still works", () => {
    const filePath = join(tempDir, "valid-alias.json");
    writeFileSync(filePath, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js render-ascii "${filePath}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    expect(stdout.length).toBeGreaterThan(0);
    unlinkSync(filePath);
  });
});

// =============================================================================
// diff subcommand
// =============================================================================

describe("diff subcommand", () => {
  let tempDir: string;
  tempDir = mkdtempSync(join(tmpdir(), "websketch-diff-"));

  it("diff A vs A → output contains 'Identical'", () => {
    const fileA = join(tempDir, "a.json");
    const fileB = join(tempDir, "b.json");
    writeFileSync(fileA, JSON.stringify(validCapture));
    writeFileSync(fileB, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js diff "${fileA}" "${fileB}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    expect(stdout).toContain("Identical");
    unlinkSync(fileA);
    unlinkSync(fileB);
  });

  it("--json diff → valid JSON with ok:true", () => {
    const fileA = join(tempDir, "a2.json");
    const fileB = join(tempDir, "b2.json");
    writeFileSync(fileA, JSON.stringify(validCapture));
    writeFileSync(fileB, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js --json diff "${fileA}" "${fileB}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const result = JSON.parse(stdout);
    expect(result.ok).toBe(true);
    expect(result.diff.summary).toBeDefined();
    unlinkSync(fileA);
    unlinkSync(fileB);
  });
});

// =============================================================================
// bundle subcommand
// =============================================================================

describe("bundle subcommand", () => {
  let tempDir: string;
  tempDir = mkdtempSync(join(tmpdir(), "websketch-bundle-"));

  it("bundle single file → stdout JSON with captures array", () => {
    const filePath = join(tempDir, "single.json");
    writeFileSync(filePath, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js bundle "${filePath}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const bundle = JSON.parse(stdout);
    expect(bundle.schemaVersion).toBe("0.1");
    expect(bundle.captures).toHaveLength(1);
    expect(bundle.tool).toContain("websketch-cli");
    expect(bundle.createdAt).toBeDefined();
    unlinkSync(filePath);
  });

  it("bundle two files → includes diff summary", () => {
    const fileA = join(tempDir, "a.json");
    const fileB = join(tempDir, "b.json");
    writeFileSync(fileA, JSON.stringify(validCapture));
    writeFileSync(fileB, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js bundle "${fileA}" "${fileB}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const bundle = JSON.parse(stdout);
    expect(bundle.captures).toHaveLength(2);
    expect(bundle.diff).toBeDefined();
    expect(bundle.diff.summary).toBeDefined();
    unlinkSync(fileA);
    unlinkSync(fileB);
  });

  it("bundle -o writes to file", () => {
    const filePath = join(tempDir, "src.json");
    const outPath = join(tempDir, "out.ws.json");
    writeFileSync(filePath, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js bundle "${filePath}" -o "${outPath}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    expect(stdout).toContain("Bundle written");
    const content = JSON.parse(readFileSync(outPath, "utf-8"));
    expect(content.captures).toHaveLength(1);
    unlinkSync(filePath);
    unlinkSync(outPath);
  });

  it("--json bundle → envelope with ok:true", () => {
    const filePath = join(tempDir, "json-mode.json");
    writeFileSync(filePath, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js --json bundle "${filePath}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const result = JSON.parse(stdout);
    expect(result.ok).toBe(true);
    expect(result.bundle.captures).toHaveLength(1);
    unlinkSync(filePath);
  });
});

// =============================================================================
// help text
// =============================================================================

describe("help text", () => {
  it("--help shows validate, render, and bundle as commands", () => {
    const stdout = execSync("node dist/index.js --help", {
      encoding: "utf-8",
      stdio: "pipe",
    });
    expect(stdout).toContain("validate");
    expect(stdout).toContain("render");
    expect(stdout).toContain("bundle");
    expect(stdout).toContain("--json");
    expect(stdout).toContain("Exit Codes");
  });
});
