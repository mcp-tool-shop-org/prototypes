import { describe, it, expect, beforeEach } from "vitest";
import { AttestationPipeline } from "../src/sdk/attestation.js";
import type { AttestationOptions } from "../src/sdk/attestation.js";

function makeOptions(overrides: Partial<AttestationOptions> = {}): AttestationOptions {
  return {
    provenance: {
      commitSha: "abc123def456",
      ref: "refs/heads/main",
      repository: "https://github.com/org/repo",
      ciSystem: "github-actions",
      runId: "run-42",
      builder: "ci-machine-1",
      builtAt: new Date().toISOString(),
    },
    artifacts: [
      { name: "app.tar.gz", sha256: "aabbccdd", sizeBytes: 1024000, contentType: "application/gzip" },
      { name: "app.exe", sha256: "eeff0011", sizeBytes: 2048000 },
    ],
    ...overrides,
  };
}

describe("AttestationPipeline", () => {
  let pipeline: AttestationPipeline;

  beforeEach(() => {
    pipeline = new AttestationPipeline();
  });

  it("creates an attestation with provenance and artifacts", () => {
    const att = pipeline.attest(makeOptions());

    expect(att.id).toContain("att-");
    expect(att.schemaVersion).toBe("1.0.0");
    expect(att.provenance.commitSha).toBe("abc123def456");
    expect(att.artifacts).toHaveLength(2);
    expect(att.signature).toBeDefined();
    expect(att.signature).toHaveLength(64); // SHA-256 hex
    expect(att.verified).toBe(false);
  });

  it("verifies a valid attestation", () => {
    const att = pipeline.attest(makeOptions());
    const result = pipeline.verify(att.id);
    expect(result.valid).toBe(true);
    expect(att.verified).toBe(true);
  });

  it("returns invalid for unknown attestation", () => {
    const result = pipeline.verify("nonexistent");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("not found");
  });

  it("verifies artifact checksums", () => {
    const att = pipeline.attest(makeOptions());

    const valid = pipeline.verifyArtifact(att.id, "app.tar.gz", "aabbccdd");
    expect(valid.valid).toBe(true);

    const mismatch = pipeline.verifyArtifact(att.id, "app.tar.gz", "wrong-hash");
    expect(mismatch.valid).toBe(false);
    expect(mismatch.reason).toContain("mismatch");
  });

  it("returns invalid for unknown artifact name", () => {
    const att = pipeline.attest(makeOptions());
    const result = pipeline.verifyArtifact(att.id, "missing.zip", "abc");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("not in attestation");
  });

  it("lists and retrieves attestations", () => {
    const att1 = pipeline.attest(makeOptions());
    const att2 = pipeline.attest(makeOptions({ provenance: { ...makeOptions().provenance, commitSha: "xyz789" } }));

    expect(pipeline.list()).toHaveLength(2);
    expect(pipeline.get(att1.id)?.id).toBe(att1.id);
  });

  it("finds attestations by commit SHA", () => {
    pipeline.attest(makeOptions({ provenance: { ...makeOptions().provenance, commitSha: "aaa111" } }));
    pipeline.attest(makeOptions({ provenance: { ...makeOptions().provenance, commitSha: "bbb222" } }));
    pipeline.attest(makeOptions({ provenance: { ...makeOptions().provenance, commitSha: "aaa111" } }));

    expect(pipeline.byCommit("aaa111")).toHaveLength(2);
    expect(pipeline.byCommit("bbb222")).toHaveLength(1);
    expect(pipeline.byCommit("ccc333")).toHaveLength(0);
  });

  it("records approvedBy", () => {
    const att = pipeline.attest(makeOptions({ approvedBy: "admin@example.com" }));
    expect(att.approvedBy).toBe("admin@example.com");
  });

  it("attestations are deterministic (same input = same signature)", () => {
    const opts = makeOptions();
    const att1 = pipeline.attest(opts);
    const att2 = pipeline.attest(opts);

    expect(att1.signature).toBe(att2.signature);
    expect(att1.id).not.toBe(att2.id); // But IDs differ
  });

  it("clears all attestations", () => {
    pipeline.attest(makeOptions());
    pipeline.attest(makeOptions());
    expect(pipeline.list()).toHaveLength(2);

    pipeline.clear();
    expect(pipeline.list()).toHaveLength(0);
  });
});
