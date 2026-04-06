/**
 * Mode-specific content generators.
 *
 * These produce EXTRA content for non-General modes.
 * They never replace canonical facts — they overlay, reorder, emphasize.
 * Speculation is always labeled.
 */

import type {
  ChangeBrief,
  ChangedModule,
  SymbolExplanation,
  ReviewerTip,
  ReviewMode,
} from "../types.js";
import { BearingsStore } from "../graph/store.js";

// ── Bug Hunter generators ──

export interface FailureHypothesis {
  symbol: string;
  hypothesis: string;
  basis: string;
  severity: "high" | "medium" | "low";
}

export interface BlindSpot {
  description: string;
  basis: string;
}

/**
 * Generate failure hypotheses from diff content signals.
 * Every hypothesis is labeled "Possible issue" — never "bug found."
 */
export function generateFailureHypotheses(
  brief: ChangeBrief,
  store: BearingsStore
): FailureHypothesis[] {
  const hypotheses: FailureHypothesis[] = [];

  for (const cm of brief.changedModules) {
    for (const se of cm.symbolExplanations) {
      // Error handling removed → possible uncaught failure
      if (se.changeType === "error-handling" && se.explanation.includes("removed")) {
        hypotheses.push({
          symbol: se.symbolName,
          hypothesis: `Error handling was removed from "${se.symbolName}". Callers may now receive unhandled exceptions instead of structured errors.`,
          basis: se.explanation,
          severity: "high",
        });
      }

      // Error handling rewritten → possible missed failure mode
      if (se.changeType === "error-handling" && se.explanation.includes("rewritten")) {
        hypotheses.push({
          symbol: se.symbolName,
          hypothesis: `Error paths in "${se.symbolName}" were rewritten. Some previous failure cases may no longer be caught.`,
          basis: se.explanation,
          severity: "medium",
        });
      }

      // Control flow restructured → possible edge case regression
      if (se.changeType === "control-flow") {
        hypotheses.push({
          symbol: se.symbolName,
          hypothesis: `Control flow in "${se.symbolName}" was restructured. Edge cases from the previous branch structure may behave differently.`,
          basis: se.explanation,
          severity: "medium",
        });
      }

      // Contract change with many callers → possible breakage
      if (se.changeType === "contract") {
        const syms = store.findSymbolByName(se.symbolName);
        if (syms.length > 0) {
          const callerCount = store.getEdgesTo(syms[0].id, "calls").length +
                              store.getEdgesTo(syms[0].id, "imports").length;
          if (callerCount > 2) {
            hypotheses.push({
              symbol: se.symbolName,
              hypothesis: `"${se.symbolName}" contract changed with ${callerCount} consumers. Some callers may not satisfy the updated shape.`,
              basis: `${callerCount} consumer(s) depend on this symbol`,
              severity: callerCount > 5 ? "high" : "medium",
            });
          }
        }
      }
    }
  }

  return hypotheses;
}

/**
 * Generate blind spots — areas where the change has weak visibility.
 */
export function generateBlindSpots(
  brief: ChangeBrief,
  store: BearingsStore
): BlindSpot[] {
  const spots: BlindSpot[] = [];

  for (const cm of brief.changedModules) {
    // Untested changed symbols
    const untestedSymbols = cm.changedSymbols.filter((name) => {
      const syms = store.findSymbolByName(name);
      return syms.some((s) => store.getTestsForSymbol(s.id).length === 0);
    });
    if (untestedSymbols.length > 0) {
      spots.push({
        description: `${untestedSymbols.length} changed symbol(s) in "${cm.moduleName}" have no test coverage: ${untestedSymbols.slice(0, 3).join(", ")}${untestedSymbols.length > 3 ? " ..." : ""}`,
        basis: "no linked tests found in symbol graph",
      });
    }

    // High fan-in module changed
    const mod = store.getModule(cm.moduleName);
    if (mod) {
      const metrics = store.getModuleMetrics(mod.id);
      if (metrics.fanIn > 5) {
        spots.push({
          description: `"${cm.moduleName}" has fan-in of ${metrics.fanIn} — changes here affect many modules but only this module's code is in the diff`,
          basis: `${metrics.fanIn} modules depend on ${cm.moduleName}`,
        });
      }
    }
  }

  // Unknowns are inherent blind spots
  if (brief.unknowns.length > 0) {
    spots.push({
      description: `${brief.unknowns.length} ambiguity(ies) mean some impact paths could not be traced`,
      basis: brief.unknowns.map((u) => u.category).join(", "),
    });
  }

  return spots;
}

