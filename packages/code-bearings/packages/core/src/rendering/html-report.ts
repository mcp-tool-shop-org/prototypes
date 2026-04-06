/**
 * HTML Review Surface — single-file, self-contained, interactive review artifact.
 *
 * Produces a polished HTML report from a ChangeBrief that serves as a
 * navigable visual review surface. All CSS and JS are inlined for
 * offline viewing and PR attachment.
 */

import type {
  ChangeBrief,
  ChangedModule,
  Evidence,
  Unknown,
  DrilldownPath,
  SymbolExplanation,
  ReviewerTip,
  ReviewMode,
} from "../types.js";
import { renderSvgGraph, type GraphData } from "./svg-graph.js";
import type { ModeContent, FailureHypothesis, BlindSpot, SyntaxTranslation, BeforeAfter, ModuleRoleSummary } from "../review/mode-generators.js";
import { getModeContract } from "../review/mode-contracts.js";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function confidenceClass(c: string): string {
  return c === "high" ? "badge-green" : c === "medium" ? "badge-yellow" : "badge-red";
}

function riskBadge(score: number): string {
  if (score >= 30) return '<span class="badge badge-red">HIGH RISK</span>';
  if (score >= 15) return '<span class="badge badge-yellow">MODERATE</span>';
  return '<span class="badge badge-muted">LOW</span>';
}

function changeKindBadge(kind: string): string {
  const colors: Record<string, string> = {
    contract: "badge-red",
    logic: "badge-blue",
    data: "badge-purple",
    wiring: "badge-muted",
    presentation: "badge-cyan",
    "test-only": "badge-green",
    interface: "badge-yellow",
  };
  return `<span class="badge ${colors[kind] || "badge-muted"}">${esc(kind)}</span>`;
}

function renderEvidence(ev: Evidence): string {
  const loc = ev.endLine
    ? `${esc(ev.filePath)}:${ev.line}-${ev.endLine}`
    : `${esc(ev.filePath)}:${ev.line}`;
  const parts = [`<code class="evidence-loc" data-file="${esc(ev.filePath)}" data-line="${ev.line}">${loc}</code>`];
  if (ev.anchor) parts.push(`<span class="evidence-anchor">${esc(ev.anchor)}</span>`);
  if (ev.derivedFrom) parts.push(`<span class="evidence-derived">${esc(ev.derivedFrom)}</span>`);
  return `<div class="evidence-item">${parts.join(" ")}</div>`;
}

function renderSymbolExplanation(se: SymbolExplanation): string {
  const typeColors: Record<string, string> = {
    behavior: "badge-blue",
    contract: "badge-red",
    "control-flow": "badge-purple",
    "data-flow": "badge-cyan",
    "error-handling": "badge-yellow",
    "test-only": "badge-green",
    refactor: "badge-muted",
  };
  const badge = `<span class="badge ${typeColors[se.changeType] || "badge-muted"}">${esc(se.changeType)}</span>`;
  const confBadge = `<span class="badge ${confidenceClass(se.confidence)}" style="font-size:0.6rem">${se.confidence}</span>`;
  return `<div class="symbol-explanation">
    <div class="symbol-explanation-header"><code class="symbol">${esc(se.symbolName)}</code> ${badge} ${confBadge}</div>
    <div class="symbol-explanation-body">${esc(se.explanation)}</div>
  </div>`;
}

function renderReviewerTip(tip: ReviewerTip): string {
  const priorityColors: Record<string, string> = {
    critical: "badge-red",
    important: "badge-yellow",
    suggestion: "badge-muted",
  };
  const badge = `<span class="badge ${priorityColors[tip.priority] || "badge-muted"}">${esc(tip.priority)}</span>`;
  return `<div class="reviewer-tip">
    <div class="reviewer-tip-header"><label><input type="checkbox"> ${badge} ${esc(tip.tip)}</label></div>
    <div class="reviewer-tip-basis">${esc(tip.basis)}</div>
  </div>`;
}

function renderUnknown(u: Unknown): string {
  const loc = u.location ? ` <code>${esc(u.location)}</code>` : "";
  return `<div class="unknown-item"><span class="unknown-cat">${esc(u.category)}</span> ${esc(u.description)}${loc}</div>`;
}

