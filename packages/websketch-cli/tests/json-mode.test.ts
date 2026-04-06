import { describe, it, expect } from "vitest";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
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
// --json mode: render
// =============================================================================

describe("--json mode: render", () => {
  let tempDir: string;
  tempDir = mkdtempSync(join(tmpdir(), "websketch-json-test-"));

  it("valid capture → { ok: true, ascii: '...' }", () => {
    const filePath = join(tempDir, "valid-render.json");
    writeFileSync(filePath, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js --json render "${filePath}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const result = JSON.parse(stdout);
    expect(result.ok).toBe(true);
    expect(typeof result.ascii).toBe("string");
    expect(result.ascii.length).toBeGreaterThan(0);
    unlinkSync(filePath);
  });

  it("invalid JSON → { ok: false, error.code: 'WS_INVALID_JSON' }, exit 1", () => {
    const filePath = join(tempDir, "bad-json.json");
    writeFileSync(filePath, "not valid json{{{");
    try {
      execSync(`node dist/index.js --json render "${filePath}"`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect.fail("Should have exited with non-zero code");
    } catch (err: any) {
      expect(err.status).toBe(1);
      const result = JSON.parse(err.stdout);
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("WS_INVALID_JSON");
    } finally {
      unlinkSync(filePath);
    }
  });

  it("missing file → { ok: false, error.code: 'WS_NOT_FOUND' }, exit 2", () => {
    try {
      execSync("node dist/index.js --json render /nonexistent/file.json", {
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect.fail("Should have exited with non-zero code");
    } catch (err: any) {
      expect(err.status).toBe(2);
      const result = JSON.parse(err.stdout);
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("WS_NOT_FOUND");
    }
  });

  it("missing arg → { ok: false, error.code: 'WS_INVALID_ARGS' }, exit 1", () => {
    try {
      execSync("node dist/index.js --json render", {
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect.fail("Should have exited with non-zero code");
    } catch (err: any) {
      expect(err.status).toBe(1);
      const result = JSON.parse(err.stdout);
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("WS_INVALID_ARGS");
    }
  });
});

// =============================================================================
// --json mode: fingerprint
// =============================================================================

describe("--json mode: fingerprint", () => {
  let tempDir: string;
  tempDir = mkdtempSync(join(tmpdir(), "websketch-json-fp-"));

  it("valid capture → { ok: true, fingerprint: '...' }", () => {
    const filePath = join(tempDir, "valid-fp.json");
    writeFileSync(filePath, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js --json fingerprint "${filePath}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const result = JSON.parse(stdout);
    expect(result.ok).toBe(true);
    expect(typeof result.fingerprint).toBe("string");
    expect(result.fingerprint).toMatch(/^[0-9a-f]{8}$/);
    unlinkSync(filePath);
  });
});

// =============================================================================
// --json mode: diff
// =============================================================================

describe("--json mode: diff", () => {
  let tempDir: string;
  tempDir = mkdtempSync(join(tmpdir(), "websketch-json-diff-"));

  it("diff A vs A → { ok: true, diff: { summary: ... } }", () => {
    const fileA = join(tempDir, "a.json");
    const fileB = join(tempDir, "b.json");
    writeFileSync(fileA, JSON.stringify(validCapture));
    writeFileSync(fileB, JSON.stringify(validCapture));
    const stdout = execSync(`node dist/index.js --json diff "${fileA}" "${fileB}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const result = JSON.parse(stdout);
    expect(result.ok).toBe(true);
    expect(result.diff).toBeDefined();
    expect(result.diff.summary).toBeDefined();
    expect(result.diff.summary.identical).toBe(true);
    unlinkSync(fileA);
    unlinkSync(fileB);
  });
});

// =============================================================================
// --json mode: validate
// =============================================================================

describe("--json mode: validate", () => {
  let tempDir: string;
  tempDir = mkdtempSync(join(tmpdir(), "websketch-json-val-"));

  it("valid capture → { ok: true, valid: true }", () => {
    const filePath = join(tempDir, "valid-val.json");
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

  it("invalid capture → { ok: false, error.code: 'WS_INVALID_CAPTURE' }", () => {
    const filePath = join(tempDir, "invalid-val.json");
    writeFileSync(filePath, "{}");
    try {
      execSync(`node dist/index.js --json validate "${filePath}"`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect.fail("Should have exited with non-zero code");
    } catch (err: any) {
      expect(err.status).toBe(1);
      const result = JSON.parse(err.stdout);
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("WS_INVALID_CAPTURE");
    } finally {
      unlinkSync(filePath);
    }
  });
});

// =============================================================================
// --json mode: unknown command
// =============================================================================

describe("--json mode: unknown command", () => {
  it("unknown command → { ok: false, error.code: 'WS_INVALID_ARGS' }", () => {
    try {
      execSync("node dist/index.js --json bogus", {
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect.fail("Should have exited with non-zero code");
    } catch (err: any) {
      expect(err.status).toBe(1);
      const result = JSON.parse(err.stdout);
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("WS_INVALID_ARGS");
    }
  });
});
