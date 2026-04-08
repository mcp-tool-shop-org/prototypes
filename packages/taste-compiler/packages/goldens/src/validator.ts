import type {
  TastePack,
  GoldenFlowRef,
  TasteViolation,
} from "@taste-compiler/core";

export interface RouteMap {
  routes: string[];
}

export interface GoldenResult {
  flow: GoldenFlowRef;
  passed: boolean;
  violations: TasteViolation[];
}

/**
 * Verify that golden flow routes exist in the target route map.
 */
function checkRoutePresence(
  flow: GoldenFlowRef,
  routeMap: RouteMap
): TasteViolation[] {
  const violations: TasteViolation[] = [];

  for (const route of flow.routes) {
    if (!routeMap.routes.includes(route)) {
      violations.push({
        id: `golden-route-${flow.id}-${route}`,
        severity: "error",
        class: "interaction-law",
        ruleId: `LAW-golden-${flow.id}`,
        message: `Golden flow "${flow.name}" requires route "${route}" which is missing`,
        rationale: `This route is part of the "${flow.name}" golden flow — removing it breaks a core user journey`,
        evidence: [{ value: route }],
        suggestedFix: `Add route "${route}" or update the golden flow definition`,
      });
    }
  }

  return violations;
}

/**
 * Verify a single golden flow against the target.
 */
export function verifyGoldenFlow(
  flow: GoldenFlowRef,
  routeMap: RouteMap,
  packViolations: TasteViolation[]
): GoldenResult {
  const violations: TasteViolation[] = [];

  // Check route presence
  violations.push(...checkRoutePresence(flow, routeMap));

  // Check if any existing violations affect golden flow routes
  for (const v of packViolations) {
    for (const e of v.evidence) {
      if (e.file && flow.routes.some((r) => e.file!.includes(r))) {
        // Violation on a golden flow route — escalate
        violations.push({
          id: `golden-violation-${flow.id}-${v.id}`,
          severity: "error",
          class: v.class,
          ruleId: v.ruleId,
          message: `Golden flow "${flow.name}" affected: ${v.message}`,
          rationale: `This violation occurs on a route in the "${flow.name}" golden flow, making it critical`,
          evidence: v.evidence,
          suggestedFix: v.suggestedFix,
        });
      }
    }
  }

  return {
    flow,
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Verify all golden flows in a pack.
 */
export function verifyAllGoldens(
  pack: TastePack,
  routeMap: RouteMap,
  packViolations: TasteViolation[]
): GoldenResult[] {
  return pack.goldens.map((flow) =>
    verifyGoldenFlow(flow, routeMap, packViolations)
  );
}
