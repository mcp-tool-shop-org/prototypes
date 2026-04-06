import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import AdmZip from "adm-zip";
import { ReceiptBuilder, computeDigest } from "@receipt-factory/core";
import { isCosignAvailable, signBundle } from "@receipt-factory/sign";
import { createBundle } from "../create.js";
import { verifyBundle } from "../verify.js";
import { inspectBundle } from "../inspect.js";

/**
 * Build a minimal valid receipt for testing.
 */
function buildTestReceipt(overrides?: {
  kind?: "ci_run" | "release";
  intent?: string;
  references?: Array<{
    kind: "receipt" | "evidence_pack";
    hash: string;
    description: string;
    path?: string;
  }>;
}) {
  const builder = new ReceiptBuilder(overrides?.kind ?? "ci_run")
    .subject({ type: "repository", name: "org/test-repo", ref: "abc123" })
    .intent(overrides?.intent ?? "Verify tests pass on main branch")
    .addOutput({ name: "test-results.json", digest: "sha256:aaa111" })
    .addEvidence({
      type: "github_run",
      url: "https://github.com/org/test-repo/actions/runs/123",
      description: "CI run 123",
    })
    .addStep("Fetch the artifact")
    .addCommand("rf verify receipt.json")
    .toolVersion("node", "22.0.0");

  if (overrides?.references) {
    for (const ref of overrides.references) {
      builder.addReference(ref);
    }
  }

  return builder.build();
}