function renderModule(cm: ChangedModule, index: number, brief: ChangeBrief, graphData?: GraphData): string {
  const moduleEvidence = brief.evidence.filter(
    (ev) => ev.anchor?.includes(cm.moduleName) || ev.derivedFrom?.includes(cm.moduleName)
  );
  const moduleTestSignals = brief.testCoverageSignals.filter((tc) =>
    cm.changedSymbols.some((sym) => tc.includes(sym))
  );
  const moduleUnknowns = brief.unknowns.filter(
    (u) => u.location?.includes(cm.moduleName) || u.description.includes(cm.moduleName)
  );
  const moduleDrilldowns = brief.drilldowns.filter(
    (dd) => dd.command.includes(cm.moduleName)
  );

  // Build edge legend from graph data (why impacted traces)
  const edgeLegend = graphData
    ? graphData.edges.filter((e) => e.reason).map((e) => {
        const other = e.from === cm.moduleName ? e.to : e.from;
        return { neighbor: other, reason: e.reason! };
      })
    : [];

  return `
    <div class="module-card" id="module-${index}" data-module-name="${esc(cm.moduleName)}" data-module-index="${index}">
      <div class="module-header" onclick="toggleModule(${index})">
        <div class="module-header-left">
          <span class="expand-icon" id="icon-${index}">▶</span>
          <span class="module-name">${esc(cm.moduleName)}</span>
          ${cm.changeKinds.map(changeKindBadge).join(" ")}
        </div>
        <div class="module-header-right">
          ${riskBadge(cm.riskScore)}
        </div>
      </div>
      <div class="module-body" id="body-${index}" style="display:none">
        ${/* 1. Risk header */""}
        ${cm.riskReason && cm.riskReason !== "low-risk change" ? `
        <div class="module-section">
          <div class="section-label">Risk</div>
          <div>${esc(cm.riskReason)}</div>
        </div>` : ""}

        ${/* 2. Module-level unknowns (near the top, before structural claims) */""}
        ${moduleUnknowns.length > 0 ? `
        <div class="module-section">
          <div class="module-unknowns">
            ${moduleUnknowns.map(renderUnknown).join("")}
          </div>
        </div>` : ""}

        ${/* 3. Semantic change explanations (what changed in meaning) */""}
        ${cm.symbolExplanations.length > 0 ? `
        <div class="module-section">
          <div class="section-label">What Changed</div>
          ${cm.symbolExplanations.map(renderSymbolExplanation).join("")}
        </div>` : cm.changedSymbols.length > 0 ? `
        <div class="module-section">
          <div class="section-label">Changed Symbols</div>
          <div class="symbol-list">
            ${cm.changedSymbols.map((s) => `<code class="symbol">${esc(s)}</code>`).join(" ")}
          </div>
        </div>` : ""}

        ${/* 4. What to check (evidence-backed reviewer tips) */""}
        ${cm.reviewerTips.length > 0 ? `
        <div class="module-section">
          <div class="section-label">What to Check</div>
          ${cm.reviewerTips.map(renderReviewerTip).join("")}
        </div>` : ""}

        ${/* 5. Risk context */""}
        ${cm.affectedDownstream.length > 0 ? `
        <div class="module-section">
          <div class="section-label">Downstream Impact</div>
          <div class="downstream-list">
            ${cm.affectedDownstream.map((d) => `<span class="downstream-tag">${esc(d)}</span>`).join(" ")}
          </div>
        </div>` : ""}

        ${moduleTestSignals.length > 0 ? `
        <div class="module-section">
          <div class="section-label">Test Coverage</div>
          ${moduleTestSignals.map((tc) => {
            const hasTests = !tc.includes("no linked tests");
            return `<div class="${hasTests ? "test-covered" : "test-missing"}">${esc(tc)}</div>`;
          }).join("")}
        </div>` : ""}

        ${/* 4. Local dependency graph */""}
        ${graphData ? `
        <div class="module-section">
          <div class="section-label">Dependency Graph</div>
          <div class="module-graph">${renderSvgGraph(graphData)}</div>
          ${edgeLegend.length > 0 ? `
          <div class="edge-legend">
            ${edgeLegend.map((el) => `<div class="edge-legend-item"><span class="edge-legend-neighbor">${esc(el.neighbor)}</span> <span class="edge-legend-reason">${esc(el.reason)}</span></div>`).join("")}
          </div>` : ""}
        </div>` : ""}

        ${/* 5. Evidence */""}
        ${moduleEvidence.length > 0 ? `
        <div class="module-section">
          <div class="section-label">Evidence</div>
          ${moduleEvidence.slice(0, 5).map(renderEvidence).join("")}
          ${moduleEvidence.length > 5 ? `<div class="evidence-more" onclick="toggleModuleEvidence(${index})" style="cursor:pointer;color:var(--accent);" id="ev-toggle-${index}">Show ${moduleEvidence.length - 5} more...</div><div id="ev-rest-${index}" style="display:none">${moduleEvidence.slice(5).map(renderEvidence).join("")}</div>` : ""}
        </div>` : ""}

        ${/* 6. Drilldown links */""}
        ${moduleDrilldowns.length > 0 ? `
        <div class="module-section">
          <div class="section-label">Drill Down</div>
          <div class="module-drilldowns">
            ${moduleDrilldowns.map((dd) => `<div class="drilldown-item">${esc(dd.label)}: <code>${esc(dd.command)}</code></div>`).join("")}
          </div>
        </div>` : ""}
      </div>
    </div>`;
}

/**
 * Render a Focus Mode page for a single module.
 * Structured reading experience: header → what changed → what to check → risk context → proof.
 */
