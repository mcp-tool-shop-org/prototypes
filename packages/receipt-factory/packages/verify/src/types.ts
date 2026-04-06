/**
 * A single verification check result.
 */
export interface VerificationCheck {
  name: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

/**
 * Full verification result for a receipt.
 */
export interface VerificationResult {
  receipt_id: string;
  valid: boolean;
  checks: VerificationCheck[];
  summary: string;
}
