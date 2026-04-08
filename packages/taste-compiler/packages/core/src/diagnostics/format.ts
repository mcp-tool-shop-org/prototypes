import type { TasteReport, TasteViolation } from "../schemas/violation.js";

function severityIcon(severity: TasteViolation["severity"]): string {
  switch (severity) {
    case "error":
      return "ERROR";
    case "warn":
      return "WARN";
    case "info":
      return "INFO";
  }
}

function formatEvidence(v: TasteViolation): string {
  const parts: string[] = [];
  for (const e of v.evidence) {
    if (e.file) {
      const loc = e.line ? `${e.file}:${e.line}` : e.file;
      parts.push(`  at ${loc}`);
    }
    if (e.snippet) {
      parts.push(`  > ${e.snippet}`);
    }
    if (e.value) {
      parts.push(`  value: ${e.value}`);
    }
  }
  return parts.join("\n");
}

export function formatViolation(v: TasteViolation): string {
  const lines = [
    `[${severityIcon(v.severity)}] ${v.ruleId}: ${v.message}`,
    `  Why: ${v.rationale}`,
  ];
  const evidence = formatEvidence(v);
  if (evidence) lines.push(evidence);
  if (v.suggestedFix) lines.push(`  Fix: ${v.suggestedFix}`);
  return lines.join("\n");
}

export function formatReportText(report: TasteReport): string {
  const lines: string[] = [
    `# Taste Check Report`,
    ``,
    `Pack: ${report.product}@${report.packVersion}`,
    `Target: ${report.target}`,
    `Checked: ${report.checkedAt}`,
    `Result: ${report.summary.passed ? "PASSED" : "FAILED"}`,
    `Violations: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.infos} info`,
    ``,
  ];

  const errors = report.violations.filter((v) => v.severity === "error");
  const warnings = report.violations.filter((v) => v.severity === "warn");
  const infos = report.violations.filter((v) => v.severity === "info");

  if (errors.length > 0) {
    lines.push(`## Errors`);
    for (const v of errors) {
      lines.push(formatViolation(v));
      lines.push("");
    }
  }

  if (warnings.length > 0) {
    lines.push(`## Warnings`);
    for (const v of warnings) {
      lines.push(formatViolation(v));
      lines.push("");
    }
  }

  if (infos.length > 0) {
    lines.push(`## Info`);
    for (const v of infos) {
      lines.push(formatViolation(v));
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function formatReportMarkdown(report: TasteReport): string {
  const lines: string[] = [
    `# Taste Check Report`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Pack | \`${report.product}@${report.packVersion}\` |`,
    `| Target | \`${report.target}\` |`,
    `| Checked | ${report.checkedAt} |`,
    `| Result | **${report.summary.passed ? "PASSED" : "FAILED"}** |`,
    `| Errors | ${report.summary.errors} |`,
    `| Warnings | ${report.summary.warnings} |`,
    ``,
  ];

  if (report.violations.length === 0) {
    lines.push("No violations found.");
    return lines.join("\n");
  }

  const grouped = {
    error: report.violations.filter((v) => v.severity === "error"),
    warn: report.violations.filter((v) => v.severity === "warn"),
    info: report.violations.filter((v) => v.severity === "info"),
  };

  for (const [severity, violations] of Object.entries(grouped)) {
    if (violations.length === 0) continue;
    const label =
      severity === "error"
        ? "Errors"
        : severity === "warn"
          ? "Warnings"
          : "Info";
    lines.push(`## ${label}`);
    lines.push("");
    for (const v of violations) {
      lines.push(`- **${v.ruleId}** ${v.message}`);
      lines.push(`  - Why: ${v.rationale}`);
      for (const e of v.evidence) {
        if (e.file) lines.push(`  - at \`${e.file}${e.line ? `:${e.line}` : ""}\``);
        if (e.snippet) lines.push(`  - \`${e.snippet}\``);
      }
      if (v.suggestedFix) lines.push(`  - Fix: ${v.suggestedFix}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