function renderFocusPage(cm: ChangedModule, index: number, brief: ChangeBrief, moduleGraphs?: Map<string, GraphData>): string {
  const moduleEvidence = brief.evidence.filter(
    (ev) => ev.anchor?.includes(cm.moduleName) || ev.derivedFrom?.includes(cm.moduleName)
  );
  const moduleUnknowns = brief.unknowns.filter(
    (u) => u.location?.includes(cm.moduleName) || u.description.includes(cm.moduleName)
  );
  const moduleDrilldowns = brief.drilldowns.filter(
    (dd) => dd.command.includes(cm.moduleName)
  );
  const graphData = moduleGraphs?.get(cm.moduleName);

  // Module-specific "why this matters" — filter global points relevant to this module
  const moduleWhyPoints = brief.whyThisMatters.filter(
    (p) => p.includes(cm.moduleName) || p.includes("high-risk") && cm.riskScore >= 30
  );

  const edgeLegend = graphData
    ? graphData.edges.filter((e) => e.reason).map((e) => {
        const other = e.from === cm.moduleName ? e.to : e.from;
        return { neighbor: other, reason: e.reason! };
      })
    : [];

  return `
  <div class="focus-page" id="focus-page-${index}" data-module-name="${esc(cm.moduleName)}" data-module-index="${index}" style="display:none">
    <div class="focus-content">
      ${/* HEADER */""}
      <div class="focus-module-header">
        <div class="focus-module-name">
          ${esc(cm.moduleName)}
          ${riskBadge(cm.riskScore)}
          ${cm.changeKinds.map(changeKindBadge).join(" ")}
        </div>
        ${cm.riskReason && cm.riskReason !== "low-risk change" ? `<div style="color:var(--text-muted);font-size:0.9rem;">${esc(cm.riskReason)}</div>` : ""}
      </div>

      ${/* WHY THIS MATTERS (module-specific) */""}
      ${moduleWhyPoints.length > 0 ? `
      <div class="focus-why">
        <div class="section-label">Why This Matters</div>
        ${moduleWhyPoints.map((p) => `<div class="focus-why-item">${esc(p)}</div>`).join("")}
      </div>` : ""}

      ${/* MODULE-LEVEL UNKNOWNS */""}
      ${moduleUnknowns.length > 0 ? `
      <div class="module-unknowns" style="margin:1rem 0">
        <div class="section-label" style="margin-bottom:0.5rem">Uncertainties</div>
        ${moduleUnknowns.map(renderUnknown).join("")}
      </div>` : ""}

      ${/* WHAT CHANGED */""}
      ${cm.symbolExplanations.length > 0 ? `
      <h2>What Changed</h2>
      ${cm.symbolExplanations.map(renderSymbolExplanation).join("")}` : cm.changedSymbols.length > 0 ? `
      <h2>What Changed</h2>
      <div class="symbol-list" style="margin-bottom:1rem">
        ${cm.changedSymbols.map((s) => `<code class="symbol">${esc(s)}</code>`).join(" ")}
      </div>` : ""}

      ${/* WHAT TO CHECK */""}
      ${cm.reviewerTips.length > 0 ? `
      <h2>What to Check</h2>
      ${cm.reviewerTips.map(renderReviewerTip).join("")}` : ""}

      ${/* RISK CONTEXT */""}
      ${cm.affectedDownstream.length > 0 ? `
      <h2>Risk Context</h2>
      <div class="module-section">
        <div class="section-label">Downstream Impact</div>
        <div class="downstream-list">
          ${cm.affectedDownstream.map((d) => `<span class="downstream-tag">${esc(d)}</span>`).join(" ")}
        </div>
      </div>` : ""}

      ${/* PROOF (progressive disclosure) */""}
      ${graphData || moduleEvidence.length > 0 ? `
      <h2>Proof</h2>` : ""}

      ${graphData ? `
      <div class="module-section">
        <div class="section-label">Dependency Graph</div>
        <div class="module-graph">${renderSvgGraph(graphData)}</div>
        ${edgeLegend.length > 0 ? `
        <div class="edge-legend">
          ${edgeLegend.map((el) => `<div class="edge-legend-item"><span class="edge-legend-neighbor">${esc(el.neighbor)}</span> <span class="edge-legend-reason">${esc(el.reason)}</span></div>`).join("")}
        </div>` : ""}
      </div>` : ""}

      ${moduleEvidence.length > 0 ? `
      <div class="module-section">
        <div class="section-label">Evidence</div>
        ${moduleEvidence.slice(0, 8).map(renderEvidence).join("")}
        ${moduleEvidence.length > 8 ? `<div class="evidence-more" style="color:var(--text-muted)">... and ${moduleEvidence.length - 8} more</div>` : ""}
      </div>` : ""}

      ${/* DRILLDOWNS */""}
      ${moduleDrilldowns.length > 0 ? `
      <div class="module-section" style="margin-top:1.5rem">
        <div class="section-label">Drill Down</div>
        <div class="module-drilldowns">
          ${moduleDrilldowns.map((dd) => `<div class="drilldown-item">${esc(dd.label)}: <code>${esc(dd.command)}</code></div>`).join("")}
        </div>
      </div>` : ""}
    </div>
  </div>`;
}

// ── Mode-specific section renderers ──

function renderModeSwitcher(currentMode: ReviewMode): string {
  const modes: { id: ReviewMode; label: string; icon: string }[] = [
    { id: "general", label: "General Review", icon: "📋" },
    { id: "bug-hunter", label: "Bug Hunter", icon: "🔍" },
    { id: "learning", label: "Learning", icon: "📖" },
    { id: "architecture", label: "Architecture", icon: "🏗" },
    { id: "exploration", label: "Exploration", icon: "🧭" },
  ];
  return `<div class="mode-switcher">
    ${modes.map((m) => `<button class="mode-btn${m.id === currentMode ? " mode-active" : ""}" data-mode="${m.id}" onclick="switchMode('${m.id}')">${m.icon} ${m.label}</button>`).join("")}
  </div>`;
}

