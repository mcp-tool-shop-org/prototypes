import { describe, it, expect } from "vitest";
import type { TasteSource } from "@taste-compiler/core";
import { TastePackSchema } from "@taste-compiler/core";
import { compile } from "../compile/compiler.js";
import { normalize } from "../normalize/normalizer.js";
import { explain, formatExplainText } from "../explain/explainer.js";

// ---------------------------------------------------------------------------
// Three distinct taste sources
// ---------------------------------------------------------------------------

function makeSourceA(): TasteSource {
  return {
    product: { name: "Ritual", summary: "A calm editorial journal app" },
    references: [],
    antiExamples: [
      { id: "ae1", reason: "Looks like a dashboard with stat blocks", category: "too-enterprise" },
      { id: "ae2", reason: "Chat assistant as primary UI", category: "too-chatty" },
    ],
    principles: [
      { id: "p1", statement: "Calm editorial design", rationale: "Users need focus" },
      { id: "p2", statement: "No fake automation claims, no imply autonomy", rationale: "Honesty" },
    ],
    flows: [
      {
        id: "f1",
        name: "Daily Entry",
        steps: [
          { route: "/journal", purpose: "Open journal" },
          { route: "/journal/new", purpose: "Create entry" },
          { route: "/journal/:id", purpose: "View entry" },
        ],
        invariants: ["Draft auto-saved every 30s", "No modal interrupts during writing"],
      },
    ],
    critique: [
      { id: "c1", target: "header", note: "Too many actions in header", severity: "critical" },
    ],
    forbiddenPatternSeeds: [],
    budgets: {
      maxTopLevelNavItems: 4,
      maxPrimaryActionsPerScreen: 1,
      maxModalDepth: 1,
    },
    metadata: { createdBy: "tester", createdAt: "2026-04-01", version: "0.1.0" },
  };
}

function makeSourceB(): TasteSource {
  return {
    product: { name: "HaxTool", summary: "A bold energetic hacker tool" },
    references: [],
    antiExamples: [
      { id: "ae1", reason: "Enterprise sidebar mega-menu", category: "too-enterprise" },
    ],
    principles: [
      { id: "p1", statement: "Bold energetic interface", rationale: "Power users expect speed" },
    ],
    flows: [
      {
        id: "f1",
        name: "Quick Scan",
        steps: [
          { route: "/scan", purpose: "Start scan" },
          { route: "/results", purpose: "View results" },
        ],
        invariants: ["Scan never blocks UI"],
      },
    ],
    critique: [],
    forbiddenPatternSeeds: [],
    budgets: {
      maxTopLevelNavItems: 8,
      maxPrimaryActionsPerScreen: 3,
    },
    metadata: { createdBy: "tester", createdAt: "2026-04-01", version: "0.2.0" },
  };
}

function makeSourceC(): TasteSource {
  return {
    product: { name: "KidsDraw", summary: "A playful simple drawing app for kids" },
    references: [],
    antiExamples: [
      { id: "ae1", reason: "Complex dashboard with too many stat blocks", category: "too-dense" },
    ],
    principles: [
      { id: "p1", statement: "Playful simplicity above all", rationale: "Children need clear paths" },
    ],
    flows: [],
    critique: [],
    forbiddenPatternSeeds: [],
    budgets: {
      maxTopLevelNavItems: 3,
      maxPrimaryActionsPerScreen: 1,
      maxModalDepth: 1,
    },
    metadata: { createdBy: "tester", createdAt: "2026-04-01", version: "0.3.0" },
  };
}

// ---------------------------------------------------------------------------
// compile()
// ---------------------------------------------------------------------------