describe("receipt bundles", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "rf-bundle-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates a bundle from a single receipt and verifies it", async () => {
    // Write a receipt to disk
    const receipt = buildTestReceipt();
    const receiptPath = join(tmpDir, "receipt.json");
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

    // Create bundle
    const outputPath = join(tmpDir, "test.bundle.zip");
    const result = createBundle(receiptPath, { output: outputPath });

    expect(result.zipPath).toBe(outputPath);
    expect(result.manifest.bundle_version).toBe("1.0");
    expect(result.manifest.root_receipt).toBe("receipts/root.json");
    expect(result.manifest.factory_version).toBe("1.7.2");
    expect(result.manifest.contents.receipts).toContain("receipts/root.json");
    expect(result.hashes.algorithm).toBe("sha256");
    expect(result.hashes.files["receipts/root.json"]).toBeDefined();

    // Verify the bundle
    const verification = await verifyBundle(outputPath);
    expect(verification.valid).toBe(true);
    expect(verification.hashChecks.every((c) => c.passed)).toBe(true);
    expect(verification.receiptChecks.every((c) => c.valid)).toBe(true);
    expect(verification.receiptChecks.length).toBe(1);
  });

  it("creates a bundle with --follow and includes referenced receipts", async () => {
    // Build a base receipt
    const baseReceipt = buildTestReceipt({ intent: "Base CI receipt proving tests pass" });
    const baseDir = join(tmpDir, "receipts");
    mkdirSync(baseDir, { recursive: true });
    const basePath = join(baseDir, "base.json");
    writeFileSync(basePath, JSON.stringify(baseReceipt, null, 2));

    // Compute the base receipt's content hash (same as how ReceiptBuilder does it)
    const { id: _id, integrity: _integrity, ...baseDraft } = baseReceipt;
    const baseHash = computeDigest(baseDraft);

    // Build a downstream receipt referencing the base
    const downstreamReceipt = buildTestReceipt({
      kind: "release",
      intent: "Release verified by CI",
      references: [
        {
          kind: "receipt",
          hash: baseHash,
          description: "CI receipt proving tests passed",
          path: "base.json",
        },
      ],
    });
    const downstreamPath = join(baseDir, "downstream.json");
    writeFileSync(downstreamPath, JSON.stringify(downstreamReceipt, null, 2));

    // Create bundle with --follow
    const outputPath = join(tmpDir, "chain.bundle.zip");
    const result = createBundle(downstreamPath, {
      output: outputPath,
      follow: true,
      receiptsDir: baseDir,
    });

    // Should include both receipts
    expect(result.manifest.contents.receipts.length).toBe(2);
    expect(result.manifest.contents.receipts).toContain("receipts/root.json");

    // Verify the bundle
    const verification = await verifyBundle(outputPath);
    expect(verification.valid).toBe(true);
    expect(verification.receiptChecks.length).toBe(2);
    expect(verification.receiptChecks.every((c) => c.valid)).toBe(true);
  });

  it("detects tampering — hash check fails on modified file", async () => {
    const receipt = buildTestReceipt();
    const receiptPath = join(tmpDir, "receipt.json");
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

    const outputPath = join(tmpDir, "tamper.bundle.zip");
    createBundle(receiptPath, { output: outputPath });

    // Tamper with the bundle: modify the receipt inside the zip
    const zip = new AdmZip(outputPath);
    const entry = zip.getEntry("receipts/root.json");
    expect(entry).toBeDefined();

    // Replace the receipt content with something different
    const tamperedContent = JSON.stringify({ tampered: true });
    zip.updateFile(entry!, Buffer.from(tamperedContent));
    zip.writeZip(outputPath);

    // Verify should fail
    const verification = await verifyBundle(outputPath);
    expect(verification.valid).toBe(false);

    // The hash check for the receipt should fail
    const receiptHashCheck = verification.hashChecks.find(
      (c) => c.file === "receipts/root.json",
    );
    expect(receiptHashCheck?.passed).toBe(false);
  });

  it("inspect returns correct manifest without full verification", () => {
    const receipt = buildTestReceipt();
    const receiptPath = join(tmpDir, "receipt.json");
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

    const outputPath = join(tmpDir, "inspect.bundle.zip");
    createBundle(receiptPath, { output: outputPath });

    const manifest = inspectBundle(outputPath);

    expect(manifest.bundle_version).toBe("1.0");
    expect(manifest.root_receipt).toBe("receipts/root.json");
    expect(manifest.factory_version).toBe("1.7.2");
    expect(manifest.contents.receipts).toContain("receipts/root.json");
    expect(manifest.created_at).toBeDefined();
  });

  it("includes policy file in bundle when specified", async () => {
    const receipt = buildTestReceipt();
    const receiptPath = join(tmpDir, "receipt.json");
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

    // Create a policy file
    const policyPath = join(tmpDir, "policy.json");
    const policy = {
      policy_version: "1.0",
      name: "test-policy",
      description: "Test policy for bundle testing",
      rules: {
        intent_min_length: 10,
        require_verification_steps: true,
        min_verification_steps: 1,
        require_verification_commands: true,
        min_verification_commands: 1,
        require_evidence: true,
        min_evidence: 1,
        require_context: true,
        require_subject_url: false,
        require_required_checks: false,
        require_references: false,
      },
    };
    writeFileSync(policyPath, JSON.stringify(policy, null, 2));

    const outputPath = join(tmpDir, "with-policy.bundle.zip");
    const result = createBundle(receiptPath, {
      output: outputPath,
      policy: policyPath,
    });

    expect(result.manifest.contents.policy).toBe("policy/policy.json");
    expect(result.hashes.files["policy/policy.json"]).toBeDefined();

    // Verify the bundle
    const verification = await verifyBundle(outputPath);
    expect(verification.valid).toBe(true);
  });

  it("bundle contains VERIFY.md with verification instructions", () => {
    const receipt = buildTestReceipt();
    const receiptPath = join(tmpDir, "receipt.json");
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

    const outputPath = join(tmpDir, "verify-md.bundle.zip");
    createBundle(receiptPath, { output: outputPath });

    // Read the VERIFY.md from the zip
    const zip = new AdmZip(outputPath);
    const verifyEntry = zip.getEntry("VERIFY.md");
    expect(verifyEntry).toBeDefined();

    const content = verifyEntry!.getData().toString("utf-8");
    expect(content).toContain("How to Verify This Bundle");
    expect(content).toContain("rf bundle verify");
    expect(content).toContain("Bundle-Internal Semantics");
  });

  it("throws on missing receipt file", () => {
    expect(() =>
      createBundle(join(tmpDir, "nonexistent.json"), {
        output: join(tmpDir, "fail.zip"),
      }),
    ).toThrow(/not found/i);
  });

  it("throws on invalid receipt JSON", () => {
    const badPath = join(tmpDir, "bad.json");
    writeFileSync(badPath, "not json at all");

    expect(() =>
      createBundle(badPath, { output: join(tmpDir, "fail.zip") }),
    ).toThrow(/not valid JSON/i);
  });

  it("throws on invalid zip file for inspect", () => {
    const fakePath = join(tmpDir, "fake.zip");
    writeFileSync(fakePath, "not a zip");

    expect(() => inspectBundle(fakePath)).toThrow(/failed to open/i);
  });

  it("hashes.json does not contain itself", () => {
    const receipt = buildTestReceipt();
    const receiptPath = join(tmpDir, "receipt.json");
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

    const outputPath = join(tmpDir, "self-hash.bundle.zip");
    const result = createBundle(receiptPath, { output: outputPath });

    // hashes.json cannot hash itself — verify it's not in the hashes
    expect(result.hashes.files["hashes.json"]).toBeUndefined();

    // But manifest.json and VERIFY.md should be hashed
    expect(result.hashes.files["manifest.json"]).toBeDefined();
    expect(result.hashes.files["VERIFY.md"]).toBeDefined();
  });
});

