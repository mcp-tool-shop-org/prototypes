import { describe, it, expect } from "vitest";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";
import {
  parseCapture,
  validateCapture,
  isWebSketchException,
  formatWebSketchError,
  WebSketchException,
} from "@mcptoolshop/websketch-ir";

// =============================================================================
// IR imports available to CLI
// =============================================================================

describe("CLI error imports from websketch-ir", () => {
  it("imports parseCapture", () => {
    expect(typeof parseCapture).toBe("function");
  });

  it("imports validateCapture", () => {
    expect(typeof validateCapture).toBe("function");
  });

  it("imports isWebSketchException", () => {
    expect(typeof isWebSketchException).toBe("function");
  });

  it("imports formatWebSketchError", () => {
    expect(typeof formatWebSketchError).toBe("function");
  });

  it("imports WebSketchException class", () => {
    const err = new WebSketchException({
      code: "WS_NOT_FOUND",
      message: "test",
    });
    expect(err).toBeInstanceOf(WebSketchException);
    expect(err).toBeInstanceOf(Error);
  });
});

// =============================================================================
// loadCapture behavior (tested via CLI execution)
// =============================================================================

describe("CLI loadCapture via process execution", () => {
  let tempDir: string;

  // Create a temp directory for test files
  tempDir = mkdtempSync(join(tmpdir(), "websketch-cli-test-"));

  it("non-existent file → exit code 2", () => {
    try {
      execSync("node dist/index.js render-ascii /nonexistent/file.json", {
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect.fail("Should have exited with non-zero code");
    } catch (err: any) {
      expect(err.status).toBe(2);
      expect(err.stderr).toContain("WS_NOT_FOUND");
    }
  });

  it("invalid JSON → exit code 1", () => {
    const badJsonPath = join(tempDir, "bad.json");
    writeFileSync(badJsonPath, "not valid json{{{");
    try {
      execSync(`node dist/index.js render-ascii "${badJsonPath}"`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect.fail("Should have exited with non-zero code");
    } catch (err: any) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain("WS_INVALID_JSON");
    } finally {
      unlinkSync(badJsonPath);
    }
  });

  it("invalid capture (empty object) → exit code 1", () => {
    const emptyPath = join(tempDir, "empty.json");
    writeFileSync(emptyPath, "{}");
    try {
      execSync(`node dist/index.js render-ascii "${emptyPath}"`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect.fail("Should have exited with non-zero code");
    } catch (err: any) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain("WS_INVALID_CAPTURE");
    } finally {
      unlinkSync(emptyPath);
    }
  });

  it("valid capture → exit code 0", () => {
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
    const validPath = join(tempDir, "valid.json");
    writeFileSync(validPath, JSON.stringify(validCapture));
    const output = execSync(`node dist/index.js render-ascii "${validPath}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    expect(output).toBeTruthy();
    unlinkSync(validPath);
  });
});

// =============================================================================
// WebSketchException for CLI error scenarios
// =============================================================================

describe("WebSketchException for CLI scenarios", () => {
  it("WS_NOT_FOUND has correct fields", () => {
    const err = new WebSketchException({
      code: "WS_NOT_FOUND",
      message: "File not found: /foo/bar.json",
      path: "/foo/bar.json",
      hint: "Check the file path and try again.",
    });
    expect(err.ws.code).toBe("WS_NOT_FOUND");
    expect(err.ws.path).toBe("/foo/bar.json");
    expect(err.ws.hint).toContain("Check");
  });

  it("WS_IO_ERROR with cause chain", () => {
    const err = new WebSketchException({
      code: "WS_IO_ERROR",
      message: "Cannot read file",
      cause: { name: "Error", message: "ENOENT" },
    });
    expect(err.ws.code).toBe("WS_IO_ERROR");
    expect(err.cause).toBeInstanceOf(Error);
  });

  it("formatWebSketchError produces readable output", () => {
    const output = formatWebSketchError({
      code: "WS_NOT_FOUND",
      message: "File not found",
      path: "/foo.json",
      hint: "Check the path.",
    });
    expect(output).toContain("[WS_NOT_FOUND]");
    expect(output).toContain("File not found");
    expect(output).toContain("/foo.json");
    expect(output).toContain("Check the path.");
  });
});
