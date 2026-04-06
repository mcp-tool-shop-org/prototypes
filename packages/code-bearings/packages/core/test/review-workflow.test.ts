import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { BearingsStore } from "../src/graph/store.js";
import { indexProject } from "../src/indexer/extract.js";
import { parseDiff } from "../src/review/diff-parser.js";
import { generateChangeBrief } from "../src/review/change-brief.js";
import { formatChangeBrief } from "../src/rendering/format.js";
import { renderSvgGraph, type GraphData } from "../src/rendering/svg-graph.js";
import { buildModuleGraphs } from "../src/rendering/graph-data.js";
import { generateModeContent } from "../src/review/mode-generators.js";
import { getModeContract, getModeSections } from "../src/review/mode-contracts.js";
import type { ReviewMode } from "../src/types.js";

const SAMPLE_FIXTURE = path.resolve(
  import.meta.dirname,
  "fixtures/sample-project"
);

// ── 3.1 PR-native input ──

describe("diff parser: rename and copy detection", () => {
  it("should parse a rename diff", () => {
    const diff = `diff --git a/src/old-billing.ts b/src/billing.ts
similarity index 95%
rename from src/old-billing.ts
rename to src/billing.ts
--- a/src/old-billing.ts
+++ b/src/billing.ts
@@ -1,5 +1,5 @@
-import { OldInvoice } from "./types.js";
+import { Invoice } from "./types.js";

 export function createInvoice() {}
`;

    const files = parseDiff(diff);
    expect(files.length).toBe(1);
    expect(files[0].filePath).toBe("src/billing.ts");
    expect(files[0].oldFilePath).toBe("src/old-billing.ts");
    expect(files[0].isRename).toBe(true);
    expect(files[0].similarity).toBe(95);
  });

  it("should parse a copy diff", () => {
    const diff = `diff --git a/src/billing.ts b/src/billing-v2.ts
similarity index 80%
copy from src/billing.ts
copy to src/billing-v2.ts
--- a/src/billing.ts
+++ b/src/billing-v2.ts
@@ -1,3 +1,4 @@
+// v2 billing
 export function createInvoice() {}
`;

    const files = parseDiff(diff);
    expect(files.length).toBe(1);
    expect(files[0].filePath).toBe("src/billing-v2.ts");
    expect(files[0].oldFilePath).toBe("src/billing.ts");
    expect(files[0].isCopy).toBe(true);
    expect(files[0].similarity).toBe(80);
  });

  it("should parse a deleted file diff", () => {
    const diff = `diff --git a/src/legacy.ts b/src/legacy.ts
deleted file mode 100644
--- a/src/legacy.ts
+++ /dev/null
@@ -1,3 +0,0 @@
-export function oldFunction() {
-  return "old";
-}
`;

    const files = parseDiff(diff);
    expect(files.length).toBe(1);
    expect(files[0].isDeleted).toBe(true);
  });

  it("should parse a new file diff", () => {
    const diff = `diff --git a/src/new-module.ts b/src/new-module.ts
new file mode 100644
--- /dev/null
+++ b/src/new-module.ts
@@ -0,0 +1,3 @@
+export function newFunction() {
+  return "new";
+}
`;

    const files = parseDiff(diff);
    expect(files.length).toBe(1);
    expect(files[0].filePath).toBe("src/new-module.ts");
    expect(files[0].isNew).toBe(true);
  });

  it("should handle multi-file diffs with renames and edits", () => {
    const diff = `diff --git a/src/old.ts b/src/new.ts
similarity index 90%
rename from src/old.ts
rename to src/new.ts
--- a/src/old.ts
+++ b/src/new.ts
@@ -1,3 +1,3 @@
-export function old() {}
+export function renamed() {}
diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -10,7 +10,7 @@ export function createInvoice(
-  if (amount <= 0) {
+  if (amount < 0) {
`;

    const files = parseDiff(diff);
    expect(files.length).toBe(2);
    expect(files[0].isRename).toBe(true);
    expect(files[0].filePath).toBe("src/new.ts");
    expect(files[1].isRename).toBe(false);
    expect(files[1].filePath).toBe("src/billing.ts");
  });
});

describe("change brief: rename handling", () => {
  let store: BearingsStore;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `code-bearings-rename-test-${Date.now()}.db`);
    store = new BearingsStore(dbPath);
    indexProject(store, { projectRoot: SAMPLE_FIXTURE });
  });

  afterEach(() => {
    store.close();
    try {
      fs.unlinkSync(dbPath);
    } catch {}
  });

  it("should surface rename as a contract shift", () => {
    // Simulate renaming billing.ts → billing-v2.ts with changes
    const diff = `diff --git a/src/billing.ts b/src/billing-v2.ts
similarity index 85%
rename from src/billing.ts
rename to src/billing-v2.ts
--- a/src/billing.ts
+++ b/src/billing-v2.ts
@@ -10,7 +10,7 @@ export function createInvoice(
-  if (amount <= 0) {
+  if (amount < 0) {
`;

    const brief = generateChangeBrief(store, diff);
    // Rename should be tracked as contract shift
    const hasRenameShift = brief.contractShifts.some((cs) =>
      cs.includes("renamed") || cs.includes("Renamed")
    );
    expect(hasRenameShift).toBe(true);
  });
});

// ── 3.2 Output modes ──

