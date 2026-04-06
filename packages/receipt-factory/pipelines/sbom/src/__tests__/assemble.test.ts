import { describe, it, expect } from "vitest";
import { assemble } from "../assemble.js";
import type { SbomEvidence } from "../types.js";

function makeEvidence(overrides?: Partial<SbomEvidence>): SbomEvidence {
  return {
    subject: "mcp-tool-shop-org/receipt-factory",
    collected_at: "2026-03-03T12:00:00.000Z",
    ref: "v1.7.0",
    format: "cyclonedx",
    spec_version: "1.5",
    digest: "abc123def456",
    filename: "sbom.cdx.json",
    size_bytes: 45000,
    component_count: 127,
    generator: { name: "cdxgen", version: "10.0.0" },
    inputs: {
      lockfile_digest: "sha256:lock123",
      package_manifest_digest: "sha256:pkg456",
    },
    ...overrides,
  };
}

describe("sbom assemble", () => {
  it("produces a valid receipt from evidence", () => {
    const receipt = assemble(makeEvidence());

    expect(receipt.kind).toBe("sbom");
    expect(receipt.subject.name).toBe("mcp-tool-shop-org/receipt-factory");
    expect(receipt.subject.ref).toBe("v1.7.0");
    expect(receipt.intent).toContain("SBOM generated");
    expect(receipt.intent).toContain("cyclonedx");
    expect(receipt.intent).toContain("127 components");
    expect(receipt.id).toBeDefined();
    expect(receipt.integrity.digest).toBeDefined();
  });

  it("includes SBOM file as output", () => {
    const receipt = assemble(makeEvidence());
    expect(receipt.outputs.length).toBe(1);
    expect(receipt.outputs[0].name).toBe("sbom.cdx.json");
    expect(receipt.outputs[0].digest).toBe("sha256:abc123def456");
    expect(receipt.outputs[0].size).toBe(45000);
  });

  it("records SBOM metadata", () => {
    const receipt = assemble(makeEvidence());
    expect(receipt.metadata?.sbom_format).toBe("cyclonedx");
    expect(receipt.metadata?.sbom_spec_version).toBe("1.5");
    expect(receipt.metadata?.sbom_digest).toBe("abc123def456");
    expect(receipt.metadata?.component_count).toBe(127);
    expect(receipt.metadata?.pipeline).toBe("sbom");
  });

  it("records generator in environment", () => {
    const receipt = assemble(makeEvidence());
    expect(receipt.environment.tool_versions["cdxgen"]).toBe("10.0.0");
  });

  it("works with SPDX format", () => {
    const receipt = assemble(makeEvidence({
      format: "spdx",
      spec_version: "2.3",
      filename: "sbom.spdx.json",
    }));

    expect(receipt.intent).toContain("spdx");
    expect(receipt.outputs[0].name).toBe("sbom.spdx.json");
    expect(receipt.metadata?.sbom_format).toBe("spdx");
  });

  it("handles missing inputs gracefully", () => {
    const receipt = assemble(makeEvidence({ inputs: undefined }));
    expect(receipt.inputs.lockfile_digest).toBe("not captured");
    expect(receipt.inputs.package_manifest_digest).toBe("not captured");
  });
});
