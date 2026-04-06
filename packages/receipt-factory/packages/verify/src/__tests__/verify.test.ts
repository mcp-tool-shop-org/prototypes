import { describe, it, expect } from "vitest";
import { ReceiptBuilder, computeDigest } from "@receipt-factory/core";
import { checkSchema } from "../schema-check.js";
import { checkHash } from "../hash-check.js";
import { checkLinks } from "../link-check.js";
import { checkLint } from "../lint-check.js";
import { checkPolicyIntegrity } from "../policy-check.js";
import { verifyReceipt } from "../index.js";

function makeReceipt() {
  return new ReceiptBuilder("ci_run")
    .subject({ type: "repository", name: "test-repo", ref: "abc123" })
    .intent("Run CI tests")
    .createdAt("2026-03-03T12:00:00.000Z")
    .addOutput({ name: "results.xml", digest: "sha256:abc" })
    .addEvidence({
      type: "workflow_run",
      url: "https://github.com/org/repo/actions/runs/123",
      description: "CI run",
    })
    .addStep("Run rf verify")
    .addCommand("rf verify receipt.json")
    .environment({ runner: "ubuntu-latest", tool_versions: { node: "20.11.0" } })
    .build();
}

describe("checkSchema", () => {
  it("passes for a valid receipt", () => {
    const result = checkSchema(makeReceipt());
    expect(result.passed).toBe(true);
    expect(result.name).toBe("schema");
  });

  it("fails for an invalid receipt", () => {
    const result = checkSchema({ garbage: true });
    expect(result.passed).toBe(false);
    expect(result.message).toContain("Schema validation failed");
  });
});

describe("checkHash", () => {
  it("passes for an untampered receipt", () => {
    const receipt = makeReceipt();
    const results = checkHash(receipt as unknown as Record<string, unknown>);
    const hashResult = results.find((r) => r.name === "hash");
    expect(hashResult?.passed).toBe(true);
  });

  it("verifies format version and byte length", () => {
    const receipt = makeReceipt();
    const results = checkHash(receipt as unknown as Record<string, unknown>);
    const formatCheck = results.find((r) => r.name === "format_version");
    const byteCheck = results.find((r) => r.name === "byte_length");
    expect(formatCheck?.passed).toBe(true);
    expect(byteCheck?.passed).toBe(true);
  });

  it("fails for a tampered receipt", () => {
    const receipt = makeReceipt();
    const tampered = { ...receipt, intent: "tampered!" } as unknown as Record<string, unknown>;
    const results = checkHash(tampered);
    const hashResult = results.find((r) => r.name === "hash");
    expect(hashResult?.passed).toBe(false);
    expect(hashResult?.message).toContain("mismatch");
  });

  it("fails when integrity is missing", () => {
    const results = checkHash({ kind: "ci_run" });
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain("No integrity digest");
  });
});

describe("checkLinks", () => {
  it("skips in offline mode", async () => {
    const receipt = makeReceipt() as unknown as Record<string, unknown>;
    const result = await checkLinks(receipt, { offline: true });
    expect(result.passed).toBe(true);
    expect(result.message).toContain("skipped");
  });

  it("passes when no links exist", async () => {
    const receipt = new ReceiptBuilder("ci_run")
      .subject({ type: "repo", name: "test" })
      .intent("test")
      .createdAt("2026-03-03T12:00:00.000Z")
      .build() as unknown as Record<string, unknown>;

    const result = await checkLinks(receipt, { offline: true });
    expect(result.passed).toBe(true);
  });
});

