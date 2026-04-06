import path from "node:path";
import { BearingsStore } from "../graph/store.js";
import { buildEvidence } from "../evidence/evidence.js";
import { parseDiff, type DiffFile } from "./diff-parser.js";
import type {
  ChangeBrief,
  ChangedModule,
  ChangeKind,
  Confidence,
  DrilldownPath,
  Evidence,
  ReviewerTip,
  SymbolExplanation,
  SymbolRecord,
  Unknown,
} from "../types.js";

/**
 * Generate a ChangeBrief from a unified diff string.
 * Maps diff regions to symbols and modules, then produces
 * a structured review brief with evidence.
 */
export function generateChangeBrief(
  store: BearingsStore,
  diffText: string
): ChangeBrief {
  const diffFiles = parseDiff(diffText);
  const projectRoot = store.getMeta("projectRoot") ?? "";
  const allFiles = store.getAllFiles();
  const allModules = store.getAllModules();

  // Map: relative path → file record (normalize slashes for cross-platform)
  const fileByRelPath = new Map(
    allFiles.map((f) => [f.relativePath.replace(/\\/g, "/"), f])
  );
  // Map: file id → module
  const fileToModule = new Map<number, string>();
  for (const mod of allModules) {
    for (const fileId of mod.fileIds) {
      fileToModule.set(fileId, mod.name);
    }
  }

  const changedModuleMap = new Map<string, ChangedModule>();
  const moduleDiffFiles = new Map<string, DiffFile[]>();
  const contractShifts: string[] = [];
  const statePathChanges: string[] = [];
  const testCoverageSignals: string[] = [];
  const reviewerFocusPoints: string[] = [];
  const unknowns: Unknown[] = [];
  const evidence: Evidence[] = [];

  for (const df of diffFiles) {
    const normalizedPath = df.filePath.replace(/\\/g, "/");
    let fileRecord = fileByRelPath.get(normalizedPath);

    // For renames/copies, try the old path if new path isn't indexed yet
    if (!fileRecord && df.oldFilePath) {
      const normalizedOldPath = df.oldFilePath.replace(/\\/g, "/");
      fileRecord = fileByRelPath.get(normalizedOldPath);
    }

    if (!fileRecord) {
      // File not in the indexed project — note as unknown
      const desc = df.isRename
        ? `Renamed file "${df.oldFilePath}" → "${df.filePath}" (${df.similarity ?? "?"}% similar) is not in the indexed project`
        : `Changed file "${df.filePath}" is not in the indexed project`;
      unknowns.push({
        category: "unresolved-export",
        description: desc,
        location: df.filePath,
      });
      continue;
    }

    // Track renames as contract shifts
    if (df.isRename && df.oldFilePath) {
      contractShifts.push(
        `File renamed: "${df.oldFilePath}" → "${df.filePath}" (${df.similarity ?? "?"}% similar)`
      );
    }

    const moduleName = fileToModule.get(fileRecord.id);
    if (!moduleName) {
      unknowns.push({
        category: "weak-module-boundary",
        description: `Changed file "${df.filePath}" does not belong to any module`,
        location: df.filePath,
      });
      continue;
    }

    // Find which symbols are affected by the diff
    const allChangedLines = df.hunks.flatMap((h) => [
      ...h.addedLines,
      ...h.removedLines,
    ]);
    const symbols = store.getSymbolsByFile(fileRecord.id);
    const affectedSymbols = symbols.filter((sym) =>
      allChangedLines.some((line) => line >= sym.line && line <= sym.endLine)
    );

    // Classify change kinds
    const changeKinds = classifyChanges(df, affectedSymbols);

    // Build or update changed module entry
    if (!changedModuleMap.has(moduleName)) {
      changedModuleMap.set(moduleName, {
        moduleName,
        changeKinds: [],
        changedSymbols: [],
        affectedDownstream: [],
        riskScore: 0,
        riskReason: "",
        symbolExplanations: [],
        reviewerTips: [],
      });
    }
    const cm = changedModuleMap.get(moduleName)!;

    // Track diff files per module for content-aware explanations
    if (!moduleDiffFiles.has(moduleName)) {
      moduleDiffFiles.set(moduleName, []);
    }
    moduleDiffFiles.get(moduleName)!.push(df);

    for (const kind of changeKinds) {
      if (!cm.changeKinds.includes(kind)) cm.changeKinds.push(kind);
    }
    for (const sym of affectedSymbols) {
      if (!cm.changedSymbols.includes(sym.name)) {
        cm.changedSymbols.push(sym.name);
      }
    }

    // Track contract shifts: exported symbols that changed
    const exportedChanged = affectedSymbols.filter((s) => s.exported);
    for (const sym of exportedChanged) {
      contractShifts.push(
        `Exported symbol "${sym.name}" in module "${moduleName}" was modified`
      );

      // Find downstream callers
      const callerEdges = store.getEdgesTo(sym.id, "calls");
      const importEdges = store.getEdgesTo(sym.id, "imports");
      const downstreamSymIds = new Set<number>();
      for (const edge of [...callerEdges, ...importEdges]) {
        downstreamSymIds.add(edge.sourceSymbolId);
      }
      for (const dsId of downstreamSymIds) {
        const dsSym = store.getSymbol(dsId);
        if (!dsSym) continue;
        const dsFile = store.getFile(dsSym.fileId);
        const dsModule = dsFile ? fileToModule.get(dsFile.id) : undefined;
        if (dsModule && dsModule !== moduleName) {
          if (!cm.affectedDownstream.includes(dsModule)) {
            cm.affectedDownstream.push(dsModule);
          }
        }
      }
    }

    // Build evidence for changed regions
    for (const hunk of df.hunks) {
      const fullPath = path.resolve(projectRoot, df.filePath);
      if (hunk.addedLines.length > 0) {
        evidence.push(buildEvidence(fullPath, hunk.addedLines[0]));
      }
    }

    // Test coverage signal
    for (const sym of affectedSymbols) {
      const tests = store.getTestsForSymbol(sym.id);
      if (tests.length > 0) {
        testCoverageSignals.push(
          `"${sym.name}" is covered by ${tests.length} test(s)`
        );
      } else {
        testCoverageSignals.push(`"${sym.name}" has no linked tests`);
      }
    }
  }

  // Generate reviewer focus points
  const changedModules = Array.from(changedModuleMap.values());

  for (const cm of changedModules) {
    // Contract-specific prompts: name the actual contracts
    if (cm.changeKinds.includes("contract")) {
      const contractSymbols = cm.changedSymbols.filter((name) => {
        // Find symbols that are interfaces/types/enums
        const syms = store.findSymbolByName(name);
        return syms.some(
          (s) => s.exported && (s.kind === "interface" || s.kind === "type" || s.kind === "enum")
        );
      });
      if (contractSymbols.length > 0) {
        reviewerFocusPoints.push(
          `Verify all consumers of changed contract(s): ${contractSymbols.join(", ")}`
        );
      } else {
        reviewerFocusPoints.push(
          `Verify consumers of "${cm.moduleName}" still satisfy updated export signatures`
        );
      }
    }

    // Logic-specific prompts: name the functions
    if (cm.changeKinds.includes("logic") && cm.changedSymbols.length > 0) {
      for (const symName of cm.changedSymbols.slice(0, 5)) {
        reviewerFocusPoints.push(
          `Review behavior change in "${symName}" — verify correctness and edge cases`
        );
      }
    }

    // Data-specific prompts
    if (cm.changeKinds.includes("data")) {
      reviewerFocusPoints.push(
        `Verify data shape changes in "${cm.moduleName}" are compatible with all consumers`
      );
    }

    // Downstream impact prompts: specific per downstream module
    for (const downstream of cm.affectedDownstream) {
      reviewerFocusPoints.push(
        `Check "${downstream}" — depends on changed symbols in "${cm.moduleName}"`
      );
    }

    // Test coverage prompts
    const untestedSymbols = cm.changedSymbols.filter((name) => {
      const syms = store.findSymbolByName(name);
      return syms.some((s) => store.getTestsForSymbol(s.id).length === 0);
    });
    if (untestedSymbols.length > 0) {
      reviewerFocusPoints.push(
        `Changed symbols without tests: ${untestedSymbols.join(", ")} — consider adding coverage`
      );
    }
  }

  // Risk scoring: score each changed module for severity-based ordering
  for (const cm of changedModules) {
    const { score, reason } = scoreModuleRisk(cm, store);
    cm.riskScore = score;
    cm.riskReason = reason;
  }

  // Semantic explanations: per-symbol change descriptions (diff-content-aware)
  for (const cm of changedModules) {
    const diffs = moduleDiffFiles.get(cm.moduleName) ?? [];
    cm.symbolExplanations = buildSymbolExplanations(cm, store, diffs);
  }

  // Evidence-backed reviewer tips: grounded, specific, actionable
  for (const cm of changedModules) {
    const diffs = moduleDiffFiles.get(cm.moduleName) ?? [];
    cm.reviewerTips = buildReviewerTips(cm, store, diffs);
  }

  // Sort by risk: highest risk first
  changedModules.sort((a, b) => b.riskScore - a.riskScore);

  // Why This Matters: plain-language blast radius summary
  const whyThisMatters = buildWhyThisMatters(changedModules, contractShifts, unknowns);

  // Drilldown paths: stable CLI commands to investigate further
  const drilldowns = buildDrilldowns(changedModules);

  // Summary
  const summary = buildSummary(changedModules, diffFiles);

  // Confidence
  const confidence: Confidence =
    unknowns.length > 0 ? "low" : changedModules.length <= 3 ? "high" : "medium";

  return {
    summary,
    whyThisMatters,
    changedModules,
    contractShifts,
    statePathChanges,
    testCoverageSignals,
    reviewerFocusPoints,
    drilldowns,
    unknowns,
    confidence,
    evidence,
  };
}

