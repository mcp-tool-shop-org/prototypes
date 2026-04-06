import { checkSchema } from "./schema-check.js";
import { checkHash } from "./hash-check.js";
import { checkLinks } from "./link-check.js";
import { checkLint } from "./lint-check.js";
import { checkReferences } from "./ref-check.js";
import { checkPolicyIntegrity } from "./policy-check.js";
import { buildResult, formatResult } from "./report.js";
import type { VerificationResult } from "./types.js";
import type { PolicyRules } from "./lint-check.js";

export type { VerificationCheck, VerificationResult } from "./types.js";
export { checkSchema } from "./schema-check.js";
export { checkHash } from "./hash-check.js";
export { checkLinks } from "./link-check.js";
export { checkLint } from "./lint-check.js";
export { checkReferences } from "./ref-check.js";
export type { RefCheckOptions } from "./ref-check.js";
export { checkPolicyIntegrity } from "./policy-check.js";
export { buildResult, formatResult } from "./report.js";

export interface VerifyOptions {
  offline?: boolean;
  strict?: boolean;
  /** Recursively verify referenced receipts. */
  follow?: boolean;
  /** Strict references: missing or unreadable refs fail verification. */
  refsStrict?: boolean;
  /** Custom lint rules (from a policy pack). */
  policy?: PolicyRules;
  /** Directory for resolving reference paths. */
  receiptsDir?: string;
}

/**
 * Run all verification checks on a receipt.
 * In strict mode, lint checks are included and can fail the receipt.
 * In follow mode, referenced receipts are verified too.
 */
export async function verifyReceipt(
  receipt: Record<string, unknown>,
  opts: VerifyOptions = {},
): Promise<VerificationResult> {
  const receiptId = (receipt.id as string) ?? "unknown";

  const checks = [
    checkSchema(receipt),
    ...checkHash(receipt),
    await checkLinks(receipt, opts),
  ];

  if (opts.strict) {
    checks.push(...checkLint(receipt, opts.policy));
  }

  // Policy integrity: always check if receipt has policy_identity
  checks.push(...checkPolicyIntegrity(receipt, { suppliedRules: opts.policy }));

  if (opts.follow || (receipt.references as unknown[])?.length) {
    const refChecks = await checkReferences(receipt, {
      follow: opts.follow,
      receiptsDir: opts.receiptsDir,
      refsStrict: opts.refsStrict,
    });
    checks.push(...refChecks);
  }

  return buildResult(receiptId, checks);
}

/**
 * Run all checks and return formatted CLI text.
 */
export async function verifyAndFormat(
  receipt: Record<string, unknown>,
  opts: VerifyOptions = {},
): Promise<string> {
  const result = await verifyReceipt(receipt, opts);
  return formatResult(result);
}