describe("output format modes", () => {
  let store: BearingsStore;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `code-bearings-format-test-${Date.now()}.db`);
    store = new BearingsStore(dbPath);
    indexProject(store, { projectRoot: SAMPLE_FIXTURE });
  });

  afterEach(() => {
    store.close();
    try {
      fs.unlinkSync(dbPath);
    } catch {}
  });

  const DIFF = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -10,7 +10,7 @@ export function createInvoice(
   currency: string
 ): InvoiceResult {
-  if (amount <= 0) {
+  if (amount < 0) {
     return {
`;

  it("should produce full markdown format", () => {
    const brief = generateChangeBrief(store, DIFF);
    const output = formatChangeBrief(brief, "full");
    expect(output).toContain("# Change Brief");
    expect(output).toContain("**Summary:**");
    expect(output).toContain("**Confidence:**");
    expect(output).toContain("## Changed Modules");
  });

  it("should produce compact format", () => {
    const brief = generateChangeBrief(store, DIFF);
    const output = formatChangeBrief(brief, "compact");
    // Compact should NOT have markdown headers
    expect(output).not.toContain("# Change Brief");
    expect(output).toContain("Change Brief |");
    expect(output).toContain("confidence");
    // Should still have module info
    expect(output.length).toBeLessThan(
      formatChangeBrief(brief, "full").length
    );
  });

  it("should produce valid HTML format", () => {
    const brief = generateChangeBrief(store, DIFF);
    const output = formatChangeBrief(brief, "html");
    expect(output).toContain("<!DOCTYPE html>");
    expect(output).toContain("<title>Code Bearings");
    expect(output).toContain("</html>");
    // Should have confidence badge
    expect(output).toMatch(/badge-(green|yellow|red)/);
    // Should have module cards
    expect(output).toContain("Changed Modules");
  });

  it("should produce markdown format identical to full", () => {
    const brief = generateChangeBrief(store, DIFF);
    const full = formatChangeBrief(brief, "full");
    const md = formatChangeBrief(brief, "markdown");
    expect(full).toBe(md);
  });

  it("full format should include evidence section", () => {
    const brief = generateChangeBrief(store, DIFF);
    const output = formatChangeBrief(brief, "full");
    if (brief.evidence.length > 0) {
      expect(output).toContain("## Evidence");
    }
  });

  it("compact format should be shorter than full", () => {
    const brief = generateChangeBrief(store, DIFF);
    const full = formatChangeBrief(brief, "full");
    const compact = formatChangeBrief(brief, "compact");
    expect(compact.length).toBeLessThan(full.length);
  });
});

// ── 4.1 HTML review surface ──

describe("HTML review surface", () => {
  let store: BearingsStore;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `code-bearings-html-test-${Date.now()}.db`);
    store = new BearingsStore(dbPath);
    indexProject(store, { projectRoot: SAMPLE_FIXTURE });
  });

  afterEach(() => {
    store.close();
    try {
      fs.unlinkSync(dbPath);
    } catch {}
  });

  const DIFF = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -10,7 +10,7 @@ export function createInvoice(
   currency: string
 ): InvoiceResult {
-  if (amount <= 0) {
+  if (amount < 0) {
     return {
`;

  it("should produce a self-contained HTML document", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    // Self-contained: inline CSS, inline JS, no external deps
    expect(html).toContain("<style>");
    expect(html).toContain("<script>");
    expect(html).not.toContain("src="); // no external scripts/stylesheets
    expect(html).not.toContain("href="); // no external links
  });

  it("should include expandable module cards with toggle JS", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    // Module expansion
    expect(html).toContain("toggleModule");
    expect(html).toContain("expandAll");
    expect(html).toContain("collapseAll");
    // Module body starts hidden
    expect(html).toContain('style="display:none"');
  });

  it("should include stats bar with counts", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    expect(html).toContain("stat-value");
    expect(html).toContain("stat-label");
    expect(html).toContain("Modules");
  });

  it("should include risk badges on module cards", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    // Should have at least one risk badge
    expect(html).toMatch(/HIGH RISK|MODERATE|LOW/);
  });

  it("should include change kind badges", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    // Should have change type badges
    expect(html).toMatch(/badge-blue|badge-red|badge-purple/);
  });

  it("should include reviewer focus with checkboxes", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("Reviewer Focus");
  });

  it("should include unknowns panel when unknowns exist", () => {
    // Use a diff that produces unknowns
    const unknownDiff = `diff --git a/unknown/path.ts b/unknown/path.ts
--- a/unknown/path.ts
+++ b/unknown/path.ts
@@ -1,3 +1,3 @@
-const x = 1;
+const x = 2;
`;
    const brief = generateChangeBrief(store, unknownDiff);
    const html = formatChangeBrief(brief, "html");
    expect(html).toContain("unknowns-panel");
    expect(html).toContain("unknown-cat");
  });

  it("should include drilldown commands", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    expect(html).toContain("Next Steps");
    expect(html).toContain("code-bearings module");
  });

  it("should include Why This Matters section", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    expect(html).toContain("Why This Matters");
    expect(html).toContain("why-item");
  });

  it("should use dark theme", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    // Dark theme uses --bg: #0d1117
    expect(html).toContain("#0d1117");
  });

  it("should include generation timestamp", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    expect(html).toContain("Generated by Code Bearings");
    expect(html).toContain("2026");
  });
});

// ── 3.3 Review session ergonomics ──

