/**
 * Evidence collected for an SBOM receipt.
 */
export interface SbomEvidence {
  /** What this SBOM covers (e.g., repository name or package name). */
  subject: string;
  /** ISO timestamp of when the SBOM was generated. */
  collected_at: string;
  /** Commit SHA or tag at time of generation. */
  ref?: string;
  /** SBOM format (e.g., "cyclonedx", "spdx"). */
  format: "cyclonedx" | "spdx" | string;
  /** SBOM spec version (e.g., "1.5" for CycloneDX, "2.3" for SPDX). */
  spec_version: string;
  /** SHA-256 digest of the SBOM file. */
  digest: string;
  /** Original filename of the SBOM. */
  filename: string;
  /** Size of the SBOM file in bytes. */
  size_bytes: number;
  /** Number of components/packages listed in the SBOM. */
  component_count: number;
  /** Tool that generated the SBOM. */
  generator: {
    name: string;
    version: string;
  };
  /** Input digests — what was used to generate this SBOM. */
  inputs?: {
    lockfile_digest?: string;
    package_manifest_digest?: string;
  };
}
