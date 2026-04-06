import { describe, it, expect } from "vitest";
import { computeDigest, computeIntegrity, verifyIntegrity } from "../hash.js";

describe("computeDigest", () => {
  it("returns a 64-char hex string (SHA-256)", () => {
    const digest = computeDigest({ test: true });
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces same hash for same input", () => {
    const obj = { a: 1, b: 2 };
    expect(computeDigest(obj)).toBe(computeDigest(obj));
  });

  it("produces same hash regardless of key order", () => {
    expect(computeDigest({ a: 1, b: 2 })).toBe(computeDigest({ b: 2, a: 1 }));
  });

  it("produces different hash for different input", () => {
    expect(computeDigest({ a: 1 })).not.toBe(computeDigest({ a: 2 }));
  });
});

describe("computeIntegrity", () => {
  it("returns algorithm and digest", () => {
    const integrity = computeIntegrity({ test: true });
    expect(integrity.algorithm).toBe("sha256");
    expect(integrity.digest).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("verifyIntegrity", () => {
  it("returns true for untampered receipt", () => {
    const draft = { kind: "ci_run", intent: "test" };
    const integrity = computeIntegrity(draft);
    const id = computeDigest(draft);
    const receipt = { ...draft, id, integrity };
    expect(verifyIntegrity(receipt)).toBe(true);
  });

  it("returns false for tampered receipt", () => {
    const draft = { kind: "ci_run", intent: "test" };
    const integrity = computeIntegrity(draft);
    const id = computeDigest(draft);
    const receipt = { ...draft, id, integrity, intent: "tampered" };
    expect(verifyIntegrity(receipt)).toBe(false);
  });

  it("returns false when integrity is missing", () => {
    expect(verifyIntegrity({ kind: "ci_run" })).toBe(false);
  });
});
