import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ReceiptBuilder } from "@receipt-factory/core";
import { checkReferences } from "../ref-check.js";

function makeTmpDir(): string {
  const dir = join(
    tmpdir(),
    `rf-ref-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

function buildCiReceipt(overrides?: { createdAt?: string; intent?: string }) {
  return new ReceiptBuilder("ci_run")
    .subject({ type: "repository", name: "test-repo", ref: "abc123" })
    .intent(overrides?.intent ?? "Verify tests pass on main branch")
    .createdAt(overrides?.createdAt ?? "2026-03-03T12:00:00.000Z")
    .addOutput({ name: "results.xml", digest: "sha256:abc" })
    .addEvidence({
      type: "workflow_run",
      url: "https://github.com/org/repo/actions/runs/123",
      description: "CI run",
    })
    .addStep("Run rf verify")
    .addCommand("rf verify receipt.json")
    .environment({
      runner: "ubuntu-latest",
      tool_versions: { node: "20.11.0" },
    })
    .build();
}

describe("checkReferences", () => {
  it("passes when receipt has no references", async () => {
    const receipt = buildCiReceipt() as unknown as Record<string, unknown>;
    const checks = await checkReferences(receipt);
    expect(checks).toHaveLength(1);
    expect(checks[0].passed).toBe(true);
    expect(checks[0].message).toContain("No references");
  });

  it("passes for a reference with no path or URL", async () => {
    const receipt = buildCiReceipt() as unknown as Record<string, unknown>;
    receipt.references = [
      {
        kind: "receipt",
        hash: "sha256:abc123",
        description: "Some other receipt",
      },
    ];
    const checks = await checkReferences(receipt);
    expect(checks).toHaveLength(1);
    expect(checks[0].passed).toBe(true);
    expect(checks[0].message).toContain("declared");
  });

  it("reports missing file in best-effort mode (does not fail)", async () => {
    const dir = makeTmpDir();

    const receipt = buildCiReceipt() as unknown as Record<string, unknown>;
    receipt.references = [
      {
        kind: "receipt",
        hash: "sha256:doesnotexist",
        description: "CI receipt that does not exist",
        path: "ci/nonexistent.json",
      },
    ];

    const checks = await checkReferences(receipt, { receiptsDir: dir });
    const reportCheck = checks.find((c) => c.message.includes("not found"));
    expect(reportCheck).toBeDefined();
    expect(reportCheck!.message).toContain("nonexistent.json");
    // Best-effort: passed is true (reported but not a failure)
    expect(reportCheck!.passed).toBe(true);

    rmSync(dir, { recursive: true, force: true });
  });

  it("fails when reference hash does not match", async () => {
    const dir = makeTmpDir();
    mkdirSync(join(dir, "ci"), { recursive: true });

    // Write a real receipt to disk
    const referencedReceipt = buildCiReceipt({
      intent: "The real CI receipt",
    });
    const receiptPath = join(dir, "ci", "real-receipt.json");
    writeFileSync(receiptPath, JSON.stringify(referencedReceipt));

    // Create a receipt that references it with a WRONG hash
    const receipt = buildCiReceipt() as unknown as Record<string, unknown>;
    receipt.references = [
      {
        kind: "receipt",
        hash: "sha256:definitely-wrong-hash",
        description: "CI receipt with wrong hash",
        path: "ci/real-receipt.json",
      },
    ];

    const checks = await checkReferences(receipt, { receiptsDir: dir });
    const failCheck = checks.find((c) => !c.passed);
    expect(failCheck).toBeDefined();
    expect(failCheck!.message).toContain("Hash mismatch");

    rmSync(dir, { recursive: true, force: true });
  });

  it("passes when reference hash matches", async () => {
    const dir = makeTmpDir();
    mkdirSync(join(dir, "ci"), { recursive: true });

    // Write a real receipt to disk
    const referencedReceipt = buildCiReceipt({
      intent: "The real CI receipt for hash match test",
    });
    const receiptPath = join(dir, "ci", "matched-receipt.json");
    writeFileSync(receiptPath, JSON.stringify(referencedReceipt));

    // Compute the correct hash (same as what computeDigest does)
    const { computeDigest } = await import("@receipt-factory/core");
    const { id: _id, integrity: _integrity, ...draft } = referencedReceipt;
    const correctHash = computeDigest(draft);

    // Create a receipt that references it with the CORRECT hash
    const receipt = buildCiReceipt() as unknown as Record<string, unknown>;
    receipt.references = [
      {
        kind: "receipt",
        hash: correctHash,
        description: "CI receipt with correct hash",
        path: "ci/matched-receipt.json",
      },
    ];

    const checks = await checkReferences(receipt, { receiptsDir: dir });
    expect(checks.every((c) => c.passed)).toBe(true);
    expect(checks.some((c) => c.message.includes("verified"))).toBe(true);

    rmSync(dir, { recursive: true, force: true });
  });

  it("detects cycles (same hash referenced twice)", async () => {
    // Cycle detection works at the visited-set level.
    // If the same hash appears multiple times in the graph,
    // the second visit reports "Cycle detected" instead of re-verifying.
    const receipt = buildCiReceipt() as unknown as Record<string, unknown>;
    const sharedHash = "sha256:shared-ref-hash";

    receipt.references = [
      {
        kind: "receipt",
        hash: sharedHash,
        description: "First reference to shared hash",
      },
      {
        kind: "receipt",
        hash: sharedHash,
        description: "Second reference to same hash (cycle)",
      },
    ];

    const checks = await checkReferences(receipt);

    // First visit: declared (no path/URL to resolve)
    const firstCheck = checks[0];
    expect(firstCheck.passed).toBe(true);
    expect(firstCheck.message).toContain("declared");

    // Second visit: cycle detected
    const cycleCheck = checks[1];
    expect(cycleCheck.passed).toBe(true);
    expect(cycleCheck.message.toLowerCase()).toContain("cycle");
  });

  it("halts traversal when max nodes exceeded", async () => {
    const receipt = buildCiReceipt() as unknown as Record<string, unknown>;

    // Create 5 references — with maxNodes=3, should halt after 3
    receipt.references = [];
    for (let i = 0; i < 5; i++) {
      (receipt.references as unknown[]).push({
        kind: "receipt",
        hash: `sha256:node-${i}`,
        description: `Node ${i}`,
      });
    }

    const checks = await checkReferences(receipt, { maxNodes: 3 });

    // First 3 should pass (declared), last 2 should fail (halted)
    const haltedChecks = checks.filter((c) =>
      c.message.includes("Max nodes visited"),
    );
    expect(haltedChecks.length).toBe(2);
    expect(haltedChecks[0].passed).toBe(false);

    // First 3 should be "declared"
    const declaredChecks = checks.filter((c) =>
      c.message.includes("declared"),
    );
    expect(declaredChecks.length).toBe(3);
  });

  it("best-effort mode: missing reference reports but does not fail", async () => {
    const dir = makeTmpDir();

    const receipt = buildCiReceipt() as unknown as Record<string, unknown>;
    receipt.references = [
      {
        kind: "receipt",
        hash: "sha256:doesnotexist",
        description: "Missing receipt (best-effort)",
        path: "ci/nonexistent.json",
      },
    ];

    // Default (refsStrict: false) — missing ref should pass (reported only)
    const checks = await checkReferences(receipt, { receiptsDir: dir });
    const missingCheck = checks.find((c) => c.message.includes("not found"));
    expect(missingCheck).toBeDefined();
    expect(missingCheck!.passed).toBe(true);

    rmSync(dir, { recursive: true, force: true });
  });

  it("strict mode: missing reference fails verification", async () => {
    const dir = makeTmpDir();

    const receipt = buildCiReceipt() as unknown as Record<string, unknown>;
    receipt.references = [
      {
        kind: "receipt",
        hash: "sha256:doesnotexist",
        description: "Missing receipt (strict)",
        path: "ci/nonexistent.json",
      },
    ];

    // refsStrict: true — missing ref should fail
    const checks = await checkReferences(receipt, {
      receiptsDir: dir,
      refsStrict: true,
    });
    const missingCheck = checks.find((c) => c.message.includes("not found"));
    expect(missingCheck).toBeDefined();
    expect(missingCheck!.passed).toBe(false);

    rmSync(dir, { recursive: true, force: true });
  });
});
