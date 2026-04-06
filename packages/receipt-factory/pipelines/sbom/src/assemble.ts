import { ReceiptBuilder } from "@receipt-factory/core";
import type { Receipt } from "@receipt-factory/core";
import type { SbomEvidence } from "./types.js";

/**
 * Assemble a Receipt from SBOM evidence.
 */
export function assemble(evidence: SbomEvidence): Receipt {
  const {
    subject,
    collected_at,
    ref,
    format,
    spec_version,
    digest,
    filename,
    size_bytes,
    component_count,
    generator,
    inputs,
  } = evidence;

  const builder = new ReceiptBuilder("sbom")
    .subject({
      type: "repository",
      name: subject,
      ref,
    })
    .intent(
      `SBOM generated for ${subject}${ref ? ` @ ${ref}` : ""} using ${generator.name} ${generator.version} (${format} ${spec_version}, ${component_count} components)`,
    )
    .createdAt(collected_at)
    .inputs({
      format,
      spec_version,
      generator_name: generator.name,
      generator_version: generator.version,
      component_count,
      lockfile_digest: inputs?.lockfile_digest ?? "not captured",
      package_manifest_digest: inputs?.package_manifest_digest ?? "not captured",
    });

  // The SBOM file itself is the primary output
  builder.addOutput({
    name: filename,
    digest: `sha256:${digest}`,
    size: size_bytes,
  });

  // Evidence: the generation run
  builder.addEvidence({
    type: "sbom_generation",
    description: `${generator.name} ${generator.version} generated ${format} ${spec_version} SBOM (${component_count} components)`,
  });

  if (inputs?.lockfile_digest) {
    builder.addEvidence({
      type: "lockfile_snapshot",
      description: `Lockfile digest: ${inputs.lockfile_digest}`,
    });
  }

  // Verification steps
  builder.addStep("Download the SBOM file");
  builder.addStep("Verify the SBOM digest matches the receipt");
  builder.addStep("Run the verify command to check receipt integrity");
  builder.addCommand(`rf verify receipts/sbom/<date>/<slug>.json`);
  builder.addCommand(`shasum -a 256 ${filename}`);

  // Environment
  builder.environment({
    tool_versions: {
      [generator.name]: generator.version,
    },
  });

  // Policy
  builder.policy({
    redacted_fields: [],
    required_checks: ["schema", "hash"],
  });

  // Metadata
  builder.meta("factory_version", "1.7.2");
  builder.meta("pipeline", "sbom");
  builder.meta("sbom_format", format);
  builder.meta("sbom_spec_version", spec_version);
  builder.meta("sbom_digest", digest);
  builder.meta("component_count", component_count);

  return builder.build();
}
