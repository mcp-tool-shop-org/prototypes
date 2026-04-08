import type { TastePack, TasteViolation } from "@taste-compiler/core";

export interface ExtractedComponent {
  file: string;
  line: number;
  name: string;
  importPath: string;
  snippet: string;
}

export interface ExtractedScreen {
  file: string;
  route?: string;
  primaryActionCount: number;
  components: string[];
}

/**
 * Check component grammar violations.
 */
export function checkGrammarViolations(
  pack: TastePack,
  components: ExtractedComponent[],
  screens: ExtractedScreen[]
): TasteViolation[] {
  const violations: TasteViolation[] = [];
  const grammar = pack.artifacts.componentGrammar;

  // Check banned component imports
  for (const comp of components) {
    if (grammar.banned.includes(comp.name)) {
      violations.push({
        id: `gram-ban-${comp.file}-${comp.line}`,
        severity: "error",
        class: "component-grammar",
        ruleId: "GRAM-001",
        message: `Banned component "${comp.name}" imported`,
        rationale: findBanRationale(grammar, comp.name),
        evidence: [
          {
            file: comp.file,
            line: comp.line,
            snippet: comp.snippet,
            value: comp.name,
          },
        ],
        suggestedFix: `Remove "${comp.name}" and use an allowed alternative`,
      });
    }
  }

  // Check composition rules — primary action count
  const maxPrimary =
    pack.artifacts.complexityBudgets.maxPrimaryActionsPerScreen;
  if (maxPrimary != null) {
    for (const screen of screens) {
      if (screen.primaryActionCount > maxPrimary) {
        violations.push({
          id: `gram-primary-${screen.file}`,
          severity: "error",
          class: "component-grammar",
          ruleId: "GRAM-006",
          message: `${screen.primaryActionCount} primary actions on screen (max ${maxPrimary})`,
          rationale:
            "Too many primary actions dilute user focus and violate complexity budget",
          evidence: [
            {
              file: screen.file,
              value: `${screen.primaryActionCount} primary actions`,
            },
          ],
          suggestedFix: `Reduce to ${maxPrimary} primary action(s) per screen`,
        });
      }
    }
  }

  return violations;
}

function findBanRationale(
  grammar: TastePack["artifacts"]["componentGrammar"],
  name: string
): string {
  for (const rule of grammar.compositionRules) {
    if (rule.rule.toLowerCase().includes(name.toLowerCase())) {
      return rule.rationale ?? "Banned by component grammar";
    }
  }
  return "This component type is not allowed by the product's component grammar";
}
