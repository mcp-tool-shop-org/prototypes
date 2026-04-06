import { verifyIntegrity, canonicalize } from "@receipt-factory/core";
import type { VerificationCheck } from "./types.js";

interface IntegrityBlock {
  digest?: string;
  canonical_format_version?: string;
  canonical_length_bytes?: number;
}

/**
 * Recompute the canonical hash and compare to stored digest.
 * Also verifies trust spine fields (format version + byte length).
 */
export function checkHash(
  receipt: Record<string, unknown>,
): VerificationCheck[] {
  const integrity = receipt.integrity as IntegrityBlock | undefined;
  const checks: VerificationCheck[] = [];

  // 1. Digest check
  if (!integrity?.digest) {
    checks.push({
      name: "hash",
      passed: false,
      message: "No integrity digest found in receipt",
    });
    return checks;
  }

  const valid = verifyIntegrity(receipt);
  checks.push(
    valid
      ? {
          name: "hash",
          passed: true,
          message: `Hash verified: ${integrity.digest}`,
        }
      : {
          name: "hash",
          passed: false,
          message:
            "Hash mismatch — receipt content has been modified since creation",
          details: { stored_digest: integrity.digest },
        },
  );

  // 2. Format version check
  if (integrity.canonical_format_version) {
    if (integrity.canonical_format_version === "1.0") {
      checks.push({
        name: "format_version",
        passed: true,
        message: "Canonical format version: 1.0",
      });
    } else {
      checks.push({
        name: "format_version",
        passed: false,
        message: `Unknown canonical format version: ${integrity.canonical_format_version}`,
        details: {
          expected: "1.0",
          actual: integrity.canonical_format_version,
        },
      });
    }
  }

  // 3. Byte length check
  if (
    integrity.canonical_length_bytes != null &&
    integrity.canonical_length_bytes > 0
  ) {
    const { id: _id, integrity: _integrity, ...draft } = receipt;
    const canonical = canonicalize(draft);
    const actualBytes = Buffer.byteLength(canonical, "utf-8");

    if (actualBytes === integrity.canonical_length_bytes) {
      checks.push({
        name: "byte_length",
        passed: true,
        message: `Canonical byte length verified: ${actualBytes}`,
      });
    } else {
      checks.push({
        name: "byte_length",
        passed: false,
        message: "Canonical byte length mismatch — possible truncation",
        details: {
          expected: integrity.canonical_length_bytes,
          actual: actualBytes,
        },
      });
    }
  }

  return checks;
}