function renderCanonicalRail(brief: ChangeBrief): string {
  const highRisk = brief.changedModules.filter((cm) => cm.riskScore >= 30).length;
  const changedSyms = brief.changedModules.reduce((n, cm) => n + cm.changedSymbols.length, 0);
  return `<div class="canonical-rail">
    <div class="rail-item"><span class="rail-value">${brief.changedModules.length}</span> <span class="rail-label">modules</span></div>
    <div class="rail-item"><span class="rail-value">${changedSyms}</span> <span class="rail-label">symbols</span></div>
    <div class="rail-item"><span class="rail-value${highRisk > 0 ? " rail-danger" : ""}">${highRisk}</span> <span class="rail-label">high risk</span></div>
    <div class="rail-item"><span class="rail-value${brief.unknowns.length > 0 ? " rail-warn" : ""}">${brief.unknowns.length}</span> <span class="rail-label">unknowns</span></div>
    <div class="rail-item"><span class="rail-value">${brief.evidence.length}</span> <span class="rail-label">evidence</span></div>
  </div>`;
}

function renderFailureHypotheses(hypotheses: FailureHypothesis[]): string {
  if (hypotheses.length === 0) return "";
  const severityColors: Record<string, string> = { high: "badge-red", medium: "badge-yellow", low: "badge-muted" };
  return `<div class="mode-section" data-mode-section="failure-hypotheses">
    <h2>Possible Failure Modes</h2>
    <div class="speculation-notice">These are hypotheses based on diff patterns — not confirmed bugs.</div>
    ${hypotheses.map((h) => `<div class="hypothesis">
      <div class="hypothesis-header"><code class="symbol">${esc(h.symbol)}</code> <span class="badge ${severityColors[h.severity]}">${h.severity}</span></div>
      <div class="hypothesis-body">${esc(h.hypothesis)}</div>
      <div class="hypothesis-basis">${esc(h.basis)}</div>
    </div>`).join("")}
  </div>`;
}

function renderBlindSpots(spots: BlindSpot[]): string {
  if (spots.length === 0) return "";
  return `<div class="mode-section" data-mode-section="blind-spots">
    <h2>Blind Spots</h2>
    ${spots.map((s) => `<div class="blind-spot">
      <div>${esc(s.description)}</div>
      <div class="blind-spot-basis">${esc(s.basis)}</div>
    </div>`).join("")}
  </div>`;
}

function renderInspectionPrompts(prompts: string[]): string {
  if (prompts.length === 0) return "";
  return `<div class="mode-section" data-mode-section="inspection-prompts">
    <h2>Inspection Path</h2>
    <div class="speculation-notice">Suggested mental exercises for the reviewer.</div>
    ${prompts.map((p, i) => `<div class="inspection-prompt"><span class="prompt-number">${i + 1}</span> ${esc(p)}</div>`).join("")}
  </div>`;
}

function renderSyntaxTranslations(translations: SyntaxTranslation[]): string {
  if (translations.length === 0) return "";
  return `<div class="mode-section" data-mode-section="syntax-translations">
    <h2>Key Concepts Used</h2>
    <div class="speculation-notice teaching">Teaching note — these explain language constructs, not review findings.</div>
    ${translations.map((t) => `<div class="syntax-card">
      <div class="syntax-construct">${esc(t.construct)} <span class="badge badge-muted">${t.category}</span></div>
      <code class="syntax-example">${esc(t.codeExample)}</code>
      <div class="syntax-plain">${esc(t.plainEnglish)}</div>
    </div>`).join("")}
  </div>`;
}

function renderBeforeAfter(items: BeforeAfter[]): string {
  if (items.length === 0) return "";
  return `<div class="mode-section" data-mode-section="before-after">
    <h2>Before → After</h2>
    ${items.map((ba) => `<div class="before-after-card">
      <div class="ba-symbol"><code class="symbol">${esc(ba.symbolName)}</code></div>
      <div class="ba-row"><span class="ba-label">Before:</span> ${esc(ba.beforeMeaning)}</div>
      <div class="ba-row"><span class="ba-label">After:</span> ${esc(ba.afterMeaning)}</div>
      <div class="ba-changed">${esc(ba.whatChangedInPlainEnglish)}</div>
    </div>`).join("")}
  </div>`;
}

function renderModuleRoles(roles: ModuleRoleSummary[]): string {
  if (roles.length === 0) return "";
  const posColors: Record<string, string> = { core: "badge-red", bridge: "badge-purple", utility: "badge-blue", leaf: "badge-muted" };
  return `<div class="mode-section" data-mode-section="module-roles">
    <h2>Module Roles</h2>
    ${roles.map((r) => `<div class="role-card">
      <div class="role-header"><span class="module-name">${esc(r.moduleName)}</span> <span class="badge ${posColors[r.systemPosition]}">${r.systemPosition}</span></div>
      <div class="role-desc">${esc(r.role)}</div>
      ${r.touchpoints.length > 0 ? `<div class="role-touchpoints">${r.touchpoints.map((t) => `<span class="touchpoint">${esc(t)}</span>`).join(" ")}</div>` : ""}
    </div>`).join("")}
  </div>`;
}

function renderExplorationPrompts(prompts: string[]): string {
  if (prompts.length === 0) return "";
  return `<div class="mode-section" data-mode-section="exploration-prompts">
    <h2>Questions to Explore</h2>
    <div class="speculation-notice">These prompts help you investigate the change interactively.</div>
    ${prompts.map((p) => `<div class="exploration-prompt-item">${esc(p)}</div>`).join("")}
  </div>`;
}

