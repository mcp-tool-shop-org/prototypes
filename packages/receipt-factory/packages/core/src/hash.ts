import { createHash } from "node:crypto";
import { canonicalize } from "./canonical.js";
import type { ReceiptIntegrity } from "./types.js";

/**
 * Compute the SHA-256 digest of a canonicalized object.
 * This is the content-addressing mechanism for receipts.
 */
export function computeDigest(obj: unknown): string {
  const canonical = canonicalize(obj);
  return createHash("sha256").update(canonical, "utf-8").digest("hex");
}

/**
 * Build integrity metadata for a receipt draft.
 * The draft must NOT include `id` or `integrity` fields —
 * those are computed by this function.
 */
export function computeIntegrity(draft: Record<string, unknown>): ReceiptIntegrity {
  const canonical = canonicalize(draft);
  const digest = createHash("sha256").update(canonical, "utf-8").digest("hex");
  const canonical_length_bytes = Buffer.byteLength(canonical, "utf-8");
  return {
    algorithm: "sha256",
    digest,
    canonical_format_version: "1.0",
    canonical_length_bytes,
  };
}

/**
 * Verify that a receipt's integrity digest matches its content.
 * Returns true if the recomputed hash matches the stored digest.
 */
export function verifyIntegrity(receipt: Record<string, unknown>): boolean {
  const { id: _id, integrity: storedIntegrity, ...draft } = receipt;
  const stored = storedIntegrity as ReceiptIntegrity | undefined;
  if (!stored?.digest) return false;

  const recomputed = computeDigest(draft);
  return recomputed === stored.digest;
}
