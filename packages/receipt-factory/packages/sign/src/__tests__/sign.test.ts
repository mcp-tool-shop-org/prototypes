import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ReceiptBuilder } from "@receipt-factory/core";

// Test the cosign availability check (works without cosign installed)
import { isCosignAvailable } from "../cosign.js";
import { verifySignature } from "../verify-signature.js";

function makeReceiptFile(dir: string): string {
  const receipt = new ReceiptBuilder("ci_run")
    .subject({ type: "repository", name: "test-repo" })
    .intent("Test signing")
    .createdAt("2026-03-03T12:00:00.000Z")
    .build();

  const path = join(dir, "receipt.json");
  writeFileSync(path, JSON.stringify(receipt, null, 2));
  return path;
}

describe("isCosignAvailable", () => {
  it("returns a boolean", async () => {
    const result = await isCosignAvailable();
    expect(typeof result).toBe("boolean");
  });
});

describe("verifySignature", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "rf-sign-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("fails when no .sig file exists", async () => {
    const receiptPath = makeReceiptFile(tempDir);
    const result = await verifySignature(receiptPath);
    expect(result.passed).toBe(false);
    expect(result.name).toBe("signature");
    expect(result.message).toContain("No signature file found");
  });

  it("returns correct check structure", async () => {
    const receiptPath = makeReceiptFile(tempDir);
    const result = await verifySignature(receiptPath);
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("passed");
    expect(result).toHaveProperty("message");
  });
});

// Import test for the sign module
import { signReceipt } from "../sign.js";

describe("signReceipt", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "rf-sign-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("throws when cosign is not installed", async () => {
    // This test only works when cosign is NOT installed (typical in dev)
    const isInstalled = await isCosignAvailable();
    if (isInstalled) {
      return; // Skip — can't test this path with cosign present
    }

    const receiptPath = makeReceiptFile(tempDir);
    await expect(
      signReceipt(receiptPath, { keyless: true }),
    ).rejects.toThrow("cosign is not installed");
  });
});
