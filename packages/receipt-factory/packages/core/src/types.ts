/**
 * Receipt kind — what type of work this receipt documents.
 */
export type ReceiptKind =
  | "ci_run"
  | "release"
  | "registry_sync"
  | "audit"
  | "sbom"
  | "delivery";

/**
 * The subject of a receipt — what this receipt is about.
 */
export interface ReceiptSubject {
  type: string;
  name: string;
  ref?: string;
  url?: string;
}

/**
 * A single output artifact produced by the work.
 */
export interface ReceiptOutput {
  name: string;
  digest?: string;
  url?: string;
  size?: number;
}

/**
 * A piece of evidence supporting the receipt.
 */
export interface ReceiptEvidence {
  type: string;
  url?: string;
  description: string;
}

/**
 * How to verify this receipt.
 */
export interface ReceiptVerification {
  steps: string[];
  commands: string[];
}

/**
 * The environment where the work was performed.
 */
export interface ReceiptEnvironment {
  runner?: string;
  os?: string;
  tool_versions: Record<string, string>;
}

/**
 * Policy metadata — redaction and required checks.
 */
export interface ReceiptPolicy {
  redacted_fields: string[];
  required_checks: string[];
}

/**
 * Integrity information — content hash, trust spine, and optional signature.
 */
export interface ReceiptIntegrity {
  algorithm: "sha256";
  digest: string;
  canonical_format_version: "1.0";
  canonical_length_bytes: number;
  signature?: string;
  signed_by?: string;
  signed_at?: string;
  rekor_log_id?: string;
}

/**
 * Policy identity — records which lint policy was applied at creation time.
 * The hash is the SHA-256 of the canonical JSON policy rules, enabling
 * verification that the same policy was used at lint and verify time.
 */
export interface PolicyIdentity {
  hash: string;
  version?: string;
  path?: string;
  signed?: boolean;
  signatureRef?: string;
}

/**
 * A reference from one receipt to another receipt or evidence pack.
 * Forms the edges of a verifiable provenance graph.
 */
export interface ReceiptReference {
  kind: "receipt" | "evidence_pack";
  hash: string;
  description: string;
  path?: string;
  url?: string;
}

/**
 * A receipt — a signed, timestamped, reproducible record of what happened.
 *
 * Human on the surface, ruthless on the backend.
 */
export interface Receipt {
  receipt_version: "1.0.0";
  kind: ReceiptKind;
  id: string;
  created_at: string;
  subject: ReceiptSubject;
  intent: string;
  inputs: Record<string, unknown>;
  outputs: ReceiptOutput[];
  evidence: ReceiptEvidence[];
  verification: ReceiptVerification;
  environment: ReceiptEnvironment;
  policy: ReceiptPolicy;
  integrity: ReceiptIntegrity;
  policy_identity?: PolicyIdentity;
  metadata?: Record<string, unknown>;
  references?: ReceiptReference[];
}

/**
 * A receipt without computed fields (id, integrity).
 * Used as input to the builder before finalization.
 */
export type ReceiptDraft = Omit<Receipt, "id" | "integrity">;
