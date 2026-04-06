/**
 * Cursor Context Resolver — projects BearingsStore + ChangeBrief onto a cursor position.
 *
 * No new truth is created. This is pure computation over existing data,
 * answering: "what does Code Bearings know about where I am right now?"
 */

import type { BearingsStore } from "../graph/store.js";
import type {
  CursorContext,
  ChangeBrief,
  SymbolRecord,
  FileRecord,
  ModuleRecord,
  ChangedModule,
  SymbolExplanation,
  ReviewerTip,
  Unknown,
  ModuleMetrics,
} from "../types.js";

/**
 * Resolve the full context for a cursor position.
 *
 * @param store - The indexed code graph
 * @param filePath - Absolute or relative file path (either separator style)
 * @param line - 1-based line number
 * @param brief - Active review brief, if any
 */
export function resolveCursorContext(
  store: BearingsStore,
  filePath: string,
  line: number,
  brief?: ChangeBrief
): CursorContext {
  const normalized = filePath.replace(/\\/g, "/");

  // ── Step 1: Find the file ──
  const file = store.getFileByPath(normalized);

  if (!file) {
    return emptyCursorContext();
  }

  // ── Step 2: Find the symbol at the cursor ──
  const symbols = store.getSymbolsByFile(file.id);
  const symbol = findSymbolAtLine(symbols, line);

  // ── Step 3: Find the module ──
  const module = findModuleForFile(store, file.id);
  const moduleMetrics = module ? store.getModuleMetrics(module.id) : undefined;

  // ── Step 4: Review awareness ──
  let inReview = false;
  let symbolChanged = false;
  let changedModule: ChangedModule | undefined;
  let symbolExplanation: SymbolExplanation | undefined;
  let relevantTips: ReviewerTip[] = [];
  let unknowns: Unknown[] = [];

  if (brief) {
    // Check if this module is in the review
    if (module) {
      changedModule = brief.changedModules.find(
        (cm) => cm.moduleName === module.name
      );
    }
    inReview = changedModule !== undefined;

    if (changedModule && symbol) {
      // Check if this specific symbol was changed
      symbolChanged = changedModule.changedSymbols.includes(symbol.name);

      // Find the symbol explanation
      symbolExplanation = changedModule.symbolExplanations.find(
        (se) => se.symbolName === symbol.name
      );

      // Find relevant reviewer tips (those mentioning this symbol)
      relevantTips = changedModule.reviewerTips.filter(
        (tip) =>
          tip.basis.toLowerCase().includes(symbol.name.toLowerCase()) ||
          tip.tip.toLowerCase().includes(symbol.name.toLowerCase())
      );
    }

    // Collect unknowns relevant to this module or file
    if (module) {
      unknowns = brief.unknowns.filter(
        (u) =>
          u.location?.includes(module.name) ||
          u.location?.includes(file.relativePath) ||
          u.description.includes(module.name)
      );
    }
  }

  // ── Step 5: Graph context ──
  let callers: CursorContext["callers"] = [];
  let callees: CursorContext["callees"] = [];
  let tests: CursorContext["tests"] = [];
  let downstreamModules: string[] = [];

  if (symbol) {
    // Callers: edges pointing TO this symbol (call edges)
    const incomingEdges = store.getEdgesTo(symbol.id, "calls");
    callers = incomingEdges
      .map((edge) => {
        const src = store.getSymbol(edge.sourceSymbolId);
        if (!src) return null;
        const srcFile = store.getFile(src.fileId);
        return {
          name: src.name,
          filePath: srcFile?.path ?? "",
          line: src.line,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    // Also check called_by edges
    const calledByEdges = store.getEdgesTo(symbol.id, "called_by");
    for (const edge of calledByEdges) {
      const src = store.getSymbol(edge.sourceSymbolId);
      if (!src) continue;
      const srcFile = store.getFile(src.fileId);
      if (!callers.some((c) => c.name === src.name && c.line === src.line)) {
        callers.push({
          name: src.name,
          filePath: srcFile?.path ?? "",
          line: src.line,
        });
      }
    }

    // Callees: edges FROM this symbol (call edges)
    const outgoingEdges = store.getEdgesFrom(symbol.id, "calls");
    callees = outgoingEdges
      .map((edge) => {
        const tgt = store.getSymbol(edge.targetSymbolId);
        if (!tgt) return null;
        const tgtFile = store.getFile(tgt.fileId);
        return {
          name: tgt.name,
          filePath: tgtFile?.path ?? "",
          line: tgt.line,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    // Tests covering this symbol
    const testRecords = store.getTestsForSymbol(symbol.id);
    tests = testRecords.map((t) => {
      const testFile = store.getFile(t.fileId);
      return {
        name: t.name,
        filePath: testFile?.path ?? "",
        line: t.line,
      };
    });
  }

  // Downstream modules (modules that depend on this module)
  if (module) {
    const reverseDeps = store.getModuleReverseDeps(module.id);
    const allModules = store.getAllModules();
    downstreamModules = reverseDeps
      .map((dep) => allModules.find((m) => m.id === dep.targetModuleId)?.name)
      .filter((n): n is string => n !== undefined);
  }

  return {
    symbol,
    file,
    module,
    inReview,
    symbolChanged,
    changedModule,
    symbolExplanation,
    relevantTips,
    callers,
    callees,
    downstreamModules,
    tests,
    unknowns,
    moduleMetrics,
  };
}

/**
 * Find the most specific symbol containing the given line.
 * If multiple symbols overlap (e.g. nested function inside class),
 * returns the narrowest (smallest line range).
 */
function findSymbolAtLine(
  symbols: SymbolRecord[],
  line: number
): SymbolRecord | undefined {
  const containing = symbols.filter(
    (s) => line >= s.line && line <= s.endLine
  );
  if (containing.length === 0) return undefined;

  // Return the narrowest (most specific) symbol
  return containing.reduce((best, s) => {
    const bestSpan = best.endLine - best.line;
    const sSpan = s.endLine - s.line;
    return sSpan < bestSpan ? s : best;
  });
}

/**
 * Find which module a file belongs to.
 */
function findModuleForFile(
  store: BearingsStore,
  fileId: number
): ModuleRecord | undefined {
  const modules = store.getAllModules();
  return modules.find((m) => m.fileIds.includes(fileId));
}

/**
 * Empty cursor context when file is not indexed.
 */
function emptyCursorContext(): CursorContext {
  return {
    symbol: undefined,
    file: undefined,
    module: undefined,
    inReview: false,
    symbolChanged: false,
    changedModule: undefined,
    symbolExplanation: undefined,
    relevantTips: [],
    callers: [],
    callees: [],
    downstreamModules: [],
    tests: [],
    unknowns: [],
    moduleMetrics: undefined,
  };
}
