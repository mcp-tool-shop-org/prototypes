import { createHash } from "node:crypto";
import type {
  TasteSource,
  TastePack,
  VisualTokenPack,
  ComponentGrammar,
  InteractionLaw,
  CopyRuleSet,
  ComplexityBudgetSet,
  ForbiddenPattern,
  GoldenFlowRef,
} from "@taste-compiler/core";
import type { NormalizedSource } from "../normalize/normalizer.js";

const COMPILER_VERSION = "0.1.0";

function hashSource(source: TasteSource): string {
  const json = JSON.stringify(source);
  return createHash("sha256").update(json).digest("hex").slice(0, 16);
}

/**
 * Compile visual tokens from principles and references.
 * Phase 1: emits structural placeholders from source.
 * The user fills in actual values; the compiler validates structure.
 */
function compileVisualTokens(source: TasteSource): VisualTokenPack {
  const tokens: VisualTokenPack = {
    colors: [],
    typography: [],
    spacing: [],
    radii: [],
    motion: [],
  };

  // Derive token roles from principles
  for (const p of source.principles) {
    const lower = p.statement.toLowerCase();
    if (lower.includes("calm") || lower.includes("editorial")) {
      tokens.colors.push({
        role: "surface-primary",
        description: `Derived from principle: ${p.id}`,
      });
      tokens.motion.push({
        name: "transition-default",
        duration: "300ms",
        easing: "ease-out",
      });
    }
    if (lower.includes("bold") || lower.includes("energetic")) {
      tokens.motion.push({
        name: "transition-default",
        duration: "150ms",
        easing: "ease-in-out",
      });
    }
  }

  // Default spacing scale if none inferred
  if (tokens.spacing.length === 0) {
    tokens.spacing = [
      { name: "space-xs", value: "4px" },
      { name: "space-sm", value: "8px" },
      { name: "space-md", value: "16px" },
      { name: "space-lg", value: "24px" },
      { name: "space-xl", value: "32px" },
    ];
  }

  return tokens;
}

/**
 * Compile component grammar from anti-examples and critique.
 */
function compileComponentGrammar(norm: NormalizedSource): ComponentGrammar {
  const grammar: ComponentGrammar = {
    allowed: [],
    banned: [],
    compositionRules: [],
  };

  // Derive bans from anti-examples
  for (const ae of norm.source.antiExamples) {
    const lower = ae.reason.toLowerCase();
    if (lower.includes("dashboard") || lower.includes("stat block")) {
      grammar.banned.push("DenseDataGrid", "StatCard", "KPIPanel");
      grammar.compositionRules.push({
        id: `gram-ae-${ae.id}`,
        rule: "No dense data grids or KPI panels",
        rationale: ae.reason,
        sourceRef: `anti-example:${ae.id}`,
      });
    }
    if (lower.includes("chat") || lower.includes("assistant")) {
      grammar.banned.push("FloatingChatBubble", "ChatWidget");
      grammar.compositionRules.push({
        id: `gram-ae-${ae.id}-chat`,
        rule: "No floating chat bubbles or chat widgets",
        rationale: ae.reason,
        sourceRef: `anti-example:${ae.id}`,
      });
    }
    if (lower.includes("sidebar") || lower.includes("mega")) {
      grammar.banned.push("MegaSidebar", "CollapsibleSidebar");
    }
  }

  // Derive from critique
  for (const c of norm.source.critique) {
    const lower = c.note.toLowerCase();
    if (lower.includes("too many actions") || lower.includes("button")) {
      grammar.compositionRules.push({
        id: `gram-crit-${c.id}`,
        rule: "Card may contain at most one primary action",
        rationale: c.note,
        sourceRef: `critique:${c.id}`,
      });
    }
  }

  // Dedupe banned
  grammar.banned = [...new Set(grammar.banned)];

  // Add default composition rules from budgets
  if (norm.source.budgets?.maxPrimaryActionsPerScreen) {
    grammar.compositionRules.push({
      id: "gram-budget-primary-actions",
      rule: `Max ${norm.source.budgets.maxPrimaryActionsPerScreen} primary action(s) per screen`,
      rationale: "Complexity budget constraint",
      sourceRef: "budgets",
    });
  }
  if (norm.source.budgets?.maxTopLevelNavItems) {
    grammar.compositionRules.push({
      id: "gram-budget-nav",
      rule: `Primary navigation max ${norm.source.budgets.maxTopLevelNavItems} items`,
      rationale: "Complexity budget constraint",
      sourceRef: "budgets",
    });
  }

  return grammar;
}