/**
 * Generate inspection prompts — suggested mental exercises for the reviewer.
 */
export function generateInspectionPrompts(
  brief: ChangeBrief,
  store: BearingsStore
): string[] {
  const prompts: string[] = [];

  for (const cm of brief.changedModules) {
    for (const se of cm.symbolExplanations) {
      if (se.changeType === "error-handling") {
        prompts.push(`Mentally trace: what happens when "${se.symbolName}" receives invalid input now?`);
      }
      if (se.changeType === "control-flow") {
        prompts.push(`Walk through: are all previous branches of "${se.symbolName}" still reachable?`);
      }
      if (se.changeType === "contract" && se.confidence !== "high") {
        prompts.push(`Check: do all callers of "${se.symbolName}" handle the new shape correctly?`);
      }
    }

    // Nullable changes
    for (const tip of cm.reviewerTips) {
      if (tip.tip.includes("null") || tip.tip.includes("Nullable")) {
        prompts.push(`Verify: can "${cm.moduleName}" still handle null/undefined at its boundaries?`);
        break;
      }
    }
  }

  return prompts;
}

// ── Learning Mode generators ──

export interface SyntaxTranslation {
  construct: string;
  codeExample: string;
  plainEnglish: string;
  category: "type-system" | "control-flow" | "async" | "module" | "pattern" | "operator";
}

export interface BeforeAfter {
  symbolName: string;
  beforeMeaning: string;
  afterMeaning: string;
  whatChangedInPlainEnglish: string;
}

/**
 * Generate syntax translations from changed symbol explanations.
 * Turns language-specific constructs into plain English.
 */
export function generateSyntaxTranslations(
  brief: ChangeBrief,
  store: BearingsStore
): SyntaxTranslation[] {
  const translations: SyntaxTranslation[] = [];
  const seen = new Set<string>();

  for (const cm of brief.changedModules) {
    for (const se of cm.symbolExplanations) {
      // Contract changes on interfaces/types → explain type system
      if (se.changeType === "contract") {
        const syms = store.findSymbolByName(se.symbolName);
        if (syms.length > 0 && !seen.has(se.symbolName)) {
          seen.add(se.symbolName);
          const sym = syms[0];
          if (sym.kind === "interface") {
            translations.push({
              construct: "interface",
              codeExample: sym.signature,
              plainEnglish: `An interface defines a shape that objects must match. "${se.symbolName}" describes what fields a value must have — any code using it must provide those fields.`,
              category: "type-system",
            });
          } else if (sym.kind === "type") {
            translations.push({
              construct: "type alias",
              codeExample: sym.signature,
              plainEnglish: `A type alias creates a name for a type. "${se.symbolName}" is a label for a specific shape of data — changing it changes what values are valid everywhere it's used.`,
              category: "type-system",
            });
          } else if (sym.kind === "enum") {
            translations.push({
              construct: "enum",
              codeExample: sym.signature,
              plainEnglish: `An enum defines a fixed set of named values. "${se.symbolName}" limits what values are valid — adding or removing options affects every switch/if that checks these values.`,
              category: "type-system",
            });
          }
        }
      }

      // Error handling → explain try/catch/throw
      if (se.changeType === "error-handling" && !seen.has("error-handling")) {
        seen.add("error-handling");
        translations.push({
          construct: "error handling (try/catch/throw)",
          codeExample: "throw new Error(\"message\")",
          plainEnglish: "When code throws an error, execution stops and jumps to the nearest catch block. If there is no catch, the program crashes. Changing error handling changes what happens when things go wrong.",
          category: "control-flow",
        });
      }

      // Control flow → explain guards
      if (se.changeType === "control-flow" && !seen.has("control-flow")) {
        seen.add("control-flow");
        translations.push({
          construct: "guard clause (early return)",
          codeExample: "if (!valid) return;",
          plainEnglish: "A guard clause checks a condition and exits early if it fails. This keeps the main logic un-nested. Changing guards changes which inputs reach the main code path.",
          category: "control-flow",
        });
      }
    }

    // Look for nullable patterns in tips
    for (const tip of cm.reviewerTips) {
      if (tip.tip.includes("Nullable") && !seen.has("nullable")) {
        seen.add("nullable");
        translations.push({
          construct: "optional chaining (?.) and nullish coalescing (??)",
          codeExample: "value?.property ?? fallback",
          plainEnglish: "The ?. operator safely accesses a property only if the value exists (not null/undefined). The ?? operator provides a fallback when the left side is null or undefined. These prevent crashes from missing data.",
          category: "operator",
        });
      }
    }
  }

  return translations;
}

