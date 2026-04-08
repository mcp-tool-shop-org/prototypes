/**
 * Canonical rule ID prefixes for each violation class.
 * Every violation references one of these.
 */
export const RULE_PREFIX = {
  visualToken: "TOK",
  componentGrammar: "GRAM",
  interactionLaw: "LAW",
  copyRule: "COPY",
  budget: "BUD",
  forbiddenPattern: "FP",
} as const;

/**
 * Built-in rule IDs that the compiler emits by default.
 * Adapters and checks reference these when flagging violations.
 */
export const BUILTIN_RULES = {
  // Token rules
  "TOK-001": "Raw hex color outside token system",
  "TOK-002": "Ad hoc spacing not on allowed scale",
  "TOK-003": "Typography outside defined roles",
  "TOK-010": "Spacing scale drift",

  // Grammar rules
  "GRAM-001": "Banned component imported",
  "GRAM-002": "Unknown component category",
  "GRAM-003": "Composition rule violated",
  "GRAM-006": "Multiple primary actions in container",

  // Interaction law rules
  "LAW-001": "Destructive action without confirmation",
  "LAW-002": "Submit enabled on invalid form",
  "LAW-003": "Back navigation loses draft",
  "LAW-004": "Empty state without next step",

  // Copy rules
  "COPY-001": "Banned phrase used",
  "COPY-002": "Tone drift detected",
  "COPY-003": "Reading level exceeded",
  "COPY-004": "Unqualified claim",

  // Budget rules
  "BUD-001": "Top-level nav count exceeded",
  "BUD-002": "Primary actions per screen exceeded",
  "BUD-003": "Modal depth exceeded",
  "BUD-004": "Interaction modes per flow exceeded",

  // Forbidden pattern rules
  "FP-001": "Forbidden layout pattern detected",
  "FP-002": "Forbidden component pattern detected",
  "FP-003": "Forbidden import pattern detected",
} as const;

export type RuleId = keyof typeof BUILTIN_RULES | string;