function classifyChanges(
  diffFile: DiffFile,
  affectedSymbols: SymbolRecord[]
): ChangeKind[] {
  const kinds = new Set<ChangeKind>();
  const filePath = diffFile.filePath.toLowerCase();

  // Test-only: test files are test-only, period
  if (
    filePath.includes(".test.") ||
    filePath.includes(".spec.") ||
    filePath.includes("__tests__")
  ) {
    kinds.add("test-only");
    return Array.from(kinds);
  }

  // Presentation: style/template files
  if (
    filePath.endsWith(".css") ||
    filePath.endsWith(".scss") ||
    filePath.endsWith(".less") ||
    filePath.endsWith(".html") ||
    filePath.endsWith(".svg")
  ) {
    kinds.add("presentation");
    return Array.from(kinds);
  }

  // Collect all diff content for pattern detection
  const allAddedContent = diffFile.hunks.flatMap((h) => h.addedContent);
  const allRemovedContent = diffFile.hunks.flatMap((h) => h.removedContent);

  // Classify each affected symbol precisely
  for (const sym of affectedSymbols) {
    // Contract: exported interfaces, types, enums
    if (sym.exported && (sym.kind === "interface" || sym.kind === "type" || sym.kind === "enum")) {
      kinds.add("contract");
      continue;
    }

    // Exported function: distinguish signature change (contract) from body-only change (logic)
    if (sym.exported && sym.kind === "function") {
      // Check if the function's signature line (first line) was changed
      const signatureChanged = diffFile.hunks.some((h) =>
        h.addedLines.includes(sym.line) || h.removedLines.includes(sym.line)
      );
      if (signatureChanged) {
        kinds.add("contract");
      }
      kinds.add("logic");
      continue;
    }

    // Data: constants, variables, exported state
    if (sym.kind === "constant" || sym.kind === "variable") {
      if (sym.exported) {
        kinds.add("data");
      } else {
        kinds.add("logic");
      }
      continue;
    }

    // Logic: internal functions, classes
    if (sym.kind === "function" || sym.kind === "class") {
      kinds.add("logic");
      continue;
    }
  }

  // Wiring: barrel/index files with only re-exports changed
  const basename = filePath.split("/").pop() ?? "";
  if (
    basename.startsWith("index.") &&
    affectedSymbols.length === 0
  ) {
    kinds.add("wiring");
  }

  // Config files
  if (
    filePath.includes("config") ||
    filePath.endsWith(".json") ||
    filePath.endsWith(".env") ||
    filePath.endsWith(".yaml") ||
    filePath.endsWith(".yml")
  ) {
    kinds.add("wiring");
  }

  // Interface: if the file is primarily non-logic symbols
  // (skip — already handled by contract above)

  // Fallback: if nothing matched and there are symbols, call it logic
  if (kinds.size === 0 && affectedSymbols.length > 0) {
    kinds.add("logic");
  }

  // If no symbols affected at all, classify based on file type
  if (kinds.size === 0) {
    kinds.add("wiring");
  }

  return Array.from(kinds);
}

