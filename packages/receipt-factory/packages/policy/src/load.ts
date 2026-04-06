import { readFileSync } from "node:fs";
import { RfError, computeDigest } from "@receipt-factory/core";
import type { PolicyPack, PolicyRules } from "./types.js";
import { DEFAULT_RULES } from "./defaults.js";

const REQUIRED_KEYS: (keyof PolicyRules)[] = [
  "intent_min_length",
  "require_verification_steps",
  "min_verification_steps",
  "require_verification_commands",
  "min_verification_commands",
  "require_evidence",
  "min_evidence",
  "require_context",
  "require_subject_url",
  "require_required_checks",
  "require_references",
];

/**
 * Load and validate a policy pack from a JSON file.
 * Missing rule keys are filled from defaults.
 */
export function loadPolicy(path: string): PolicyPack {
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch (err) {
    throw new RfError({
      code: "IO_READ",
      message: `Failed to read policy file: ${path}`,
      hint: "Check that the policy file exists and is readable",
      cause: err instanceof Error ? err : undefined,
    });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    throw new RfError({
      code: "CONFIG_PARSE",
      message: `Policy file is not valid JSON: ${path}`,
      hint: "Check the policy file for syntax errors",
      cause: err instanceof Error ? err : undefined,
    });
  }

  if (parsed.policy_version !== "1.0") {
    throw new RfError({
      code: "CONFIG_VERSION",
      message: `Unsupported policy version: ${String(parsed.policy_version)}`,
      hint: "Policy files must have policy_version: \"1.0\"",
    });
  }

  if (typeof parsed.name !== "string" || parsed.name.length === 0) {
    throw new RfError({
      code: "CONFIG_PARSE",
      message: "Policy file is missing a name",
      hint: "Add a \"name\" field to the policy file",
    });
  }

  const rawRules = (parsed.rules ?? {}) as Record<string, unknown>;
  const rules: PolicyRules = { ...DEFAULT_RULES };

  // Apply overrides from the policy file
  for (const key of REQUIRED_KEYS) {
    if (key in rawRules) {
      (rules as unknown as Record<string, unknown>)[key] = rawRules[key];
    }
  }

  return {
    policy_version: "1.0",
    name: parsed.name as string,
    description: (parsed.description as string) ?? "",
    rules,
  };
}

/**
 * Compute a deterministic hash of policy rules.
 * Uses the same canonical JSON + SHA-256 as receipt content addressing.
 * This hash is embedded in receipts via policy_identity.hash.
 */
export function computePolicyHash(rules: PolicyRules): string {
  return computeDigest(rules);
}
