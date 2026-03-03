/**
 * Patch Planner
 *
 * Takes detected drifts and produces an execution plan.
 * Groups by action type, assigns order, and generates
 * both machine-readable (JSON) and human-readable (Markdown) plans.
 */

/**
 * @typedef {object} PatchPlan
 * @property {string} generatedAt
 * @property {string} mode
 * @property {object[]} actions
 */

/**
 * Build an execution plan from detected drifts.
 *
 * @param {import("./drift-detector.mjs").Drift[]} drifts
 * @param {object} config
 * @returns {PatchPlan}
 */
export function buildPlan(drifts, config) {
  const now = new Date().toISOString();

  const actions = drifts.map((drift, i) => ({
    id: i + 1,
    slug: drift.slug,
    surface: drift.surface,
    field: drift.field,
    action: drift.action,
    current: drift.current,
    canonical: drift.canonical,
    status: "planned",
  }));

  // Sort: DIRECT_UPDATE first, then PR_REQUIRED, then RELEASE_REQUIRED
  const ORDER = { DIRECT_UPDATE: 0, PR_REQUIRED: 1, RELEASE_REQUIRED: 2 };
  actions.sort((a, b) => (ORDER[a.action] ?? 9) - (ORDER[b.action] ?? 9));

  return {
    generatedAt: now,
    mode: config.rules?.registryDriftPR ? "full" : "github-only",
    totalDrifts: drifts.length,
    actions,
  };
}