/**
 * Generate before/after behavior explanations.
 * Translates semantic change types into plain-English meaning.
 */
export function generateBeforeAfter(
  brief: ChangeBrief,
  store: BearingsStore
): BeforeAfter[] {
  const results: BeforeAfter[] = [];

  for (const cm of brief.changedModules) {
    for (const se of cm.symbolExplanations) {
      const syms = store.findSymbolByName(se.symbolName);
      if (syms.length === 0) continue;
      const sym = syms[0];

      let beforeMeaning: string;
      let afterMeaning: string;
      let whatChanged: string;

      switch (se.changeType) {
        case "contract":
          beforeMeaning = `"${se.symbolName}" defined a specific shape that callers had to match.`;
          afterMeaning = `The shape has changed — callers must now match the updated definition.`;
          whatChanged = sym.kind === "function"
            ? "The function's parameters or return type changed — callers may need to pass different arguments or handle a different result."
            : "The type definition changed — all code using this type must now match the new shape.";
          break;

        case "error-handling":
          beforeMeaning = `"${se.symbolName}" handled errors in a specific way.`;
          afterMeaning = `Error handling has been modified — failures may be caught differently or propagated where they weren't before.`;
          whatChanged = se.explanation.includes("removed")
            ? "Error handling was removed. Code that previously caught failures now lets them propagate to callers."
            : "Error handling was rewritten. The way this function responds to problems has changed.";
          break;

        case "control-flow":
          beforeMeaning = `"${se.symbolName}" followed a specific decision path (if/else/switch).`;
          afterMeaning = `The decision structure has changed — some inputs may now take different code paths.`;
          whatChanged = "Guards, branches, or conditions were restructured. Inputs that previously hit one path may now hit a different one.";
          break;

        case "behavior":
          beforeMeaning = `"${se.symbolName}" had specific behavior that callers relied on.`;
          afterMeaning = `The behavior has been modified — the function does something different now.`;
          whatChanged = sym.exported
            ? "This is a public function, so the behavior change is visible to other modules."
            : "This is an internal function — the change is contained within this module.";
          break;

        case "refactor":
          beforeMeaning = `"${se.symbolName}" worked a certain way internally.`;
          afterMeaning = `The internal structure changed, but the external behavior should be the same.`;
          whatChanged = "This appears to be a refactor — the code was reorganized without changing what it does.";
          break;

        case "data-flow":
          beforeMeaning = `"${se.symbolName}" held or produced a specific value.`;
          afterMeaning = `The value or its shape has changed.`;
          whatChanged = "Data that other code reads from this symbol may now look different.";
          break;

        default:
          continue;
      }

      results.push({
        symbolName: se.symbolName,
        beforeMeaning,
        afterMeaning,
        whatChangedInPlainEnglish: whatChanged,
      });
    }
  }

  return results;
}

// ── Architecture Mode generators ──

export interface ModuleRoleSummary {
  moduleName: string;
  role: string;
  systemPosition: "core" | "leaf" | "bridge" | "utility";
  touchpoints: string[];
}

/**
 * Generate module role summaries from the graph.
 */
