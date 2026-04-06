/**
 * Hover Provider — on-demand contextual intelligence when hovering a symbol.
 *
 * Layered from most important to least:
 * 1. Review context (if changed)
 * 2. Graph context (callers, callees, tests)
 * 3. Unknowns
 * 4. Actionable links
 */

import * as vscode from "vscode";
import type { BearingsStore, ChangeBrief, CursorContext } from "@code-bearings/core";
import { resolveCursorContext } from "@code-bearings/core";

export class CursorHoverProvider implements vscode.HoverProvider {
  private store: BearingsStore | undefined;
  private brief: ChangeBrief | undefined;

  setStore(store: BearingsStore): void {
    this.store = store;
  }

  setBrief(brief: ChangeBrief | undefined): void {
    this.brief = brief;
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Hover | undefined {
    if (!this.store) return undefined;

    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return undefined;
    const word = document.getText(wordRange);

    const filePath = document.uri.fsPath;
    const line = position.line + 1;

    const ctx = resolveCursorContext(this.store, filePath, line, this.brief);

    // Only show hover if we resolved a symbol and it matches the hovered word
    if (!ctx.symbol || ctx.symbol.name !== word) return undefined;

    const md = buildHoverMarkdown(ctx);
    if (!md) return undefined;

    return new vscode.Hover(md, wordRange);
  }
}

function buildHoverMarkdown(ctx: CursorContext): vscode.MarkdownString | undefined {
  if (!ctx.symbol) return undefined;

  const md = new vscode.MarkdownString();
  md.isTrusted = true;
  md.supportHtml = true;

  // ── Header ──
  md.appendMarkdown(`**Code Bearings** · \`${ctx.symbol.name}\`\n\n`);

  // ── Layer 1: Review context ──
  if (ctx.symbolChanged && ctx.changedModule) {
    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`$(warning) **Changed in current review** · risk ${ctx.changedModule.riskScore}\n\n`);

    if (ctx.symbolExplanation) {
      md.appendMarkdown(`> ${ctx.symbolExplanation.explanation}\n\n`);
      md.appendMarkdown(
        `Change type: \`${ctx.symbolExplanation.changeType}\` · ` +
        `Confidence: \`${ctx.symbolExplanation.confidence}\`\n\n`
      );
    }

    if (ctx.relevantTips.length > 0) {
      md.appendMarkdown(`**Review guidance:**\n`);
      for (const tip of ctx.relevantTips.slice(0, 3)) {
        md.appendMarkdown(`- ${tip.tip}\n`);
      }
      md.appendMarkdown(`\n`);
    }
  } else if (ctx.inReview) {
    md.appendMarkdown(`$(info) Part of reviewed module \`${ctx.changedModule?.moduleName}\`\n\n`);
  }

  // ── Layer 2: Graph context ──
  md.appendMarkdown(`---\n\n`);

  if (ctx.symbol.documentation) {
    md.appendMarkdown(`*${ctx.symbol.documentation}*\n\n`);
  }

  const graphLines: string[] = [];

  if (ctx.module) {
    graphLines.push(`Module: \`${ctx.module.name}\` (${ctx.module.boundaryKind})`);
  }

  if (ctx.callers.length > 0) {
    const names = ctx.callers.slice(0, 3).map((c) => `\`${c.name}\``).join(", ");
    const more = ctx.callers.length > 3 ? ` +${ctx.callers.length - 3} more` : "";
    graphLines.push(`Callers (${ctx.callers.length}): ${names}${more}`);
  }

  if (ctx.callees.length > 0) {
    const names = ctx.callees.slice(0, 3).map((c) => `\`${c.name}\``).join(", ");
    const more = ctx.callees.length > 3 ? ` +${ctx.callees.length - 3} more` : "";
    graphLines.push(`Calls (${ctx.callees.length}): ${names}${more}`);
  }

  if (ctx.tests.length > 0) {
    graphLines.push(`Tests (${ctx.tests.length}): ${ctx.tests.slice(0, 2).map((t) => `\`${t.name}\``).join(", ")}`);
  } else {
    graphLines.push(`Tests: none detected`);
  }

  if (ctx.downstreamModules.length > 0) {
    graphLines.push(`Downstream: ${ctx.downstreamModules.slice(0, 3).map((m) => `\`${m}\``).join(", ")}`);
  }

  if (ctx.moduleMetrics) {
    graphLines.push(
      `Fan-in: ${ctx.moduleMetrics.fanIn} · Fan-out: ${ctx.moduleMetrics.fanOut}`
    );
  }

  md.appendMarkdown(graphLines.join("  \n") + "\n\n");

  // ── Layer 3: Unknowns ──
  if (ctx.unknowns.length > 0) {
    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`$(question) **Unknowns:**\n`);
    for (const u of ctx.unknowns.slice(0, 3)) {
      md.appendMarkdown(`- ${u.category}: ${u.description}\n`);
    }
    md.appendMarkdown(`\n`);
  }

  return md;
}