function buildSummary(
  changedModules: ChangedModule[],
  diffFiles: DiffFile[]
): string {
  const moduleCount = changedModules.length;
  const fileCount = diffFiles.length;
  const newFiles = diffFiles.filter((d) => d.isNew).length;

  const parts: string[] = [];

  parts.push(`${fileCount} file(s) changed across ${moduleCount} module(s).`);

  if (newFiles > 0) {
    parts.push(`${newFiles} new file(s) added.`);
  }

  for (const cm of changedModules) {
    const kinds = cm.changeKinds.join(", ");
    parts.push(
      `"${cm.moduleName}": ${kinds} changes to ${cm.changedSymbols.length} symbol(s).`
    );
  }

  const totalDownstream = new Set(
    changedModules.flatMap((cm) => cm.affectedDownstream)
  );
  if (totalDownstream.size > 0) {
    parts.push(
      `${totalDownstream.size} downstream module(s) potentially affected.`
    );
  }

  return parts.join(" ");
}

function scoreModuleRisk(
  cm: ChangedModule,
  store: BearingsStore
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Contract changes are highest risk
  if (cm.changeKinds.includes("contract")) {
    score += 30;
    reasons.push("contract changed");
  }

  // Downstream impact multiplies risk
  if (cm.affectedDownstream.length > 0) {
    score += cm.affectedDownstream.length * 10;
    reasons.push(`${cm.affectedDownstream.length} downstream module(s)`);
  }

  // Fan-in: look up module metrics
  const allModules = store.getAllModules();
  const mod = allModules.find((m) => m.name === cm.moduleName);
  if (mod) {
    const metrics = store.getModuleMetrics(mod.id);
    if (metrics.fanIn > 5) {
      score += 15;
      reasons.push(`high fan-in (${metrics.fanIn})`);
    } else if (metrics.fanIn > 2) {
      score += 5;
    }

    if (metrics.testCount === 0) {
      score += 10;
      reasons.push("no tests");
    }
  }

  // Logic changes have moderate risk
  if (cm.changeKinds.includes("logic")) {
    score += 5;
  }

  // More changed symbols = more to review
  score += Math.min(cm.changedSymbols.length * 2, 20);

  return {
    score,
    reason: reasons.length > 0 ? reasons.join(", ") : "low-risk change",
  };
}