/**
 * Compile interaction laws from principles, flows, and critique.
 */
function compileInteractionLaws(norm: NormalizedSource): InteractionLaw[] {
  const laws: InteractionLaw[] = [];
  const seen = new Set<string>();

  // Default laws derived from principles
  const defaults: InteractionLaw[] = [
    {
      id: "law-destructive-confirm",
      law: "Destructive actions require confirmation",
      rationale: "Prevent accidental data loss",
      severity: "error",
    },
    {
      id: "law-submit-validation",
      law: "Form submit disabled until valid",
      rationale: "Prevent invalid submissions",
      severity: "error",
    },
    {
      id: "law-draft-preservation",
      law: "Draft state preserved on back navigation",
      rationale: "Respect user work in progress",
      severity: "error",
    },
    {
      id: "law-empty-state",
      law: "Empty states require a primary next step",
      rationale: "Guide users forward, never leave them stranded",
      severity: "warn",
    },
  ];

  for (const law of defaults) {
    if (!seen.has(law.id)) {
      laws.push(law);
      seen.add(law.id);
    }
  }

  // Derive from flow invariants
  for (const flow of norm.source.flows) {
    if (flow.invariants) {
      for (let i = 0; i < flow.invariants.length; i++) {
        const inv = flow.invariants[i];
        const id = `law-flow-${flow.id}-${i}`;
        if (!seen.has(id)) {
          laws.push({
            id,
            law: inv,
            rationale: `Invariant from flow: ${flow.name}`,
            sourceRef: `flow:${flow.id}`,
            severity: "error",
          });
          seen.add(id);
        }
      }
    }
  }

  return laws;
}

/**
 * Compile copy rules from principles, critique, and anti-examples.
 */
function compileCopyRules(norm: NormalizedSource): CopyRuleSet {
  const rules: CopyRuleSet = {
    bannedPhrases: [],
    toneWords: { encouraged: [], discouraged: [] },
    claimQualifiers: [],
  };

  // Derive from principles
  for (const p of norm.source.principles) {
    const lower = p.statement.toLowerCase();
    if (lower.includes("no fake") || lower.includes("no imply")) {
      rules.bannedPhrases.push({
        phrase: "fully automated",
        reason: p.rationale,
      });
      rules.bannedPhrases.push({
        phrase: "autonomous",
        reason: p.rationale,
      });
      rules.claimQualifiers.push({
        pattern: "AI-powered",
        qualifier: "AI-assisted",
      });
    }
    if (lower.includes("calm") || lower.includes("editorial")) {
      rules.toneWords.encouraged.push(
        "thoughtful",
        "considered",
        "intentional"
      );
      rules.toneWords.discouraged.push(
        "blazing fast",
        "supercharged",
        "revolutionary"
      );
    }
  }

  // Derive from anti-examples
  for (const ae of norm.source.antiExamples) {
    if (ae.category === "too-chatty") {
      rules.toneWords.discouraged.push("hey there", "awesome", "super easy");
    }
  }

  // Derive from critique
  for (const c of norm.source.critique) {
    const lower = c.note.toLowerCase();
    if (lower.includes("tone") || lower.includes("copy")) {
      rules.bannedPhrases.push({
        phrase: c.note.split('"')[1] || "",
        reason: c.note,
      });
    }
  }

  // Dedupe
  rules.toneWords.encouraged = [...new Set(rules.toneWords.encouraged)];
  rules.toneWords.discouraged = [...new Set(rules.toneWords.discouraged)];
  rules.bannedPhrases = rules.bannedPhrases.filter((bp) => bp.phrase.length > 0);

  return rules;
}

/**
 * Compile complexity budgets (pass through from source).
 */
function compileComplexityBudgets(source: TasteSource): ComplexityBudgetSet {
  return {
    maxTopLevelNavItems: source.budgets?.maxTopLevelNavItems,
    maxPrimaryActionsPerScreen: source.budgets?.maxPrimaryActionsPerScreen,
    maxModalDepth: source.budgets?.maxModalDepth,
    maxDistinctInteractionModesPerFlow:
      source.budgets?.maxDistinctInteractionModesPerFlow,
    custom: source.budgets?.custom ?? [],
  };
}

/**
 * Compile forbidden patterns from anti-examples, critique, and forbiddenPatternSeeds.
 */