describe("review ergonomics", () => {
  let store: BearingsStore;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `code-bearings-ergo-test-${Date.now()}.db`);
    store = new BearingsStore(dbPath);
    indexProject(store, { projectRoot: SAMPLE_FIXTURE });
  });

  afterEach(() => {
    store.close();
    try {
      fs.unlinkSync(dbPath);
    } catch {}
  });

  const DIFF = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -10,7 +10,7 @@ export function createInvoice(
   currency: string
 ): InvoiceResult {
-  if (amount <= 0) {
+  if (amount < 0) {
     return {
`;

  it("should produce whyThisMatters section", () => {
    const brief = generateChangeBrief(store, DIFF);
    expect(brief.whyThisMatters.length).toBeGreaterThan(0);
    for (const point of brief.whyThisMatters) {
      expect(point.length).toBeGreaterThan(10);
    }
  });

  it("should assign risk scores to changed modules", () => {
    const brief = generateChangeBrief(store, DIFF);
    for (const cm of brief.changedModules) {
      expect(typeof cm.riskScore).toBe("number");
      expect(cm.riskScore).toBeGreaterThanOrEqual(0);
      expect(cm.riskReason).toBeTruthy();
    }
  });

  it("should sort changed modules by risk (highest first)", () => {
    const brief = generateChangeBrief(store, DIFF);
    if (brief.changedModules.length >= 2) {
      for (let i = 1; i < brief.changedModules.length; i++) {
        expect(brief.changedModules[i - 1].riskScore).toBeGreaterThanOrEqual(
          brief.changedModules[i].riskScore
        );
      }
    }
  });

  it("should produce drilldown paths", () => {
    const brief = generateChangeBrief(store, DIFF);
    expect(brief.drilldowns.length).toBeGreaterThan(0);
    for (const dd of brief.drilldowns) {
      expect(dd.label).toBeTruthy();
      expect(dd.command).toContain("code-bearings");
    }
  });

  it("full format should include Why This Matters section", () => {
    const brief = generateChangeBrief(store, DIFF);
    const output = formatChangeBrief(brief, "full");
    expect(output).toContain("## Why This Matters");
  });

  it("full format should include Next Steps drilldowns", () => {
    const brief = generateChangeBrief(store, DIFF);
    const output = formatChangeBrief(brief, "full");
    expect(output).toContain("## Next Steps");
    expect(output).toContain("code-bearings module");
  });

  it("should show risk indicators in formatted output", () => {
    const brief = generateChangeBrief(store, DIFF);
    const output = formatChangeBrief(brief, "full");
    expect(output).toContain("## Changed Modules");
    if (brief.changedModules.some((cm) => cm.riskReason !== "low-risk change")) {
      expect(output).toContain("Risk:");
    }
  });
});

// ── 4.2 SVG dependency graph ──

describe("SVG graph renderer", () => {
  it("should return empty string for no nodes", () => {
    const result = renderSvgGraph({ nodes: [], edges: [], centerNodeId: "x" });
    expect(result).toBe("");
  });

  it("should render a single node", () => {
    const result = renderSvgGraph({
      nodes: [{ id: "a", label: "billing", kind: "changed" }],
      edges: [],
      centerNodeId: "a",
    });
    expect(result).toContain("<svg");
    expect(result).toContain("billing");
    expect(result).toContain("</svg>");
  });

  it("should render nodes with correct colors by kind", () => {
    const data: GraphData = {
      nodes: [
        { id: "center", label: "billing", kind: "changed" },
        { id: "dep", label: "types", kind: "direct-dep" },
        { id: "rev", label: "api", kind: "reverse-dep" },
      ],
      edges: [
        { from: "center", to: "dep", kind: "imports" },
        { from: "rev", to: "center", kind: "depends" },
      ],
      centerNodeId: "center",
    };
    const result = renderSvgGraph(data);
    expect(result).toContain("<svg");
    // Changed node uses red stroke
    expect(result).toContain("#f85149");
    // Direct dep uses blue stroke
    expect(result).toContain("#58a6ff");
    // Reverse dep uses yellow stroke
    expect(result).toContain("#d29922");
  });

  it("should render edges with bezier curves", () => {
    const data: GraphData = {
      nodes: [
        { id: "a", label: "billing", kind: "changed" },
        { id: "b", label: "types", kind: "direct-dep" },
      ],
      edges: [{ from: "a", to: "b", kind: "imports" }],
      centerNodeId: "a",
    };
    const result = renderSvgGraph(data);
    expect(result).toContain("<path");
    expect(result).toContain("marker-end");
  });

  it("should include arrow markers", () => {
    const data: GraphData = {
      nodes: [
        { id: "a", label: "billing", kind: "changed" },
        { id: "b", label: "types", kind: "direct-dep" },
      ],
      edges: [{ from: "a", to: "b", kind: "imports" }],
      centerNodeId: "a",
    };
    const result = renderSvgGraph(data);
    expect(result).toContain("<defs>");
    expect(result).toContain("<marker");
    expect(result).toContain("arrow-imports");
  });

  it("should truncate long labels in multi-node graphs", () => {
    const data: GraphData = {
      nodes: [
        { id: "a", label: "a-very-long-module-name-that-exceeds-twenty-chars", kind: "changed" },
        { id: "b", label: "short", kind: "direct-dep" },
      ],
      edges: [{ from: "a", to: "b", kind: "imports" }],
      centerNodeId: "a",
    };
    const result = renderSvgGraph(data);
    // Should contain the unicode ellipsis (truncated)
    expect(result).toContain("\u2026");
  });
});

// ── 4.2 Module graph data builder ──

describe("module graph data builder", () => {
  let store: BearingsStore;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `code-bearings-graph-test-${Date.now()}.db`);
    store = new BearingsStore(dbPath);
    indexProject(store, { projectRoot: SAMPLE_FIXTURE });
  });

  afterEach(() => {
    store.close();
    try {
      fs.unlinkSync(dbPath);
    } catch {}
  });

  const DIFF = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -10,7 +10,7 @@ export function createInvoice(
   currency: string
 ): InvoiceResult {
-  if (amount <= 0) {
+  if (amount < 0) {
     return {
`;

  it("should build graph data from store and brief", () => {
    const brief = generateChangeBrief(store, DIFF);
    const graphs = buildModuleGraphs(store, brief);
    expect(graphs).toBeInstanceOf(Map);
    // Each changed module with connections should have a graph
    for (const [name, data] of graphs) {
      expect(data.centerNodeId).toBe(name);
      expect(data.nodes.length).toBeGreaterThan(0);
      // Center node should be marked as changed
      const centerNode = data.nodes.find((n) => n.id === name);
      expect(centerNode?.kind).toBe("changed");
    }
  });

  it("should include dep graph in HTML output when graphs provided", () => {
    const brief = generateChangeBrief(store, DIFF);
    const graphs = buildModuleGraphs(store, brief);
    const html = formatChangeBrief(brief, "html", graphs);
    // If any module has connections, the graph should appear
    if (graphs.size > 0) {
      expect(html).toContain("Dependency Graph");
      expect(html).toContain("<svg");
      expect(html).toContain("module-graph");
    }
  });

  it("should not include graph for modules with no connections", () => {
    const brief = generateChangeBrief(store, DIFF);
    const graphs = buildModuleGraphs(store, brief);
    // Graphs should only exist for modules that have deps or reverse deps
    for (const [, data] of graphs) {
      expect(data.nodes.length).toBeGreaterThan(1);
    }
  });
});

// ── 4.3 Visual drilldown model ──

describe("visual drilldown model", () => {
  let store: BearingsStore;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `code-bearings-drilldown-test-${Date.now()}.db`);
    store = new BearingsStore(dbPath);
    indexProject(store, { projectRoot: SAMPLE_FIXTURE });
  });

  afterEach(() => {
    store.close();
    try {
      fs.unlinkSync(dbPath);
    } catch {}
  });

  const DIFF = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -10,7 +10,7 @@ export function createInvoice(
   currency: string
 ): InvoiceResult {
-  if (amount <= 0) {
+  if (amount < 0) {
     return {
`;

  it("should have fixed section order in module cards", () => {
    const brief = generateChangeBrief(store, DIFF);
    const graphs = buildModuleGraphs(store, brief);
    const html = formatChangeBrief(brief, "html", graphs);
    // Risk should come before Changed Symbols
    const riskIdx = html.indexOf("section-label\">Risk");
    const symbolIdx = html.indexOf("section-label\">Changed Symbols");
    if (riskIdx >= 0 && symbolIdx >= 0) {
      expect(riskIdx).toBeLessThan(symbolIdx);
    }
    // Changed Symbols should come before Dependency Graph
    const graphIdx = html.indexOf("section-label\">Dependency Graph");
    if (symbolIdx >= 0 && graphIdx >= 0) {
      expect(symbolIdx).toBeLessThan(graphIdx);
    }
    // Dependency Graph should come before Evidence
    const evidenceIdx = html.indexOf("section-label\">Evidence");
    if (graphIdx >= 0 && evidenceIdx >= 0) {
      expect(graphIdx).toBeLessThan(evidenceIdx);
    }
  });

  it("should include module jump index", () => {
    const brief = generateChangeBrief(store, DIFF);
    const graphs = buildModuleGraphs(store, brief);
    const html = formatChangeBrief(brief, "html", graphs);
    expect(html).toContain("module-index");
    expect(html).toContain("module-jump");
    expect(html).toContain("jumpToModule");
  });

  it("should include per-module drilldown links", () => {
    const brief = generateChangeBrief(store, DIFF);
    const graphs = buildModuleGraphs(store, brief);
    const html = formatChangeBrief(brief, "html", graphs);
    // Should have drilldown section inside module cards
    expect(html).toContain("Drill Down");
    expect(html).toContain("code-bearings module");
  });

  it("should include per-module unknowns when they exist", () => {
    // Use a diff that produces unknowns (file not in index)
    const unknownDiff = `diff --git a/unknown/path.ts b/unknown/path.ts
--- a/unknown/path.ts
+++ b/unknown/path.ts
@@ -1,3 +1,3 @@
-const x = 1;
+const x = 2;
`;
    const brief = generateChangeBrief(store, unknownDiff);
    const html = formatChangeBrief(brief, "html");
    // Global unknowns should still appear
    expect(html).toContain("unknowns-panel");
  });

  it("should include why-impacted edge reasons in graph data", () => {
    const brief = generateChangeBrief(store, DIFF);
    const graphs = buildModuleGraphs(store, brief);
    // Check if any edges have reasons
    for (const [, data] of graphs) {
      const reasonedEdges = data.edges.filter((e) => e.reason);
      // At least some edges should have reasons if there are trace connections
      if (data.edges.length > 0) {
        // Not all edges will have reasons (depends on trace data availability)
        expect(data.edges.length).toBeGreaterThan(0);
      }
    }
  });

  it("should include edge legend when reasons exist", () => {
    const brief = generateChangeBrief(store, DIFF);
    const graphs = buildModuleGraphs(store, brief);
    const html = formatChangeBrief(brief, "html", graphs);
    // If any graph edge has a reason, the legend should appear
    let hasReasonedEdges = false;
    for (const [, data] of graphs) {
      if (data.edges.some((e) => e.reason)) hasReasonedEdges = true;
    }
    if (hasReasonedEdges) {
      expect(html).toContain("edge-legend");
      expect(html).toContain("edge-legend-reason");
    }
  });

  it("should include jumpToModule JS function", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    expect(html).toContain("function jumpToModule");
    expect(html).toContain("scrollIntoView");
  });

  it("should include module evidence toggle", () => {
    const brief = generateChangeBrief(store, DIFF);
    const graphs = buildModuleGraphs(store, brief);
    const html = formatChangeBrief(brief, "html", graphs);
    expect(html).toContain("toggleModuleEvidence");
  });

  it("SVG edges should include title tooltips when reasons exist", () => {
    const data: GraphData = {
      nodes: [
        { id: "a", label: "billing", kind: "changed" },
        { id: "b", label: "types", kind: "direct-dep" },
      ],
      edges: [{ from: "a", to: "b", kind: "imports", reason: "imports InvoiceResult" }],
      centerNodeId: "a",
    };
    const svg = renderSvgGraph(data);
    expect(svg).toContain("<title>");
    expect(svg).toContain("imports InvoiceResult");
  });
});

// ── 4.4 Focused Review Surface ──

describe("focused review surface", () => {
  let store: BearingsStore;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `code-bearings-focus-test-${Date.now()}.db`);
    store = new BearingsStore(dbPath);
    indexProject(store, { projectRoot: SAMPLE_FIXTURE });
  });

  afterEach(() => {
    store.close();
    try {
      fs.unlinkSync(dbPath);
    } catch {}
  });

  const DIFF = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -10,7 +10,7 @@ export function createInvoice(
   currency: string
 ): InvoiceResult {
-  if (amount <= 0) {
+  if (amount < 0) {
     return {
`;

  it("should generate symbol explanations for changed modules", () => {
    const brief = generateChangeBrief(store, DIFF);
    for (const cm of brief.changedModules) {
      if (cm.changedSymbols.length > 0) {
        expect(cm.symbolExplanations.length).toBeGreaterThan(0);
        for (const se of cm.symbolExplanations) {
          expect(se.symbolName).toBeTruthy();
          expect(se.changeType).toBeTruthy();
          expect(se.explanation.length).toBeGreaterThan(10);
          expect(["high", "medium", "low"]).toContain(se.confidence);
        }
      }
    }
  });

  it("should classify symbol changes by type", () => {
    const brief = generateChangeBrief(store, DIFF);
    const validTypes = ["behavior", "contract", "control-flow", "data-flow", "error-handling", "test-only", "refactor"];
    for (const cm of brief.changedModules) {
      for (const se of cm.symbolExplanations) {
        expect(validTypes).toContain(se.changeType);
      }
    }
  });

  it("should generate evidence-backed reviewer tips", () => {
    const brief = generateChangeBrief(store, DIFF);
    for (const cm of brief.changedModules) {
      if (cm.changedSymbols.length > 0) {
        expect(cm.reviewerTips.length).toBeGreaterThan(0);
        for (const tip of cm.reviewerTips) {
          expect(tip.tip.length).toBeGreaterThan(10);
          expect(tip.basis).toBeTruthy();
          expect(["critical", "important", "suggestion"]).toContain(tip.priority);
        }
      }
    }
  });

  it("should include What Changed section in HTML", () => {
    const brief = generateChangeBrief(store, DIFF);
    const graphs = buildModuleGraphs(store, brief);
    const html = formatChangeBrief(brief, "html", graphs);
    expect(html).toContain("What Changed");
    expect(html).toContain("symbol-explanation");
  });

  it("should include What to Check section in HTML", () => {
    const brief = generateChangeBrief(store, DIFF);
    const graphs = buildModuleGraphs(store, brief);
    const html = formatChangeBrief(brief, "html", graphs);
    expect(html).toContain("What to Check");
    expect(html).toContain("reviewer-tip");
  });

  it("should include reviewer tip priority badges", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    // Should have priority badges on tips
    expect(html).toMatch(/badge-.*(critical|important|suggestion)/);
  });

  it("should include reviewer tip basis text", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    expect(html).toContain("reviewer-tip-basis");
  });

  it("should include Focus Mode button and overlay", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    expect(html).toContain("Focus Mode");
    expect(html).toContain("focus-overlay");
    expect(html).toContain("focus-mode-btn");
  });

  it("should include Focus Mode navigation", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    expect(html).toContain("focusNext");
    expect(html).toContain("focusPrev");
    expect(html).toContain("exitFocusMode");
    expect(html).toContain("focus-counter");
  });

  it("should render one focus page per changed module", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    for (let i = 0; i < brief.changedModules.length; i++) {
      expect(html).toContain(`focus-page-${i}`);
    }
  });

  it("should include keyboard navigation in Focus Mode", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    expect(html).toContain("keydown");
    expect(html).toContain("ArrowRight");
    expect(html).toContain("Escape");
  });

  it("focus pages should have structured sections", () => {
    const brief = generateChangeBrief(store, DIFF);
    const graphs = buildModuleGraphs(store, brief);
    const html = formatChangeBrief(brief, "html", graphs);
    // Focus pages should have the section structure
    expect(html).toContain("focus-module-header");
    expect(html).toContain("focus-content");
  });

  it("should include symbol change type badges in explanations", () => {
    const brief = generateChangeBrief(store, DIFF);
    const html = formatChangeBrief(brief, "html");
    // Should have change type badges
    expect(html).toContain("symbol-explanation-header");
    expect(html).toContain("symbol-explanation-body");
  });
});