describe("bundle signing", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "rf-bundle-sign-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("requireBundleSignature fails when no .sig file exists", async () => {
    const receipt = buildTestReceipt();
    const receiptPath = join(tmpDir, "receipt.json");
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

    const outputPath = join(tmpDir, "unsigned.bundle.zip");
    createBundle(receiptPath, { output: outputPath });

    // Verify with requireBundleSignature — should fail (no .sig file)
    const result = await verifyBundle(outputPath, {
      requireBundleSignature: true,
    });

    expect(result.valid).toBe(false);
    expect(result.signatureCheck).toBeDefined();
    expect(result.signatureCheck!.passed).toBe(false);
    expect(result.signatureCheck!.message).toContain("signature not found");
    // Hash and receipt checks should be empty (early return on sig failure)
    expect(result.hashChecks).toHaveLength(0);
    expect(result.receiptChecks).toHaveLength(0);
  });

  it("signatureCheck is absent when requireBundleSignature is not set", async () => {
    const receipt = buildTestReceipt();
    const receiptPath = join(tmpDir, "receipt.json");
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

    const outputPath = join(tmpDir, "no-sig-required.bundle.zip");
    createBundle(receiptPath, { output: outputPath });

    // Verify without requireBundleSignature — no signature check
    const result = await verifyBundle(outputPath);

    expect(result.valid).toBe(true);
    expect(result.signatureCheck).toBeUndefined();
  });

  it("fake .sig file fails bundle signature verification", async () => {
    const receipt = buildTestReceipt();
    const receiptPath = join(tmpDir, "receipt.json");
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

    const outputPath = join(tmpDir, "fake-sig.bundle.zip");
    createBundle(receiptPath, { output: outputPath });

    // Write a fake .sig file — it's not a real cosign signature
    writeFileSync(`${outputPath}.sig`, "not-a-valid-signature");

    // If cosign isn't installed, the check fails with "cosign not available"
    // If cosign is installed, the check fails with "verification failed"
    // Either way: it should not pass
    const result = await verifyBundle(outputPath, {
      requireBundleSignature: true,
    });

    expect(result.valid).toBe(false);
    expect(result.signatureCheck).toBeDefined();
    expect(result.signatureCheck!.passed).toBe(false);
  });

  it("signBundle throws when cosign is not installed", async () => {
    const isInstalled = await isCosignAvailable();
    if (isInstalled) {
      return; // Skip — can't test this path with cosign present
    }

    const receipt = buildTestReceipt();
    const receiptPath = join(tmpDir, "receipt.json");
    writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

    const outputPath = join(tmpDir, "sign-fail.bundle.zip");
    createBundle(receiptPath, { output: outputPath });

    await expect(
      signBundle(outputPath, { keyless: true }),
    ).rejects.toThrow("cosign is not installed");
  });
});
