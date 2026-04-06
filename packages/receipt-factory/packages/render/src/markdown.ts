import type { Receipt } from "@receipt-factory/core";
import { canonicalize } from "@receipt-factory/core";

/**
 * Render a receipt as a Markdown document.
 *
 * Two layers:
 * 1. Front page — human-readable summary
 * 2. Back matter — technical details in a collapsible section
 */
export function renderMarkdown(receipt: Receipt): string {
  const lines: string[] = [];

  // Header
  const kindLabel = receipt.kind.replace(/_/g, " ");
  lines.push(`# ${capitalize(kindLabel)}: ${receipt.subject.name}`);
  lines.push("");

  // Subtitle with date
  const date = receipt.created_at.split("T")[0];
  lines.push(`> ${capitalize(kindLabel)} on ${date}`);
  if (receipt.environment.runner) {
    lines[lines.length - 1] += ` by ${receipt.environment.runner}`;
  }
  lines.push("");

  // Intent
  lines.push("## What happened");
  lines.push("");
  lines.push(receipt.intent);
  lines.push("");

  // Subject details
  if (receipt.subject.ref || receipt.subject.url) {
    lines.push("**Subject:**");
    if (receipt.subject.ref) lines.push(`- Ref: \`${receipt.subject.ref}\``);
    if (receipt.subject.url) lines.push(`- URL: ${receipt.subject.url}`);
    lines.push("");
  }

  // Outputs
  if (receipt.outputs.length > 0) {
    lines.push("## Results");
    lines.push("");
    lines.push("| Output | Digest | Link |");
    lines.push("|--------|--------|------|");
    for (const out of receipt.outputs) {
      const digest = out.digest ? `\`${truncateDigest(out.digest)}\`` : "—";
      const link = out.url ? `[link](${out.url})` : "—";
      const size = out.size != null ? ` (${formatBytes(out.size)})` : "";
      lines.push(`| ${out.name}${size} | ${digest} | ${link} |`);
    }
    lines.push("");
  }

  // Evidence
  if (receipt.evidence.length > 0) {
    lines.push("## Evidence");
    lines.push("");
    for (const ev of receipt.evidence) {
      if (ev.url) {
        lines.push(`- **${ev.type}**: [${ev.description}](${ev.url})`);
      } else {
        lines.push(`- **${ev.type}**: ${ev.description}`);
      }
    }
    lines.push("");
  }

  // Verification
  if (receipt.verification.steps.length > 0 || receipt.verification.commands.length > 0) {
    lines.push("## How to verify");
    lines.push("");
    for (const step of receipt.verification.steps) {
      lines.push(`1. ${step}`);
    }
    if (receipt.verification.commands.length > 0) {
      lines.push("");
      lines.push("```bash");
      for (const cmd of receipt.verification.commands) {
        lines.push(cmd);
      }
      lines.push("```");
    }
    lines.push("");
  }

  // Policy identity (if present)
  if (receipt.policy_identity?.hash) {
    const truncHash = receipt.policy_identity.hash.slice(0, 16);
    const signed = receipt.policy_identity.signed ? " (signed)" : "";
    lines.push(`**Lint policy:** \`${truncHash}…\`${signed}`);
    lines.push("");
  }

  // What this does NOT prove
  lines.push("## What this does NOT prove");
  lines.push("");
  lines.push("- That the underlying code is correct (receipts prove process, not quality)");
  lines.push("- That the CI environment itself wasn't compromised");
  lines.push("- That artifacts haven't been modified after receipt creation");
  lines.push("");

  // Back matter
  lines.push("---");
  lines.push("");
  lines.push("<details>");
  lines.push("<summary>Technical details</summary>");
  lines.push("");

  // Integrity
  lines.push("### Integrity");
  lines.push("");
  lines.push(`- **ID:** \`${receipt.id}\``);
  lines.push(`- **Algorithm:** ${receipt.integrity.algorithm}`);
  lines.push(`- **Digest:** \`${receipt.integrity.digest}\``);
  if (receipt.integrity.signature) {
    lines.push(`- **Signature:** \`${receipt.integrity.signature}\``);
  }
  lines.push("");

  // Environment
  lines.push("### Environment");
  lines.push("");
  if (receipt.environment.os) lines.push(`- **OS:** ${receipt.environment.os}`);
  if (receipt.environment.runner) lines.push(`- **Runner:** ${receipt.environment.runner}`);
  if (Object.keys(receipt.environment.tool_versions).length > 0) {
    lines.push("- **Tool versions:**");
    for (const [tool, ver] of Object.entries(receipt.environment.tool_versions)) {
      lines.push(`  - ${tool}: ${ver}`);
    }
  }
  lines.push("");

  // Policy
  const hasPolicy = receipt.policy.redacted_fields.length > 0 ||
    receipt.policy.required_checks.length > 0 ||
    receipt.policy_identity?.hash;
  if (hasPolicy) {
    lines.push("### Policy");
    lines.push("");
    if (receipt.policy_identity?.hash) {
      lines.push(`- **Policy hash:** \`${receipt.policy_identity.hash}\``);
      if (receipt.policy_identity.version) {
        lines.push(`- **Policy version:** ${receipt.policy_identity.version}`);
      }
      if (receipt.policy_identity.signed) {
        lines.push(`- **Signed:** yes`);
      }
    }
    if (receipt.policy.redacted_fields.length > 0) {
      lines.push(`- **Redacted:** ${receipt.policy.redacted_fields.join(", ")}`);
    }
    if (receipt.policy.required_checks.length > 0) {
      lines.push(`- **Required checks:** ${receipt.policy.required_checks.join(", ")}`);
    }
    lines.push("");
  }

  // Canonical JSON
  lines.push("### Canonical JSON");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(JSON.parse(canonicalize(receipt)), null, 2));
  lines.push("```");
  lines.push("");
  lines.push("</details>");
  lines.push("");

  return lines.join("\n");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncateDigest(digest: string): string {
  if (digest.length <= 16) return digest;
  return digest.slice(0, 16) + "…";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
