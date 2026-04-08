/**
 * Export Module
 *
 * Generates shareable audit summaries in various formats.
 */

import type { AdoptionRiskAudit, RankedFeature } from "./ranking";
import { generateHeadline } from "./ranking";
import { getActionsForDiagnosis } from "./actions";

/**
 * Generates a plain text summary of the audit.
 */
export function generateTextSummary(audit: AdoptionRiskAudit): string {
  const lines: string[] = [];
  const { summary, rankedFeatures } = audit;

  // Header
  lines.push("═".repeat(60));
  lines.push("FEATURE ADOPTION RISK AUDIT");
  lines.push(`Audit ID: ${summary.auditId}`);
  lines.push("═".repeat(60));
  lines.push("");

  // Scope disclaimer
  lines.push("SCOPE: This audit is based on provided artifacts only");
  lines.push("       (no live usage telemetry).");
  lines.push("");

  // Headline
  lines.push(generateHeadline(audit).toUpperCase());
  lines.push("");

  // Summary stats
  lines.push("SUMMARY");
  lines.push("─".repeat(40));
  lines.push(`Audit ID: ${summary.auditId}`);
  lines.push(`Features Analyzed: ${summary.totalFeatures}`);
  lines.push(`Artifacts Analyzed: ${summary.artifactsAnalyzed}`);
  lines.push(`Evidence Points: ${summary.totalEvidence}`);
  lines.push("");
  lines.push("Risk Breakdown:");
  lines.push(`  Critical: ${summary.byRiskLevel.critical}`);
  lines.push(`  High: ${summary.byRiskLevel.high}`);
  lines.push(`  Medium: ${summary.byRiskLevel.medium}`);
  lines.push(`  Low: ${summary.byRiskLevel.low}`);
  lines.push("");

  // Top risk factors
  if (summary.topRiskFactors.length > 0) {
    lines.push("Top Risk Factors:");
    for (const factor of summary.topRiskFactors) {
      lines.push(`  • ${factor}`);
    }
    lines.push("");
  }

  // At-risk features
  const atRiskFeatures = rankedFeatures.filter((rf) => rf.riskLevel !== "low");

  if (atRiskFeatures.length > 0) {
    lines.push("═".repeat(60));
    lines.push("AT-RISK FEATURES");
    lines.push("═".repeat(60));
    lines.push("");

    for (const rf of atRiskFeatures) {
      lines.push(formatFeatureSection(rf));
      lines.push("");
    }
  }

  // Footer
  lines.push("─".repeat(60));
  lines.push(`Generated: ${new Date(summary.analyzedAt).toLocaleString()}`);
  lines.push("");
  lines.push("HOW TO INTERPRET THIS REPORT");
  lines.push("─".repeat(40));
  lines.push("• Risk scores combine recency, visibility, and documentation signals");
  lines.push("• Higher risk = feature is likely undiscoverable by users");
  lines.push("• Each diagnosis includes cited evidence from your artifacts");
  lines.push("• Recommended actions are suggestions—use your judgment");
  lines.push("");
  lines.push("CONFIDENCE DISCLAIMER");
  lines.push("─".repeat(40));
  lines.push("This analysis is based on text patterns in your documentation.");
  lines.push("It does not have access to actual usage analytics.");
  lines.push("Combine these insights with real user data when available.");

  return lines.join("\n");
}

/**
 * Formats a single feature section for text export.
 */