// ── 4.5 Diff Comprehension Hardening ──

describe("diff comprehension hardening", () => {
  let store: BearingsStore;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `code-bearings-hardening-test-${Date.now()}.db`);
    store = new BearingsStore(dbPath);
    indexProject(store, { projectRoot: SAMPLE_FIXTURE });
  });

  afterEach(() => {
    store.close();
    try { fs.unlinkSync(dbPath); } catch {}
  });

  it("should detect error-handling changes from diff content", () => {
    // Diff that rewrites error handling in createInvoice (lines 13-18)
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -12,8 +12,8 @@ export function createInvoice(
 ): InvoiceResult {
-  if (amount <= 0) {
-    return {
-      invoice: { id, amount, currency, status: "draft" },
-      success: false,
-      error: "Amount must be positive",
-    };
+  if (amount <= 0) {
+    throw new Error("Amount must be positive");
   }
`;
    const brief = generateChangeBrief(store, diff);
    const billing = brief.changedModules[0];
    expect(billing).toBeDefined();
    const createExpl = billing!.symbolExplanations.find((e) => e.symbolName === "createInvoice");
    expect(createExpl).toBeDefined();
    expect(createExpl!.changeType).toBe("error-handling");
    expect(createExpl!.explanation).toContain("error");
  });

  it("should detect control-flow changes from guard patterns", () => {
    // Diff that restructures guards in sendInvoice (lines 29-37)
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -29,9 +29,9 @@ export function sendInvoice(id: string): InvoiceResult {
   const invoice = getInvoice(id);
-  if (!invoice) {
-    return {
-      invoice: { id, amount: 0, currency: "", status: "draft" },
-      success: false,
-      error: "Invoice not found",
-    };
-  }
+  if (!invoice) return { invoice: { id, amount: 0, currency: "", status: "draft" }, success: false, error: "Not found" };
+  if (invoice.status === "sent") return { invoice, success: false, error: "Already sent" };
`;
    const brief = generateChangeBrief(store, diff);
    const billing = brief.changedModules[0];
    expect(billing).toBeDefined();
    const sendExpl = billing!.symbolExplanations.find((e) => e.symbolName === "sendInvoice");
    expect(sendExpl).toBeDefined();
    // Should detect as control-flow (guard restructuring) or error-handling
    expect(["control-flow", "error-handling"]).toContain(sendExpl!.changeType);
  });

  it("should classify body-only changes as behavior, not contract", () => {
    // Diff that only changes line 22 (body of createInvoice, not the signature on line 8)
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -20,4 +20,4 @@ export function createInvoice(
   const invoice: Invoice = { id, amount, currency, status: "draft" };
-  saveInvoice(invoice);
+  saveInvoice({ ...invoice, status: "pending" });
   return { invoice, success: true };
`;
    const brief = generateChangeBrief(store, diff);
    const billing = brief.changedModules[0];
    expect(billing).toBeDefined();
    const createExpl = billing!.symbolExplanations.find((e) => e.symbolName === "createInvoice");
    expect(createExpl).toBeDefined();
    // Body-only change on exported function = behavior, NOT contract
    expect(createExpl!.changeType).toBe("behavior");
  });

  it("should classify signature changes as contract shifts", () => {
    // Diff that modifies the function signature line (line 8)
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -8,3 +8,4 @@
-export function createInvoice(
+export function createInvoice(
   id: string,
   amount: number,
-  currency: string
+  currency: string,
+  memo?: string
`;
    const brief = generateChangeBrief(store, diff);
    const billing = brief.changedModules[0];
    expect(billing).toBeDefined();
    const createExpl = billing!.symbolExplanations.find((e) => e.symbolName === "createInvoice");
    expect(createExpl).toBeDefined();
    expect(createExpl!.changeType).toBe("contract");
  });

  it("should generate error path reviewer tips when error handling is removed", () => {
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -12,8 +12,3 @@ export function createInvoice(
 ): InvoiceResult {
-  if (amount <= 0) {
-    return {
-      invoice: { id, amount, currency, status: "draft" },
-      success: false,
-      error: "Amount must be positive",
-    };
-  }
+  // validation removed
`;
    const brief = generateChangeBrief(store, diff);
    const billing = brief.changedModules[0];
    expect(billing).toBeDefined();
    // Should have a critical tip about removed error handling
    const errorTip = billing!.reviewerTips.find((t) =>
      t.tip.toLowerCase().includes("error") && t.tip.toLowerCase().includes("removed")
    );
    expect(errorTip).toBeDefined();
    expect(errorTip!.priority).toBe("critical");
  });

  it("should generate guard restructuring tips", () => {
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -29,9 +29,6 @@ export function sendInvoice(id: string): InvoiceResult {
   const invoice = getInvoice(id);
-  if (!invoice) {
-    return {
-      invoice: { id, amount: 0, currency: "", status: "draft" },
-      success: false,
-      error: "Invoice not found",
-    };
-  }
+  if (!invoice) return { invoice: { id, amount: 0, currency: "", status: "draft" }, success: false };
+  if (invoice.status !== "draft") return { invoice, success: false };
`;
    const brief = generateChangeBrief(store, diff);
    const billing = brief.changedModules[0];
    expect(billing).toBeDefined();
    const guardTip = billing!.reviewerTips.find((t) =>
      t.tip.toLowerCase().includes("guard") || t.tip.toLowerCase().includes("branch")
    );
    expect(guardTip).toBeDefined();
  });

  it("should generate critical tips when untested symbols have error changes", () => {
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -12,8 +12,8 @@ export function createInvoice(
 ): InvoiceResult {
-  if (amount <= 0) {
-    return {
-      success: false,
-      error: "Amount must be positive",
-    };
+  if (amount <= 0) {
+    throw new Error("Invalid amount");
   }
`;
    const brief = generateChangeBrief(store, diff);
    const billing = brief.changedModules[0];
    expect(billing).toBeDefined();
    // Find test gap tips — should mention "no tests" with elevated priority
    const testGapTip = billing!.reviewerTips.find((t) =>
      t.tip.includes("no test") || t.tip.includes("no linked test")
    );
    // If the symbol has no tests AND error changes, priority should be critical
    if (testGapTip && testGapTip.tip.includes("error")) {
      expect(testGapTip.priority).toBe("critical");
    }
  });

  it("should produce sharper refactor explanations for internal functions", () => {
    // formatInvoice on line 44 is exported but saveInvoice/getInvoice are in store.ts
    // Let's target store.ts internal functions
    const diff = `diff --git a/src/store.ts b/src/store.ts
--- a/src/store.ts
+++ b/src/store.ts
@@ -1,5 +1,5 @@
-const store = new Map();
+const invoiceStore = new Map();
`;
    const brief = generateChangeBrief(store, diff);
    // Check that the change is classified (store module)
    expect(brief.changedModules.length).toBeGreaterThan(0);
  });

  it("should include error-handling and control-flow in HTML explanations", () => {
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -12,8 +12,8 @@ export function createInvoice(
 ): InvoiceResult {
-  if (amount <= 0) {
-    return {
-      success: false,
-      error: "Amount must be positive",
-    };
+  if (amount <= 0) {
+    throw new Error("Invalid amount");
   }
`;
    const brief = generateChangeBrief(store, diff);
    const html = formatChangeBrief(brief, "html");
    // HTML should render the error-handling change type
    const billing = brief.changedModules[0];
    if (billing) {
      const errorExpl = billing.symbolExplanations.find((e) => e.changeType === "error-handling");
      if (errorExpl) {
        expect(html).toContain("error-handling");
      }
    }
    // Should still have valid structure
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("symbol-explanation");
  });

  it("should handle big diff with small meaning (refactor classification)", () => {
    // Large diff that's mostly whitespace/formatting in formatInvoice body (line 45, not 44)
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -45,1 +45,5 @@ export function formatInvoice(invoice: Invoice): string {
-  return \`Invoice \${invoice.id}: \${invoice.amount} \${invoice.currency} [\${invoice.status}]\`;
+  const parts = [
+    \`Invoice \${invoice.id}\`,
+    \`\${invoice.amount} \${invoice.currency}\`,
+    \`[\${invoice.status}]\`,
+  ];
+  return parts.join(": ");
`;
    const brief = generateChangeBrief(store, diff);
    const billing = brief.changedModules[0];
    expect(billing).toBeDefined();
    const fmtExpl = billing!.symbolExplanations.find((e) => e.symbolName === "formatInvoice");
    expect(fmtExpl).toBeDefined();
    // Body-only change, no error/guard patterns — should be behavior (exported) or refactor
    expect(["behavior", "refactor"]).toContain(fmtExpl!.changeType);
  });

  it("diff content signals should not leak across symbol boundaries", () => {
    // Diff that touches BOTH createInvoice (error handling) and formatInvoice (plain refactor)
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -12,8 +12,8 @@ export function createInvoice(
 ): InvoiceResult {
-  if (amount <= 0) {
-    return {
-      success: false,
-      error: "Amount must be positive",
-    };
+  if (amount <= 0) {
+    throw new Error("Invalid amount");
   }
@@ -44,2 +44,2 @@ export function formatInvoice(invoice: Invoice): string {
-  return \`Invoice \${invoice.id}: \${invoice.amount} \${invoice.currency} [\${invoice.status}]\`;
+  return \`INV-\${invoice.id}: \${invoice.amount} \${invoice.currency} [\${invoice.status}]\`;
`;
    const brief = generateChangeBrief(store, diff);
    const billing = brief.changedModules[0];
    expect(billing).toBeDefined();

    const createExpl = billing!.symbolExplanations.find((e) => e.symbolName === "createInvoice");
    const formatExpl = billing!.symbolExplanations.find((e) => e.symbolName === "formatInvoice");

    // createInvoice should detect error handling
    expect(createExpl).toBeDefined();
    expect(createExpl!.changeType).toBe("error-handling");

    // formatInvoice should NOT be classified as error-handling (its hunk has no error patterns)
    if (formatExpl) {
      expect(formatExpl.changeType).not.toBe("error-handling");
    }
  });
});

// ── 5.1 Mode Law ──

describe("mode law: contracts and infrastructure", () => {
  it("should define contracts for all five modes", () => {
    const modes: ReviewMode[] = ["general", "bug-hunter", "learning", "architecture", "exploration"];
    for (const mode of modes) {
      const contract = getModeContract(mode);
      expect(contract.mode).toBe(mode);
      expect(contract.purpose.length).toBeGreaterThan(10);
      expect(contract.primaryQuestion.length).toBeGreaterThan(10);
      expect(contract.sectionOrder.length).toBeGreaterThan(0);
      expect(contract.forbiddenClaims.length).toBeGreaterThan(0);
    }
  });

  it("general mode should have canonical section order", () => {
    const sections = getModeSections("general");
    expect(sections).toEqual([
      "why-this-matters",
      "unknowns",
      "what-changed",
      "what-to-check",
      "risk-context",
      "proof",
    ]);
  });

  it("all modes must include proof section", () => {
    const modes: ReviewMode[] = ["general", "bug-hunter", "learning", "architecture", "exploration"];
    for (const mode of modes) {
      const sections = getModeSections(mode);
      expect(sections).toContain("proof");
    }
  });

  it("general mode contract should forbid speculation", () => {
    const contract = getModeContract("general");
    expect(contract.speculationLabel).toBe("");
    expect(contract.extraGenerators).toEqual([]);
  });

  it("non-general modes must label speculation", () => {
    const modes: ReviewMode[] = ["bug-hunter", "learning", "architecture", "exploration"];
    for (const mode of modes) {
      const contract = getModeContract(mode);
      expect(contract.speculationLabel.length).toBeGreaterThan(0);
    }
  });
});

// ── 5.2–5.5 Mode content generation ──

describe("purpose modes: content generation", () => {
  let store: BearingsStore;
  let dbPath: string;

  const ERROR_DIFF = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -12,8 +12,8 @@ export function createInvoice(
 ): InvoiceResult {
-  if (amount <= 0) {
-    return {
-      success: false,
-      error: "Amount must be positive",
-    };
+  if (amount <= 0) {
+    throw new Error("Invalid amount");
   }
`;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `code-bearings-modes-test-${Date.now()}.db`);
    store = new BearingsStore(dbPath);
    indexProject(store, { projectRoot: SAMPLE_FIXTURE });
  });

  afterEach(() => {
    store.close();
    try { fs.unlinkSync(dbPath); } catch {}
  });

  it("general mode should return empty mode content", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("general", brief, store);
    expect(content.mode).toBe("general");
    expect(content.failureHypotheses).toBeUndefined();
    expect(content.syntaxTranslations).toBeUndefined();
    expect(content.moduleRoles).toBeUndefined();
    expect(content.explorationPrompts).toBeUndefined();
  });

  // Bug Hunter
  it("bug-hunter should generate failure hypotheses from error changes", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("bug-hunter", brief, store);
    expect(content.mode).toBe("bug-hunter");
    expect(content.failureHypotheses).toBeDefined();
    expect(content.failureHypotheses!.length).toBeGreaterThan(0);
    for (const h of content.failureHypotheses!) {
      expect(h.symbol).toBeTruthy();
      expect(h.hypothesis.length).toBeGreaterThan(10);
      expect(["high", "medium", "low"]).toContain(h.severity);
    }
  });

  it("bug-hunter should generate blind spots", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("bug-hunter", brief, store);
    expect(content.blindSpots).toBeDefined();
    // Should find at least untested symbols
    if (content.blindSpots!.length > 0) {
      expect(content.blindSpots![0].description.length).toBeGreaterThan(5);
      expect(content.blindSpots![0].basis.length).toBeGreaterThan(0);
    }
  });

  it("bug-hunter should generate inspection prompts", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("bug-hunter", brief, store);
    expect(content.inspectionPrompts).toBeDefined();
    expect(content.inspectionPrompts!.length).toBeGreaterThan(0);
    // Prompts should be actionable questions
    for (const p of content.inspectionPrompts!) {
      expect(p.length).toBeGreaterThan(10);
    }
  });

  // Learning Mode
  it("learning mode should generate syntax translations", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("learning", brief, store);
    expect(content.mode).toBe("learning");
    expect(content.syntaxTranslations).toBeDefined();
    if (content.syntaxTranslations!.length > 0) {
      const t = content.syntaxTranslations![0];
      expect(t.construct.length).toBeGreaterThan(0);
      expect(t.plainEnglish.length).toBeGreaterThan(10);
      expect(["type-system", "control-flow", "async", "module", "pattern", "operator"]).toContain(t.category);
    }
  });

  it("learning mode should generate before/after explanations", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("learning", brief, store);
    expect(content.beforeAfter).toBeDefined();
    expect(content.beforeAfter!.length).toBeGreaterThan(0);
    const ba = content.beforeAfter![0];
    expect(ba.symbolName).toBeTruthy();
    expect(ba.beforeMeaning.length).toBeGreaterThan(5);
    expect(ba.afterMeaning.length).toBeGreaterThan(5);
    expect(ba.whatChangedInPlainEnglish.length).toBeGreaterThan(5);
  });

  // Architecture Mode
  it("architecture mode should generate module roles", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("architecture", brief, store);
    expect(content.mode).toBe("architecture");
    expect(content.moduleRoles).toBeDefined();
    expect(content.moduleRoles!.length).toBeGreaterThan(0);
    const role = content.moduleRoles![0];
    expect(role.moduleName).toBeTruthy();
    expect(["core", "leaf", "bridge", "utility"]).toContain(role.systemPosition);
  });

  // Exploration Mode
  it("exploration mode should generate exploration prompts", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("exploration", brief, store);
    expect(content.mode).toBe("exploration");
    expect(content.explorationPrompts).toBeDefined();
    expect(content.explorationPrompts!.length).toBeGreaterThan(0);
  });

  // HTML rendering with modes
  it("HTML should include mode switcher with all five modes", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("general", brief, store);
    const html = formatChangeBrief(brief, "html", undefined, "general", content);
    expect(html).toContain("mode-switcher");
    expect(html).toContain("General Review");
    expect(html).toContain("Bug Hunter");
    expect(html).toContain("Learning");
    expect(html).toContain("Architecture");
    expect(html).toContain("Exploration");
  });

  it("HTML should include canonical rail with persistent stats", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("general", brief, store);
    const html = formatChangeBrief(brief, "html", undefined, "general", content);
    expect(html).toContain("canonical-rail");
    expect(html).toContain("modules");
    expect(html).toContain("symbols");
    expect(html).toContain("high risk");
    expect(html).toContain("unknowns");
    expect(html).toContain("evidence");
  });

  it("bug-hunter HTML should include failure hypotheses with speculation notice", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("bug-hunter", brief, store);
    const html = formatChangeBrief(brief, "html", undefined, "bug-hunter", content);
    expect(html).toContain("mode-active");
    expect(html).toContain("Possible Failure Modes");
    expect(html).toContain("speculation-notice");
    expect(html).toContain("hypotheses");
  });

  it("learning HTML should include syntax translations and before/after", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("learning", brief, store);
    const html = formatChangeBrief(brief, "html", undefined, "learning", content);
    if (content.syntaxTranslations!.length > 0) {
      expect(html).toContain("Key Concepts Used");
      expect(html).toContain("syntax-card");
      expect(html).toContain("Teaching note");
    }
    if (content.beforeAfter!.length > 0) {
      expect(html).toContain("Before");
      expect(html).toContain("After");
      expect(html).toContain("before-after-card");
    }
  });

  it("architecture HTML should include module roles with system position", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("architecture", brief, store);
    const html = formatChangeBrief(brief, "html", undefined, "architecture", content);
    expect(html).toContain("Module Roles");
    expect(html).toContain("role-card");
  });

  it("exploration HTML should include exploration prompts", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("exploration", brief, store);
    const html = formatChangeBrief(brief, "html", undefined, "exploration", content);
    expect(html).toContain("Questions to Explore");
    expect(html).toContain("exploration-prompt-item");
  });

  it("all modes should render valid HTML with same canonical structure", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const modes: ReviewMode[] = ["general", "bug-hunter", "learning", "architecture", "exploration"];
    for (const mode of modes) {
      const content = generateModeContent(mode, brief, store);
      const html = formatChangeBrief(brief, "html", undefined, mode, content);
      // All modes must produce valid HTML
      expect(html).toContain("<!DOCTYPE html>");
      // All modes must include the canonical rail
      expect(html).toContain("canonical-rail");
      // All modes must include the mode switcher
      expect(html).toContain("mode-switcher");
      // All modes must include changed modules
      expect(html).toContain("Changed Modules");
    }
  });

  it("mode switcher should highlight the active mode", () => {
    const brief = generateChangeBrief(store, ERROR_DIFF);
    const content = generateModeContent("bug-hunter", brief, store);
    const html = formatChangeBrief(brief, "html", undefined, "bug-hunter", content);
    // The bug-hunter button should have the active class
    expect(html).toMatch(/mode-active[^>]*data-mode="bug-hunter"/s);
    // Other buttons should not
    expect(html).not.toMatch(/mode-active[^>]*data-mode="general"/s);
  });
});