function renderModeContent(content: ModeContent | undefined, brief: ChangeBrief): string {
  if (!content || content.mode === "general") return "";
  const parts: string[] = [];

  if (content.failureHypotheses) parts.push(renderFailureHypotheses(content.failureHypotheses));
  if (content.blindSpots) parts.push(renderBlindSpots(content.blindSpots));
  if (content.inspectionPrompts) parts.push(renderInspectionPrompts(content.inspectionPrompts));
  if (content.syntaxTranslations) parts.push(renderSyntaxTranslations(content.syntaxTranslations));
  if (content.beforeAfter) parts.push(renderBeforeAfter(content.beforeAfter));
  if (content.moduleRoles) parts.push(renderModuleRoles(content.moduleRoles));
  if (content.explorationPrompts) parts.push(renderExplorationPrompts(content.explorationPrompts));

  return parts.join("\n");
}

export function renderHtmlReport(brief: ChangeBrief, moduleGraphs?: Map<string, GraphData>, reviewMode: ReviewMode = "general", modeContent?: ModeContent): string {
  const moduleCount = brief.changedModules.length;
  const highRiskCount = brief.changedModules.filter((cm) => cm.riskScore >= 30).length;
  const contractCount = brief.contractShifts.length;
  const unknownCount = brief.unknowns.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Code Bearings — Change Brief</title>
<style>
:root {
  --bg: #0d1117;
  --surface: #161b22;
  --surface-2: #1c2128;
  --border: #30363d;
  --text: #c9d1d9;
  --text-muted: #8b949e;
  --accent: #58a6ff;
  --green: #3fb950;
  --yellow: #d29922;
  --red: #f85149;
  --purple: #bc8cff;
  --cyan: #56d4dd;
  --blue: #58a6ff;
  --radius: 8px;
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  --mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font); background: var(--bg); color: var(--text); line-height: 1.6; padding: 2rem; max-width: 960px; margin: 0 auto; }
h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; }
h2 { font-size: 1.1rem; font-weight: 600; color: var(--text-muted); margin: 1.5rem 0 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }

/* Header */
.header { border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem; }
.header-title { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
.header-title h1 { flex: 1; }
.summary { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem; }

/* Badges */
.badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.03em; }
.badge-green { background: rgba(63,185,80,0.15); color: var(--green); }
.badge-yellow { background: rgba(210,153,34,0.15); color: var(--yellow); }
.badge-red { background: rgba(248,81,73,0.15); color: var(--red); }
.badge-blue { background: rgba(88,166,255,0.15); color: var(--blue); }
.badge-purple { background: rgba(188,140,255,0.15); color: var(--purple); }
.badge-cyan { background: rgba(86,212,221,0.15); color: var(--cyan); }
.badge-muted { background: rgba(139,148,158,0.15); color: var(--text-muted); }

/* Stats bar */
.stats { display: flex; gap: 1.5rem; flex-wrap: wrap; margin: 1rem 0; }
.stat { display: flex; flex-direction: column; align-items: center; }
.stat-value { font-size: 1.5rem; font-weight: 700; }
.stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

/* Why This Matters */
.why-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; margin: 1rem 0; }
.why-item { padding: 0.25rem 0; padding-left: 1rem; border-left: 2px solid var(--accent); margin: 0.5rem 0; }

/* Module cards */
.module-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin: 0.5rem 0; overflow: hidden; }
.module-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; cursor: pointer; user-select: none; transition: background 0.15s; }
.module-header:hover { background: var(--surface-2); }
.module-header-left { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.module-header-right { flex-shrink: 0; }
.expand-icon { font-size: 0.7rem; color: var(--text-muted); transition: transform 0.2s; display: inline-block; width: 1rem; }
.expand-icon.open { transform: rotate(90deg); }
.module-name { font-weight: 600; font-size: 0.95rem; }
.module-body { padding: 0 1rem 1rem; border-top: 1px solid var(--border); }
.module-section { margin-top: 0.75rem; }
.section-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }

