/**
 * classifyGuidance.ts
 *
 * Deterministic guidance classifier for CommandUI plans.
 * Takes a CommandPlan and returns structured guidance data:
 * impact areas, pre-flight checks, risk explanation, and caution notes.
 *
 * No AI/LLM calls — pure pattern matching on plan properties and command text.
 */

export type ImpactArea = {
  label: string;
  detail: string;
  severity: "info" | "warn" | "danger";
};

export type PreFlightCheck = {
  id: string;
  label: string;
  checked: boolean;
};

export type GuidanceResult = {
  riskExplanation: string;
  impactAreas: ImpactArea[];
  preFlightChecks: PreFlightCheck[];
  cautions: string[];
  /** True if guidance has enough signal to be worth showing */
  hasGuidance: boolean;
};

type PlanInput = {
  command: string;
  risk: "low" | "medium" | "high";
  destructive: boolean;
  touchesFiles: boolean;
  touchesNetwork: boolean;
  escalatesPrivileges: boolean;
  assumptions: string[];
  explanation: string;
  source: "raw" | "semantic";
};

const RISK_EXPLANATIONS: Record<string, string> = {
  low: "This command performs read-only or routine operations with minimal side effects.",
  medium:
    "This command modifies state or resources. Review the proposed changes before running.",
  high: "This command performs destructive or irreversible operations. Careful review is suggested before execution.",
};

/** Patterns that suggest specific file operations */
const FILE_DESTRUCTIVE_PATTERNS = [
  /\brm\s/,
  /\brmdir\b/,
  /\bdel\b/,
  /\bunlink\b/,
  /\bshred\b/,
  /\btruncate\b/,
  />\s*\//,        // redirect overwrite to absolute path
  /\bmv\b/,
  /\bformat\b/,
];

const NETWORK_PATTERNS = [
  /\bcurl\b/,
  /\bwget\b/,
  /\bssh\b/,
  /\bscp\b/,
  /\brsync\b.*:/,
  /\bnpm\s+publish\b/,
  /\bgit\s+push\b/,
  /\bdocker\s+push\b/,
];

const PRIVILEGE_PATTERNS = [
  /\bsudo\b/,
  /\bdoas\b/,
  /\brunas\b/,
  /\bchmod\b/,
  /\bchown\b/,
  /\bchgrp\b/,
];

const PACKAGE_PATTERNS = [
  /\bnpm\s+(install|uninstall|update)\b/,
  /\bpip\s+install\b/,
  /\bapt\s+(install|remove|purge)\b/,
  /\bbrew\s+(install|uninstall)\b/,
  /\bcargo\s+install\b/,
];

const GIT_DESTRUCTIVE_PATTERNS = [
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+push\s+--force\b/,
  /\bgit\s+push\s+-f\b/,
  /\bgit\s+clean\s+-f/,
  /\bgit\s+checkout\s+--\s/,
  /\bgit\s+branch\s+-D\b/,
];

export function classifyGuidance(plan: PlanInput): GuidanceResult {
  // Only show guidance for semantic plans
  if (plan.source !== "semantic") {
    return {
      riskExplanation: "",
      impactAreas: [],
      preFlightChecks: [],
      cautions: [],
      hasGuidance: false,
    };
  }

  const cmd = plan.command;
  const impactAreas: ImpactArea[] = [];
  const preFlightChecks: PreFlightCheck[] = [];
  const cautions: string[] = [];

  // --- Impact areas ---

  if (plan.touchesFiles) {
    const isDestructiveFile = FILE_DESTRUCTIVE_PATTERNS.some((p) => p.test(cmd));
    impactAreas.push({
      label: "Filesystem",
      detail: isDestructiveFile
        ? "Proposed command removes or overwrites files"
        : "Proposed command reads or modifies files",
      severity: isDestructiveFile ? "danger" : "warn",
    });

    if (isDestructiveFile) {
      preFlightChecks.push({
        id: "backup-check",
        label: "Verify backup exists or files are recoverable",
        checked: false,
      });
    }

    preFlightChecks.push({
      id: "path-check",
      label: "Verify target path is correct",
      checked: false,
    });
  }

  if (plan.touchesNetwork) {
    const isPublish = NETWORK_PATTERNS.some((p) => p.test(cmd));
    impactAreas.push({
      label: "Network",
      detail: isPublish
        ? "Proposed command sends data to a remote service"
        : "Proposed command accesses the network",
      severity: isPublish ? "warn" : "info",
    });

    preFlightChecks.push({
      id: "network-check",
      label: "Verify network target and credentials",
      checked: false,
    });
  }

  if (plan.escalatesPrivileges) {
    impactAreas.push({
      label: "Privileges",
      detail: "Proposed command runs with elevated permissions",
      severity: "danger",
    });

    preFlightChecks.push({
      id: "privilege-check",
      label: "Confirm elevated access is intended",
      checked: false,
    });
  }

  // --- Pattern-based detection for areas not covered by plan flags ---

  const hasGitDestructive = GIT_DESTRUCTIVE_PATTERNS.some((p) => p.test(cmd));
  if (hasGitDestructive) {
    impactAreas.push({
      label: "Git History",
      detail: "Proposed command may discard commits or rewrite history",
      severity: "danger",
    });

    preFlightChecks.push({
      id: "git-check",
      label: "Verify current branch and stash any uncommitted work",
      checked: false,
    });
  }

  const hasPackageOp = PACKAGE_PATTERNS.some((p) => p.test(cmd));
  if (hasPackageOp) {
    impactAreas.push({
      label: "Dependencies",
      detail: "Proposed command modifies installed packages",
      severity: "warn",
    });

    preFlightChecks.push({
      id: "deps-check",
      label: "Review package names and versions",
      checked: false,
    });
  }

  // Detect privilege escalation from command text even if flag is not set
  if (!plan.escalatesPrivileges && PRIVILEGE_PATTERNS.some((p) => p.test(cmd))) {
    impactAreas.push({
      label: "Privileges",
      detail: "Proposed command may modify permissions or ownership",
      severity: "warn",
    });
  }

  // --- Cautions from plan properties ---

  if (plan.destructive) {
    cautions.push(
      "This command is flagged as destructive. Changes may not be reversible.",
    );
  }

  if (plan.risk === "high" && plan.assumptions.length > 0) {
    cautions.push(
      "The suggested plan includes assumptions that should be verified.",
    );
  }

  // --- Risk explanation ---

  const riskExplanation = RISK_EXPLANATIONS[plan.risk] ?? "";

  const hasGuidance =
    impactAreas.length > 0 ||
    preFlightChecks.length > 0 ||
    cautions.length > 0 ||
    plan.risk !== "low";

  return {
    riskExplanation,
    impactAreas,
    preFlightChecks,
    cautions,
    hasGuidance,
  };
}
