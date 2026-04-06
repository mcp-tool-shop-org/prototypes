import type { VerificationCheck } from "./types.js";

/**
 * Configurable lint rules for receipt quality checks.
 * Re-declared here to avoid a hard dependency on @receipt-factory/policy.
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

const DEFAULT_RULES: PolicyRules = {
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

interface LintableReceipt {
  intent?: string;
  verification?: { steps?: string[]; commands?: string[] };
  evidence?: Array<{ type?: string; url?: string; description?: string }>;
  metadata?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  subject?: { url?: string; name?: string };
  policy?: { required_checks?: string[] };
  references?: unknown[];
}

/**
 * Lint checks for receipt quality — human-surface field completeness.
 * These don't check structural validity (that's schema-check), they check
 * whether the receipt is *useful* for a human reader.
 *
 * When rules is undefined, uses built-in defaults (backward compat).
 * Only run in --strict mode.
 */
export function checkLint(
  receipt: Record<string, unknown>,
  rules?: PolicyRules,
): VerificationCheck[] {
  const r = receipt as unknown as LintableReceipt;
  const p = rules ?? DEFAULT_RULES;
  const checks: VerificationCheck[] = [];

  // 1. Intent is meaningful (not just "test" or empty-ish)
  const intent = r.intent ?? "";
  if (intent.length < p.intent_min_length) {
    checks.push({
      name: "lint:intent",
      passed: false,
      message: `Intent is too short (${intent.length} chars, minimum ${p.intent_min_length})`,
      details: { intent },
    });
  } else {
    checks.push({
      name: "lint:intent",
      passed: true,
      message: "Intent is descriptive",
    });
  }

  // 2. Verification steps
  const steps = r.verification?.steps ?? [];
  if (p.require_verification_steps && steps.length < p.min_verification_steps) {
    checks.push({
      name: "lint:verification_steps",
      passed: false,
      message:
        steps.length === 0
          ? "No verification steps — readers won't know how to verify this"
          : `Too few verification steps (${steps.length}, minimum ${p.min_verification_steps})`,
    });
  } else {
    checks.push({
      name: "lint:verification_steps",
      passed: true,
      message: `${steps.length} verification step(s)`,
    });
  }

  // 3. Verification commands
  const commands = r.verification?.commands ?? [];
  if (p.require_verification_commands && commands.length < p.min_verification_commands) {
    checks.push({
      name: "lint:verification_commands",
      passed: false,
      message:
        commands.length === 0
          ? "No verification commands — there should be at least one runnable command"
          : `Too few verification commands (${commands.length}, minimum ${p.min_verification_commands})`,
    });
  } else {
    checks.push({
      name: "lint:verification_commands",
      passed: true,
      message: `${commands.length} verification command(s)`,
    });
  }

  // 4. Evidence entries
  const evidence = r.evidence ?? [];
  if (p.require_evidence && evidence.length < p.min_evidence) {
    checks.push({
      name: "lint:evidence",
      passed: false,
      message:
        evidence.length === 0
          ? "No evidence — receipts should link to verifiable sources"
          : `Too few evidence entries (${evidence.length}, minimum ${p.min_evidence})`,
    });
  } else {
    checks.push({
      name: "lint:evidence",
      passed: true,
      message: `${evidence.length} evidence link(s)`,
    });
  }

  // 5. Has metadata or meaningful inputs
  if (p.require_context) {
    const hasMetadata =
      r.metadata != null && Object.keys(r.metadata).length > 0;
    const hasInputs = r.inputs != null && Object.keys(r.inputs).length > 0;
    if (!hasMetadata && !hasInputs) {
      checks.push({
        name: "lint:context",
        passed: false,
        message:
          "No metadata or inputs — receipts should include context about how they were produced",
      });
    } else {
      checks.push({
        name: "lint:context",
        passed: true,
        message: "Receipt has contextual metadata or inputs",
      });
    }
  }

  // 6. Subject has a URL (not just a name)
  if (p.require_subject_url) {
    if (!r.subject?.url) {
      checks.push({
        name: "lint:subject_url",
        passed: false,
        message:
          "Subject has no URL — readers should be able to navigate to the subject",
      });
    } else {
      checks.push({
        name: "lint:subject_url",
        passed: true,
        message: "Subject has a URL",
      });
    }
  }

  // 7. Policy has required checks
  if (p.require_required_checks) {
    const requiredChecks = r.policy?.required_checks ?? [];
    if (requiredChecks.length === 0) {
      checks.push({
        name: "lint:required_checks",
        passed: false,
        message:
          "No required_checks in policy — declare what checks must pass for this receipt to be trusted",
      });
    } else {
      checks.push({
        name: "lint:required_checks",
        passed: true,
        message: `${requiredChecks.length} required check(s) declared`,
      });
    }
  }

  // 8. References (only checked when policy requires them)
  if (p.require_references) {
    const refs = r.references ?? [];
    if (refs.length === 0) {
      checks.push({
        name: "lint:references",
        passed: false,
        message: "No references — policy requires receipts to cite related receipts",
      });
    } else {
      checks.push({
        name: "lint:references",
        passed: true,
        message: `${refs.length} reference(s)`,
      });
    }
  }

  return checks;
}
