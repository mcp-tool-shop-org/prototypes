import { safeValidateReceipt } from "@receipt-factory/core";
import type { VerificationCheck } from "./types.js";

/**
 * Validate receipt against the Zod schema.
 */
export function checkSchema(data: unknown): VerificationCheck {
  const result = safeValidateReceipt(data);

  if (result.success) {
    return {
      name: "schema",
      passed: true,
      message: "Receipt matches schema v1.0.0",
    };
  }

  const issues = result.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");

  return {
    name: "schema",
    passed: false,
    message: `Schema validation failed: ${issues}`,
    details: result.error.issues,
  };
}
