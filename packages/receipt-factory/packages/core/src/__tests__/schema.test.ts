import { describe, it, expect } from "vitest";
import { validateReceipt, safeValidateReceipt } from "../schema.js";
import { ReceiptBuilder } from "../receipt.js";

function makeValidReceipt() {
  return new ReceiptBuilder("ci_run")
    .subject({ type: "repository", name: "my-repo", ref: "abc123" })
    .intent("Verify tests pass on main branch")
    .createdAt("2026-03-03T12:00:00.000Z")
    .addOutput({ name: "test-results", digest: "sha256:abc123" })
    .addEvidence({
      type: "workflow_run",
      url: "https://github.com/org/repo/actions/runs/123",
      description: "GitHub Actions workflow run",
    })
    .addStep("Run rf verify on this file")
    .addCommand("rf verify receipts/ci/2026-03-03/123.json")
    .environment({
      runner: "ubuntu-latest",
      os: "Linux",
      tool_versions: { node: "20.11.0", pnpm: "10.28.2" },
    })
    .build();
}

describe("validateReceipt", () => {
  it("accepts a valid receipt", () => {
    const receipt = makeValidReceipt();
    expect(() => validateReceipt(receipt)).not.toThrow();
  });

  it("rejects receipt with missing kind", () => {
    const receipt = makeValidReceipt();
    const broken = { ...receipt, kind: undefined };
    expect(() => validateReceipt(broken)).toThrow();
  });

  it("rejects receipt with invalid kind", () => {
    const receipt = makeValidReceipt();
    const broken = { ...receipt, kind: "invalid_kind" };
    expect(() => validateReceipt(broken)).toThrow();
  });

  it("rejects receipt with empty intent", () => {
    const receipt = makeValidReceipt();
    const broken = { ...receipt, intent: "" };
    expect(() => validateReceipt(broken)).toThrow();
  });

  it("rejects receipt with invalid evidence URL", () => {
    const receipt = makeValidReceipt();
    const broken = {
      ...receipt,
      evidence: [{ type: "log", url: "not-a-url", description: "test" }],
    };
    expect(() => validateReceipt(broken)).toThrow();
  });
});

describe("safeValidateReceipt", () => {
  it("returns success for valid receipt", () => {
    const receipt = makeValidReceipt();
    const result = safeValidateReceipt(receipt);
    expect(result.success).toBe(true);
  });

  it("returns error for invalid receipt", () => {
    const result = safeValidateReceipt({ garbage: true });
    expect(result.success).toBe(false);
  });
});