/* Symbols */
.symbol-list { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.symbol { font-family: var(--mono); font-size: 0.85rem; background: var(--surface-2); padding: 2px 6px; border-radius: 3px; }

/* Downstream */
.downstream-list { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.downstream-tag { font-size: 0.85rem; background: rgba(248,81,73,0.1); color: var(--red); padding: 2px 8px; border-radius: 4px; }

/* Tests */
.test-covered { color: var(--green); font-size: 0.85rem; padding: 2px 0; }
.test-missing { color: var(--yellow); font-size: 0.85rem; padding: 2px 0; }

/* Evidence */
.evidence-item { font-size: 0.85rem; padding: 0.25rem 0; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: baseline; }
.evidence-loc { font-family: var(--mono); font-size: 0.8rem; color: var(--accent); cursor: pointer; }
.evidence-loc:hover { text-decoration: underline; }
.evidence-anchor { color: var(--text-muted); font-size: 0.8rem; }
.evidence-derived { color: var(--text-muted); font-size: 0.8rem; font-style: italic; }
.evidence-more { color: var(--text-muted); font-size: 0.8rem; margin-top: 0.25rem; }

/* Module graph */
.module-graph { margin-top: 0.5rem; background: var(--surface-2); border-radius: var(--radius); padding: 0.5rem; overflow-x: auto; }
.module-graph svg { display: block; margin: 0 auto; }

/* Edge legend (why impacted traces) */
.edge-legend { margin-top: 0.5rem; padding: 0.5rem; background: var(--bg); border-radius: 4px; }
.edge-legend-item { font-size: 0.8rem; padding: 2px 0; display: flex; gap: 0.5rem; align-items: baseline; }
.edge-legend-neighbor { font-weight: 600; color: var(--text); font-family: var(--mono); font-size: 0.8rem; }
.edge-legend-reason { color: var(--text-muted); font-size: 0.8rem; }

/* Module-level unknowns (inline warning) */
.module-unknowns { background: rgba(210,153,34,0.08); border: 1px solid rgba(210,153,34,0.3); border-radius: 4px; padding: 0.5rem 0.75rem; }

/* Module-level drilldowns */
.module-drilldowns { display: flex; flex-direction: column; gap: 0.25rem; }

/* Symbol explanations */
.symbol-explanation { padding: 0.5rem; margin: 0.25rem 0; background: var(--surface-2); border-radius: 4px; }
.symbol-explanation-header { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.25rem; }
.symbol-explanation-body { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }

/* Reviewer tips */
.reviewer-tip { padding: 0.5rem; margin: 0.25rem 0; border-left: 2px solid var(--accent); background: var(--surface-2); border-radius: 0 4px 4px 0; }
.reviewer-tip-header { font-size: 0.9rem; }
.reviewer-tip-header label { display: flex; align-items: baseline; gap: 0.5rem; cursor: pointer; }
.reviewer-tip-header input[type="checkbox"] { accent-color: var(--accent); flex-shrink: 0; }
.reviewer-tip-basis { font-size: 0.75rem; color: var(--text-muted); font-style: italic; margin-top: 0.25rem; padding-left: 1.5rem; }

/* Focus mode */
.focus-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--bg); z-index: 100; overflow-y: auto; padding: 2rem; }
.focus-overlay.active { display: block; }
.focus-nav { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; position: sticky; top: 0; background: var(--bg); z-index: 10; }
.focus-nav-btn { background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); padding: 6px 16px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; }
.focus-nav-btn:hover:not(:disabled) { background: var(--surface-2); color: var(--text); }
.focus-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.focus-counter { font-size: 0.85rem; color: var(--text-muted); }
.focus-content { max-width: 720px; margin: 0 auto; }
.focus-module-header { margin-bottom: 1.5rem; }
.focus-module-name { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.focus-why { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; margin: 1rem 0; }
.focus-why-item { padding: 0.25rem 0; padding-left: 0.75rem; border-left: 2px solid var(--accent); margin: 0.5rem 0; font-size: 0.9rem; }

/* Module index (jump links) */
.module-index { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.module-jump { text-decoration: none; color: var(--text); font-size: 0.85rem; cursor: pointer; padding: 2px 6px; border-radius: 4px; background: var(--surface); border: 1px solid var(--border); transition: background 0.15s; display: inline-flex; align-items: center; gap: 0.35rem; }
.module-jump:hover { background: var(--surface-2); color: var(--accent); }

/* Contract shifts */
.contract-item { border-left: 3px solid var(--red); padding-left: 0.75rem; margin: 0.5rem 0; font-size: 0.9rem; }

/* Focus checklist */
.focus-item { padding: 0.25rem 0; font-size: 0.9rem; }
.focus-item input[type="checkbox"] { margin-right: 0.5rem; accent-color: var(--accent); }

/* Unknowns */
.unknowns-panel { background: rgba(210,153,34,0.08); border: 1px solid rgba(210,153,34,0.3); border-radius: var(--radius); padding: 1rem; margin: 1rem 0; }
.unknown-item { padding: 0.25rem 0; font-size: 0.9rem; }
.unknown-cat { font-family: var(--mono); font-size: 0.8rem; color: var(--yellow); background: rgba(210,153,34,0.15); padding: 1px 6px; border-radius: 3px; margin-right: 0.5rem; }

/* Drilldowns */
.drilldown-list { display: flex; flex-direction: column; gap: 0.25rem; }
.drilldown-item { font-size: 0.9rem; }
.drilldown-item code { font-family: var(--mono); font-size: 0.8rem; background: var(--surface-2); padding: 2px 6px; border-radius: 3px; color: var(--accent); }

/* Footer */
.footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 0.8rem; text-align: center; }

/* Responsive */
@media (max-width: 640px) {
  body { padding: 1rem; }
  .stats { gap: 1rem; }
  .module-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
}

/* Expand all / collapse all */
.controls { display: flex; gap: 0.75rem; margin-bottom: 0.5rem; }
.controls button { background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); padding: 4px 12px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; }
.controls button:hover { background: var(--surface-2); color: var(--text); }
.focus-mode-btn { background: var(--accent) !important; color: var(--bg) !important; border-color: var(--accent) !important; font-weight: 600; }
.focus-mode-btn:hover { opacity: 0.9; }

/* Mode switcher */
.mode-switcher { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; padding: 0.5rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.mode-btn { background: transparent; border: 1px solid transparent; color: var(--text-muted); padding: 6px 14px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; transition: all 0.15s; }
.mode-btn:hover { background: var(--surface-2); color: var(--text); }
.mode-active { background: var(--accent) !important; color: var(--bg) !important; border-color: var(--accent) !important; font-weight: 600; }
.mode-question { color: var(--text-muted); font-size: 0.9rem; font-style: italic; margin: 0.25rem 0 0.5rem; }

/* Canonical rail — always visible */
.canonical-rail { display: flex; gap: 1.5rem; flex-wrap: wrap; padding: 0.75rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 1rem; position: sticky; top: 0; z-index: 50; }
.rail-item { display: flex; align-items: baseline; gap: 0.35rem; }
.rail-value { font-size: 1.1rem; font-weight: 700; font-family: var(--mono); }
.rail-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.rail-danger { color: var(--red); }
.rail-warn { color: var(--yellow); }

/* Mode sections */
.mode-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; margin: 1rem 0; }
.speculation-notice { font-size: 0.8rem; color: var(--yellow); background: rgba(210,153,34,0.08); padding: 0.5rem 0.75rem; border-radius: 4px; margin-bottom: 0.75rem; border-left: 3px solid var(--yellow); }
.speculation-notice.teaching { color: var(--cyan); background: rgba(86,212,221,0.08); border-left-color: var(--cyan); }

