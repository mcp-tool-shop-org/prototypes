import type { VerificationCheck, VerificationResult } from "./types.js";

/**
 * Build a verification result from individual checks.
 */
export function buildResult(
  receiptId: string,
  checks: VerificationCheck[],
): VerificationResult {
  const valid = checks.every((c) => c.passed);
  const passed = checks.filter((c) => c.passed).length;
  const total = checks.length;

  const summary = valid
    ? `All ${total} checks passed for receipt ${receiptId.slice(0, 12)}…`
    : `${passed}/${total} checks passed for receipt ${receiptId.slice(0, 12)}… — VERIFICATION FAILED`;

  return { receipt_id: receiptId, valid, checks, summary };
}

/**
 * Format a verification result for CLI output.
 */
export function formatResult(result: VerificationResult): string {
  const lines: string[] = [];

  const icon = result.valid ? "\u2705" : "\u274C";
  lines.push(`${icon} ${result.summary}`);
  lines.push("");

  for (const check of result.checks) {
    const mark = check.passed ? "\u2714" : "\u2718";
    lines.push(`  ${mark} ${check.name}: ${check.message}`);
  }

  return lines.join("\n");
}
