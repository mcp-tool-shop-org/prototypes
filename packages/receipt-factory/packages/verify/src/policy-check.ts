import { computeDigest } from "@receipt-factory/core";
import type { VerificationCheck } from "./types.js";

/**
 * Policy rules type — re-declared to avoid hard dep on rf-policy.
 */
interface PolicyRules {
  intent_min_length: number;
  require_verification_steps: boolean;
  min_verification_steps: number;
  require_verification_commands: boolean;
  min_verification_commands: number;
  require_evidence: boolean;
  min_evidence: number;
  require_context: boolean;
  require_subject_url: boolean;
  require_required_checks: boolean;
  require_references: boolean;
}

interface PolicyIdentity {
  hash: string;
  version?: string;
  path?: string;
  signed?: boolean;
  signatureRef?: string;
}

export interface PolicyCheckOptions {
  /** The policy rules supplied at verify time (via --policy). */
  suppliedRules?: PolicyRules;
}

/**
 * Verify that the receipt's embedded policy hash matches the supplied policy.
 *
 * Semantics:
 * - If receipt has no policy_identity → skip (backward compatible).
 * - If receipt has policy_identity.hash but no policy supplied → info (not a failure).
 * - If receipt has policy_identity.hash and policy is supplied → compare hashes.
 *   Mismatch = fail (this is integrity, not lint quality).
 */
export function checkPolicyIntegrity(
  receipt: Record<string, unknown>,
  opts: PolicyCheckOptions = {},
): VerificationCheck[] {
  const identity = receipt.policy_identity as PolicyIdentity | undefined;

  if (!identity?.hash) {
    return [];
  }

  if (!opts.suppliedRules) {
    return [
      {
        name: "policy:identity",
        passed: true,
        message: `Receipt declares policy hash ${identity.hash.slice(0, 16)}… but no --policy supplied to compare`,
      },
    ];
  }

  const suppliedHash = computeDigest(opts.suppliedRules);

  if (suppliedHash !== identity.hash) {
    return [
      {
        name: "policy:integrity",
        passed: false,
        message: "Policy hash mismatch: receipt was linted under a different policy",
        details: {
          receiptPolicyHash: identity.hash,
          suppliedPolicyHash: suppliedHash,
        },
      },
    ];
  }

  return [
    {
      name: "policy:integrity",
      passed: true,
      message: `Policy hash verified: ${suppliedHash.slice(0, 16)}…`,
    },
  ];
}
