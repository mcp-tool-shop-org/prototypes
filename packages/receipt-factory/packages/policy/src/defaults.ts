import type { PolicyPack, PolicyRules } from "./types.js";

/**
 * Default policy rules — matches the hard-coded lint-check.ts behavior.
 */
export const DEFAULT_RULES: PolicyRules = {
  intent_min_length: 10,
  require_verification_steps: true,
  min_verification_steps: 1,
  require_verification_commands: true,
  min_verification_commands: 1,
  require_evidence: true,
  min_evidence: 1,
  require_context: true,
  require_subject_url: true,
  require_required_checks: true,
  require_references: false,
};

/**
 * Default policy pack — the built-in quality baseline.
 */
export const DEFAULT_POLICY: PolicyPack = {
  policy_version: "1.0",
  name: "default",
  description: "Default quality policy for receipt-factory receipts",
  rules: DEFAULT_RULES,
};
