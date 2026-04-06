/**
 * Release Attestation
 *
 * CI/CD release attestation pipeline for verifying build provenance.
 * Creates tamper-evident attestation records that prove:
 * - Which source commit produced a build
 * - Which CI environment ran the build
 * - What artifacts were produced and their checksums
 * - Who approved the release
 */

import { createHash } from "node:crypto";

// ─── Types ──────────────────────────────────────────────────────────

export interface BuildProvenance {
  /** Git commit SHA */
  commitSha: string;
  /** Git branch or tag */
  ref: string;
  /** Repository URL */
  repository: string;
  /** CI system (e.g., "github-actions", "jenkins") */
  ciSystem: string;
  /** CI run/job identifier */
  runId: string;
  /** Builder identity (machine or user) */
  builder: string;
  /** ISO-8601 build timestamp */
  builtAt: string;
}

export interface ArtifactRecord {
  /** Artifact filename */
  name: string;
  /** SHA-256 digest */
  sha256: string;
  /** File size in bytes */
  sizeBytes: number;
  /** MIME type */
  contentType?: string;
}

export interface Attestation {
  /** Unique attestation ID */
  readonly id: string;
  /** Attestation version/schema */
  readonly schemaVersion: string;
  /** Build provenance */
  readonly provenance: BuildProvenance;
  /** Artifacts produced by the build */
  readonly artifacts: readonly ArtifactRecord[];
  /** Attestation signature (SHA-256 of JSON payload) */
  readonly signature: string;
  /** ISO-8601 attestation timestamp */
  readonly attestedAt: string;
  /** Who approved this attestation */
  readonly approvedBy?: string;
  /** Whether this attestation has been verified */
  verified: boolean;
}

export interface AttestationOptions {
  provenance: BuildProvenance;
  artifacts: ArtifactRecord[];
  approvedBy?: string;
}

// ─── Attestation Pipeline ───────────────────────────────────────────

let attestationCounter = 0;

export class AttestationPipeline {
  private readonly attestations = new Map<string, Attestation>();

  /** Create a new attestation for a build */
  attest(options: AttestationOptions): Attestation {
    const id = `att-${++attestationCounter}-${Date.now()}`;
    const payload = JSON.stringify({
      provenance: options.provenance,
      artifacts: options.artifacts,
    });
    const signature = createHash("sha256").update(payload).digest("hex");

    const attestation: Attestation = {
      id,
      schemaVersion: "1.0.0",
      provenance: { ...options.provenance },
      artifacts: options.artifacts.map((a) => ({ ...a })),
      signature,
      attestedAt: new Date().toISOString(),
      approvedBy: options.approvedBy,
      verified: false,
    };

    this.attestations.set(id, attestation);
    return attestation;
  }

  /** Verify an attestation's signature */
  verify(attestationId: string): { valid: boolean; reason?: string } {
    const att = this.attestations.get(attestationId);
    if (!att) return { valid: false, reason: "Attestation not found" };

    const payload = JSON.stringify({
      provenance: att.provenance,
      artifacts: att.artifacts,
    });
    const expected = createHash("sha256").update(payload).digest("hex");

    if (expected !== att.signature) {
      return { valid: false, reason: "Signature mismatch — attestation may be tampered" };
    }

    att.verified = true;
    return { valid: true };
  }

  /** Verify an artifact checksum against an attestation */
  verifyArtifact(
    attestationId: string,
    artifactName: string,
    sha256: string,
  ): { valid: boolean; reason?: string } {
    const att = this.attestations.get(attestationId);
    if (!att) return { valid: false, reason: "Attestation not found" };

    const artifact = att.artifacts.find((a) => a.name === artifactName);
    if (!artifact) return { valid: false, reason: `Artifact "${artifactName}" not in attestation` };

    if (artifact.sha256 !== sha256) {
      return { valid: false, reason: "Artifact SHA-256 mismatch" };
    }

    return { valid: true };
  }

  /** Get an attestation by ID */
  get(id: string): Attestation | undefined {
    return this.attestations.get(id);
  }

  /** List all attestations */
  list(): Attestation[] {
    return [...this.attestations.values()];
  }

  /** Find attestations by commit SHA */
  byCommit(commitSha: string): Attestation[] {
    return this.list().filter((a) => a.provenance.commitSha === commitSha);
  }

  /** Clear all attestations (for testing) */
  clear(): void {
    this.attestations.clear();
  }
}
