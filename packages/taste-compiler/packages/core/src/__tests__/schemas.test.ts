import { describe, it, expect } from "vitest";
import {
  TasteSourceSchema,
  TastePackSchema,
  TasteViolationSchema,
  TasteReportSchema,
  ViolationClassSchema,
  ViolationSeveritySchema,
} from "@taste-compiler/core";

// ---------------------------------------------------------------------------
// Helpers: minimal valid fixtures
// ---------------------------------------------------------------------------

function validSource() {
  return {
    product: { name: "Ritual", summary: "A calm journal app" },
    principles: [
      {
        id: "p1",
        statement: "Calm over busy",
        rationale: "Users need focus",
      },
    ],
    metadata: {
      createdBy: "tester",
      createdAt: "2026-04-01",
      version: "0.1.0",
    },
  };
}

function validViolation() {
  return {
    id: "v1",
    severity: "error" as const,
    class: "budget" as const,
    ruleId: "budget-nav-items",
    message: "Too many nav items",
    rationale: "Budget limits nav to 5",
  };
}

function validReport() {
  return {
    packVersion: "0.1.0",
    product: "Ritual",
    target: "src/App.tsx",
    checkedAt: "2026-04-01T00:00:00Z",
    violations: [],
    summary: { errors: 0, warnings: 0, infos: 0, passed: true },
  };
}

// ---------------------------------------------------------------------------
// TasteSource
// ---------------------------------------------------------------------------