function formatFeatureSection(rf: RankedFeature): string {
  const lines: string[] = [];
  const { feature, primaryDiagnosis, riskLevel, riskScore, evidence } = rf;

  // Feature header
  lines.push(`[${riskLevel.toUpperCase()}] ${feature.name}`);
  lines.push(`Risk Score: ${Math.round(riskScore * 100)}%`);
  lines.push("");

  // Diagnosis
  if (primaryDiagnosis) {
    lines.push(`Diagnosis: ${primaryDiagnosis.title}`);
    lines.push(`${primaryDiagnosis.explanation}`);
    lines.push("");

    // Why flagged
    if (primaryDiagnosis.triggeringSignals.length > 0) {
      lines.push("Why Flagged:");
      for (const signal of primaryDiagnosis.triggeringSignals) {
        lines.push(`  • ${signal}`);
      }
      lines.push("");
    }

    // Actions
    const actions = getActionsForDiagnosis(
      primaryDiagnosis.type,
      primaryDiagnosis.severity
    ).slice(0, 2);

    if (actions.length > 0) {
      lines.push("Recommended Actions:");
      for (const action of actions) {
        lines.push(`  [${action.priority.toUpperCase()}] ${action.title}`);
        lines.push(`    ${action.description}`);
      }
      lines.push("");
    }
  }

  // Evidence
  if (evidence.length > 0) {
    lines.push(`Evidence (${evidence.length} total):`);
    for (const e of evidence.slice(0, 2)) {
      const location = e.location ?? e.signalType;
      lines.push(`  [${location}]`);
      lines.push(`  "${truncate(e.excerpt, 100)}"`);
    }
  }

  lines.push("─".repeat(40));

  return lines.join("\n");
}

/**
 * Generates an HTML report for printing.
 */
