/**
 * Action Recommendations
 *
 * Maps diagnoses to actionable recommendations.
 * Generic but credible—users can copy these directly into their planning tools.
 */

import type { DiagnosisType, DiagnosisSeverity } from "@/domain";

/**
 * A recommended action to address a diagnosis.
 */
export interface RecommendedAction {
  /** Short action title */
  title: string;
  /** Detailed description of what to do */
  description: string;
  /** Priority level */
  priority: "urgent" | "high" | "medium" | "low";
  /** Category of action */
  category: "onboarding" | "ui" | "documentation" | "product" | "communication";
  /** Estimated effort level */
  effort: "minimal" | "moderate" | "significant";
}

/**
 * Action templates keyed by diagnosis type.
 */
const ACTION_TEMPLATES: Record<DiagnosisType, RecommendedAction[]> = {
  dormant_but_documented: [
    {
      title: "Add to onboarding flow",
      description:
        "Include this feature in the getting-started guide or new user onboarding sequence. Users who don't discover features during onboarding rarely find them later.",
      priority: "high",
      category: "onboarding",
      effort: "moderate",
    },
    {
      title: "Create feature spotlight",
      description:
        "Write a dedicated blog post or changelog entry highlighting this feature's value. Re-introduce it to existing users who may have missed it.",
      priority: "medium",
      category: "communication",
      effort: "moderate",
    },
    {
      title: "Add contextual discovery",
      description:
        "Surface this feature at the moment users would benefit from it. Use tooltips, inline suggestions, or smart recommendations.",
      priority: "high",
      category: "ui",
      effort: "significant",
    },
  ],

  likely_invisible: [
    {
      title: "Improve feature discoverability",
      description:
        "Add this feature to the navigation, command palette, or feature discovery surfaces. Users can't use what they can't find.",
      priority: "urgent",
      category: "ui",
      effort: "moderate",
    },
    {
      title: "Add to documentation landing page",
      description:
        "Feature this prominently in the docs homepage or feature index. Don't bury it in a subpage.",
      priority: "high",
      category: "documentation",
      effort: "minimal",
    },
    {
      title: "Create tutorial or walkthrough",
      description:
        "Build an interactive tutorial that guides users through using this feature. Learning by doing increases retention.",
      priority: "medium",
      category: "onboarding",
      effort: "significant",
    },
  ],

  over_referenced_but_stale: [
    {
      title: "Audit for relevance",
      description:
        "Review whether this feature is still valuable to users. If yes, update documentation. If no, consider deprecation.",
      priority: "high",
      category: "product",
      effort: "moderate",
    },
    {
      title: "Update release notes",
      description:
        "If the feature was recently improved, announce it. Users may have written it off based on outdated information.",
      priority: "medium",
      category: "communication",
      effort: "minimal",
    },
    {
      title: "Refresh documentation",
      description:
        "Update all references to this feature with current screenshots, examples, and best practices.",
      priority: "medium",
      category: "documentation",
      effort: "moderate",
    },
  ],

  deprecated_candidate: [
    {
      title: "Evaluate for deprecation",
      description:
        "Analyze usage data (if available) to determine if this feature should be deprecated. Maintaining unused features has real costs.",
      priority: "high",
      category: "product",
      effort: "moderate",
    },
    {
      title: "Survey users",
      description:
        "Before removing, survey users to understand if there's a vocal minority depending on this feature.",
      priority: "medium",
      category: "communication",
      effort: "moderate",
    },
    {
      title: "Create migration path",
      description:
        "If deprecating, document how users can achieve the same outcome with other features or workflows.",
      priority: "high",
      category: "documentation",
      effort: "significant",
    },
  ],

  undiscoverable: [
    {
      title: "Add prominent entry point",
      description:
        "Create a clear, visible way to access this feature from the main navigation or a relevant context.",
      priority: "urgent",
      category: "ui",
      effort: "moderate",
    },
    {
      title: "Include in search results",
      description:
        "Ensure this feature appears in in-app search, help search, and documentation search with appropriate keywords.",
      priority: "high",
      category: "ui",
      effort: "minimal",
    },
    {
      title: "Add to feature index",
      description:
        "Create or update a comprehensive feature index/directory that includes this feature with clear descriptions.",
      priority: "medium",
      category: "documentation",
      effort: "minimal",
    },
    {
      title: "Announce to users",
      description:
        "Send an email, in-app notification, or changelog entry specifically highlighting this feature's existence and value.",
      priority: "high",
      category: "communication",
      effort: "minimal",
    },
  ],

  healthy: [
    {
      title: "Maintain current visibility",
      description:
        "This feature appears well-surfaced. Continue monitoring for any changes in documentation or user flows.",
      priority: "low",
      category: "documentation",
      effort: "minimal",
    },
  ],
};

/**
 * Gets recommended actions for a diagnosis type.
 */
export function getActionsForDiagnosis(
  diagnosisType: DiagnosisType,
  severity: DiagnosisSeverity
): RecommendedAction[] {
  const actions = ACTION_TEMPLATES[diagnosisType] ?? [];

  // Adjust priorities based on severity
  if (severity === "critical") {
    return actions.map((a) => ({
      ...a,
      priority: a.priority === "medium" ? "high" : a.priority === "low" ? "medium" : a.priority,
    }));
  }

  if (severity === "low") {
    return actions.map((a) => ({
      ...a,
      priority: a.priority === "urgent" ? "high" : a.priority === "high" ? "medium" : a.priority,
    }));
  }

  return actions;
}

/**
 * Gets the top N recommended actions across all diagnoses.
 */
export function getTopActions(
  diagnoses: { type: DiagnosisType; severity: DiagnosisSeverity }[],
  limit: number = 5
): RecommendedAction[] {
  const allActions: RecommendedAction[] = [];

  for (const diagnosis of diagnoses) {
    const actions = getActionsForDiagnosis(diagnosis.type, diagnosis.severity);
    allActions.push(...actions);
  }

  // Deduplicate by title
  const uniqueActions = Array.from(
    new Map(allActions.map((a) => [a.title, a])).values()
  );

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  uniqueActions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return uniqueActions.slice(0, limit);
}

/**
 * Formats an action as copyable text.
 */
export function formatActionAsText(action: RecommendedAction): string {
  return `[${action.priority.toUpperCase()}] ${action.title}\n${action.description}`;
}

/**
 * Formats all actions as a copyable list.
 */
export function formatActionsAsText(actions: RecommendedAction[]): string {
  return actions.map(formatActionAsText).join("\n\n---\n\n");
}