/* Bug Hunter: hypotheses */
.hypothesis { padding: 0.75rem; margin: 0.5rem 0; background: var(--surface-2); border-radius: 4px; border-left: 3px solid var(--red); }
.hypothesis-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
.hypothesis-body { font-size: 0.9rem; margin-bottom: 0.25rem; }
.hypothesis-basis { font-size: 0.75rem; color: var(--text-muted); font-style: italic; }

/* Bug Hunter: blind spots */
.blind-spot { padding: 0.5rem; margin: 0.25rem 0; background: rgba(210,153,34,0.08); border-radius: 4px; font-size: 0.9rem; }
.blind-spot-basis { font-size: 0.75rem; color: var(--text-muted); font-style: italic; margin-top: 0.25rem; }

/* Bug Hunter: inspection prompts */
.inspection-prompt { padding: 0.5rem; margin: 0.25rem 0; display: flex; align-items: baseline; gap: 0.75rem; font-size: 0.9rem; }
.prompt-number { font-weight: 700; color: var(--accent); font-family: var(--mono); min-width: 1.5rem; }

/* Learning: syntax translations */
.syntax-card { padding: 0.75rem; margin: 0.5rem 0; background: var(--surface-2); border-radius: 4px; }
.syntax-construct { font-weight: 600; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem; }
.syntax-example { display: block; font-family: var(--mono); font-size: 0.85rem; background: var(--bg); padding: 0.5rem; border-radius: 4px; margin: 0.5rem 0; color: var(--accent); }
.syntax-plain { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; }

/* Learning: before/after */
.before-after-card { padding: 0.75rem; margin: 0.5rem 0; background: var(--surface-2); border-radius: 4px; }
.ba-symbol { margin-bottom: 0.5rem; }
.ba-row { font-size: 0.9rem; padding: 0.25rem 0; display: flex; gap: 0.5rem; }
.ba-label { font-weight: 600; color: var(--text-muted); min-width: 3.5rem; flex-shrink: 0; }
.ba-changed { font-size: 0.85rem; color: var(--accent); margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border); }