describe("verifyReceipt", () => {
  it("all checks pass for a valid receipt (offline)", async () => {
    const receipt = makeReceipt() as unknown as Record<string, unknown>;
    const result = await verifyReceipt(receipt, { offline: true });

    expect(result.valid).toBe(true);
    expect(result.checks.length).toBeGreaterThanOrEqual(3);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("fails when receipt is tampered (offline)", async () => {
    const receipt = makeReceipt();
    const tampered = { ...receipt, intent: "hacked" } as unknown as Record<string, unknown>;
    const result = await verifyReceipt(tampered, { offline: true });

    expect(result.valid).toBe(false);
    const hashCheck = result.checks.find((c) => c.name === "hash");
    expect(hashCheck?.passed).toBe(false);
  });

  it("does not run lint checks in normal mode", async () => {
    const receipt = makeReceipt() as unknown as Record<string, unknown>;
    const result = await verifyReceipt(receipt, { offline: true });
    const lintChecks = result.checks.filter((c) => c.name.startsWith("lint:"));
    expect(lintChecks).toHaveLength(0);
  });

  it("runs lint checks in strict mode", async () => {
    const receipt = makeReceipt() as unknown as Record<string, unknown>;
    const result = await verifyReceipt(receipt, { offline: true, strict: true });
    const lintChecks = result.checks.filter((c) => c.name.startsWith("lint:"));
    expect(lintChecks.length).toBeGreaterThan(0);
  });
});

describe("checkLint", () => {
  function makeFullReceipt() {
    return new ReceiptBuilder("ci_run")
      .subject({
        type: "repository",
        name: "test-repo",
        ref: "abc123",
        url: "https://github.com/org/repo",
      })
      .intent("Verify that all tests pass and artifacts build correctly")
      .createdAt("2026-03-03T12:00:00.000Z")
      .inputs({ commit: "abc123", branch: "main" })
      .addOutput({ name: "results.xml", digest: "sha256:abc" })
      .addEvidence({
        type: "workflow_run",
        url: "https://github.com/org/repo/actions/runs/123",
        description: "CI run",
      })
      .addStep("Download and run rf verify")
      .addCommand("rf verify receipt.json")
      .environment({ runner: "ubuntu-latest", tool_versions: { node: "20.11.0" } })
      .policy({
        redacted_fields: [],
        required_checks: ["schema", "hash"],
      })
      .meta("factory_version", "1.0.0")
      .build() as unknown as Record<string, unknown>;
  }

  it("passes all lint checks for a well-formed receipt", () => {
    const results = checkLint(makeFullReceipt());
    expect(results.every((r) => r.passed)).toBe(true);
    expect(results).toHaveLength(7);
  });

  it("fails lint:intent for short intent", () => {
    const receipt = makeFullReceipt();
    (receipt as Record<string, unknown>).intent = "test";
    const results = checkLint(receipt);
    const intentCheck = results.find((r) => r.name === "lint:intent");
    expect(intentCheck?.passed).toBe(false);
  });

  it("fails lint:subject_url when subject has no URL", () => {
    const receipt = makeFullReceipt();
    (receipt as Record<string, unknown>).subject = { type: "repo", name: "test" };
    const results = checkLint(receipt);
    const urlCheck = results.find((r) => r.name === "lint:subject_url");
    expect(urlCheck?.passed).toBe(false);
  });

  it("fails lint:evidence when evidence is empty", () => {
    const receipt = makeFullReceipt();
    (receipt as Record<string, unknown>).evidence = [];
    const results = checkLint(receipt);
    const evidenceCheck = results.find((r) => r.name === "lint:evidence");
    expect(evidenceCheck?.passed).toBe(false);
  });

  it("fails lint:required_checks when policy has no required checks", () => {
    const receipt = makeFullReceipt();
    (receipt as Record<string, unknown>).policy = {
      redacted_fields: [],
      required_checks: [],
    };
    const results = checkLint(receipt);
    const policyCheck = results.find((r) => r.name === "lint:required_checks");
    expect(policyCheck?.passed).toBe(false);
  });

  it("respects custom policy rules (higher intent minimum)", () => {
    const receipt = makeFullReceipt();
    // Default intent_min_length is 10, this intent is ~56 chars
    const defaultResults = checkLint(receipt);
    expect(defaultResults.find((r) => r.name === "lint:intent")?.passed).toBe(true);

    // With a policy requiring 100 chars, it should fail
    const strictResults = checkLint(receipt, {
      intent_min_length: 100,
      require_verification_steps: true,
      min_verification_steps: 1,
      require_verification_commands: true,
      min_verification_commands: 1,
      require_evidence: true,
      min_evidence: 1,
      require_context: true,
      require_subject_url: true,
      require_required_checks: true,
      require_references: false,
    });
    expect(strictResults.find((r) => r.name === "lint:intent")?.passed).toBe(false);
  });

  it("checks references when policy requires them", () => {
    const receipt = makeFullReceipt();
    const results = checkLint(receipt, {
      intent_min_length: 10,
      require_verification_steps: true,
      min_verification_steps: 1,
      require_verification_commands: true,
      min_verification_commands: 1,
      require_evidence: true,
      min_evidence: 1,
      require_context: true,
      require_subject_url: true,
      require_required_checks: true,
      require_references: true,
    });
    const refCheck = results.find((r) => r.name === "lint:references");
    expect(refCheck).toBeDefined();
    expect(refCheck?.passed).toBe(false);
    expect(refCheck?.message).toContain("No references");
  });
});

describe("checkPolicyIntegrity", () => {
  const POLICY_A = {
    intent_min_length: 10,
    require_verification_steps: true,
    min_verification_steps: 1,
    require_verification_commands: true,
    min_verification_commands: 1,
    require_evidence: true,
    min_evidence: 1,
    require_context: true,
    require_subject_url: true,
    require_required_checks: true,
    require_references: false,
  };

  const POLICY_B = {
    ...POLICY_A,
    intent_min_length: 50,
  };

  function makeReceiptWithPolicyHash(policyHash: string) {
    return new ReceiptBuilder("ci_run")
      .subject({
        type: "repository",
        name: "test-repo",
        ref: "abc123",
        url: "https://github.com/org/repo",
      })
      .intent("Verify that all tests pass and artifacts build correctly")
      .createdAt("2026-03-03T12:00:00.000Z")
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
      .policy({
        redacted_fields: [],
        required_checks: ["schema", "hash"],
      })
      .policyIdentity({ hash: policyHash })
      .build() as unknown as Record<string, unknown>;
  }

  it("skips when receipt has no policy_identity", () => {
    const receipt = makeReceipt() as unknown as Record<string, unknown>;
    const checks = checkPolicyIntegrity(receipt);
    expect(checks).toHaveLength(0);
  });

  it("reports info when receipt has policy hash but no policy supplied", () => {
    const hash = computeDigest(POLICY_A);
    const receipt = makeReceiptWithPolicyHash(hash);
    const checks = checkPolicyIntegrity(receipt);
    expect(checks).toHaveLength(1);
    expect(checks[0].passed).toBe(true);
    expect(checks[0].name).toBe("policy:identity");
    expect(checks[0].message).toContain("no --policy supplied");
  });

  it("passes when supplied policy matches receipt policy hash", () => {
    const hash = computeDigest(POLICY_A);
    const receipt = makeReceiptWithPolicyHash(hash);
    const checks = checkPolicyIntegrity(receipt, { suppliedRules: POLICY_A });
    expect(checks).toHaveLength(1);
    expect(checks[0].passed).toBe(true);
    expect(checks[0].name).toBe("policy:integrity");
    expect(checks[0].message).toContain("verified");
  });

  it("fails when supplied policy does not match receipt policy hash", () => {
    const hashA = computeDigest(POLICY_A);
    const receipt = makeReceiptWithPolicyHash(hashA);
    // Supply a different policy
    const checks = checkPolicyIntegrity(receipt, { suppliedRules: POLICY_B });
    expect(checks).toHaveLength(1);
    expect(checks[0].passed).toBe(false);
    expect(checks[0].name).toBe("policy:integrity");
    expect(checks[0].message).toContain("mismatch");
  });
});
