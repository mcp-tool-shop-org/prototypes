import { describe, it, expect } from "vitest";
import { ReceiptBuilder } from "../receipt.js";
import { verifyIntegrity } from "../hash.js";

describe("ReceiptBuilder", () => {
  it("builds a valid receipt with required fields", () => {
    const receipt = new ReceiptBuilder("ci_run")
      .subject({ type: "repository", name: "test-repo" })
      .intent("Run CI tests")
      .createdAt("2026-03-03T12:00:00.000Z")
      .build();

    expect(receipt.receipt_version).toBe("1.0.0");
    expect(receipt.kind).toBe("ci_run");
    expect(receipt.subject.name).toBe("test-repo");
    expect(receipt.intent).toBe("Run CI tests");
    expect(receipt.id).toMatch(/^[0-9a-f]{64}$/);
    expect(receipt.integrity.algorithm).toBe("sha256");
    expect(receipt.integrity.digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("built receipt passes integrity verification", () => {
    const receipt = new ReceiptBuilder("release")
      .subject({ type: "package", name: "@receipt-factory/core", ref: "v1.0.0" })
      .intent("Publish v1.0.0 to npm")
      .createdAt("2026-03-03T12:00:00.000Z")
      .addOutput({ name: "rf-core-1.0.0.tgz", digest: "sha256:abc", size: 12345 })
      .build();

    expect(verifyIntegrity(receipt as unknown as Record<string, unknown>)).toBe(true);
  });

  it("throws when subject is missing", () => {
    expect(() =>
      new ReceiptBuilder("ci_run").intent("test").build()
    ).toThrow("Receipt requires a subject");
  });

  it("throws when intent is missing", () => {
    expect(() =>
      new ReceiptBuilder("ci_run")
        .subject({ type: "repo", name: "test" })
        .build()
    ).toThrow("Receipt requires an intent");
  });

  it("supports fluent API for all fields", () => {
    const receipt = new ReceiptBuilder("audit")
      .subject({ type: "repository", name: "my-repo" })
      .intent("Security audit")
      .createdAt("2026-03-03T12:00:00.000Z")
      .input("scanner", "trivy")
      .inputs({ version: "0.50.0", args: "--severity HIGH" })
      .addOutput({ name: "report.json", digest: "sha256:def" })
      .addEvidence({
        type: "scan_result",
        url: "https://example.com/report",
        description: "Trivy scan output",
      })
      .addStep("Review the scan report")
      .addCommand("trivy fs --severity HIGH .")
      .environment({ runner: "ubuntu-latest", tool_versions: { trivy: "0.50.0" } })
      .toolVersion("node", "20.11.0")
      .policy({ redacted_fields: ["secrets"], required_checks: ["no-critical-vulns"] })
      .meta("auditor", "automated")
      .build();

    expect(receipt.inputs).toEqual({ scanner: "trivy", version: "0.50.0", args: "--severity HIGH" });
    expect(receipt.outputs).toHaveLength(1);
    expect(receipt.evidence).toHaveLength(1);
    expect(receipt.verification.steps).toEqual(["Review the scan report"]);
    expect(receipt.verification.commands).toEqual(["trivy fs --severity HIGH ."]);
    expect(receipt.environment.tool_versions).toEqual({ trivy: "0.50.0", node: "20.11.0" });
    expect(receipt.policy.redacted_fields).toEqual(["secrets"]);
    expect(receipt.metadata).toEqual({ auditor: "automated" });
  });

  it("produces deterministic ID for same inputs", () => {
    const build = () =>
      new ReceiptBuilder("ci_run")
        .subject({ type: "repo", name: "test" })
        .intent("test")
        .createdAt("2026-03-03T12:00:00.000Z")
        .build();

    expect(build().id).toBe(build().id);
  });
});