function buildWhyThisMatters(
  changedModules: ChangedModule[],
  contractShifts: string[],
  unknowns: Unknown[]
): string[] {
  const points: string[] = [];

  // Contract impact
  if (contractShifts.length > 0) {
    points.push(
      `This change modifies ${contractShifts.length} public contract(s). Any consumer of these APIs may need updating.`
    );
  }

  // Blast radius
  const allDownstream = new Set(
    changedModules.flatMap((cm) => cm.affectedDownstream)
  );
  if (allDownstream.size > 0) {
    points.push(
      `${allDownstream.size} other module(s) depend on the changed code: ${Array.from(allDownstream).slice(0, 5).join(", ")}${allDownstream.size > 5 ? " ..." : ""}.`
    );
  }

  // High-risk modules
  const highRisk = changedModules.filter((cm) => cm.riskScore >= 30);
  for (const cm of highRisk) {
    points.push(
      `"${cm.moduleName}" is high-risk (${cm.riskReason}) — review this module first.`
    );
  }

  // Untested changes
  const untestedModules = changedModules.filter((cm) =>
    cm.riskReason.includes("no tests")
  );
  if (untestedModules.length > 0) {
    points.push(
      `${untestedModules.length} changed module(s) have no linked tests — changes cannot be verified automatically.`
    );
  }

  // Unknowns
  if (unknowns.length > 0) {
    points.push(
      `${unknowns.length} ambiguity(ies) detected — review with extra caution.`
    );
  }

  // Fallback
  if (points.length === 0) {
    points.push(
      "Low-risk change affecting well-scoped modules with no downstream impact detected."
    );
  }

  return points;
}