export function generateModuleRoles(
  brief: ChangeBrief,
  store: BearingsStore
): ModuleRoleSummary[] {
  const roles: ModuleRoleSummary[] = [];
  const allModules = store.getAllModules();

  for (const cm of brief.changedModules) {
    const mod = allModules.find((m) => m.name === cm.moduleName);
    if (!mod) continue;

    const metrics = store.getModuleMetrics(mod.id);
    const deps = store.getModuleDeps(mod.id);
    const reverseDeps = store.getModuleReverseDeps(mod.id);

    // Determine system position
    let position: ModuleRoleSummary["systemPosition"];
    if (metrics.fanIn > 3 && metrics.fanOut > 3) {
      position = "bridge";
    } else if (metrics.fanIn > 3) {
      position = "core";
    } else if (metrics.fanOut > 3) {
      position = "utility";
    } else {
      position = "leaf";
    }

    // Build role description from metrics
    const roleParts: string[] = [];
    if (metrics.exportedSymbolCount > 0) {
      roleParts.push(`exports ${metrics.exportedSymbolCount} symbol(s)`);
    }
    if (metrics.fanIn > 0) {
      roleParts.push(`depended on by ${metrics.fanIn} module(s)`);
    }
    if (metrics.fanOut > 0) {
      roleParts.push(`depends on ${metrics.fanOut} module(s)`);
    }

    // Touchpoints: what this module connects to
    const touchpoints: string[] = [];
    for (const dep of deps) {
      const target = allModules.find((m) => m.id === dep.targetModuleId);
      if (target) touchpoints.push(`→ ${target.name}`);
    }
    for (const rdep of reverseDeps) {
      const source = allModules.find((m) => m.id === rdep.sourceModuleId);
      if (source) touchpoints.push(`← ${source.name}`);
    }

    roles.push({
      moduleName: cm.moduleName,
      role: roleParts.join(", ") || "standalone module",
      systemPosition: position,
      touchpoints,
    });
  }

  return roles;
}

// ── Exploration Mode generators ──

/**
 * Generate guided exploration prompts based on the change.
 */
export function generateExplorationPrompts(
  brief: ChangeBrief,
  store: BearingsStore
): string[] {
  const prompts: string[] = [];

  for (const cm of brief.changedModules) {
    prompts.push(`Explain what "${cm.moduleName}" does and why it matters.`);

    for (const sym of cm.changedSymbols.slice(0, 3)) {
      prompts.push(`Walk me through "${sym}" — what does it do?`);
    }

    if (cm.affectedDownstream.length > 0) {
      prompts.push(`Which callers of "${cm.moduleName}" should I inspect next?`);
    }

    for (const se of cm.symbolExplanations) {
      if (se.changeType === "contract") {
        prompts.push(`Why is the "${se.symbolName}" contract change risky?`);
      }
      if (se.changeType === "error-handling") {
        prompts.push(`What happens now when "${se.symbolName}" fails?`);
      }
    }
  }

  return prompts;
}

// ── Unified mode content ──

export interface ModeContent {
  mode: ReviewMode;
  /** Bug Hunter extras */
  failureHypotheses?: FailureHypothesis[];
  blindSpots?: BlindSpot[];
  inspectionPrompts?: string[];
  /** Learning Mode extras */
  syntaxTranslations?: SyntaxTranslation[];
  beforeAfter?: BeforeAfter[];
  /** Architecture Mode extras */
  moduleRoles?: ModuleRoleSummary[];
  /** Exploration Mode extras */
  explorationPrompts?: string[];
}

/**
 * Generate all mode-specific content for a given mode.
 * General mode returns empty — it uses only canonical truth.
 */
export function generateModeContent(
  mode: ReviewMode,
  brief: ChangeBrief,
  store: BearingsStore
): ModeContent {
  switch (mode) {
    case "general":
      return { mode };

    case "bug-hunter":
      return {
        mode,
        failureHypotheses: generateFailureHypotheses(brief, store),
        blindSpots: generateBlindSpots(brief, store),
        inspectionPrompts: generateInspectionPrompts(brief, store),
      };

    case "learning":
      return {
        mode,
        syntaxTranslations: generateSyntaxTranslations(brief, store),
        beforeAfter: generateBeforeAfter(brief, store),
      };

    case "architecture":
      return {
        mode,
        moduleRoles: generateModuleRoles(brief, store),
      };

    case "exploration":
      return {
        mode,
        explorationPrompts: generateExplorationPrompts(brief, store),
      };
  }
}
