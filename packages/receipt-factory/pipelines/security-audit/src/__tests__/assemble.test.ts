import { describe, it, expect } from "vitest";
import { assemble } from "../assemble.js";
import type { SecurityAuditEvidence } from "../types.js";

function makeEvidence(overrides?: Partial<SecurityAuditEvidence>): SecurityAuditEvidence {
  return {
    scan_target: "mcp-tool-shop-org/receipt-factory",
    collected_at: "2026-03-03T12:00:00.000Z",
    commit_sha: "abc1234567890",
    tool: { name: "npm-audit", version: "10.0.0" },
    lockfile_digest: "sha256:def456",
    summary: {
      total: 3,
      critical: 0,
      high: 1,
      moderate: 2,
      low: 0,
      info: 0,
    },
    findings: [
      { severity: "high", package: "vulnerable-lib", title: "Prototype pollution", url: "https://example.com/advisory/1" },
      { severity: "moderate", package: "old-dep", range: "<2.0.0", title: "ReDoS vulnerability" },
      { severity: "moderate", package: "another-dep", title: "Path traversal" },
    ],
    ...overrides,
  };
}

describe("security-audit assemble", () => {
  it("produces a valid receipt from evidence", () => {
    const receipt = assemble(makeEvidence());

    expect(receipt.kind).toBe("audit");
    expect(receipt.subject.name).toBe("mcp-tool-shop-org/receipt-factory");
    expect(receipt.subject.ref).toBe("abc1234567890");
    expect(receipt.intent).toContain("Security audit");
    expect(receipt.intent).toContain("npm-audit");
    expect(receipt.intent).toContain("3 finding(s)");
    expect(receipt.id).toBeDefined();
    expect(receipt.integrity.digest).toBeDefined();
  });

  it("includes findings as outputs", () => {
    const receipt = assemble(makeEvidence());
    expect(receipt.outputs.length).toBe(3);
    expect(receipt.outputs[0].name).toContain("high");
    expect(receipt.outputs[0].name).toContain("vulnerable-lib");
  });

  it("records severity summary in metadata", () => {
    const receipt = assemble(makeEvidence());
    expect(receipt.metadata?.findings_total).toBe(3);
    expect(receipt.metadata?.findings_critical).toBe(0);
    expect(receipt.metadata?.findings_high).toBe(1);
    expect(receipt.metadata?.findings_moderate).toBe(2);
    expect(receipt.metadata?.pipeline).toBe("security-audit");
  });

  it("handles clean audit (no findings)", () => {
    const receipt = assemble(makeEvidence({
      summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 },
      findings: [],
    }));

    expect(receipt.intent).toContain("0 finding(s)");
    expect(receipt.intent).toContain("no vulnerabilities found");
    expect(receipt.outputs.length).toBe(0);
  });

  it("records tool version in environment", () => {
    const receipt = assemble(makeEvidence());
    expect(receipt.environment.tool_versions["npm-audit"]).toBe("10.0.0");
  });

  it("includes lockfile evidence when present", () => {
    const receipt = assemble(makeEvidence());
    const lockfileEvidence = receipt.evidence.find((e) => e.type === "lockfile_snapshot");
    expect(lockfileEvidence).toBeDefined();
    expect(lockfileEvidence?.description).toContain("sha256:def456");
  });
});