function buildDrilldowns(changedModules: ChangedModule[]): DrilldownPath[] {
  const paths: DrilldownPath[] = [];

  // Module drilldowns: highest risk first
  for (const cm of changedModules.slice(0, 5)) {
    paths.push({
      label: `Inspect module "${cm.moduleName}"`,
      command: `code-bearings module "${cm.moduleName}"`,
    });
  }

  // Function drilldowns: first few changed symbols
  const seenSymbols = new Set<string>();
  for (const cm of changedModules) {
    for (const sym of cm.changedSymbols.slice(0, 3)) {
      if (seenSymbols.has(sym)) continue;
      seenSymbols.add(sym);
      paths.push({
        label: `Inspect function "${sym}"`,
        command: `code-bearings function "${sym}"`,
      });
      if (seenSymbols.size >= 8) break;
    }
    if (seenSymbols.size >= 8) break;
  }

  return paths;
}

// ── Diff content pattern helpers ──

const ERROR_PATTERNS = /\b(throw|catch|Error|reject|\.catch|try\s*\{|finally\s*\{|error\b|err\b)/i;
const GUARD_PATTERNS = /\b(if\s*\(|else\s*\{|else\s+if|return\s+(?:null|undefined|false|void)|switch\s*\(|case\s+)/;
const NULLABLE_PATTERNS = /(\?\.|!\.|undefined|null|\?\?|\.?\s*\?\s*:)/;

interface DiffContentSignals {
  hasErrorChanges: boolean;
  hasGuardChanges: boolean;
  hasNullableChanges: boolean;
  addedErrorLines: number;
  removedErrorLines: number;
  addedGuardLines: number;
  removedGuardLines: number;
}

function analyzeDiffContent(diffs: DiffFile[], sym: SymbolRecord): DiffContentSignals {
  const signals: DiffContentSignals = {
    hasErrorChanges: false,
    hasGuardChanges: false,
    hasNullableChanges: false,
    addedErrorLines: 0,
    removedErrorLines: 0,
    addedGuardLines: 0,
    removedGuardLines: 0,
  };

  for (const df of diffs) {
    for (const hunk of df.hunks) {
      // Only look at hunks that overlap this symbol's line range
      const hunkStart = Math.min(
        hunk.oldStart,
        hunk.newStart
      );
      const hunkEnd = Math.max(
        hunk.oldStart + hunk.oldCount,
        hunk.newStart + hunk.newCount
      );
      if (hunkEnd < sym.line || hunkStart > sym.endLine) continue;

      for (const line of hunk.addedContent) {
        if (ERROR_PATTERNS.test(line)) {
          signals.hasErrorChanges = true;
          signals.addedErrorLines++;
        }
        if (GUARD_PATTERNS.test(line)) {
          signals.hasGuardChanges = true;
          signals.addedGuardLines++;
        }
        if (NULLABLE_PATTERNS.test(line)) {
          signals.hasNullableChanges = true;
        }
      }
      for (const line of hunk.removedContent) {
        if (ERROR_PATTERNS.test(line)) {
          signals.hasErrorChanges = true;
          signals.removedErrorLines++;
        }
        if (GUARD_PATTERNS.test(line)) {
          signals.hasGuardChanges = true;
          signals.removedGuardLines++;
        }
        if (NULLABLE_PATTERNS.test(line)) {
          signals.hasNullableChanges = true;
        }
      }
    }
  }

  return signals;
}

/**
 * Build semantic explanations for each changed symbol.
 * Classifies what the change means (behavior, contract, refactor, etc.)
 * and produces a human-readable explanation from evidence.
 * Uses diff content patterns for sharper error-handling / control-flow / refactor detection.
 */
function buildSymbolExplanations(
  cm: ChangedModule,
  store: BearingsStore,
  diffs: DiffFile[]
): SymbolExplanation[] {
  const explanations: SymbolExplanation[] = [];

  for (const symName of cm.changedSymbols) {
    const syms = store.findSymbolByName(symName);
    if (syms.length === 0) continue;

    const sym = syms[0];
    const callerEdges = store.getEdgesTo(sym.id, "calls");
    const importEdges = store.getEdgesTo(sym.id, "imports");
    const tests = store.getTestsForSymbol(sym.id);
    const callerCount = callerEdges.length + importEdges.length;

    // Analyze diff content for this symbol
    const signals = analyzeDiffContent(diffs, sym);

    // Determine change type — now content-aware
    let changeType: SymbolExplanation["changeType"];
    let confidence: SymbolExplanation["confidence"] = "medium";

    if (sym.kind === "interface" || sym.kind === "type" || sym.kind === "enum") {
      changeType = "contract";
      confidence = "high";
    } else if (sym.kind === "function" || sym.kind === "class") {
      // Error-handling changes take priority when the diff is dominated by error patterns
      if (signals.hasErrorChanges && (signals.addedErrorLines + signals.removedErrorLines) >= 2) {
        changeType = "error-handling";
        confidence = "high";
      }
      // Guard/control-flow changes: reordered branches, added/removed guards
      else if (signals.hasGuardChanges && (signals.addedGuardLines + signals.removedGuardLines) >= 2) {
        changeType = "control-flow";
        confidence = "medium";
      }
      // Exported function: signature change = contract, otherwise behavior or refactor
      else if (sym.exported) {
        // Check if signature line was modified in the diff
        const signatureChanged = diffs.some((df) =>
          df.hunks.some((h) =>
            h.addedLines.includes(sym.line) || h.removedLines.includes(sym.line)
          )
        );
        if (signatureChanged) {
          changeType = "contract";
          confidence = "high";
        } else if (callerCount > 0) {
          changeType = "behavior";
          confidence = callerCount > 3 ? "high" : "medium";
        } else {
          changeType = "refactor";
          confidence = "medium";
        }
      }
      // Internal function with no callers = refactor
      else if (!sym.exported && callerCount === 0) {
        changeType = "refactor";
        confidence = "high";
      } else {
        changeType = "behavior";
        confidence = callerCount > 0 ? "medium" : "high";
      }
    } else if (sym.kind === "constant" || sym.kind === "variable") {
      changeType = sym.exported ? "data-flow" : "refactor";
    } else {
      changeType = "behavior";
    }

    // Build explanation — content-aware
    const parts: string[] = [];

    if (changeType === "contract") {
      parts.push(`"${symName}" is a public contract (${sym.kind}).`);
      if (callerCount > 0) {
        parts.push(`${callerCount} consumer(s) depend on this shape.`);
      }
      parts.push("Verify all consumers still satisfy the updated contract.");
    } else if (changeType === "error-handling") {
      const added = signals.addedErrorLines;
      const removed = signals.removedErrorLines;
      if (added > 0 && removed > 0) {
        parts.push(`Error handling in "${symName}" was rewritten (${removed} removed, ${added} added).`);
        parts.push("Verify error paths still cover expected failure modes.");
      } else if (added > 0) {
        parts.push(`New error handling added to "${symName}" (${added} line(s)).`);
      } else {
        parts.push(`Error handling removed from "${symName}" (${removed} line(s)).`);
        parts.push("Verify removed error paths are no longer needed.");
        confidence = "low";
      }
      if (tests.length === 0) {
        parts.push("No linked tests — error path changes are high-risk without coverage.");
        confidence = "low";
      }
    } else if (changeType === "control-flow") {
      const added = signals.addedGuardLines;
      const removed = signals.removedGuardLines;
      if (added > 0 && removed > 0) {
        parts.push(`Control flow in "${symName}" was restructured (guards/branches changed).`);
      } else if (added > removed) {
        parts.push(`New guards/branches added to "${symName}".`);
      } else {
        parts.push(`Guards/branches removed from "${symName}".`);
        confidence = "low";
      }
      if (signals.hasNullableChanges) {
        parts.push("Nullable handling also changed — check null safety.");
      }
    } else if (changeType === "behavior") {
      parts.push(`"${symName}" behavior was modified.`);
      if (sym.exported && callerCount > 0) {
        parts.push(`${callerCount} caller(s) may be affected.`);
        confidence = "medium";
      }
      if (signals.hasNullableChanges) {
        parts.push("Nullable handling changed — verify null safety.");
      }
      if (tests.length > 0) {
        parts.push(`${tests.length} test(s) cover this symbol.`);
      } else {
        parts.push("No linked tests — verify manually.");
        confidence = "low";
      }
    } else if (changeType === "data-flow") {
      parts.push(`"${symName}" is exported data (${sym.kind}).`);
      if (callerCount > 0) {
        parts.push(`${callerCount} consumer(s) read this value.`);
      }
    } else if (changeType === "refactor") {
      if (!sym.exported && callerCount === 0) {
        // Pure internal refactor — keep explanation short
        parts.push(`"${symName}" is an internal ${sym.kind} with no callers — safe refactor.`);
        confidence = "high";
      } else {
        parts.push(`"${symName}" appears to be a refactor (internal ${sym.kind}).`);
        if (callerCount > 0) {
          parts.push(`${callerCount} internal caller(s) exist — verify they still work.`);
          confidence = "medium";
        }
      }
    }

    explanations.push({
      symbolName: symName,
      changeType,
      explanation: parts.join(" "),
      confidence,
    });
  }

  return explanations;
}

/**
 * Build evidence-backed reviewer tips for a changed module.
 * Tips are specific, grounded in extracted data, and actionable.
 * Uses diff content signals for error-path and guard-movement tips.
 */
function buildReviewerTips(
  cm: ChangedModule,
  store: BearingsStore,
  diffs: DiffFile[]
): ReviewerTip[] {
  const tips: ReviewerTip[] = [];

  // Contract change tips + error/guard tips per symbol
  for (const symName of cm.changedSymbols) {
    const syms = store.findSymbolByName(symName);
    if (syms.length === 0) continue;
    const sym = syms[0];

    const callerEdges = store.getEdgesTo(sym.id, "calls");
    const importEdges = store.getEdgesTo(sym.id, "imports");
    const consumers = [...callerEdges, ...importEdges];
    const tests = store.getTestsForSymbol(sym.id);

    // Diff content signals for this symbol
    const signals = analyzeDiffContent(diffs, sym);

    // Error path tips
    if (signals.hasErrorChanges && signals.removedErrorLines > 0 && signals.addedErrorLines === 0) {
      tips.push({
        tip: `Error handling removed from "${symName}" — verify callers handle failures themselves`,
        basis: `${signals.removedErrorLines} error-handling line(s) removed, 0 added`,
        priority: "critical",
      });
    } else if (signals.hasErrorChanges && signals.addedErrorLines > 0 && signals.removedErrorLines > 0) {
      tips.push({
        tip: `Error paths in "${symName}" were rewritten — verify all failure modes are still covered`,
        basis: `${signals.removedErrorLines} error line(s) removed, ${signals.addedErrorLines} added`,
        priority: "important",
      });
    }

    // Guard/control-flow movement tips
    if (signals.hasGuardChanges && signals.removedGuardLines > 0) {
      tips.push({
        tip: `Guards/branches restructured in "${symName}" — verify edge cases still handled`,
        basis: `${signals.removedGuardLines} guard line(s) removed, ${signals.addedGuardLines} added`,
        priority: signals.addedGuardLines < signals.removedGuardLines ? "critical" : "suggestion",
      });
    }

    // Nullable path tips
    if (signals.hasNullableChanges && (sym.exported || consumers.length > 0)) {
      tips.push({
        tip: `Nullable handling changed in "${symName}" — check for null/undefined safety`,
        basis: "optional chaining, nullish coalescing, or null checks were modified",
        priority: "important",
      });
    }

    if (!sym.exported) continue;

    // Consumer verification tips
    if ((sym.kind === "function" || sym.kind === "interface" || sym.kind === "type") && consumers.length > 0) {
      const consumerModules = new Set<string>();
      for (const edge of consumers) {
        const consumerSym = store.getSymbol(edge.sourceSymbolId);
        if (consumerSym) {
          const file = store.getFile(consumerSym.fileId);
          if (file) {
            const allModules = store.getAllModules();
            for (const mod of allModules) {
              if (mod.fileIds.includes(file.id)) {
                consumerModules.add(mod.name);
              }
            }
          }
        }
      }

      if (consumerModules.size > 0) {
        const moduleList = Array.from(consumerModules).slice(0, 3).join(", ");
        const more = consumerModules.size > 3 ? ` +${consumerModules.size - 3} more` : "";
        tips.push({
          tip: `Verify callers of "${symName}" in ${moduleList}${more} still satisfy updated contract`,
          basis: `${consumers.length} consumer(s) import/call this symbol`,
          priority: cm.changeKinds.includes("contract") ? "critical" : "important",
        });
      }
    }

    // Untested exported symbol — sharper callout when combined with error/guard changes
    if (tests.length === 0 && sym.kind === "function") {
      const hasRiskyChanges = signals.hasErrorChanges || signals.hasGuardChanges;
      tips.push({
        tip: hasRiskyChanges
          ? `"${symName}" has no tests and error/guard logic changed — high-risk blind spot`
          : `"${symName}" has no linked tests — verify behavior change manually`,
        basis: hasRiskyChanges
          ? "no test coverage + error/control-flow modifications detected in diff"
          : "no test coverage detected for this exported function",
        priority: hasRiskyChanges ? "critical" : "important",
      });
    }
  }

  // Downstream impact tips
  for (const downstream of cm.affectedDownstream) {
    const downMod = store.getModule(downstream);
    if (!downMod) continue;
    const metrics = store.getModuleMetrics(downMod.id);

    tips.push({
      tip: `Check "${downstream}" — depends on changed symbols in "${cm.moduleName}"`,
      basis: `fan-in: ${metrics.fanIn}, ${metrics.testCount} test(s)`,
      priority: metrics.testCount === 0 ? "critical" : "suggestion",
    });
  }

  // High fan-in warning
  const mod = store.getModule(cm.moduleName);
  if (mod) {
    const metrics = store.getModuleMetrics(mod.id);
    if (metrics.fanIn > 5) {
      tips.push({
        tip: `"${cm.moduleName}" has high fan-in (${metrics.fanIn}) — changes here have wide blast radius`,
        basis: `${metrics.fanIn} modules depend on this module`,
        priority: "important",
      });
    }
  }

  return tips;
}
