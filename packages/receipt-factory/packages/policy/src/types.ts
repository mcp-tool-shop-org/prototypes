/**
 * Configurable lint rules for receipt quality checks.
 * Each field controls a specific check in the lint pipeline.
 */
export interface PolicyRules {
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

/**
 * A policy pack — a portable, versioned lint configuration.
 * Orgs define these so all receipts meet the same quality bar.
 */
export interface PolicyPack {
  policy_version: "1.0";
  name: string;
  description: string;
  rules: PolicyRules;
}
