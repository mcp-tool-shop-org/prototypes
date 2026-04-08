import { describe, it, expect } from "vitest";
import type { TastePack, TasteViolation, GoldenFlowRef } from "@taste-compiler/core";
import { verifyGoldenFlow, verifyAllGoldens } from "../validator.js";
import type { RouteMap } from "../validator.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeFlow(overrides?: Partial<GoldenFlowRef>): GoldenFlowRef {
  return {
    id: "onboarding",
    name: "Onboarding Flow",
    routes: ["/welcome", "/setup", "/home"],
    invariants: ["No modal on first visit"],
    ...overrides,
  };
}

function makeRouteMap(routes: string[]): RouteMap {
  return { routes };
}

function makePack(goldens: GoldenFlowRef[]): TastePack {
  return {
    schemaVersion: "0.1.0",
    packVersion: "0.1.0",
    product: { name: "TestApp", summary: "A test app" },
    provenance: {
      sourceHash: "abc123",
      compiledAt: "2026-04-01T00:00:00Z",
      compilerVersion: "0.1.0",
    },
    artifacts: {
      visualTokens: {
        colors: [],
        typography: [],
        spacing: [],
        radii: [],
        motion: [],
      },
      componentGrammar: {
        allowed: [],
        banned: [],
        compositionRules: [],
      },
      interactionLaws: [],
      copyRules: {
        bannedPhrases: [],
        toneWords: { encouraged: [], discouraged: [] },
        claimQualifiers: [],
      },
      complexityBudgets: { custom: [] },
      forbiddenPatterns: [],
    },
    goldens,
  };
}

// ---------------------------------------------------------------------------
// verifyGoldenFlow
// ---------------------------------------------------------------------------

describe("verifyGoldenFlow", () => {
  it("missing route fails with correct violation", () => {
    const flow = makeFlow();
    const routeMap = makeRouteMap(["/welcome", "/home"]); // missing /setup
    const packViolations: TasteViolation[] = [];

    const result = verifyGoldenFlow(flow, routeMap, packViolations);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(1);

    const routeViolation = result.violations.find((v) =>
      v.message.includes("/setup")
    );
    expect(routeViolation).toBeDefined();
    expect(routeViolation!.severity).toBe("error");
    expect(routeViolation!.class).toBe("interaction-law");
    expect(routeViolation!.message).toContain("Onboarding Flow");
  });

  it("all routes present passes", () => {
    const flow = makeFlow();
    const routeMap = makeRouteMap(["/welcome", "/setup", "/home", "/settings"]);
    const packViolations: TasteViolation[] = [];

    const result = verifyGoldenFlow(flow, routeMap, packViolations);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.flow.id).toBe("onboarding");
  });

  it("violation on golden flow route gets escalated", () => {
    const flow = makeFlow();
    const routeMap = makeRouteMap(["/welcome", "/setup", "/home"]);
    const packViolations: TasteViolation[] = [
      {
        id: "tok-setup-5",
        severity: "warn",
        class: "visual-token",
        ruleId: "TOK-001",
        message: "Raw hex color used",
        rationale: "All colors should reference tokens",
        evidence: [
          {
            file: "src/pages/setup.tsx",
            line: 5,
            snippet: "bg-[#ff0000]",
            value: "#ff0000",
          },
        ],
      },
    ];

    // The violation is on a file that includes "/setup" which is a golden route
    const result = verifyGoldenFlow(flow, routeMap, packViolations);

    // The original violation should be escalated because it affects a golden flow route
    const escalated = result.violations.filter((v) =>
      v.message.includes("Golden flow")
    );
    expect(escalated.length).toBeGreaterThanOrEqual(1);
    expect(escalated[0].severity).toBe("error");
    expect(escalated[0].message).toContain("Onboarding Flow");
  });

  it("violation on non-golden route is NOT escalated", () => {
    const flow = makeFlow();
    const routeMap = makeRouteMap(["/welcome", "/setup", "/home"]);
    const packViolations: TasteViolation[] = [
      {
        id: "tok-settings-10",
        severity: "warn",
        class: "visual-token",
        ruleId: "TOK-001",
        message: "Raw hex color used",
        rationale: "All colors should reference tokens",
        evidence: [
          {
            file: "src/pages/settings.tsx",
            line: 10,
            snippet: "bg-[#ff0000]",
            value: "#ff0000",
          },
        ],
      },
    ];

    const result = verifyGoldenFlow(flow, routeMap, packViolations);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("multiple missing routes each produce a violation", () => {
    const flow = makeFlow();
    const routeMap = makeRouteMap(["/home"]); // missing /welcome and /setup

    const result = verifyGoldenFlow(flow, routeMap, []);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBe(2);
    const messages = result.violations.map((v) => v.message);
    expect(messages.some((m) => m.includes("/welcome"))).toBe(true);
    expect(messages.some((m) => m.includes("/setup"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// verifyAllGoldens
// ---------------------------------------------------------------------------

describe("verifyAllGoldens", () => {
  it("checks multiple flows", () => {
    const flowA = makeFlow({
      id: "onboarding",
      name: "Onboarding",
      routes: ["/welcome", "/home"],
    });
    const flowB = makeFlow({
      id: "checkout",
      name: "Checkout",
      routes: ["/cart", "/payment", "/confirmation"],
    });

    const pack = makePack([flowA, flowB]);
    const routeMap = makeRouteMap(["/welcome", "/home", "/cart", "/payment"]);
    // /confirmation is missing

    const results = verifyAllGoldens(pack, routeMap, []);

    expect(results).toHaveLength(2);

    const onboardingResult = results.find((r) => r.flow.id === "onboarding")!;
    expect(onboardingResult.passed).toBe(true);

    const checkoutResult = results.find((r) => r.flow.id === "checkout")!;
    expect(checkoutResult.passed).toBe(false);
    expect(
      checkoutResult.violations.some((v) => v.message.includes("/confirmation"))
    ).toBe(true);
  });

  it("results per flow with correct pass/fail", () => {
    const flowA = makeFlow({
      id: "flow-a",
      name: "Flow A",
      routes: ["/a1", "/a2"],
    });
    const flowB = makeFlow({
      id: "flow-b",
      name: "Flow B",
      routes: ["/b1", "/b2"],
    });
    const flowC = makeFlow({
      id: "flow-c",
      name: "Flow C",
      routes: ["/c1"],
    });

    const pack = makePack([flowA, flowB, flowC]);
    // All A routes present, missing /b2, all C routes present
    const routeMap = makeRouteMap(["/a1", "/a2", "/b1", "/c1"]);

    const results = verifyAllGoldens(pack, routeMap, []);

    expect(results).toHaveLength(3);
    expect(results.find((r) => r.flow.id === "flow-a")!.passed).toBe(true);
    expect(results.find((r) => r.flow.id === "flow-b")!.passed).toBe(false);
    expect(results.find((r) => r.flow.id === "flow-c")!.passed).toBe(true);
  });

  it("returns empty array when pack has no goldens", () => {
    const pack = makePack([]);
    const routeMap = makeRouteMap(["/anything"]);

    const results = verifyAllGoldens(pack, routeMap, []);
    expect(results).toHaveLength(0);
  });
});