export function generateHtmlReport(audit: AdoptionRiskAudit): string {
  const { summary, rankedFeatures } = audit;
  const headline = generateHeadline(audit);
  const atRiskFeatures = rankedFeatures.filter((rf) => rf.riskLevel !== "low");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Adoption Risk Audit - Feature-Reacher</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.25rem; margin: 2rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e5e5; }
    h3 { font-size: 1rem; margin-bottom: 0.5rem; }
    .headline { font-size: 1.5rem; font-weight: bold; margin: 1rem 0; }
    .headline.critical { color: #dc2626; }
    .headline.high { color: #ea580c; }
    .headline.medium { color: #ca8a04; }
    .headline.low { color: #16a34a; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1rem 0; }
    .stat { background: #f5f5f5; padding: 1rem; border-radius: 0.5rem; text-align: center; }
    .stat-value { font-size: 1.5rem; font-weight: bold; }
    .stat-label { font-size: 0.75rem; color: #666; }
    .feature { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
    .feature-header { display: flex; justify-content: space-between; align-items: start; }
    .feature-name { font-weight: 600; }
    .risk-badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .risk-badge.critical { background: #fee2e2; color: #991b1b; }
    .risk-badge.high { background: #ffedd5; color: #9a3412; }
    .risk-badge.medium { background: #fef9c3; color: #854d0e; }
    .risk-badge.low { background: #dcfce7; color: #166534; }
    .diagnosis { margin-top: 0.5rem; color: #666; }
    .signals { margin-top: 0.5rem; padding-left: 1rem; }
    .signal { font-size: 0.875rem; color: #666; }
    .evidence { background: #f9fafb; padding: 0.5rem; border-radius: 0.25rem; margin-top: 0.5rem; font-size: 0.875rem; }
    .evidence-location { font-size: 0.75rem; color: #999; }
    .action { background: #f0fdf4; padding: 0.5rem; border-radius: 0.25rem; margin-top: 0.5rem; }
    .action-title { font-weight: 500; }
    .action-desc { font-size: 0.875rem; color: #666; margin-top: 0.25rem; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e5e5; font-size: 0.75rem; color: #666; }
    .disclaimer { background: #fef3c7; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; font-size: 0.875rem; }
    @media print { body { padding: 0; } .feature { break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>Feature Adoption Risk Audit</h1>
  <p style="color: #666; font-size: 0.875rem;">Generated by Feature-Reacher</p>

  <div class="headline ${getHeadlineClass(summary)}">${headline}</div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${summary.totalFeatures}</div>
      <div class="stat-label">Features Analyzed</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #dc2626;">${summary.byRiskLevel.critical}</div>
      <div class="stat-label">Critical Risk</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #ea580c;">${summary.byRiskLevel.high}</div>
      <div class="stat-label">High Risk</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #ca8a04;">${summary.byRiskLevel.medium}</div>
      <div class="stat-label">Medium Risk</div>
    </div>
  </div>

  ${atRiskFeatures.length > 0 ? `
  <h2>At-Risk Features</h2>
  ${atRiskFeatures.map((rf) => formatFeatureHtml(rf)).join("\n")}
  ` : `
  <div style="text-align: center; padding: 2rem; background: #f0fdf4; border-radius: 0.5rem; margin: 1rem 0;">
    <p style="color: #166534; font-weight: 500;">No significant adoption risks detected.</p>
  </div>
  `}

  <div class="disclaimer">
    <strong>Confidence Disclaimer:</strong> This analysis is based on text patterns in your documentation.
    It does not have access to actual usage analytics. Combine these insights with real user data when available.
  </div>

  <div class="footer">
    <p>Analyzed: ${new Date(summary.analyzedAt).toLocaleString()}</p>
    <p>${summary.artifactsAnalyzed} artifacts • ${summary.totalEvidence} evidence points</p>
  </div>
</body>
</html>`;
}

function getHeadlineClass(summary: AdoptionRiskAudit["summary"]): string {
  if (summary.byRiskLevel.critical > 0) return "critical";
  if (summary.byRiskLevel.high > 0) return "high";
  if (summary.byRiskLevel.medium > 0) return "medium";
  return "low";
}

function formatFeatureHtml(rf: RankedFeature): string {
  const { feature, primaryDiagnosis, riskLevel, riskScore, evidence } = rf;

  let html = `<div class="feature">
    <div class="feature-header">
      <div>
        <span class="feature-name">${escapeHtml(feature.name)}</span>
        <span class="risk-badge ${riskLevel}">${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}</span>
      </div>
      <div style="font-weight: bold;">${Math.round(riskScore * 100)}%</div>
    </div>`;

  if (primaryDiagnosis) {
    html += `<div class="diagnosis"><strong>${escapeHtml(primaryDiagnosis.title)}</strong>: ${escapeHtml(primaryDiagnosis.explanation)}</div>`;

    if (primaryDiagnosis.triggeringSignals.length > 0) {
      html += `<div class="signals">`;
      for (const signal of primaryDiagnosis.triggeringSignals.slice(0, 3)) {
        html += `<div class="signal">• ${escapeHtml(signal)}</div>`;
      }
      html += `</div>`;
    }

    const actions = getActionsForDiagnosis(
      primaryDiagnosis.type,
      primaryDiagnosis.severity
    ).slice(0, 1);

    if (actions.length > 0) {
      const action = actions[0];
      html += `<div class="action">
        <div class="action-title">[${action.priority.toUpperCase()}] ${escapeHtml(action.title)}</div>
        <div class="action-desc">${escapeHtml(action.description)}</div>
      </div>`;
    }
  }

  if (evidence.length > 0) {
    const e = evidence[0];
    html += `<div class="evidence">
      <div class="evidence-location">${escapeHtml(e.location ?? e.signalType)}</div>
      <div>"${escapeHtml(truncate(e.excerpt, 100))}"</div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// ─────────────────────────────────────────────────────────────────────────────
// Compare Export
// ─────────────────────────────────────────────────────────────────────────────

import type { AuditDiff } from "./diff";

/**
 * Generate a text report comparing two audits.
 */
export function generateCompareTextReport(diff: AuditDiff): string {
  const lines: string[] = [];

  // Header
  lines.push("═".repeat(60));
  lines.push("AUDIT COMPARISON REPORT");
  lines.push("═".repeat(60));
  lines.push("");

  // Audit info
  lines.push(`Base Audit: ${diff.baseAuditName}`);
  lines.push(`  ID: ${diff.baseAuditId}`);
  lines.push(`  Date: ${new Date(diff.baseCreatedAt).toLocaleDateString()}`);
  lines.push("");
  lines.push(`Compare Audit: ${diff.compareAuditName}`);
  lines.push(`  ID: ${diff.compareAuditId}`);
  lines.push(`  Date: ${new Date(diff.compareCreatedAt).toLocaleDateString()}`);
  lines.push("");

  // Headline
  lines.push("─".repeat(60));
  lines.push(diff.headline.toUpperCase());
  lines.push("─".repeat(60));
  lines.push("");

  // Summary
  lines.push("CHANGE SUMMARY");
  lines.push("─".repeat(40));
  lines.push(`New Risks: ${diff.summary.newRisks}`);
  lines.push(`Resolved Risks: ${diff.summary.resolvedRisks}`);
  lines.push(`Risk Increases: ${diff.summary.riskIncreases}`);
  lines.push(`Risk Decreases: ${diff.summary.riskDecreases}`);
  lines.push(`Diagnosis Changes: ${diff.summary.diagnosisChanges}`);
  lines.push(`Features Added: ${diff.summary.addedFeatures}`);
  lines.push(`Features Removed: ${diff.summary.removedFeatures}`);
  lines.push(`Unchanged: ${diff.summary.unchangedFeatures}`);
  lines.push("");

  // Biggest movers
  if (diff.biggestMovers.length > 0) {
    lines.push("BIGGEST MOVERS");
    lines.push("─".repeat(40));
    for (const change of diff.biggestMovers) {
      lines.push(`• ${change.changeSummary}`);
    }
    lines.push("");
  }

  // Changes by type
  const addedChanges = diff.allChanges.filter((c) => c.changeType === "added");
  const removedChanges = diff.allChanges.filter((c) => c.changeType === "removed");
  const increasedChanges = diff.allChanges.filter((c) => c.changeType === "risk_increased");
  const decreasedChanges = diff.allChanges.filter((c) => c.changeType === "risk_decreased");
  const diagnosisChanges = diff.allChanges.filter((c) => c.changeType === "diagnosis_changed");

  if (addedChanges.length > 0) {
    lines.push("ADDED FEATURES");
    lines.push("─".repeat(40));
    for (const c of addedChanges) {
      lines.push(`+ ${c.featureName} (${c.after?.riskLevel} risk)`);
    }
    lines.push("");
  }

  if (removedChanges.length > 0) {
    lines.push("REMOVED FEATURES");
    lines.push("─".repeat(40));
    for (const c of removedChanges) {
      lines.push(`- ${c.featureName} (was ${c.before?.riskLevel} risk)`);
    }
    lines.push("");
  }

  if (increasedChanges.length > 0) {
    lines.push("RISK INCREASED");
    lines.push("─".repeat(40));
    for (const c of increasedChanges) {
      lines.push(`↑ ${c.featureName}: ${c.before?.riskLevel} → ${c.after?.riskLevel}`);
    }
    lines.push("");
  }

  if (decreasedChanges.length > 0) {
    lines.push("RISK DECREASED");
    lines.push("─".repeat(40));
    for (const c of decreasedChanges) {
      lines.push(`↓ ${c.featureName}: ${c.before?.riskLevel} → ${c.after?.riskLevel}`);
    }
    lines.push("");
  }

  if (diagnosisChanges.length > 0) {
    lines.push("DIAGNOSIS CHANGED");
    lines.push("─".repeat(40));
    for (const c of diagnosisChanges) {
      lines.push(`~ ${c.featureName}: ${formatDiagnosisType(c.before?.diagnosis)} → ${formatDiagnosisType(c.after?.diagnosis)}`);
    }
    lines.push("");
  }

  // Footer
  lines.push("─".repeat(60));
  lines.push(`Generated: ${new Date().toLocaleString()}`);

  return lines.join("\n");
}

function formatDiagnosisType(type: string | undefined): string {
  if (!type) return "unknown";
  return type.replace(/_/g, " ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Executive Narrative
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a 3–5 sentence executive summary (template-driven, not AI).
 */
export function generateExecutiveNarrative(audit: AdoptionRiskAudit): string {
  const { summary, rankedFeatures } = audit;
  const sentences: string[] = [];

  // Sentence 1: Overview
  const totalAtRisk = summary.byRiskLevel.critical + summary.byRiskLevel.high;
  if (totalAtRisk === 0) {
    sentences.push(
      `This audit analyzed ${summary.totalFeatures} features across ${summary.artifactsAnalyzed} documentation artifact${summary.artifactsAnalyzed !== 1 ? "s" : ""} and found no significant adoption risks.`
    );
  } else {
    sentences.push(
      `This audit analyzed ${summary.totalFeatures} features and identified ${totalAtRisk} with elevated adoption risk.`
    );
  }

  // Sentence 2: Critical findings
  if (summary.byRiskLevel.critical > 0) {
    const criticalFeatures = rankedFeatures
      .filter((rf) => rf.riskLevel === "critical")
      .slice(0, 2)
      .map((rf) => rf.feature.name);
    sentences.push(
      `Critical attention needed: ${criticalFeatures.join(" and ")} ${criticalFeatures.length === 1 ? "shows" : "show"} signs of poor discoverability.`
    );
  } else if (summary.byRiskLevel.high > 0) {
    const highFeatures = rankedFeatures
      .filter((rf) => rf.riskLevel === "high")
      .slice(0, 2)
      .map((rf) => rf.feature.name);
    sentences.push(
      `Priority review recommended for: ${highFeatures.join(" and ")}.`
    );
  }

  // Sentence 3: Top risk factor
  if (summary.topRiskFactors.length > 0) {
    sentences.push(
      `The most common issue is "${summary.topRiskFactors[0]}".`
    );
  }

  // Sentence 4: Action-oriented
  if (totalAtRisk > 0) {
    sentences.push(
      `Addressing documentation gaps for the top ${Math.min(3, totalAtRisk)} features could improve feature adoption within 30 days.`
    );
  } else {
    sentences.push(
      `Continue monitoring these features in future audits to maintain healthy adoption.`
    );
  }

  // Sentence 5: Confidence note
  sentences.push(
    `Note: This analysis is based on documentation patterns only—combine with usage analytics for full visibility.`
  );

  return sentences.join(" ");
}

/**
 * Generate an executive narrative for a comparison.
 */
export function generateCompareExecutiveNarrative(diff: AuditDiff): string {
  const sentences: string[] = [];

  // Sentence 1: Time span
  const daysDiff = Math.round(
    (new Date(diff.compareCreatedAt).getTime() - new Date(diff.baseCreatedAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  sentences.push(
    `Between "${diff.baseAuditName}" and "${diff.compareAuditName}" (${daysDiff} day${daysDiff !== 1 ? "s" : ""}), ${diff.allChanges.length - diff.summary.unchangedFeatures} changes were detected.`
  );

  // Sentence 2: Direction
  if (diff.summary.newRisks > diff.summary.resolvedRisks) {
    sentences.push(
      `Risk profile has worsened: ${diff.summary.newRisks} new risks emerged while only ${diff.summary.resolvedRisks} were resolved.`
    );
  } else if (diff.summary.resolvedRisks > diff.summary.newRisks) {
    sentences.push(
      `Risk profile has improved: ${diff.summary.resolvedRisks} risks were resolved, outpacing the ${diff.summary.newRisks} new risks.`
    );
  } else if (diff.summary.newRisks === 0 && diff.summary.resolvedRisks === 0) {
    sentences.push(
      `Risk profile remains stable with no new critical risks introduced.`
    );
  } else {
    sentences.push(
      `Risk profile is neutral: ${diff.summary.newRisks} new risks balanced by ${diff.summary.resolvedRisks} resolved.`
    );
  }

  // Sentence 3: Biggest mover
  if (diff.biggestMovers.length > 0) {
    const top = diff.biggestMovers[0];
    sentences.push(
      `Most significant change: ${top.changeSummary}.`
    );
  }

  // Sentence 4: Recommendation
  if (diff.summary.riskIncreases > 0) {
    sentences.push(
      `Recommend reviewing the ${diff.summary.riskIncreases} features with increased risk before the next release.`
    );
  } else if (diff.summary.addedFeatures > 0) {
    sentences.push(
      `Ensure the ${diff.summary.addedFeatures} newly detected feature${diff.summary.addedFeatures !== 1 ? "s have" : " has"} adequate documentation.`
    );
  } else {
    sentences.push(
      `No urgent action required—continue monitoring in future audits.`
    );
  }

  return sentences.join(" ");
}
