/**
 * Mode Contracts — the internal law that prevents mode drift.
 *
 * Product law:
 * - General Review tells the truth. Other modes help humans think with that truth.
 * - Modes are lenses over the same canonical artifact, not separate products.
 * - Every mode points to the same evidence anchors.
 */

import type { ModeContract, ReviewMode, ModeSection } from "../types.js";

/**
 * Get the contract for a given mode.
 * This defines what each mode is allowed to do and how it must behave.
 */
export function getModeContract(mode: ReviewMode): ModeContract {
  return MODE_CONTRACTS[mode];
}

/**
 * Get section order for a given mode.
 */
export function getModeSections(mode: ReviewMode): ModeSection[] {
  return MODE_CONTRACTS[mode].sectionOrder;
}

/**
 * Check if a section is enabled for a given mode.
 */
export function isSectionEnabled(mode: ReviewMode, section: ModeSection): boolean {
  return MODE_CONTRACTS[mode].sectionOrder.includes(section);
}

const MODE_CONTRACTS: Record<ReviewMode, ModeContract> = {
  general: {
    mode: "general",
    purpose: "Canonical review artifact — source of truth for what changed.",
    primaryQuestion: "What changed, why does it matter, and what should I verify?",
    sectionOrder: [
      "why-this-matters",
      "unknowns",
      "what-changed",
      "what-to-check",
      "risk-context",
      "proof",
    ],
    allowedInferences: [
      "downstream impact from call graph",
      "risk scoring from extracted metrics",
      "test coverage gaps from symbol linkage",
    ],
    forbiddenClaims: [
      "speculative bug reports",
      "code quality judgments",
      "teaching-first framing",
      "personality or opinion",
    ],
    speculationLabel: "",
    extraGenerators: [],
  },

  "bug-hunter": {
    mode: "bug-hunter",
    purpose: "Risk lens — surfaces where danger is likely hiding in this change.",
    primaryQuestion: "If this change is dangerous, where is the danger likely hiding?",
    sectionOrder: [
      "risk-hotspots",
      "failure-hypotheses",
      "untested-danger",
      "what-changed",
      "inspection-path",
      "proof",
    ],
    allowedInferences: [
      "possible failure modes from diff patterns",
      "targeted 'try this mentally' prompts",
      "likely blind spots from coverage gaps",
      "risk amplification from fan-in/downstream",
    ],
    forbiddenClaims: [
      "'bug found' without direct evidence",
      "certainty about runtime behavior",
      "code quality scores",
    ],
    speculationLabel: "Possible issue",
    extraGenerators: ["failureHypotheses", "inspectionPrompts", "blindSpots"],
  },

  learning: {
    mode: "learning",
    purpose: "Comprehension lens — translates code into understanding.",
    primaryQuestion: "What does this code mean if I do not fully know the language or idioms?",
    sectionOrder: [
      "plain-summary",
      "key-concepts",
      "before-after",
      "syntax-translation",
      "pattern-rationale",
      "proof",
    ],
    allowedInferences: [
      "syntax-to-meaning translation",
      "construct explanations",
      "pattern identification",
      "before/after behavior meaning",
    ],
    forbiddenClaims: [
      "opinions on code quality",
      "security assessments",
      "hidden risk without evidence",
    ],
    speculationLabel: "Teaching note",
    extraGenerators: ["syntaxTranslation", "constructGlossary", "beforeAfter"],
  },

  architecture: {
    mode: "architecture",
    purpose: "System lens — shows where this module sits and what it touches.",
    primaryQuestion: "Where does this module sit in the system, and what does it touch?",
    sectionOrder: [
      "module-role",
      "system-neighbors",
      "upstream-deps",
      "downstream-deps",
      "runtime-touchpoints",
      "proof",
    ],
    allowedInferences: [
      "boundary placement from module graph",
      "ownership inference from file patterns",
      "coupling assessment from edge counts",
    ],
    forbiddenClaims: [
      "architectural recommendations",
      "refactoring suggestions",
      "code quality judgments",
    ],
    speculationLabel: "Interpretation",
    extraGenerators: ["moduleRoleSummary", "systemPlacement"],
  },

  exploration: {
    mode: "exploration",
    purpose: "Interactive lens — guided question-driven understanding of the change.",
    primaryQuestion: "Help me ask questions and explore this change interactively.",
    sectionOrder: [
      "what-changed",
      "what-to-check",
      "exploration-prompt",
      "proof",
    ],
    allowedInferences: [
      "explain this symbol",
      "compare explanations",
      "walk through function",
      "identify next inspection target",
    ],
    forbiddenClaims: [
      "silently replace General Review",
      "approve or reject the change",
      "teach without grounding in current diff",
    ],
    speculationLabel: "Hypothesis",
    extraGenerators: ["explorationPrompts"],
  },
};