/* Architecture: module roles */
.role-card { padding: 0.75rem; margin: 0.5rem 0; background: var(--surface-2); border-radius: 4px; }
.role-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
.role-desc { font-size: 0.9rem; color: var(--text-muted); }
.role-touchpoints { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
.touchpoint { font-family: var(--mono); font-size: 0.8rem; background: var(--bg); padding: 2px 6px; border-radius: 3px; }

/* Exploration: prompts */
.exploration-prompt-item { padding: 0.5rem 0.75rem; margin: 0.25rem 0; background: var(--surface-2); border-radius: 4px; font-size: 0.9rem; cursor: default; border-left: 2px solid var(--accent); }
</style>
</head>
<body>

${renderModeSwitcher(reviewMode)}
${renderCanonicalRail(brief)}

<div class="header">
  <div class="header-title">
    <h1>${reviewMode === "general" ? "Change Brief" : getModeContract(reviewMode).purpose.split("—")[0].trim()}</h1>
    <span class="badge ${confidenceClass(brief.confidence)}">${brief.confidence} confidence</span>
  </div>
  <div class="mode-question">${esc(getModeContract(reviewMode).primaryQuestion)}</div>
  <div class="summary">${esc(brief.summary)}</div>
</div>

${renderModeContent(modeContent, brief)}

${brief.whyThisMatters.length > 0 ? `
<h2>Why This Matters</h2>
<div class="why-section">
  ${brief.whyThisMatters.map((p) => `<div class="why-item">${esc(p)}</div>`).join("")}
</div>` : ""}

<h2>Changed Modules</h2>
<div class="controls">
  <button onclick="expandAll()">Expand All</button>
  <button onclick="collapseAll()">Collapse All</button>
  <button onclick="enterFocusMode(0)" class="focus-mode-btn">Focus Mode</button>
</div>
<div class="module-index">
  ${brief.changedModules.map((cm, i) => {
    const riskClass = cm.riskScore >= 30 ? "badge-red" : cm.riskScore >= 15 ? "badge-yellow" : "badge-muted";
    return `<a class="module-jump" onclick="jumpToModule(${i})">${esc(cm.moduleName)} <span class="badge ${riskClass}" style="font-size:0.65rem">${cm.riskScore >= 30 ? "HIGH" : cm.riskScore >= 15 ? "MOD" : "LOW"}</span></a>`;
  }).join(" ")}
</div>
${brief.changedModules.map((cm, i) => renderModule(cm, i, brief, moduleGraphs?.get(cm.moduleName))).join("")}

${brief.contractShifts.length > 0 ? `
<h2>Contract Shifts</h2>
${brief.contractShifts.map((cs) => `<div class="contract-item">${esc(cs)}</div>`).join("")}` : ""}

${brief.reviewerFocusPoints.length > 0 ? `
<h2>Reviewer Focus</h2>
${brief.reviewerFocusPoints.map((rf) => `<div class="focus-item"><label><input type="checkbox"> ${esc(rf)}</label></div>`).join("")}` : ""}

${brief.unknowns.length > 0 ? `
<h2>Unknowns</h2>
<div class="unknowns-panel">
  ${brief.unknowns.map(renderUnknown).join("")}
</div>` : ""}

${brief.evidence.length > 0 ? `
<h2>Evidence (${brief.evidence.length})</h2>
<div id="evidence-section">
  ${brief.evidence.slice(0, 10).map(renderEvidence).join("")}
  ${brief.evidence.length > 10 ? `
  <div class="evidence-more" id="evidence-toggle" onclick="showAllEvidence()" style="cursor:pointer; color: var(--accent);">
    Show ${brief.evidence.length - 10} more...
  </div>
  <div id="evidence-rest" style="display:none">
    ${brief.evidence.slice(10).map(renderEvidence).join("")}
  </div>` : ""}
</div>` : ""}

${brief.drilldowns.length > 0 ? `
<h2>Next Steps</h2>
<div class="drilldown-list">
  ${brief.drilldowns.map((dd) => `<div class="drilldown-item">${esc(dd.label)}: <code>${esc(dd.command)}</code></div>`).join("")}
</div>` : ""}

<div class="footer">
  Generated by Code Bearings &middot; Get your bearings back in your code &middot; ${new Date().toISOString().split("T")[0]}
</div>

${/* Focus Mode overlay — one page per module, JS-driven navigation */""}
<div class="focus-overlay" id="focus-overlay">
  <div class="focus-nav">
    <button class="focus-nav-btn" id="focus-prev" onclick="focusPrev()">← Previous</button>
    <span class="focus-counter" id="focus-counter"></span>
    <button class="focus-nav-btn" id="focus-exit" onclick="exitFocusMode()">Exit Focus Mode</button>
    <button class="focus-nav-btn" id="focus-next" onclick="focusNext()">Next →</button>
  </div>
  ${brief.changedModules.map((cm, i) => renderFocusPage(cm, i, brief, moduleGraphs)).join("")}
</div>

<script>
function toggleModule(i) {
  const body = document.getElementById('body-' + i);
  const icon = document.getElementById('icon-' + i);
  if (body.style.display === 'none') {
    body.style.display = 'block';
    icon.classList.add('open');
  } else {
    body.style.display = 'none';
    icon.classList.remove('open');
  }
}
function expandAll() {
  document.querySelectorAll('.module-body').forEach(el => el.style.display = 'block');
  document.querySelectorAll('.expand-icon').forEach(el => el.classList.add('open'));
}
function collapseAll() {
  document.querySelectorAll('.module-body').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.expand-icon').forEach(el => el.classList.remove('open'));
}
function showAllEvidence() {
  document.getElementById('evidence-rest').style.display = 'block';
  document.getElementById('evidence-toggle').style.display = 'none';
}
function jumpToModule(i) {
  var card = document.getElementById('module-' + i);
  var body = document.getElementById('body-' + i);
  var icon = document.getElementById('icon-' + i);
  if (body.style.display === 'none') {
    body.style.display = 'block';
    icon.classList.add('open');
  }
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function toggleModuleEvidence(i) {
  var rest = document.getElementById('ev-rest-' + i);
  var toggle = document.getElementById('ev-toggle-' + i);
  if (rest.style.display === 'none') {
    rest.style.display = 'block';
    toggle.textContent = 'Show less';
  } else {
    rest.style.display = 'none';
    toggle.textContent = toggle.dataset.original || 'Show more...';
  }
}
var focusIndex = 0;
var focusTotal = ${brief.changedModules.length};
function enterFocusMode(startAt) {
  focusIndex = startAt || 0;
  document.getElementById('focus-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  showFocusPage();
}
function exitFocusMode() {
  document.getElementById('focus-overlay').classList.remove('active');
  document.body.style.overflow = '';
}
function focusNext() {
  if (focusIndex < focusTotal - 1) { focusIndex++; showFocusPage(); }
}
function focusPrev() {
  if (focusIndex > 0) { focusIndex--; showFocusPage(); }
}
function showFocusPage() {
  for (var i = 0; i < focusTotal; i++) {
    var page = document.getElementById('focus-page-' + i);
    if (page) page.style.display = i === focusIndex ? 'block' : 'none';
  }
  document.getElementById('focus-counter').textContent = (focusIndex + 1) + ' / ' + focusTotal;
  document.getElementById('focus-prev').disabled = focusIndex === 0;
  document.getElementById('focus-next').disabled = focusIndex === focusTotal - 1;
  document.getElementById('focus-overlay').scrollTop = 0;
}
document.addEventListener('keydown', function(e) {
  if (!document.getElementById('focus-overlay').classList.contains('active')) return;
  if (e.key === 'ArrowRight' || e.key === 'j') focusNext();
  if (e.key === 'ArrowLeft' || e.key === 'k') focusPrev();
  if (e.key === 'Escape') exitFocusMode();
});
function switchMode(mode) {
  // Mode switcher just highlights the active button (server renders the right content)
  document.querySelectorAll('.mode-btn').forEach(function(btn) {
    btn.classList.toggle('mode-active', btn.dataset.mode === mode);
  });
}
</script>
</body>
</html>`;
}
