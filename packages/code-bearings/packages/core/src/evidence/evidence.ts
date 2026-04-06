import fs from "node:fs";
import type { Evidence } from "../types.js";

export interface EvidenceOptions {
  /** Number of context lines around the anchor */
  contextLines?: number;
  /** End line for range evidence */
  endLine?: number;
  /** What this evidence proves */
  anchor?: string;
  /** How this evidence was derived */
  derivedFrom?: string;
}

/**
 * Build an Evidence anchor from a file path and line number.
 * Reads the actual source lines as the snippet.
 */
export function buildEvidence(
  filePath: string,
  line: number,
  optsOrContext?: number | EvidenceOptions
): Evidence {
  const opts: EvidenceOptions =
    typeof optsOrContext === "number"
      ? { contextLines: optsOrContext }
      : optsOrContext ?? {};

  const contextLines = opts.contextLines ?? 0;
  const endLine = opts.endLine ?? line;

  let snippet = "";
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const start = Math.max(0, line - 1 - contextLines);
    const end = Math.min(lines.length, endLine + contextLines);
    snippet = lines
      .slice(start, end)
      .map((l, i) => `${start + i + 1}: ${l}`)
      .join("\n");
  } catch {
    snippet = `(unable to read ${filePath}:${line})`;
  }

  return {
    filePath,
    line,
    endLine: endLine !== line ? endLine : undefined,
    snippet,
    anchor: opts.anchor,
    derivedFrom: opts.derivedFrom,
  };
}

/**
 * Build evidence for a symbol definition.
 */
export function buildSymbolEvidence(
  filePath: string,
  line: number,
  endLine: number,
  symbolName: string,
  derivedFrom?: string
): Evidence {
  return buildEvidence(filePath, line, {
    endLine,
    anchor: `symbol: ${symbolName}`,
    derivedFrom: derivedFrom ?? `Symbol extracted from AST at ${filePath}:${line}`,
  });
}

/**
 * Build evidence for a call site.
 */
export function buildCallEvidence(
  filePath: string,
  line: number,
  callerName: string,
  calleeName: string
): Evidence {
  return buildEvidence(filePath, line, {
    contextLines: 1,
    anchor: `call: ${callerName} → ${calleeName}`,
    derivedFrom: `Call expression resolved via TypeScript compiler API`,
  });
}

/**
 * Build evidence for an import relationship.
 */
export function buildImportEvidence(
  filePath: string,
  line: number,
  importedName: string,
  fromModule: string
): Evidence {
  return buildEvidence(filePath, line, {
    anchor: `import: ${importedName} from ${fromModule}`,
    derivedFrom: `Import declaration resolved via module specifier`,
  });
}

/**
 * Build evidence for a module boundary decision.
 */
export function buildBoundaryEvidence(
  filePath: string,
  line: number,
  boundaryKind: string,
  reason: string
): Evidence {
  return buildEvidence(filePath, line, {
    anchor: `boundary: ${boundaryKind}`,
    derivedFrom: reason,
  });
}

/**
 * Build multiple evidence anchors from a list of file/line pairs.
 */
export function buildEvidenceList(
  locations: { filePath: string; line: number; anchor?: string; derivedFrom?: string }[]
): Evidence[] {
  return locations.map((loc) =>
    buildEvidence(loc.filePath, loc.line, {
      anchor: loc.anchor,
      derivedFrom: loc.derivedFrom,
    })
  );
}
