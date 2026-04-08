import type { TastePack, TasteViolation } from "@taste-compiler/core";

export interface ExtractedMetrics {
  topLevelNavItems?: number;
  primaryActionsPerScreen?: Map<string, number>;
  modalDepth?: number;
  interactionModesPerFlow?: Map<string, number>;
  routeCount?: number;
}

/**
 * Check complexity budget violations.
 */
export function checkBudgetViolations(
  pack: TastePack,
  metrics: ExtractedMetrics
): TasteViolation[] {
  const violations: TasteViolation[] = [];
  const budgets = pack.artifacts.complexityBudgets;

  // Top-level nav items
  if (
    budgets.maxTopLevelNavItems != null &&
    metrics.topLevelNavItems != null &&
    metrics.topLevelNavItems > budgets.maxTopLevelNavItems
  ) {
    violations.push({
      id: "bud-nav-count",
      severity: "error",
      class: "budget",
      ruleId: "BUD-001",
      message: `Top-level nav count ${metrics.topLevelNavItems} exceeds max ${budgets.maxTopLevelNavItems}`,
      rationale:
        "Navigation complexity budget exists to preserve focus and simplicity",
      evidence: [
        {
          value: `${metrics.topLevelNavItems} items (max ${budgets.maxTopLevelNavItems})`,
        },
      ],
      suggestedFix: `Reduce top-level navigation to ${budgets.maxTopLevelNavItems} items`,
    });
  }

  // Primary actions per screen
  if (
    budgets.maxPrimaryActionsPerScreen != null &&
    metrics.primaryActionsPerScreen
  ) {
    for (const [screen, count] of metrics.primaryActionsPerScreen) {
      if (count > budgets.maxPrimaryActionsPerScreen) {
        violations.push({
          id: `bud-primary-${screen}`,
          severity: "error",
          class: "budget",
          ruleId: "BUD-002",
          message: `Screen "${screen}" has ${count} primary actions (max ${budgets.maxPrimaryActionsPerScreen})`,
          rationale:
            "Multiple primary actions dilute user focus and create decision fatigue",
          evidence: [
            {
              file: screen,
              value: `${count} primary actions`,
            },
          ],
          suggestedFix: `Reduce to ${budgets.maxPrimaryActionsPerScreen} primary action(s)`,
        });
      }
    }
  }

  // Modal depth
  if (
    budgets.maxModalDepth != null &&
    metrics.modalDepth != null &&
    metrics.modalDepth > budgets.maxModalDepth
  ) {
    violations.push({
      id: "bud-modal-depth",
      severity: "error",
      class: "budget",
      ruleId: "BUD-003",
      message: `Modal depth ${metrics.modalDepth} exceeds max ${budgets.maxModalDepth}`,
      rationale:
        "Deep modal stacking creates confusion and traps users in nested contexts",
      evidence: [
        {
          value: `depth ${metrics.modalDepth} (max ${budgets.maxModalDepth})`,
        },
      ],
      suggestedFix: `Flatten modal interactions to max depth ${budgets.maxModalDepth}`,
    });
  }

  // Interaction modes per flow
  if (
    budgets.maxDistinctInteractionModesPerFlow != null &&
    metrics.interactionModesPerFlow
  ) {
    for (const [flow, count] of metrics.interactionModesPerFlow) {
      if (count > budgets.maxDistinctInteractionModesPerFlow) {
        violations.push({
          id: `bud-modes-${flow}`,
          severity: "error",
          class: "budget",
          ruleId: "BUD-004",
          message: `Flow "${flow}" has ${count} distinct interaction modes (max ${budgets.maxDistinctInteractionModesPerFlow})`,
          rationale:
            "Too many interaction modes in a single flow fragment the user's mental model",
          evidence: [
            {
              value: `${count} modes (max ${budgets.maxDistinctInteractionModesPerFlow})`,
            },
          ],
          suggestedFix: `Simplify flow to max ${budgets.maxDistinctInteractionModesPerFlow} interaction modes`,
        });
      }
    }
  }

  return violations;
}