function compileForbiddenPatterns(norm: NormalizedSource): ForbiddenPattern[] {
  const patterns: ForbiddenPattern[] = [];
  const seen = new Set<string>();

  for (const ae of norm.source.antiExamples) {
    const lower = ae.reason.toLowerCase();

    if (lower.includes("dashboard") || lower.includes("stat")) {
      const id = `fp-dashboard-${ae.id}`;
      if (!seen.has(id)) {
        patterns.push({
          id,
          pattern: "Dense dashboard / KPI layout",
          reason: ae.reason,
          sourceRef: `anti-example:${ae.id}`,
          severity: "error",
          detection: {
            componentNames: [
              "DenseDataGrid",
              "StatCard",
              "KPIPanel",
              "MetricsDashboard",
            ],
            classPatterns: ["grid-cols-4", "grid-cols-5", "grid-cols-6"],
          },
        });
        seen.add(id);
      }
    }

    if (lower.includes("chat") || lower.includes("assistant")) {
      const id = `fp-chat-${ae.id}`;
      if (!seen.has(id)) {
        patterns.push({
          id,
          pattern: "Chat/assistant as primary interface",
          reason: ae.reason,
          sourceRef: `anti-example:${ae.id}`,
          severity: "error",
          detection: {
            componentNames: ["FloatingChatBubble", "ChatWidget", "AIAssistant"],
            importPatterns: ["chat-bubble", "chat-widget"],
          },
        });
        seen.add(id);
      }
    }

    // Generic: any anti-example with "hidden" or "state" + "shift/drift"
    if (
      (lower.includes("hidden") && lower.includes("state")) ||
      lower.includes("state shift") ||
      lower.includes("blur") && lower.includes("preview")
    ) {
      const id = `fp-hidden-${ae.id}`;
      if (!seen.has(id)) {
        patterns.push({
          id,
          pattern: "Hidden state transition or preview/commit blur",
          reason: ae.reason,
          sourceRef: `anti-example:${ae.id}`,
          severity: "error",
        });
        seen.add(id);
      }
    }
  }

  // Process explicit forbidden pattern seeds
  for (const seed of norm.source.forbiddenPatternSeeds) {
    if (!seen.has(seed.id)) {
      const lower = seed.pattern.toLowerCase();

      // Auto-derive detection hints from pattern text
      const detection: ForbiddenPattern["detection"] = {};
      if (lower.includes("chat") || lower.includes("assistant")) {
        detection.componentNames = ["FloatingChatBubble", "ChatWidget", "AIAssistant", "ChatBubble"];
        detection.importPatterns = ["chat-bubble", "chat-widget", "assistant"];
      }
      if (lower.includes("kpi") || lower.includes("stat tile") || lower.includes("dashboard")) {
        detection.componentNames = ["DenseDataGrid", "StatCard", "KPIPanel", "MetricsDashboard"];
      }
      if (lower.includes("raw color") || lower.includes("color bypass") || lower.includes("token")) {
        // Token bypass patterns — detected by CSS-var adapter, not component names
      }

      patterns.push({
        id: seed.id,
        pattern: seed.pattern,
        reason: seed.rationale,
        sourceRef: `forbiddenPatternSeed:${seed.id}`,
        severity: "error",
        detection: Object.keys(detection).length > 0 ? detection : undefined,
      });
      seen.add(seed.id);
    }
  }

  return patterns;
}

/**
 * Compile golden flow references from source flows.
 */
function compileGoldens(source: TasteSource): GoldenFlowRef[] {
  return source.flows.map((flow) => ({
    id: flow.id,
    name: flow.name,
    routes: flow.steps.map((s) =>
      typeof s === "string" ? s : s.route
    ),
    invariants: flow.invariants ?? [],
    notes:
      flow.steps
        .map((s) => (typeof s === "string" ? undefined : s.purpose))
        .filter(Boolean)
        .join("; ") || undefined,
  }));
}

/**
 * Main compilation: NormalizedSource -> TastePack
 */
export function compile(norm: NormalizedSource): TastePack {
  const { source } = norm;

  return {
    schemaVersion: "0.1.0",
    packVersion: source.metadata.version,
    product: {
      name: source.product.name,
      summary: source.product.summary,
    },
    provenance: {
      sourceHash: hashSource(source),
      compiledAt: new Date().toISOString(),
      compilerVersion: COMPILER_VERSION,
    },
    artifacts: {
      visualTokens: compileVisualTokens(source),
      componentGrammar: compileComponentGrammar(norm),
      interactionLaws: compileInteractionLaws(norm),
      copyRules: compileCopyRules(norm),
      complexityBudgets: compileComplexityBudgets(source),
      forbiddenPatterns: compileForbiddenPatterns(norm),
    },
    goldens: compileGoldens(source),
  };
}
