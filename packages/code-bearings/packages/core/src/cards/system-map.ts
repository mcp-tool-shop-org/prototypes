import { BearingsStore } from "../graph/store.js";
import type { SystemMap, SystemMapEntry } from "../types.js";

/**
 * Generate a SystemMap from the indexed graph.
 * v1 heuristic: each module is its own subsystem entry.
 * Later versions can cluster modules into semantic subsystems.
 */
export function generateSystemMap(store: BearingsStore): SystemMap {
  const allModules = store.getAllModules();
  const subsystems: SystemMapEntry[] = [];
  const hotspots: SystemMap["hotspots"] = [];
  const weakTestLinkage: SystemMap["weakTestLinkage"] = [];

  for (const mod of allModules) {
    const metrics = store.getModuleMetrics(mod.id);
    const deps = store.getModuleDeps(mod.id);
    const reverseDeps = store.getModuleReverseDeps(mod.id);
    const moduleNameById = new Map(allModules.map((m) => [m.id, m.name]));

    const couplingScore = deps.reduce((sum, d) => sum + d.weight, 0) +
      reverseDeps.reduce((sum, d) => sum + d.weight, 0);

    const riskNotes: string[] = [];
    if (metrics.fanIn > 5) {
      riskNotes.push(`High fan-in (${metrics.fanIn})`);
      hotspots.push({
        moduleName: mod.name,
        fanIn: metrics.fanIn,
        reason: `${metrics.fanIn} modules depend on this`,
      });
    }
    if (metrics.testCount === 0 && metrics.symbolCount > 0) {
      riskNotes.push("No linked tests");
      weakTestLinkage.push({
        moduleName: mod.name,
        testCount: 0,
      });
    }

    subsystems.push({
      subsystem: mod.name,
      modules: [mod.name],
      dominantFlows: [],
      couplingScore,
      riskNotes,
    });
  }

  // Sort hotspots by fan-in descending
  hotspots.sort((a, b) => b.fanIn - a.fanIn);

  // Sort subsystems by coupling score descending
  subsystems.sort((a, b) => b.couplingScore - a.couplingScore);

  return { subsystems, hotspots, weakTestLinkage };
}
