import type { TastePack, TasteViolation, TasteReport } from "@taste-compiler/core";
import {
  checkTokenViolations,
  type ExtractedStyle,
} from "./evaluators/token-checker.js";
import {
  checkGrammarViolations,
  type ExtractedComponent,
  type ExtractedScreen,
} from "./evaluators/grammar-checker.js";
import {
  checkCopyViolations,
  type ExtractedCopy,
} from "./evaluators/copy-checker.js";
import {
  checkBudgetViolations,
  type ExtractedMetrics,
} from "./evaluators/budget-checker.js";
import {
  checkForbiddenPatternViolations,
  type ExtractedClassUsage,
} from "./evaluators/forbidden-checker.js";
import {
  checkLawViolations,
  type ExtractedInteraction,
} from "./evaluators/law-checker.js";

/**
 * All extracted data from a target app needed for taste checking.
 */
export interface ExtractedTarget {
  styles: ExtractedStyle[];
  components: ExtractedComponent[];
  screens: ExtractedScreen[];
  copyBlocks: ExtractedCopy[];
  metrics: ExtractedMetrics;
  classes: ExtractedClassUsage[];
  interactions: ExtractedInteraction[];
}

/**
 * Run all taste checks against extracted target data.
 */
export function runChecks(
  pack: TastePack,
  target: ExtractedTarget
): TasteViolation[] {
  const violations: TasteViolation[] = [];

  violations.push(...checkTokenViolations(pack, target.styles));
  violations.push(
    ...checkGrammarViolations(pack, target.components, target.screens)
  );
  violations.push(...checkCopyViolations(pack, target.copyBlocks));
  violations.push(...checkBudgetViolations(pack, target.metrics));
  violations.push(
    ...checkForbiddenPatternViolations(pack, target.components, target.classes)
  );
  violations.push(...checkLawViolations(pack, target.interactions));

  return violations;
}

/**
 * Build a full TasteReport from check results.
 */
export function buildReport(
  pack: TastePack,
  targetPath: string,
  violations: TasteViolation[]
): TasteReport {
  const errors = violations.filter((v) => v.severity === "error").length;
  const warnings = violations.filter((v) => v.severity === "warn").length;
  const infos = violations.filter((v) => v.severity === "info").length;

  return {
    packVersion: pack.packVersion,
    product: pack.product.name,
    target: targetPath,
    checkedAt: new Date().toISOString(),
    violations,
    summary: {
      errors,
      warnings,
      infos,
      passed: errors === 0,
    },
  };
}
