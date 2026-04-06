/**
 * Code Bearings — Core type definitions
 *
 * Three-layer architecture:
 *   Layer A: Extracted truth (symbols, imports, calls, refs)
 *   Layer B: Derived structure (modules, deps, fan-in/out, blast radius)
 *   Layer C: Human narration (cards, briefs, maps)
 */

// ── Layer A: Extracted Truth ──

export interface FileRecord {
  id: number;
  path: string;
  /** Relative to project root */
  relativePath: string;
  linesOfCode: number;
}

export type SymbolKind =
  | "function"
  | "class"
  | "interface"
  | "type"
  | "enum"
  | "variable"
  | "constant";

export interface SymbolRecord {
  id: number;
  name: string;
  kind: SymbolKind;
  fileId: number;
  line: number;
  endLine: number;
  signature: string;
  exported: boolean;
  /** JSDoc or leading comment */
  documentation: string | null;
}

export type EdgeKind =
  | "imports"
  | "calls"
  | "called_by"
  | "references"
  | "implements"
  | "extends"
  | "reads"
  | "writes"
  | "exposes"
  | "verified_by";

export interface EdgeRecord {
  id: number;
  sourceSymbolId: number;
  targetSymbolId: number;
  kind: EdgeKind;
  /** Source file and line where this edge is observed */
  evidenceFileId: number;
  evidenceLine: number;
}

export interface TestRecord {
  id: number;
  name: string;
  fileId: number;
  line: number;
  /** Symbols this test exercises (by call/reference) */
  targetSymbolIds: number[];
}

export interface EntrypointRecord {
  id: number;
  symbolId: number;
  kind: "export" | "cli" | "api-route" | "job" | "event-handler";
}

// ── Layer B: Derived Structure ──

export interface ModuleRecord {
  id: number;
  name: string;
  /** File IDs that belong to this module */
  fileIds: number[];
  /** How this module was detected */
  boundaryKind: "file" | "directory" | "package" | "barrel" | "override" | "heuristic";
  /** Confidence in this module boundary */
  boundaryConfidence: Confidence;
  /** Why this module boundary exists */
  boundaryReason: string;
  /** Whether this module has a barrel/index file */
  hasBarrel: boolean;
  /** Whether this module has its own package.json */
  hasPackageJson: boolean;
}

/** User-provided module boundary overrides */
export interface ModuleOverride {
  /** Module name */
  name: string;
  /** File patterns (globs) that belong to this module */
  include: string[];
  /** Optional file patterns to exclude */
  exclude?: string[];
  /** Human description of what this module owns */
  responsibility?: string;
}

export interface ModuleDepRecord {
  sourceModuleId: number;
  targetModuleId: number;
  /** Number of import/call edges across this boundary */
  weight: number;
}

export interface ModuleMetrics {
  moduleId: number;
  symbolCount: number;
  exportedSymbolCount: number;
  fanIn: number;
  fanOut: number;
  testCount: number;
  linesOfCode: number;
}

// ── Layer C: Human Narration ──

export type Confidence = "high" | "medium" | "low";

export type UnknownCategory =
  | "dynamic-call"
  | "unresolved-export"
  | "framework-wiring"
  | "incomplete-test-linkage"
  | "weak-module-boundary"
  | "indirect-dependency"
  | "generated-code"
  | "reflection";

export interface Unknown {
  category: UnknownCategory;
  description: string;
  /** Where the ambiguity was observed */
  location?: string;
}

export interface Evidence {
  filePath: string;
  line: number;
  endLine?: number;
  snippet: string;
  /** What this evidence proves */
  anchor?: string;
  /** How this evidence was derived */
  derivedFrom?: string;
}

export interface FunctionCard {
  name: string;
  signature: string;
  filePath: string;
  line: number;
  purpose: string;
  callers: { name: string; filePath: string; line: number }[];
  callees: { name: string; filePath: string; line: number }[];
  sideEffects: string[];
  linkedTests: { name: string; filePath: string; line: number }[];
  unknowns: Unknown[];
  confidence: Confidence;
  evidence: Evidence[];
}

export interface ModuleCard {
  name: string;
  responsibility: string;
  boundary: {
    kind: ModuleRecord["boundaryKind"];
    confidence: Confidence;
    reason: string;
    hasBarrel: boolean;
    hasPackageJson: boolean;
  };
  publicSurface: { name: string; kind: SymbolKind; signature: string }[];
  internalParts: { name: string; kind: SymbolKind }[];
  dependencies: { moduleName: string; weight: number }[];
  reverseDependencies: { moduleName: string; weight: number }[];
  stateTouched: string[];
  externalTouchpoints: string[];
  relatedFlows: string[];
  riskNotes: string[];
  metrics: {
    symbolCount: number;
    exportedSymbolCount: number;
    fanIn: number;
    fanOut: number;
    testCount: number;
    linesOfCode: number;
  };
  unknowns: Unknown[];
  confidence: Confidence;
  evidence: Evidence[];
}

export type ChangeKind =
  | "logic"
  | "contract"
  | "data"
  | "interface"
  | "wiring"
  | "presentation"
  | "test-only";

