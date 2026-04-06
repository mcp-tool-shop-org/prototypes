import { describe, it, expect } from "vitest";
import { assemble } from "../assemble.js";
import type { RegistrySyncEvidence } from "../types.js";

function makeEvidence(overrides?: Partial<RegistrySyncEvidence>): RegistrySyncEvidence {
  return {
    repository: "mcp-tool-shop-org/receipt-factory",
    registry: "npm",
    collected_at: "2026-03-03T12:00:00.000Z",
    packages: [
      { name: "@receipt-factory/core", localVersion: "1.7.0", publishedVersion: "1.6.0", inSync: false, registry: "npm" },
      { name: "@receipt-factory/verify", localVersion: "1.7.0", publishedVersion: "1.7.0", inSync: true, registry: "npm" },
      { name: "@receipt-factory/new", localVersion: "0.1.0", publishedVersion: null, inSync: false, registry: "npm" },
    ],
    summary: {
      total: 3,
      in_sync: 1,
      ahead: 1,
      behind: 0,
      unpublished: 1,
    },
    ...overrides,
  };
}

describe("registry-sync assemble", () => {
  it("produces a valid receipt from evidence", () => {
    const receipt = assemble(makeEvidence());

    expect(receipt.kind).toBe("registry_sync");
    expect(receipt.subject.name).toBe("mcp-tool-shop-org/receipt-factory");
    expect(receipt.intent).toContain("Registry sync check");
    expect(receipt.intent).toContain("npm");
    expect(receipt.id).toBeDefined();
    expect(receipt.integrity.digest).toBeDefined();
    expect(receipt.integrity.algorithm).toBe("sha256");
  });

  it("includes all packages as outputs", () => {
    const receipt = assemble(makeEvidence());
    expect(receipt.outputs.length).toBe(3);
    expect(receipt.outputs[0].name).toBe("@receipt-factory/core");
  });

  it("records drift summary in metadata", () => {
    const receipt = assemble(makeEvidence());
    expect(receipt.metadata?.in_sync).toBe(1);
    expect(receipt.metadata?.ahead).toBe(1);
    expect(receipt.metadata?.unpublished).toBe(1);
    expect(receipt.metadata?.pipeline).toBe("registry-sync");
  });

  it("handles all-in-sync case", () => {
    const receipt = assemble(makeEvidence({
      packages: [
        { name: "@receipt-factory/core", localVersion: "1.7.0", publishedVersion: "1.7.0", inSync: true, registry: "npm" },
      ],
      summary: { total: 1, in_sync: 1, ahead: 0, behind: 0, unpublished: 0 },
    }));

    expect(receipt.intent).toContain("all in sync");
  });

  it("has verification steps and commands", () => {
    const receipt = assemble(makeEvidence());
    expect(receipt.verification.steps.length).toBeGreaterThan(0);
    expect(receipt.verification.commands.length).toBeGreaterThan(0);
  });
});
