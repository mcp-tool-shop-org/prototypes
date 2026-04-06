/**
 * Bundle manifest — describes what's inside a receipt bundle.
 *
 * Lives at the root of the zip as `manifest.json`.
 */
export interface BundleManifest {
  bundle_version: "1.0";
  created_at: string;
  /** Path to the root receipt within the bundle. */
  root_receipt: string;
  /** Version of receipt-factory that created this bundle. */
  factory_version: string;
  contents: {
    /** Paths to receipt JSON files inside the bundle. */
    receipts: string[];
    /** Paths to evidence pack directories inside the bundle. */
    evidence: string[];
    /** Path to the policy file inside the bundle (if included). */
    policy?: string;
    /** Paths to signature sidecars inside the bundle. */
    signatures: string[];
  };
}

/**
 * Bundle hashes — SHA-256 of every file in the bundle for tamper-evidence.
 *
 * Lives at the root of the zip as `hashes.json`.
 */
export interface BundleHashes {
  algorithm: "sha256";
  files: Record<string, string>;
}

/**
 * Options for creating a bundle.
 */
export interface CreateBundleOptions {
  /** Include referenced receipts (follow the provenance graph). */
  follow?: boolean;
  /** Include evidence packs referenced by receipts. */
  includeEvidence?: boolean;
  /** Path to a policy file to include in the bundle. */
  policy?: string;
  /** Output path for the zip file. */
  output?: string;
  /** Directory for resolving receipt reference paths. */
  receiptsDir?: string;
}

/**
 * Result of creating a bundle.
 */
export interface CreateBundleResult {
  /** Path to the created zip file. */
  zipPath: string;
  /** The bundle manifest. */
  manifest: BundleManifest;
  /** The bundle hashes. */
  hashes: BundleHashes;
}

/**
 * Options for verifying a bundle.
 */
export interface VerifyBundleOptions {
  /** Enable strict lint checks on receipts. */
  strict?: boolean;
  /** Require a valid bundle-level signature (detached sidecar). */
  requireBundleSignature?: boolean;
}

/**
 * Result of a single hash check within a bundle.
 */
export interface BundleHashCheck {
  file: string;
  passed: boolean;
  message: string;
}

/**
 * Result of verifying a single receipt within a bundle.
 */
export interface BundleReceiptCheck {
  file: string;
  valid: boolean;
  message: string;
}

/**
 * Result of a bundle-level signature check.
 */
export interface BundleSignatureCheck {
  passed: boolean;
  message: string;
}

/**
 * Result of verifying a bundle.
 */
export interface VerifyBundleResult {
  valid: boolean;
  manifest: BundleManifest;
  /** Bundle-level signature check (only present when requireBundleSignature is set). */
  signatureCheck?: BundleSignatureCheck;
  hashChecks: BundleHashCheck[];
  receiptChecks: BundleReceiptCheck[];
}
