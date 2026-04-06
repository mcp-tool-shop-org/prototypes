import { ReceiptBuilder } from "@receipt-factory/core";
import type { Receipt } from "@receipt-factory/core";
import type { RegistrySyncEvidence } from "./types.js";

/**
 * Assemble a Receipt from registry sync evidence.
 */
export function assemble(evidence: RegistrySyncEvidence): Receipt {
  const { repository, registry, packages, summary, collected_at } = evidence;

  // Classify overall drift status
  const driftStatus =
    summary.ahead + summary.behind + summary.unpublished === 0
      ? "all in sync"
      : `${summary.ahead} ahead, ${summary.behind} behind, ${summary.unpublished} unpublished`;

  const builder = new ReceiptBuilder("registry_sync")
    .subject({
      type: "repository",
      name: repository,
    })
    .intent(
      `Registry sync check for ${repository} against ${registry}: ${driftStatus}`,
    )
    .createdAt(collected_at)
    .inputs({
      registry,
      package_count: summary.total,
    });

  // Each package becomes an output
  for (const pkg of packages) {
    builder.addOutput({
      name: pkg.name,
      digest: pkg.publishedVersion
        ? `local:${pkg.localVersion} published:${pkg.publishedVersion}`
        : `local:${pkg.localVersion} unpublished`,
    });
  }

  // Evidence: the sync check itself
  builder.addEvidence({
    type: "registry_query",
    description: `Queried ${registry} for ${summary.total} package(s) at ${collected_at}`,
  });

  // Verification steps
  builder.addStep("Review the package list for version drift");
  builder.addStep("Run the verify command to check receipt integrity");
  builder.addCommand(`rf verify receipts/registry-sync/<date>/<slug>.json`);

  // Environment
  builder.environment({
    tool_versions: {},
  });

  // Policy
  builder.policy({
    redacted_fields: [],
    required_checks: ["schema", "hash"],
  });

  // Metadata
  builder.meta("factory_version", "1.7.2");
  builder.meta("pipeline", "registry-sync");
  builder.meta("total_packages", summary.total);
  builder.meta("in_sync", summary.in_sync);
  builder.meta("ahead", summary.ahead);
  builder.meta("behind", summary.behind);
  builder.meta("unpublished", summary.unpublished);

  return builder.build();
}
