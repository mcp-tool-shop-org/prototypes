/**
 * Builds GraphData from the BearingsStore for each changed module in a ChangeBrief.
 * Used to render per-module SVG dependency graphs in the HTML report.
 */

import { BearingsStore } from "../graph/store.js";
import type { ChangeBrief } from "../types.js";
import type { GraphData, GraphNode, GraphEdge } from "./svg-graph.js";

/**
 * Build a local dependency graph for each changed module.
 * Returns a map of moduleName → GraphData.
 * Includes "why impacted" trace reasons on edges.
 */
export function buildModuleGraphs(
  store: BearingsStore,
  brief: ChangeBrief
): Map<string, GraphData> {
  const result = new Map<string, GraphData>();
  const changedNames = new Set(brief.changedModules.map((cm) => cm.moduleName));
  const allModules = store.getAllModules();
  const moduleByName = new Map(allModules.map((m) => [m.name, m]));

  for (const cm of brief.changedModules) {
    const mod = moduleByName.get(cm.moduleName);
    if (!mod) continue;

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const seenIds = new Set<string>();

    // Center node (the changed module)
    nodes.push({
      id: cm.moduleName,
      label: cm.moduleName,
      kind: "changed",
    });
    seenIds.add(cm.moduleName);

    // Forward dependencies (what this module depends on)
    const deps = store.getModuleDeps(mod.id);
    for (const dep of deps) {
      const targetMod = allModules.find((m) => m.id === dep.targetModuleId);
      if (!targetMod) continue;
      const name = targetMod.name;
      if (!seenIds.has(name)) {
        seenIds.add(name);
        nodes.push({
          id: name,
          label: name,
          kind: changedNames.has(name) ? "changed" : "direct-dep",
        });
      }

      // Get trace reason
      const reason = buildEdgeReason(store, mod.id, dep.targetModuleId, "imports");

      edges.push({
        from: cm.moduleName,
        to: name,
        kind: "imports",
        reason,
      });
    }

    // Reverse dependencies (what depends on this module)
    const revDeps = store.getModuleReverseDeps(mod.id);
    for (const dep of revDeps) {
      const sourceMod = allModules.find((m) => m.id === dep.sourceModuleId);
      if (!sourceMod) continue;
      const name = sourceMod.name;
      if (!seenIds.has(name)) {
        seenIds.add(name);
        nodes.push({
          id: name,
          label: name,
          kind: changedNames.has(name) ? "changed" : "reverse-dep",
        });
      }

      // Get trace reason (source imports/calls target)
      const reason = buildEdgeReason(store, dep.sourceModuleId, mod.id, "depends");

      edges.push({
        from: name,
        to: cm.moduleName,
        kind: "depends",
        reason,
      });
    }

    // Only include graph if there are connections
    if (nodes.length > 1) {
      result.set(cm.moduleName, {
        nodes,
        edges,
        centerNodeId: cm.moduleName,
      });
    }
  }

  return result;
}

/**
 * Build a terse reason string for a module dep edge.
 * Uses getModuleDepTrace to find symbol-level connections.
 */
function buildEdgeReason(
  store: BearingsStore,
  sourceModuleId: number,
  targetModuleId: number,
  direction: "imports" | "depends"
): string | undefined {
  try {
    const traces = store.getModuleDepTrace(sourceModuleId, targetModuleId);
    if (traces.length === 0) return undefined;

    // Group by edge kind
    const symbolNames = traces.slice(0, 3).map((t) => {
      const verb = t.edgeKind === "calls" ? "calls" : "imports";
      return `${verb} ${t.targetSymbol.name}`;
    });

    let reason = symbolNames.join(", ");
    if (traces.length > 3) {
      reason += ` +${traces.length - 3} more`;
    }

    if (direction === "depends") {
      reason = `depends: ${reason}`;
    }

    return reason;
  } catch {
    return undefined;
  }
}