describe("TasteSourceSchema", () => {
  it("parses a valid minimal source", () => {
    const result = TasteSourceSchema.safeParse(validSource());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.product.name).toBe("Ritual");
      // Defaults should be filled in
      expect(result.data.references).toEqual([]);
      expect(result.data.antiExamples).toEqual([]);
      expect(result.data.flows).toEqual([]);
      expect(result.data.critique).toEqual([]);
    }
  });

  it("parses a source with all optional fields", () => {
    const full = {
      ...validSource(),
      references: [
        { id: "ref1", type: "url", uri: "https://example.com", notes: "nice", tags: ["calm"] },
      ],
      antiExamples: [
        { id: "ae1", reason: "Too enterprise", category: "too-enterprise" },
      ],
      flows: [
        {
          id: "flow1",
          name: "Onboarding",
          steps: [{ route: "/welcome", purpose: "Greet user" }],
          successCriteria: ["User lands on home"],
          invariants: ["No modal on first visit"],
        },
      ],
      critique: [
        { id: "c1", target: "header", note: "Too many actions", severity: "critical" },
      ],
      budgets: {
        maxTopLevelNavItems: 5,
        maxPrimaryActionsPerScreen: 2,
        maxModalDepth: 2,
        maxDistinctInteractionModesPerFlow: 3,
        custom: [{ id: "b1", name: "tooltips", max: 3, unit: "per screen" }],
      },
    };
    const result = TasteSourceSchema.safeParse(full);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.references).toHaveLength(1);
      expect(result.data.antiExamples).toHaveLength(1);
      expect(result.data.flows).toHaveLength(1);
      expect(result.data.critique).toHaveLength(1);
      expect(result.data.budgets?.maxTopLevelNavItems).toBe(5);
    }
  });

  it("rejects missing product", () => {
    const { product: _, ...noProduct } = validSource();
    const result = TasteSourceSchema.safeParse(noProduct);
    expect(result.success).toBe(false);
  });

  it("rejects missing metadata", () => {
    const { metadata: _, ...noMeta } = validSource();
    const result = TasteSourceSchema.safeParse(noMeta);
    expect(result.success).toBe(false);
  });

  it("rejects empty principles array", () => {
    const result = TasteSourceSchema.safeParse({ ...validSource(), principles: [] });
    expect(result.success).toBe(false);
  });

  it("rejects missing product.name", () => {
    const source = validSource();
    source.product.name = "";
    const result = TasteSourceSchema.safeParse(source);
    expect(result.success).toBe(false);
  });

  it("rejects invalid reference type", () => {
    const source = {
      ...validSource(),
      references: [{ id: "r1", type: "video", uri: "https://example.com" }],
    };
    const result = TasteSourceSchema.safeParse(source);
    expect(result.success).toBe(false);
  });

  it("rejects invalid anti-example category", () => {
    const source = {
      ...validSource(),
      antiExamples: [{ id: "ae1", reason: "bad", category: "not-a-category" }],
    };
    const result = TasteSourceSchema.safeParse(source);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TastePack
// ---------------------------------------------------------------------------

describe("TastePackSchema", () => {
  function validPack() {
    return {
      schemaVersion: "0.1.0" as const,
      packVersion: "0.1.0",
      product: { name: "Ritual", summary: "A calm journal app" },
      provenance: {
        sourceHash: "abc123",
        compiledAt: "2026-04-01T00:00:00Z",
        compilerVersion: "0.1.0",
      },
      artifacts: {
        visualTokens: {
          colors: [{ role: "surface-primary" }],
          typography: [{ role: "body" }],
          spacing: [{ name: "space-md", value: "16px" }],
          radii: [{ name: "radius-sm", value: "4px" }],
          motion: [{ name: "transition-default", duration: "300ms" }],
        },
        componentGrammar: {
          allowed: ["Card", "Button"],
          banned: ["DenseDataGrid"],
          compositionRules: [
            { id: "cr1", rule: "Max 1 primary action per card" },
          ],
        },
        interactionLaws: [
          {
            id: "law1",
            law: "Destructive actions require confirmation",
            severity: "error",
          },
        ],
        copyRules: {
          bannedPhrases: [{ phrase: "blazing fast" }],
          toneWords: {
            encouraged: ["thoughtful"],
            discouraged: ["revolutionary"],
          },
          claimQualifiers: [
            { pattern: "AI-powered", qualifier: "AI-assisted" },
          ],
        },
        complexityBudgets: {
          maxTopLevelNavItems: 5,
          custom: [],
        },
        forbiddenPatterns: [
          {
            id: "fp1",
            pattern: "Dense dashboard",
            reason: "Anti-calm",
            severity: "error",
          },
        ],
      },
      goldens: [
        {
          id: "g1",
          name: "Onboarding",
          routes: ["/welcome", "/home"],
          invariants: ["No modal on first visit"],
        },
      ],
    };
  }

  it("parses a pack with all 6 artifact classes", () => {
    const result = TastePackSchema.safeParse(validPack());
    expect(result.success).toBe(true);
    if (result.success) {
      const a = result.data.artifacts;
      expect(a.visualTokens.colors).toHaveLength(1);
      expect(a.componentGrammar.banned).toContain("DenseDataGrid");
      expect(a.interactionLaws).toHaveLength(1);
      expect(a.copyRules.bannedPhrases).toHaveLength(1);
      expect(a.complexityBudgets.maxTopLevelNavItems).toBe(5);
      expect(a.forbiddenPatterns).toHaveLength(1);
    }
  });

  it("rejects wrong schemaVersion", () => {
    const pack = validPack();
    (pack as any).schemaVersion = "999.0.0";
    const result = TastePackSchema.safeParse(pack);
    expect(result.success).toBe(false);
  });

  it("rejects missing provenance", () => {
    const { provenance: _, ...noProv } = validPack();
    const result = TastePackSchema.safeParse(noProv);
    expect(result.success).toBe(false);
  });

  it("defaults goldens to empty array", () => {
    const pack = validPack();
    delete (pack as any).goldens;
    const result = TastePackSchema.safeParse(pack);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.goldens).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// TasteViolation
// ---------------------------------------------------------------------------

describe("TasteViolationSchema", () => {
  it("parses a valid violation", () => {
    const result = TasteViolationSchema.safeParse(validViolation());
    expect(result.success).toBe(true);
  });

  it("validates all severity values", () => {
    for (const sev of ["error", "warn", "info"] as const) {
      const v = { ...validViolation(), severity: sev };
      expect(TasteViolationSchema.safeParse(v).success).toBe(true);
    }
  });

  it("rejects invalid severity", () => {
    const v = { ...validViolation(), severity: "fatal" };
    expect(TasteViolationSchema.safeParse(v).success).toBe(false);
  });

  it("validates all violation class values", () => {
    const classes = [
      "visual-token",
      "component-grammar",
      "interaction-law",
      "copy-rule",
      "budget",
      "forbidden-pattern",
    ] as const;
    for (const cls of classes) {
      const v = { ...validViolation(), class: cls };
      expect(TasteViolationSchema.safeParse(v).success).toBe(true);
    }
  });

  it("rejects invalid class", () => {
    const v = { ...validViolation(), class: "unknown-class" };
    expect(TasteViolationSchema.safeParse(v).success).toBe(false);
  });

  it("validates all severity + class combinations", () => {
    const severities = ViolationSeveritySchema.options;
    const classes = ViolationClassSchema.options;
    for (const sev of severities) {
      for (const cls of classes) {
        const v = { ...validViolation(), severity: sev, class: cls };
        expect(TasteViolationSchema.safeParse(v).success).toBe(true);
      }
    }
  });

  it("parses violation with evidence", () => {
    const v = {
      ...validViolation(),
      evidence: [
        { file: "src/App.tsx", line: 42, column: 10, snippet: "<KPIPanel />", value: "KPIPanel" },
      ],
      suggestedFix: "Remove KPIPanel component",
    };
    const result = TasteViolationSchema.safeParse(v);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.evidence).toHaveLength(1);
      expect(result.data.suggestedFix).toBe("Remove KPIPanel component");
    }
  });

  it("rejects missing ruleId", () => {
    const { ruleId: _, ...noRuleId } = validViolation();
    expect(TasteViolationSchema.safeParse(noRuleId).success).toBe(false);
  });

  it("rejects missing message", () => {
    const { message: _, ...noMsg } = validViolation();
    expect(TasteViolationSchema.safeParse(noMsg).success).toBe(false);
  });

  it("rejects missing rationale", () => {
    const { rationale: _, ...noRat } = validViolation();
    expect(TasteViolationSchema.safeParse(noRat).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TasteReport
// ---------------------------------------------------------------------------

describe("TasteReportSchema", () => {
  it("parses a passing report with no violations", () => {
    const result = TasteReportSchema.safeParse(validReport());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.summary.passed).toBe(true);
      expect(result.data.violations).toHaveLength(0);
    }
  });

  it("parses a failing report with violations", () => {
    const report = {
      ...validReport(),
      violations: [validViolation()],
      summary: { errors: 1, warnings: 0, infos: 0, passed: false },
    };
    const result = TasteReportSchema.safeParse(report);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.summary.passed).toBe(false);
      expect(result.data.summary.errors).toBe(1);
    }
  });

  it("summary counts match violations", () => {
    const report = {
      ...validReport(),
      violations: [
        { ...validViolation(), id: "v1", severity: "error" },
        { ...validViolation(), id: "v2", severity: "warn" },
        { ...validViolation(), id: "v3", severity: "info" },
      ],
      summary: { errors: 1, warnings: 1, infos: 1, passed: false },
    };
    const result = TasteReportSchema.safeParse(report);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.violations).toHaveLength(3);
      expect(result.data.summary.errors).toBe(1);
      expect(result.data.summary.warnings).toBe(1);
      expect(result.data.summary.infos).toBe(1);
    }
  });

  it("rejects missing product", () => {
    const { product: _, ...noProduct } = validReport();
    expect(TasteReportSchema.safeParse(noProduct).success).toBe(false);
  });

  it("rejects missing summary", () => {
    const { summary: _, ...noSummary } = validReport();
    expect(TasteReportSchema.safeParse(noSummary).success).toBe(false);
  });
});