/** Semantic explanation of what a symbol change means for review. */
export interface SymbolExplanation {
  symbolName: string;
  /** What kind of change: behavior, contract, control-flow, data-flow, error-handling, test-only, refactor */
  changeType: "behavior" | "contract" | "control-flow" | "data-flow" | "error-handling" | "test-only" | "refactor";
  /** Human-readable explanation of the change's meaning */
  explanation: string;
  /** Confidence in this explanation */
  confidence: Confidence;
}

/** Evidence-backed reviewer tip — specific, grounded, actionable. */
export interface ReviewerTip {
  /** The tip itself */
  tip: string;
  /** What evidence backs this tip */
  basis: string;
  /** Priority: critical tips should be checked first */
  priority: "critical" | "important" | "suggestion";
}

export interface ChangedModule {
  moduleName: string;
  changeKinds: ChangeKind[];
  changedSymbols: string[];
  affectedDownstream: string[];
  riskScore: number;
  riskReason: string;
  /** Per-symbol semantic explanations of changes */
  symbolExplanations: SymbolExplanation[];
  /** Evidence-backed reviewer tips specific to this module */
  reviewerTips: ReviewerTip[];
}

export interface DrilldownPath {
  label: string;
  command: string;
}

export interface ChangeBrief {
  summary: string;
  whyThisMatters: string[];
  changedModules: ChangedModule[];
  contractShifts: string[];
  statePathChanges: string[];
  testCoverageSignals: string[];
  reviewerFocusPoints: string[];
  drilldowns: DrilldownPath[];
  unknowns: Unknown[];
  confidence: Confidence;
  evidence: Evidence[];
}

// ── Cursor Context (contextual intelligence at the cursor) ──

/**
 * Resolved context for a cursor position in a source file.
 * Computed on demand from the BearingsStore and active ChangeBrief.
 * No new truth is created — this is a projection of existing data.
 */
export interface CursorContext {
  /** The symbol at the cursor, if any */
  symbol: SymbolRecord | undefined;
  /** The file record */
  file: FileRecord | undefined;
  /** The module this file belongs to */
  module: ModuleRecord | undefined;

  // ── Review awareness ──
  /** Is this file part of the current review? */
  inReview: boolean;
  /** Is this specific symbol changed in the current review? */
  symbolChanged: boolean;
  /** The ChangedModule entry, if this module is in the review */
  changedModule: ChangedModule | undefined;
  /** Symbol explanation from the review, if this symbol was changed */
  symbolExplanation: SymbolExplanation | undefined;
  /** Reviewer tips that mention this symbol */
  relevantTips: ReviewerTip[];

  // ── Graph context ──
  /** Direct callers of this symbol */
  callers: { name: string; filePath: string; line: number }[];
  /** What this symbol calls */
  callees: { name: string; filePath: string; line: number }[];
  /** Downstream modules that depend on this module */
  downstreamModules: string[];
  /** Tests that cover this symbol */
  tests: { name: string; filePath: string; line: number }[];
  /** Unknowns that apply to this symbol or its module */
  unknowns: Unknown[];

  // ── Metrics ──
  moduleMetrics: ModuleMetrics | undefined;
}

// ── Purpose Modes (lenses over canonical truth) ──

/**
 * Review modes are lenses, not separate truths.
 * General Review is sovereign — all other modes are derived overlays.
 *
 * Mode law:
 * 1. General Review is canonical and the default.
 * 2. Other modes may only: reorder, emphasize, explain, teach, hypothesize in labeled form.
 * 3. Other modes may NOT: rewrite canonical facts, hide uncertainty, invent evidence, turn guesses into conclusions.
 * 4. Speculation must be quarantined in visibly separate sections (Hypotheses, Possible failure modes, Teaching note).
 */
export type ReviewMode =
  | "general"
  | "bug-hunter"
  | "learning"
  | "architecture"
  | "exploration";

/**
 * Internal contract for each mode — defines what is allowed.
 * Used for enforcement, not rendering.
 */
export interface ModeContract {
  mode: ReviewMode;
  purpose: string;
  primaryQuestion: string;
  /** Section order for this mode's rendering */
  sectionOrder: ModeSection[];
  /** What kind of inferences this mode is allowed to make */
  allowedInferences: string[];
  /** What this mode must never claim */
  forbiddenClaims: string[];
  /** How speculation is labeled in this mode */
  speculationLabel: string;
  /** Extra generators enabled for this mode */
  extraGenerators: string[];
}

export type ModeSection =
  | "why-this-matters"
  | "unknowns"
  | "what-changed"
  | "what-to-check"
  | "risk-context"
  | "proof"
  | "risk-hotspots"
  | "failure-hypotheses"
  | "untested-danger"
  | "inspection-path"
  | "plain-summary"
  | "key-concepts"
  | "before-after"
  | "syntax-translation"
  | "pattern-rationale"
  | "module-role"
  | "system-neighbors"
  | "upstream-deps"
  | "downstream-deps"
  | "runtime-touchpoints"
  | "exploration-prompt";

export interface SystemMapEntry {
  subsystem: string;
  modules: string[];
  dominantFlows: string[];
  couplingScore: number;
  riskNotes: string[];
}

export interface SystemMap {
  subsystems: SystemMapEntry[];
  hotspots: { moduleName: string; fanIn: number; reason: string }[];
  weakTestLinkage: { moduleName: string; testCount: number }[];
}