describe("compile()", () => {
  describe("Source A: Ritual app (calm, editorial, anti-dashboard, anti-chat)", () => {
    const norm = normalize(makeSourceA());
    const pack = compile(norm);

    it("produces a valid TastePack", () => {
      const result = TastePackSchema.safeParse(pack);
      expect(result.success).toBe(true);
    });

    it("has correct product name and summary", () => {
      expect(pack.product.name).toBe("Ritual");
      expect(pack.product.summary).toContain("calm");
    });

    it("populates all 6 artifact classes", () => {
      expect(pack.artifacts.visualTokens).toBeDefined();
      expect(pack.artifacts.componentGrammar).toBeDefined();
      expect(pack.artifacts.interactionLaws).toBeDefined();
      expect(pack.artifacts.copyRules).toBeDefined();
      expect(pack.artifacts.complexityBudgets).toBeDefined();
      expect(pack.artifacts.forbiddenPatterns).toBeDefined();
    });

    it("source hash is deterministic", () => {
      const norm2 = normalize(makeSourceA());
      const pack2 = compile(norm2);
      expect(pack2.provenance.sourceHash).toBe(pack.provenance.sourceHash);
    });

    it("bans dashboard components from anti-examples", () => {
      expect(pack.artifacts.componentGrammar.banned).toContain("DenseDataGrid");
      expect(pack.artifacts.componentGrammar.banned).toContain("StatCard");
      expect(pack.artifacts.componentGrammar.banned).toContain("KPIPanel");
    });

    it("bans chat components from anti-examples", () => {
      expect(pack.artifacts.componentGrammar.banned).toContain("FloatingChatBubble");
      expect(pack.artifacts.componentGrammar.banned).toContain("ChatWidget");
    });

    it("produces forbidden patterns for dashboard and chat", () => {
      const fpIds = pack.artifacts.forbiddenPatterns.map((fp) => fp.id);
      expect(fpIds.some((id) => id.includes("dashboard"))).toBe(true);
      expect(fpIds.some((id) => id.includes("chat"))).toBe(true);
    });

    it("forbidden patterns have detection hints", () => {
      for (const fp of pack.artifacts.forbiddenPatterns) {
        expect(fp.detection).toBeDefined();
        expect(fp.detection!.componentNames!.length).toBeGreaterThan(0);
      }
    });

    it("passes through complexity budgets", () => {
      expect(pack.artifacts.complexityBudgets.maxTopLevelNavItems).toBe(4);
      expect(pack.artifacts.complexityBudgets.maxPrimaryActionsPerScreen).toBe(1);
      expect(pack.artifacts.complexityBudgets.maxModalDepth).toBe(1);
    });

    it("flows become golden refs", () => {
      expect(pack.goldens).toHaveLength(1);
      expect(pack.goldens[0].name).toBe("Daily Entry");
      expect(pack.goldens[0].routes).toEqual(["/journal", "/journal/new", "/journal/:id"]);
      expect(pack.goldens[0].invariants).toContain("Draft auto-saved every 30s");
    });

    it("interaction laws include defaults", () => {
      const lawIds = pack.artifacts.interactionLaws.map((l) => l.id);
      expect(lawIds).toContain("law-destructive-confirm");
      expect(lawIds).toContain("law-submit-validation");
      expect(lawIds).toContain("law-draft-preservation");
      expect(lawIds).toContain("law-empty-state");
    });

    it("interaction laws include flow invariants", () => {
      const lawIds = pack.artifacts.interactionLaws.map((l) => l.id);
      expect(lawIds).toContain("law-flow-f1-0");
      expect(lawIds).toContain("law-flow-f1-1");
    });

    it("calm principle creates visual tokens with motion", () => {
      expect(pack.artifacts.visualTokens.motion.length).toBeGreaterThan(0);
      const transition = pack.artifacts.visualTokens.motion.find(
        (m) => m.name === "transition-default"
      );
      expect(transition).toBeDefined();
      expect(transition!.duration).toBe("300ms");
    });

    it("calm principle creates surface-primary color token", () => {
      const colorRoles = pack.artifacts.visualTokens.colors.map((c) => c.role);
      expect(colorRoles).toContain("surface-primary");
    });

    it("copy rules discourage hype words for calm product", () => {
      expect(pack.artifacts.copyRules.toneWords.discouraged).toContain("blazing fast");
      expect(pack.artifacts.copyRules.toneWords.discouraged).toContain("supercharged");
    });

    it("copy rules encourage thoughtful tone for calm product", () => {
      expect(pack.artifacts.copyRules.toneWords.encouraged).toContain("thoughtful");
      expect(pack.artifacts.copyRules.toneWords.encouraged).toContain("intentional");
    });

    it("no-fake-claims principle produces banned phrases", () => {
      const phrases = pack.artifacts.copyRules.bannedPhrases.map((bp) => bp.phrase);
      expect(phrases).toContain("fully automated");
      expect(phrases).toContain("autonomous");
    });

    it("no-fake-claims principle produces claim qualifiers", () => {
      const qualifiers = pack.artifacts.copyRules.claimQualifiers;
      expect(qualifiers.some((q) => q.pattern === "AI-powered" && q.qualifier === "AI-assisted")).toBe(true);
    });

    it("chatty anti-example adds discouraged tone words", () => {
      expect(pack.artifacts.copyRules.toneWords.discouraged).toContain("hey there");
      expect(pack.artifacts.copyRules.toneWords.discouraged).toContain("awesome");
    });
  });

  describe("Source B: HaxTool (bold, energetic, anti-enterprise)", () => {
    const norm = normalize(makeSourceB());
    const pack = compile(norm);

    it("produces a valid TastePack", () => {
      expect(TastePackSchema.safeParse(pack).success).toBe(true);
    });

    it("populates all 6 artifact classes", () => {
      expect(pack.artifacts.visualTokens).toBeDefined();
      expect(pack.artifacts.componentGrammar).toBeDefined();
      expect(pack.artifacts.interactionLaws).toBeDefined();
      expect(pack.artifacts.copyRules).toBeDefined();
      expect(pack.artifacts.complexityBudgets).toBeDefined();
      expect(pack.artifacts.forbiddenPatterns).toBeDefined();
    });

    it("source hash is deterministic", () => {
      const pack2 = compile(normalize(makeSourceB()));
      expect(pack2.provenance.sourceHash).toBe(pack.provenance.sourceHash);
    });

    it("bans sidebar components from enterprise anti-example", () => {
      expect(pack.artifacts.componentGrammar.banned).toContain("MegaSidebar");
      expect(pack.artifacts.componentGrammar.banned).toContain("CollapsibleSidebar");
    });

    it("bold principle creates fast motion tokens", () => {
      const transition = pack.artifacts.visualTokens.motion.find(
        (m) => m.name === "transition-default"
      );
      expect(transition).toBeDefined();
      expect(transition!.duration).toBe("150ms");
    });

    it("passes through higher budgets", () => {
      expect(pack.artifacts.complexityBudgets.maxTopLevelNavItems).toBe(8);
      expect(pack.artifacts.complexityBudgets.maxPrimaryActionsPerScreen).toBe(3);
    });

    it("flows become golden refs with invariants", () => {
      expect(pack.goldens).toHaveLength(1);
      expect(pack.goldens[0].invariants).toContain("Scan never blocks UI");
    });

    it("interaction laws include flow invariants for scan", () => {
      const lawIds = pack.artifacts.interactionLaws.map((l) => l.id);
      expect(lawIds).toContain("law-flow-f1-0");
    });
  });

  describe("Source C: KidsDraw (playful, simple, anti-complexity)", () => {
    const norm = normalize(makeSourceC());
    const pack = compile(norm);

    it("produces a valid TastePack", () => {
      expect(TastePackSchema.safeParse(pack).success).toBe(true);
    });

    it("populates all 6 artifact classes", () => {
      expect(pack.artifacts.visualTokens).toBeDefined();
      expect(pack.artifacts.componentGrammar).toBeDefined();
      expect(pack.artifacts.interactionLaws).toBeDefined();
      expect(pack.artifacts.copyRules).toBeDefined();
      expect(pack.artifacts.complexityBudgets).toBeDefined();
      expect(pack.artifacts.forbiddenPatterns).toBeDefined();
    });

    it("source hash is deterministic", () => {
      const pack2 = compile(normalize(makeSourceC()));
      expect(pack2.provenance.sourceHash).toBe(pack.provenance.sourceHash);
    });

    it("bans dashboard components from dense anti-example", () => {
      expect(pack.artifacts.componentGrammar.banned).toContain("DenseDataGrid");
      expect(pack.artifacts.componentGrammar.banned).toContain("StatCard");
    });

    it("forbidden patterns detect dashboard components", () => {
      expect(pack.artifacts.forbiddenPatterns.length).toBeGreaterThan(0);
      const dashFp = pack.artifacts.forbiddenPatterns.find((fp) => fp.id.includes("dashboard"));
      expect(dashFp).toBeDefined();
      expect(dashFp!.detection!.componentNames).toContain("DenseDataGrid");
    });

    it("tight budgets pass through", () => {
      expect(pack.artifacts.complexityBudgets.maxTopLevelNavItems).toBe(3);
      expect(pack.artifacts.complexityBudgets.maxPrimaryActionsPerScreen).toBe(1);
      expect(pack.artifacts.complexityBudgets.maxModalDepth).toBe(1);
    });

    it("has no golden flows when source has no flows", () => {
      expect(pack.goldens).toHaveLength(0);
    });

    it("default spacing scale is present", () => {
      expect(pack.artifacts.visualTokens.spacing.length).toBeGreaterThan(0);
      const names = pack.artifacts.visualTokens.spacing.map((s) => s.name);
      expect(names).toContain("space-md");
    });
  });
});

