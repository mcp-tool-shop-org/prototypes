import type {
  ModuleCard,
  FunctionCard,
  ChangeBrief,
  SystemMap,
  Evidence,
  Unknown,
  ReviewMode,
} from "../types.js";
import { renderHtmlReport } from "./html-report.js";
import type { GraphData } from "./svg-graph.js";
import type { ModeContent } from "../review/mode-generators.js";

function formatEvidence(ev: Evidence): string {
  const location = ev.endLine
    ? `${ev.filePath}:${ev.line}-${ev.endLine}`
    : `${ev.filePath}:${ev.line}`;
  const parts = [`- ${location}`];
  if (ev.anchor) parts.push(`  [${ev.anchor}]`);
  if (ev.derivedFrom) parts.push(`  derived from: ${ev.derivedFrom}`);
  return parts.join("\n");
}

function formatUnknowns(unknowns: Unknown[], lines: string[]): void {
  if (unknowns.length === 0) return;
  lines.push("## Unknowns");
  for (const u of unknowns) {
    const loc = u.location ? ` (${u.location})` : "";
    lines.push(`- [${u.category}] ${u.description}${loc}`);
  }
  lines.push("");
}

// ── Module Card ──

export function formatModuleCard(card: ModuleCard): string {
  const lines: string[] = [];

  lines.push(`# Module: ${card.name}`);
  lines.push("");
  lines.push(`**Responsibility:** ${card.responsibility}`);
  lines.push(`**Confidence:** ${card.confidence}`);
  lines.push("");

  // Boundary
  lines.push("## Boundary");
  lines.push(`- Kind: ${card.boundary.kind}`);
  lines.push(`- Confidence: ${card.boundary.confidence}`);
  if (card.boundary.reason) {
    lines.push(`- Reason: ${card.boundary.reason}`);
  }
  if (card.boundary.hasBarrel) lines.push("- Has barrel/index export");
  if (card.boundary.hasPackageJson) lines.push("- Has package.json");
  lines.push("");

  // Metrics
  lines.push("## Metrics");
  lines.push(`- Symbols: ${card.metrics.symbolCount}`);
  lines.push(`- Exported: ${card.metrics.exportedSymbolCount}`);
  lines.push(`- Fan-in: ${card.metrics.fanIn}`);
  lines.push(`- Fan-out: ${card.metrics.fanOut}`);
  lines.push(`- Tests: ${card.metrics.testCount}`);
  lines.push(`- Lines of code: ${card.metrics.linesOfCode}`);
  lines.push("");

  // Public surface
  if (card.publicSurface.length > 0) {
    lines.push("## Public Surface");
    for (const sym of card.publicSurface) {
      lines.push(`- \`${sym.signature}\` (${sym.kind})`);
    }
    lines.push("");
  }

  // Dependencies
  if (card.dependencies.length > 0) {
    lines.push("## Dependencies");
    for (const dep of card.dependencies) {
      lines.push(`- → ${dep.moduleName} (weight: ${dep.weight})`);
    }
    lines.push("");
  }

  // Reverse dependencies
  if (card.reverseDependencies.length > 0) {
    lines.push("## Reverse Dependencies (who depends on this)");
    for (const dep of card.reverseDependencies) {
      lines.push(`- ← ${dep.moduleName} (weight: ${dep.weight})`);
    }
    lines.push("");
  }

  // State touched
  if (card.stateTouched.length > 0) {
    lines.push("## State Touched");
    for (const s of card.stateTouched) {
      lines.push(`- ${s}`);
    }
    lines.push("");
  }

  // Risk notes
  if (card.riskNotes.length > 0) {
    lines.push("## Risk Notes");
    for (const note of card.riskNotes) {
      lines.push(`- ${note}`);
    }
    lines.push("");
  }

  // Unknowns
  formatUnknowns(card.unknowns, lines);

  // Evidence
  if (card.evidence.length > 0) {
    lines.push("## Evidence");
    for (const ev of card.evidence.slice(0, 10)) {
      lines.push(formatEvidence(ev));
    }
    if (card.evidence.length > 10) {
      lines.push(`  ... and ${card.evidence.length - 10} more`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ── Function Card ──

export function formatFunctionCard(card: FunctionCard): string {
  const lines: string[] = [];

  lines.push(`# Function: ${card.name}`);
  lines.push("");
  lines.push(`**Signature:** \`${card.signature}\``);
  lines.push(`**Location:** ${card.filePath}:${card.line}`);
  lines.push(`**Purpose:** ${card.purpose}`);
  lines.push(`**Confidence:** ${card.confidence}`);
  lines.push("");

  if (card.callers.length > 0) {
    lines.push("## Callers");
    for (const c of card.callers) {
      lines.push(`- ${c.name} (${c.filePath}:${c.line})`);
    }
    lines.push("");
  }

  if (card.callees.length > 0) {
    lines.push("## Callees");
    for (const c of card.callees) {
      lines.push(`- ${c.name} (${c.filePath}:${c.line})`);
    }
    lines.push("");
  }

  if (card.sideEffects.length > 0) {
    lines.push("## Side Effects");
    for (const s of card.sideEffects) {
      lines.push(`- ${s}`);
    }
    lines.push("");
  }

  if (card.linkedTests.length > 0) {
    lines.push("## Linked Tests");
    for (const t of card.linkedTests) {
      lines.push(`- ${t.name} (${t.filePath}:${t.line})`);
    }
    lines.push("");
  }

  // Unknowns
  formatUnknowns(card.unknowns, lines);

  return lines.join("\n");
}

// ── Change Brief ──

export function formatChangeBrief(
  brief: ChangeBrief,
  mode: "full" | "compact" | "markdown" | "html" = "full",
  moduleGraphs?: Map<string, GraphData>,
  reviewMode?: ReviewMode,
  modeContent?: ModeContent
): string {
  if (mode === "compact") return formatChangeBriefCompact(brief);
  if (mode === "html") return renderHtmlReport(brief, moduleGraphs, reviewMode ?? "general", modeContent);
  // "full" and "markdown" produce the same markdown output
  return formatChangeBriefFull(brief);
}

function formatChangeBriefFull(brief: ChangeBrief): string {
  const lines: string[] = [];

  lines.push("# Change Brief");
  lines.push("");
  lines.push(`**Summary:** ${brief.summary}`);
  lines.push(`**Confidence:** ${brief.confidence}`);
  lines.push("");

  // Why This Matters (first — sets reviewer context)
  if (brief.whyThisMatters.length > 0) {
    lines.push("## Why This Matters");
    for (const point of brief.whyThisMatters) {
      lines.push(`- ${point}`);
    }
    lines.push("");
  }

  // Changed modules (sorted by risk — highest first)
  if (brief.changedModules.length > 0) {
    lines.push("## Changed Modules");
    for (const cm of brief.changedModules) {
      const riskTag = cm.riskScore >= 30 ? " ⚠" : cm.riskScore >= 15 ? " △" : "";
      lines.push(
        `### ${cm.moduleName} [${cm.changeKinds.join(", ")}]${riskTag}`
      );
      if (cm.riskReason && cm.riskReason !== "low-risk change") {
        lines.push(`  Risk: ${cm.riskReason}`);
      }
      if (cm.changedSymbols.length > 0) {
        lines.push(`  Changed: ${cm.changedSymbols.join(", ")}`);
      }
      if (cm.affectedDownstream.length > 0) {
        lines.push(`  Downstream: ${cm.affectedDownstream.join(", ")}`);
      }
    }
    lines.push("");
  }

  // Contract shifts
  if (brief.contractShifts.length > 0) {
    lines.push("## Contract Shifts");
    for (const cs of brief.contractShifts) {
      lines.push(`- ${cs}`);
    }
    lines.push("");
  }

  // Test coverage
  if (brief.testCoverageSignals.length > 0) {
    lines.push("## Test Coverage");
    for (const tc of brief.testCoverageSignals) {
      lines.push(`- ${tc}`);
    }
    lines.push("");
  }

  // Reviewer focus
  if (brief.reviewerFocusPoints.length > 0) {
    lines.push("## Reviewer Focus");
    for (const rf of brief.reviewerFocusPoints) {
      lines.push(`- [ ] ${rf}`);
    }
    lines.push("");
  }

  // Unknowns
  formatUnknowns(brief.unknowns, lines);

  // Evidence
  if (brief.evidence.length > 0) {
    lines.push("## Evidence");
    for (const ev of brief.evidence.slice(0, 15)) {
      lines.push(formatEvidence(ev));
    }
    if (brief.evidence.length > 15) {
      lines.push(`  ... and ${brief.evidence.length - 15} more`);
    }
    lines.push("");
  }

  // Drilldowns
  if (brief.drilldowns.length > 0) {
    lines.push("## Next Steps");
    for (const dd of brief.drilldowns) {
      lines.push(`- ${dd.label}: \`${dd.command}\``);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatChangeBriefCompact(brief: ChangeBrief): string {
  const lines: string[] = [];

  lines.push(`Change Brief | ${brief.confidence} confidence`);
  lines.push(brief.summary);

  if (brief.whyThisMatters.length > 0) {
    lines.push("");
    for (const point of brief.whyThisMatters.slice(0, 2)) {
      lines.push(`  > ${point}`);
    }
  }

  lines.push("");

  for (const cm of brief.changedModules) {
    const riskTag = cm.riskScore >= 30 ? " !!" : cm.riskScore >= 15 ? " !" : "";
    const symbols = cm.changedSymbols.length > 0
      ? `: ${cm.changedSymbols.slice(0, 5).join(", ")}${cm.changedSymbols.length > 5 ? " ..." : ""}`
      : "";
    lines.push(`  ${cm.moduleName} [${cm.changeKinds.join(", ")}]${riskTag}${symbols}`);
    if (cm.affectedDownstream.length > 0) {
      lines.push(`    -> ${cm.affectedDownstream.join(", ")}`);
    }
  }

  if (brief.contractShifts.length > 0) {
    lines.push("");
    lines.push("Contract shifts:");
    for (const cs of brief.contractShifts) {
      lines.push(`  ! ${cs}`);
    }
  }

  if (brief.reviewerFocusPoints.length > 0) {
    lines.push("");
    lines.push("Review checklist:");
    for (const rf of brief.reviewerFocusPoints) {
      lines.push(`  [ ] ${rf}`);
    }
  }

  if (brief.unknowns.length > 0) {
    lines.push("");
    lines.push("Unknowns:");
    for (const u of brief.unknowns) {
      lines.push(`  ? [${u.category}] ${u.description}`);
    }
  }

  return lines.join("\n");
}

// ── System Map (overview) ──

export function formatSystemMap(map: SystemMap): string {
  const lines: string[] = [];

  lines.push("# System Map");
  lines.push("");

  if (map.subsystems.length > 0) {
    lines.push("## Subsystems");
    for (const sub of map.subsystems) {
      lines.push(`### ${sub.subsystem}`);
      lines.push(`  Modules: ${sub.modules.join(", ")}`);
      if (sub.dominantFlows.length > 0) {
        lines.push(`  Flows: ${sub.dominantFlows.join(", ")}`);
      }
      lines.push(`  Coupling score: ${sub.couplingScore}`);
      if (sub.riskNotes.length > 0) {
        for (const note of sub.riskNotes) {
          lines.push(`  Risk: ${note}`);
        }
      }
    }
    lines.push("");
  }

  if (map.hotspots.length > 0) {
    lines.push("## Hotspots (high fan-in)");
    for (const hs of map.hotspots) {
      lines.push(`- ${hs.moduleName} (fan-in: ${hs.fanIn}) — ${hs.reason}`);
    }
    lines.push("");
  }

  if (map.weakTestLinkage.length > 0) {
    lines.push("## Weak Test Linkage");
    for (const wt of map.weakTestLinkage) {
      lines.push(`- ${wt.moduleName} (${wt.testCount} tests)`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
