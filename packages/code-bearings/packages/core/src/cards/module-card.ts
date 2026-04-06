import { BearingsStore } from "../graph/store.js";
import { buildEvidence, buildSymbolEvidence } from "../evidence/evidence.js";
import type { ModuleCard, Confidence, Evidence, Unknown } from "../types.js";

/**
 * Generate a ModuleCard for a named module.
 * All claims are derived from extracted facts (Layer A) and derived structure (Layer B).
 */
export function generateModuleCard(
  store: BearingsStore,
  moduleName: string
): ModuleCard | undefined {
  const mod = store.getModule(moduleName);
  if (!mod) return undefined;

  const metrics = store.getModuleMetrics(mod.id);
  const evidence: Evidence[] = [];

  // Public surface: exported symbols across module files
  const publicSurface: ModuleCard["publicSurface"] = [];
  const internalParts: ModuleCard["internalParts"] = [];

  for (const fileId of mod.fileIds) {
    const exported = store.getExportedSymbolsByFile(fileId);
    const all = store.getSymbolsByFile(fileId);
    const file = store.getFile(fileId);

    for (const sym of exported) {
      publicSurface.push({
        name: sym.name,
        kind: sym.kind,
        signature: sym.signature,
      });
      if (file) {
        evidence.push(
          buildSymbolEvidence(
            file.path,
            sym.line,
            sym.endLine,
            sym.name,
            `Exported ${sym.kind} "${sym.name}" at ${file.relativePath}:${sym.line}-${sym.endLine}`
          )
        );
      }
    }

    for (const sym of all) {
      if (!sym.exported) {
        internalParts.push({ name: sym.name, kind: sym.kind });
      }
    }
  }

  // Dependencies
  const deps = store.getModuleDeps(mod.id);
  const allModules = store.getAllModules();
  const moduleNameById = new Map(allModules.map((m) => [m.id, m.name]));

  const dependencies: ModuleCard["dependencies"] = deps
    .map((d) => ({
      moduleName: moduleNameById.get(d.targetModuleId) ?? `module:${d.targetModuleId}`,
      weight: d.weight,
    }))
    .sort((a, b) => b.weight - a.weight);

  // Reverse dependencies with traces
  const reverseDeps = store.getModuleReverseDeps(mod.id);
  const reverseDependencies: ModuleCard["reverseDependencies"] = reverseDeps
    .map((d) => {
      // Add evidence traces for why this reverse dep exists
      const traces = store.getModuleDepTrace(d.sourceModuleId, mod.id);
      for (const trace of traces.slice(0, 3)) {
        const sourceFile = store.getFile(trace.sourceSymbol.fileId);
        if (sourceFile) {
          evidence.push(
            buildEvidence(sourceFile.path, trace.line, {
              anchor: `reverse-dep: ${trace.sourceSymbol.name} ${trace.edgeKind} ${trace.targetSymbol.name}`,
              derivedFrom: `Module "${moduleNameById.get(d.sourceModuleId)}" depends on "${moduleName}" via ${trace.edgeKind} edge`,
            })
          );
        }
      }
      return {
        moduleName: moduleNameById.get(d.sourceModuleId) ?? `module:${d.sourceModuleId}`,
        weight: d.weight,
      };
    })
    .sort((a, b) => b.weight - a.weight);

  // State touched: look for writes/reads edges from symbols in this module
  const stateTouched: string[] = [];
  const externalTouchpoints: string[] = [];

  for (const fileId of mod.fileIds) {
    const symbols = store.getSymbolsByFile(fileId);
    for (const sym of symbols) {
      const writes = store.getEdgesFrom(sym.id, "writes");
      const reads = store.getEdgesFrom(sym.id, "reads");
      for (const edge of [...writes, ...reads]) {
        const targetSym = store.getSymbol(edge.targetSymbolId);
        if (targetSym) {
          const label = `${edge.kind}: ${targetSym.name}`;
          if (!stateTouched.includes(label)) {
            stateTouched.push(label);
          }
        }
      }
    }
  }

  // Risk notes
  const riskNotes: string[] = [];
  if (metrics.fanIn > 5) {
    riskNotes.push(
      `High fan-in (${metrics.fanIn}): many modules depend on this — changes have wide blast radius`
    );
  }
  if (metrics.testCount === 0) {
    riskNotes.push("No linked tests detected");
  }
  if (metrics.exportedSymbolCount > 15) {
    riskNotes.push(
      `Large public surface (${metrics.exportedSymbolCount} exports): contract changes affect many consumers`
    );
  }
  if (mod.boundaryConfidence === "low") {
    riskNotes.push(
      `Weak module boundary (${mod.boundaryKind}): ${mod.boundaryReason}`
    );
  }

  // Responsibility: synthesized from facts
  const responsibility = synthesizeResponsibility(moduleName, publicSurface, metrics);

  // Unknowns: detect ambiguities at the module level
  const unknowns: Unknown[] = [];
  if (mod.boundaryConfidence === "low") {
    unknowns.push({
      category: "weak-module-boundary",
      description: `Module boundary is weak (${mod.boundaryKind}): ${mod.boundaryReason}`,
    });
  }
  if (metrics.testCount === 0 && metrics.symbolCount > 0) {
    unknowns.push({
      category: "incomplete-test-linkage",
      description: `No tests linked to any symbol in module "${moduleName}" — test coverage unknown`,
    });
  }

  // Confidence: factor in unknowns
  const confidence: Confidence = determineConfidence(metrics, publicSurface.length);

  return {
    name: moduleName,
    responsibility,
    boundary: {
      kind: mod.boundaryKind,
      confidence: mod.boundaryConfidence,
      reason: mod.boundaryReason,
      hasBarrel: mod.hasBarrel,
      hasPackageJson: mod.hasPackageJson,
    },
    publicSurface,
    internalParts,
    dependencies,
    reverseDependencies,
    stateTouched,
    externalTouchpoints,
    relatedFlows: [],
    riskNotes,
    metrics: {
      symbolCount: metrics.symbolCount,
      exportedSymbolCount: metrics.exportedSymbolCount,
      fanIn: metrics.fanIn,
      fanOut: metrics.fanOut,
      testCount: metrics.testCount,
      linesOfCode: metrics.linesOfCode,
    },
    unknowns,
    confidence,
    evidence,
  };
}

function synthesizeResponsibility(
  moduleName: string,
  publicSurface: ModuleCard["publicSurface"],
  metrics: { symbolCount: number; exportedSymbolCount: number }
): string {
  const exportNames = publicSurface.map((s) => s.name);
  const kinds = [...new Set(publicSurface.map((s) => s.kind))];

  if (publicSurface.length === 0) {
    return `Internal module "${moduleName}" with no public exports.`;
  }

  const kindStr = kinds.join(", ");
  const topExports =
    exportNames.length <= 3
      ? exportNames.join(", ")
      : `${exportNames.slice(0, 3).join(", ")} and ${exportNames.length - 3} more`;

  return `Module "${moduleName}" exposes ${publicSurface.length} public symbols (${kindStr}): ${topExports}. Contains ${metrics.symbolCount} total symbols.`;
}

function determineConfidence(
  metrics: { testCount: number; symbolCount: number; fanIn: number },
  publicSurfaceSize: number
): Confidence {
  // High: well-tested, moderate size, clear structure
  if (metrics.testCount > 0 && metrics.symbolCount < 50) return "high";
  // Medium: some signals present
  if (metrics.symbolCount < 100) return "medium";
  // Low: large, untested, or complex
  return "low";
}