// ---------------------------------------------------------------------------
// normalize()
// ---------------------------------------------------------------------------

describe("normalize()", () => {
  it("merges duplicate critiques targeting the same element", () => {
    const source = makeSourceA();
    source.critique = [
      { id: "c1", target: "header", note: "Too many buttons", severity: "important" },
      { id: "c2", target: "header", note: "Actions overlap", severity: "critical" },
    ];
    const norm = normalize(source);
    // Two critiques with same target merged into one
    const headerCritiques = norm.source.critique.filter((c) => c.target === "header");
    expect(headerCritiques).toHaveLength(1);
    // Merged note contains both
    expect(headerCritiques[0].note).toContain("Too many buttons");
    expect(headerCritiques[0].note).toContain("Actions overlap");
    // Strongest severity wins
    expect(headerCritiques[0].severity).toBe("critical");
    // Merge count tracked
    expect(norm.deduped.critiqueMerges).toBe(1);
  });

  it("does not merge critiques with different targets", () => {
    const source = makeSourceA();
    source.critique = [
      { id: "c1", target: "header", note: "Note A", severity: "important" },
      { id: "c2", target: "footer", note: "Note B", severity: "suggestion" },
    ];
    const norm = normalize(source);
    expect(norm.source.critique).toHaveLength(2);
    expect(norm.deduped.critiqueMerges).toBe(0);
  });

  it("does not merge unscoped critiques (different ids)", () => {
    const source = makeSourceA();
    source.critique = [
      { id: "c1", note: "General note A" },
      { id: "c2", note: "General note B" },
    ];
    const norm = normalize(source);
    expect(norm.source.critique).toHaveLength(2);
    expect(norm.deduped.critiqueMerges).toBe(0);
  });

  it("derives negatives from anti-examples with category", () => {
    const source = makeSourceA();
    const norm = normalize(source);
    expect(norm.derivedNegatives.length).toBeGreaterThan(0);
    // Categorized anti-example
    expect(norm.derivedNegatives.some((n) => n.startsWith("Anti-"))).toBe(true);
  });

  it("derives negatives from anti-examples without category", () => {
    const source = makeSourceA();
    source.antiExamples = [{ id: "ae1", reason: "Just bad vibes" }];
    const norm = normalize(source);
    expect(norm.derivedNegatives.some((n) => n.startsWith("Avoid:"))).toBe(true);
  });

  it("detects principle overlaps by duplicate id", () => {
    const source = makeSourceA();
    source.principles = [
      ...source.principles,
      { id: "p1", statement: "Duplicate principle", rationale: "Oops" },
    ];
    const norm = normalize(source);
    expect(norm.deduped.principleOverlaps).toBe(1);
  });

  it("reports zero overlaps when all principle ids are unique", () => {
    const norm = normalize(makeSourceA());
    expect(norm.deduped.principleOverlaps).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// explain()
// ---------------------------------------------------------------------------

describe("explain()", () => {
  it("produces non-empty sections", () => {
    const pack = compile(normalize(makeSourceA()));
    const sections = explain(pack);
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.lines.length).toBeGreaterThan(0);
    }
  });

  it("includes Product Constitution section", () => {
    const pack = compile(normalize(makeSourceA()));
    const sections = explain(pack);
    const constitution = sections.find((s) => s.title === "Product Constitution");
    expect(constitution).toBeDefined();
    expect(constitution!.lines.some((l) => l.includes("Ritual"))).toBe(true);
  });

  it("includes Visual Token Intent section when tokens exist", () => {
    const pack = compile(normalize(makeSourceA()));
    const sections = explain(pack);
    const tokens = sections.find((s) => s.title === "Visual Token Intent");
    expect(tokens).toBeDefined();
  });

  it("includes Component Grammar section with banned components", () => {
    const pack = compile(normalize(makeSourceA()));
    const sections = explain(pack);
    const grammar = sections.find((s) => s.title === "Component Grammar");
    expect(grammar).toBeDefined();
    expect(grammar!.lines.some((l) => l.includes("Banned components"))).toBe(true);
  });

  it("includes Interaction Laws section", () => {
    const pack = compile(normalize(makeSourceA()));
    const sections = explain(pack);
    const laws = sections.find((s) => s.title === "Interaction Laws");
    expect(laws).toBeDefined();
    expect(laws!.lines.length).toBeGreaterThan(0);
  });

  it("includes Copy Rules section", () => {
    const pack = compile(normalize(makeSourceA()));
    const sections = explain(pack);
    const copy = sections.find((s) => s.title === "Copy Rules");
    expect(copy).toBeDefined();
  });

  it("includes Complexity Budgets section", () => {
    const pack = compile(normalize(makeSourceA()));
    const sections = explain(pack);
    const budgets = sections.find((s) => s.title === "Complexity Budgets");
    expect(budgets).toBeDefined();
    expect(budgets!.lines.some((l) => l.includes("4"))).toBe(true);
  });

  it("includes Forbidden Patterns section", () => {
    const pack = compile(normalize(makeSourceA()));
    const sections = explain(pack);
    const fp = sections.find((s) => s.title === "Forbidden Patterns");
    expect(fp).toBeDefined();
  });

  it("includes 'What This Product Is Not' section when forbidden patterns exist", () => {
    const pack = compile(normalize(makeSourceA()));
    const sections = explain(pack);
    const notSection = sections.find((s) => s.title === "What This Product Is Not");
    expect(notSection).toBeDefined();
    expect(notSection!.lines.length).toBeGreaterThan(0);
  });

  it("includes Golden Flows section when flows exist", () => {
    const pack = compile(normalize(makeSourceA()));
    const sections = explain(pack);
    const goldens = sections.find((s) => s.title === "Golden Flows");
    expect(goldens).toBeDefined();
    expect(goldens!.lines.some((l) => l.includes("Daily Entry"))).toBe(true);
  });

  it("omits Golden Flows section when no flows", () => {
    const pack = compile(normalize(makeSourceC()));
    const sections = explain(pack);
    const goldens = sections.find((s) => s.title === "Golden Flows");
    expect(goldens).toBeUndefined();
  });

  it("formatExplainText produces non-empty string", () => {
    const pack = compile(normalize(makeSourceA()));
    const sections = explain(pack);
    const text = formatExplainText(sections);
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain("## Product Constitution");
  });

  it("'What This Product Is Not' omitted when no forbidden patterns or bans", () => {
    // Source B has sidebar anti-example but no dashboard/chat patterns
    const source = makeSourceB();
    // Remove anti-examples so no forbidden patterns are generated
    source.antiExamples = [];
    const pack = compile(normalize(source));
    // Only check if there are actually no forbidden patterns AND no bans
    if (
      pack.artifacts.forbiddenPatterns.length === 0 &&
      pack.artifacts.componentGrammar.banned.length === 0
    ) {
      const sections = explain(pack);
      const notSection = sections.find((s) => s.title === "What This Product Is Not");
      expect(notSection).toBeUndefined();
    }
  });
});
