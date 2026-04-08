import type { TastePack, TasteViolation } from "@taste-compiler/core";

/**
 * Extracted interaction pattern from a target app.
 * Each entry represents a UI interaction point that may be subject to interaction laws.
 */
export interface ExtractedInteraction {
  file: string;
  line: number;
  snippet: string;
  /** What kind of interaction this is. */
  kind:
    | "destructive-action"
    | "form-submit"
    | "navigation"
    | "empty-state";
  /** Whether a confirmation guard is present (relevant for destructive-action). */
  hasConfirmation?: boolean;
  /** Whether form validation gates the submit (relevant for form-submit). */
  hasValidationGate?: boolean;
  /** Whether draft state is preserved on navigate-away (relevant for navigation). */
  hasDraftPreservation?: boolean;
  /** Whether the empty state has a primary action/CTA (relevant for empty-state). */
  hasPrimaryAction?: boolean;
}

/**
 * Map from compiled law IDs to the builtin rule IDs they enforce.
 */
const LAW_ID_TO_RULE: Record<string, string> = {
  "law-destructive-confirm": "LAW-001",
  "law-submit-validation": "LAW-002",
  "law-draft-preservation": "LAW-003",
  "law-empty-state": "LAW-004",
};

/**
 * Map from interaction kinds to the law IDs they can violate.
 */
const KIND_TO_LAW: Record<ExtractedInteraction["kind"], string> = {
  "destructive-action": "law-destructive-confirm",
  "form-submit": "law-submit-validation",
  "navigation": "law-draft-preservation",
  "empty-state": "law-empty-state",
};

/**
 * For each kind, which boolean field must be true to satisfy the law.
 */
const KIND_TO_GUARD: Record<
  ExtractedInteraction["kind"],
  keyof ExtractedInteraction
> = {
  "destructive-action": "hasConfirmation",
  "form-submit": "hasValidationGate",
  "navigation": "hasDraftPreservation",
  "empty-state": "hasPrimaryAction",
};

/**
 * Check interaction law violations.
 *
 * Each extracted interaction is matched against the pack's compiled interaction laws.
 * A violation fires when the interaction's kind maps to an active law and the
 * required guard is missing (falsy).
 */
export function checkLawViolations(
  pack: TastePack,
  interactions: ExtractedInteraction[]
): TasteViolation[] {
  const violations: TasteViolation[] = [];
  const laws = pack.artifacts.interactionLaws;

  // Index active laws by their compiled ID for fast lookup
  const activeLaws = new Map(laws.map((l) => [l.id, l]));

  for (const interaction of interactions) {
    const lawId = KIND_TO_LAW[interaction.kind];
    const law = activeLaws.get(lawId);
    if (!law) continue; // law not active in this pack

    const guardField = KIND_TO_GUARD[interaction.kind];
    const guardPresent = interaction[guardField];

    if (!guardPresent) {
      const ruleId = LAW_ID_TO_RULE[lawId] ?? lawId;

      violations.push({
        id: `law-${interaction.kind}-${interaction.file}-${interaction.line}`,
        severity: law.severity,
        class: "interaction-law",
        ruleId,
        message: `${law.law}: missing guard in ${interaction.file}`,
        rationale: law.rationale ?? law.law,
        evidence: [
          {
            file: interaction.file,
            line: interaction.line,
            snippet: interaction.snippet,
            value: interaction.kind,
          },
        ],
        suggestedFix: getSuggestedFix(interaction.kind),
      });
    }
  }

  return violations;
}

function getSuggestedFix(kind: ExtractedInteraction["kind"]): string {
  switch (kind) {
    case "destructive-action":
      return "Add a confirmation dialog before executing the destructive action";
    case "form-submit":
      return "Disable submit until form validation passes";
    case "navigation":
      return "Preserve draft state or prompt before navigating away";
    case "empty-state":
      return "Add a primary action (CTA) to guide users from the empty state";
  }
}
