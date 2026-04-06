import { BearingsStore } from "../graph/store.js";
import {
  buildEvidence,
  buildSymbolEvidence,
  buildCallEvidence,
} from "../evidence/evidence.js";
import type { FunctionCard, Confidence, Evidence, Unknown } from "../types.js";

/**
 * Generate a FunctionCard for a named function/method.
 * Searches by name; if ambiguous, specify the file path to narrow.
 */
export function generateFunctionCard(
  store: BearingsStore,
  functionName: string,
  filePath?: string
): FunctionCard | undefined {
  let symbols = store.findSymbolByName(functionName);

  if (filePath) {
    const allFiles = store.getAllFiles();
    const targetFile = allFiles.find(
      (f) => f.path === filePath || f.relativePath === filePath
    );
    if (targetFile) {
      symbols = symbols.filter((s) => s.fileId === targetFile.id);
    }
  }

  // Only process functions/methods
  symbols = symbols.filter((s) => s.kind === "function");

  if (symbols.length === 0) return undefined;

  // Take the first match (or the exported one if multiple)
  const sym = symbols.find((s) => s.exported) ?? symbols[0];
  const file = store.getFile(sym.fileId);
  if (!file) return undefined;

  const evidence: Evidence[] = [
    buildSymbolEvidence(
      file.path,
      sym.line,
      sym.endLine,
      sym.name,
      `Function definition extracted from AST at ${file.relativePath}:${sym.line}-${sym.endLine}`
    ),
  ];

  // Callers: who calls this symbol
  const callerEdges = store.getEdgesTo(sym.id, "calls");
  const callers: FunctionCard["callers"] = [];
  for (const edge of callerEdges) {
    const callerSym = store.getSymbol(edge.sourceSymbolId);
    if (!callerSym) continue;
    const callerFile = store.getFile(callerSym.fileId);
    callers.push({
      name: callerSym.name,
      filePath: callerFile?.relativePath ?? "unknown",
      line: callerSym.line,
    });
    if (callerFile) {
      evidence.push(
        buildCallEvidence(callerFile.path, edge.evidenceLine, callerSym.name, sym.name)
      );
    }
  }

  // Callees: what this symbol calls
  const calleeEdges = store.getEdgesFrom(sym.id, "calls");
  const callees: FunctionCard["callees"] = [];
  for (const edge of calleeEdges) {
    const calleeSym = store.getSymbol(edge.targetSymbolId);
    if (!calleeSym) continue;
    const calleeFile = store.getFile(calleeSym.fileId);
    callees.push({
      name: calleeSym.name,
      filePath: calleeFile?.relativePath ?? "unknown",
      line: calleeSym.line,
    });
  }

  // Side effects: writes edges
  const sideEffects: string[] = [];
  const writeEdges = store.getEdgesFrom(sym.id, "writes");
  for (const edge of writeEdges) {
    const targetSym = store.getSymbol(edge.targetSymbolId);
    if (targetSym) {
      sideEffects.push(`writes: ${targetSym.name}`);
    }
  }

  // Linked tests
  const tests = store.getTestsForSymbol(sym.id);
  const linkedTests: FunctionCard["linkedTests"] = tests.map((t) => {
    const testFile = store.getFile(t.fileId);
    return {
      name: t.name,
      filePath: testFile?.relativePath ?? "unknown",
      line: t.line,
    };
  });

  // Purpose: synthesize from name, signature, docs
  const purpose = synthesizePurpose(sym.name, sym.signature, sym.documentation);

  // Confidence
  const confidence: Confidence = determineConfidence(
    callers.length,
    callees.length,
    linkedTests.length,
    sym.documentation !== null
  );

  // Unknowns: detect ambiguities
  const unknowns: Unknown[] = [];
  if (linkedTests.length === 0) {
    unknowns.push({
      category: "incomplete-test-linkage",
      description: `No tests found that exercise "${sym.name}" — coverage unknown`,
      location: `${file.relativePath}:${sym.line}`,
    });
  }
  if (callers.length === 0 && sym.exported) {
    unknowns.push({
      category: "unresolved-export",
      description: `Exported function "${sym.name}" has no detected callers — may be called dynamically or externally`,
      location: `${file.relativePath}:${sym.line}`,
    });
  }

  return {
    name: sym.name,
    signature: sym.signature,
    filePath: file.relativePath,
    line: sym.line,
    purpose,
    callers,
    callees,
    sideEffects,
    linkedTests,
    unknowns,
    confidence,
    evidence,
  };
}

function synthesizePurpose(
  name: string,
  signature: string,
  documentation: string | null
): string {
  if (documentation) {
    // Strip JSDoc markers and take first sentence
    const clean = documentation
      .replace(/\/\*\*|\*\/|\*/g, "")
      .trim()
      .split("\n")[0]
      .trim();
    if (clean.length > 0) return clean;
  }

  return `Function "${name}" — purpose inferred from signature: ${signature}`;
}

function determineConfidence(
  callerCount: number,
  calleeCount: number,
  testCount: number,
  hasDocumentation: boolean
): Confidence {
  let score = 0;
  if (callerCount > 0) score++;
  if (calleeCount > 0) score++;
  if (testCount > 0) score++;
  if (hasDocumentation) score++;

  if (score >= 3) return "high";
  if (score >= 1) return "medium";
  return "low";
}
