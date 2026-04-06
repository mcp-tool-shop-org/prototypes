import { ReceiptBuilder } from "@receipt-factory/core";
import type { Receipt } from "@receipt-factory/core";
import type { SecurityAuditEvidence } from "./types.js";

/**
 * Assemble a Receipt from security audit evidence.
 */
export function assemble(evidence: SecurityAuditEvidence): Receipt {
  const { scan_target, collected_at, commit_sha, tool, summary, findings, lockfile_digest } = evidence;

  // Build findings summary string
  const severityParts: string[] = [];
  if (summary.critical > 0) severityParts.push(`${summary.critical} critical`);
  if (summary.high > 0) severityParts.push(`${summary.high} high`);
  if (summary.moderate > 0) severityParts.push(`${summary.moderate} moderate`);
  if (summary.low > 0) severityParts.push(`${summary.low} low`);
  if (summary.info > 0) severityParts.push(`${summary.info} info`);
  const findingsSummary = severityParts.length > 0
    ? severityParts.join(", ")
    : "no vulnerabilities found";

  const builder = new ReceiptBuilder("audit")
    .subject({
      type: "repository",
      name: scan_target,
      ref: commit_sha,
    })
    .intent(
      `Security audit of ${scan_target} using ${tool.name} ${tool.version}: ${summary.total} finding(s) (${findingsSummary})`,
    )
    .createdAt(collected_at)
    .inputs({
      tool_name: tool.name,
      tool_version: tool.version,
      commit_sha: commit_sha ?? "unknown",
      lockfile_digest: lockfile_digest ?? "not captured",
    });

  // Each finding becomes an output
  for (const finding of findings) {
    builder.addOutput({
      name: `${finding.severity}: ${finding.package}`,
      digest: finding.title,
      url: finding.url,
    });
  }

  // Evidence: the audit run
  builder.addEvidence({
    type: "security_scan",
    description: `${tool.name} ${tool.version} scan of ${scan_target} at ${collected_at}`,
  });

  if (lockfile_digest) {
    builder.addEvidence({
      type: "lockfile_snapshot",
      description: `Lockfile digest: ${lockfile_digest}`,
    });
  }

  // Verification steps
  builder.addStep("Review the findings list for accuracy");
  builder.addStep("Run the verify command to check receipt integrity");
  builder.addStep("Re-run the audit tool to confirm findings match");
  builder.addCommand(`rf verify receipts/security-audit/<date>/<slug>.json`);

  // Environment
  builder.environment({
    tool_versions: {
      [tool.name]: tool.version,
    },
  });

  // Policy
  builder.policy({
    redacted_fields: [],
    required_checks: ["schema", "hash"],
  });

  // Metadata
  builder.meta("factory_version", "1.7.2");
  builder.meta("pipeline", "security-audit");
  builder.meta("findings_total", summary.total);
  builder.meta("findings_critical", summary.critical);
  builder.meta("findings_high", summary.high);
  builder.meta("findings_moderate", summary.moderate);
  builder.meta("findings_low", summary.low);

  return builder.build();
}
