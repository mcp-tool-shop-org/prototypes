import type { TastePack } from "@taste-compiler/core";

export interface ExplainSection {
  title: string;
  lines: string[];
}

/**
 * Generate a human-readable explanation of a TastePack.
 * Every rule traces back to its source input.
 */
export function explain(pack: TastePack): ExplainSection[] {
  const sections: ExplainSection[] = [];

  // Product constitution
  sections.push({
    title: "Product Constitution",
    lines: [
      `Product: ${pack.product.name}`,
      `Summary: ${pack.product.summary}`,
      `Pack version: ${pack.packVersion}`,
      `Compiled: ${pack.provenance.compiledAt}`,
      `Source hash: ${pack.provenance.sourceHash}`,
    ],
  });

  // Visual tokens
  const tokenLines: string[] = [];
  if (pack.artifacts.visualTokens.colors.length > 0) {
    tokenLines.push(
      `Color roles: ${pack.artifacts.visualTokens.colors.map((c) => c.role).join(", ")}`
    );
  }
  if (pack.artifacts.visualTokens.spacing.length > 0) {
    tokenLines.push(
      `Spacing scale: ${pack.artifacts.visualTokens.spacing.map((s) => `${s.name}=${s.value}`).join(", ")}`
    );
  }
  if (pack.artifacts.visualTokens.motion.length > 0) {
    tokenLines.push(
      `Motion presets: ${pack.artifacts.visualTokens.motion.map((m) => `${m.name}=${m.duration}`).join(", ")}`
    );
  }
  if (tokenLines.length > 0) {
    sections.push({ title: "Visual Token Intent", lines: tokenLines });
  }

  // Component grammar
  const grammarLines: string[] = [];
  if (pack.artifacts.componentGrammar.banned.length > 0) {
    grammarLines.push(
      `Banned components: ${pack.artifacts.componentGrammar.banned.join(", ")}`
    );
  }
  for (const rule of pack.artifacts.componentGrammar.compositionRules) {
    const source = rule.sourceRef ? ` (from ${rule.sourceRef})` : "";
    grammarLines.push(`Rule: ${rule.rule}${source}`);
    if (rule.rationale) grammarLines.push(`  Why: ${rule.rationale}`);
  }
  if (grammarLines.length > 0) {
    sections.push({ title: "Component Grammar", lines: grammarLines });
  }

  // Interaction laws
  const lawLines: string[] = [];
  for (const law of pack.artifacts.interactionLaws) {
    const source = law.sourceRef ? ` (from ${law.sourceRef})` : "";
    lawLines.push(`[${law.severity}] ${law.law}${source}`);
    if (law.rationale) lawLines.push(`  Why: ${law.rationale}`);
  }
  if (lawLines.length > 0) {
    sections.push({ title: "Interaction Laws", lines: lawLines });
  }

  // Copy rules
  const copyLines: string[] = [];
  if (pack.artifacts.copyRules.bannedPhrases.length > 0) {
    copyLines.push("Banned phrases:");
    for (const bp of pack.artifacts.copyRules.bannedPhrases) {
      copyLines.push(`  "${bp.phrase}" — ${bp.reason || "no reason given"}`);
    }
  }
  if (pack.artifacts.copyRules.toneWords.encouraged.length > 0) {
    copyLines.push(
      `Encouraged tone: ${pack.artifacts.copyRules.toneWords.encouraged.join(", ")}`
    );
  }
  if (pack.artifacts.copyRules.toneWords.discouraged.length > 0) {
    copyLines.push(
      `Discouraged tone: ${pack.artifacts.copyRules.toneWords.discouraged.join(", ")}`
    );
  }
  if (pack.artifacts.copyRules.claimQualifiers.length > 0) {
    copyLines.push("Claim qualifiers:");
    for (const cq of pack.artifacts.copyRules.claimQualifiers) {
      copyLines.push(`  "${cq.pattern}" → "${cq.qualifier}"`);
    }
  }
  if (copyLines.length > 0) {
    sections.push({ title: "Copy Rules", lines: copyLines });
  }

  // Complexity budgets
  const budgetLines: string[] = [];
  const b = pack.artifacts.complexityBudgets;
  if (b.maxTopLevelNavItems != null)
    budgetLines.push(`Max top-level nav items: ${b.maxTopLevelNavItems}`);
  if (b.maxPrimaryActionsPerScreen != null)
    budgetLines.push(
      `Max primary actions per screen: ${b.maxPrimaryActionsPerScreen}`
    );
  if (b.maxModalDepth != null)
    budgetLines.push(`Max modal depth: ${b.maxModalDepth}`);
  if (b.maxDistinctInteractionModesPerFlow != null)
    budgetLines.push(
      `Max interaction modes per flow: ${b.maxDistinctInteractionModesPerFlow}`
    );
  for (const custom of b.custom) {
    budgetLines.push(`${custom.name}: max ${custom.max} ${custom.unit}`);
  }
  if (budgetLines.length > 0) {
    sections.push({ title: "Complexity Budgets", lines: budgetLines });
  }

  // Forbidden patterns
  const fpLines: string[] = [];
  for (const fp of pack.artifacts.forbiddenPatterns) {
    const source = fp.sourceRef ? ` (from ${fp.sourceRef})` : "";
    fpLines.push(`[${fp.severity}] ${fp.pattern}${source}`);
    fpLines.push(`  Why: ${fp.reason}`);
    if (fp.detection) {
      if (fp.detection.componentNames?.length)
        fpLines.push(
          `  Detects: ${fp.detection.componentNames.join(", ")}`
        );
      if (fp.detection.classPatterns?.length)
        fpLines.push(
          `  CSS patterns: ${fp.detection.classPatterns.join(", ")}`
        );
      if (fp.detection.importPatterns?.length)
        fpLines.push(
          `  Import patterns: ${fp.detection.importPatterns.join(", ")}`
        );
    }
  }
  if (fpLines.length > 0) {
    sections.push({ title: "Forbidden Patterns", lines: fpLines });
  }

  // What this product is NOT
  const notLines: string[] = [];
  for (const fp of pack.artifacts.forbiddenPatterns) {
    notLines.push(`This product is NOT: ${fp.pattern}`);
  }
  if (pack.artifacts.componentGrammar.banned.length > 0) {
    notLines.push(
      `This product does NOT use: ${pack.artifacts.componentGrammar.banned.join(", ")}`
    );
  }
  if (notLines.length > 0) {
    sections.push({ title: "What This Product Is Not", lines: notLines });
  }

  // Golden flows
  if (pack.goldens.length > 0) {
    const goldenLines: string[] = [];
    for (const g of pack.goldens) {
      goldenLines.push(`Flow: ${g.name} (${g.id})`);
      goldenLines.push(`  Routes: ${g.routes.join(" → ")}`);
      if (g.invariants.length > 0) {
        for (const inv of g.invariants) {
          goldenLines.push(`  Invariant: ${inv}`);
        }
      }
    }
    sections.push({ title: "Golden Flows", lines: goldenLines });
  }

  return sections;
}

/**
 * Format explanation as plain text.
 */
export function formatExplainText(sections: ExplainSection[]): string {
  return sections
    .map((s) => [`## ${s.title}`, ...s.lines, ""].join("\n"))
    .join("\n");
}
