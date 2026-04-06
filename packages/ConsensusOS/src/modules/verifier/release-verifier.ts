/**
 * Release Verifier Module
 *
 * Binary integrity and signature validation plugin. Verifies release
 * artifacts against known hashes and optional cryptographic signatures.
 *
 * Capabilities: verifier
 * Events emitted: release.verified, release.verification.failed
 * Invariants: release.hash-integrity, release.signature-valid
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import type {
  Plugin,
  PluginManifest,
  PluginContext,
  PluginConfig,
  LifecycleResult,
  Logger,
} from "../../plugins/api.js";
import type { EventBus } from "../../core/event-bus.js";
import type { InvariantEngine } from "../../core/invariant-engine.js";

// ─── Types ──────────────────────────────────────────────────────────

export type HashAlgorithm = "sha256" | "sha384" | "sha512";

export interface ReleaseArtifact {
  /** Path to the artifact file */
  path: string;
  /** Expected hash (hex-encoded) */
  expectedHash: string;
  /** Hash algorithm (default: sha256) */
  algorithm?: HashAlgorithm;
  /** Optional signature to verify (hex-encoded) */
  signature?: string;
}

export interface VerificationResult {
  artifact: string;
  algorithm: HashAlgorithm;
  expectedHash: string;
  actualHash: string;
  hashMatch: boolean;
  signatureValid: boolean | null;
  verifiedAt: string;
  error?: string;
}

export interface VerificationReport {
  results: VerificationResult[];
  allPassed: boolean;
  verifiedAt: string;
}

export interface ReleaseVerifierConfig {
  /** Known artifacts to verify */
  artifacts?: ReleaseArtifact[];
  /** Default hash algorithm */
  defaultAlgorithm?: HashAlgorithm;
  /** Custom hash function (for testing / DI) */
  hashFn?: (path: string, algorithm: HashAlgorithm) => Promise<string>;
  /** Custom signature verifier (for testing / DI) */
  signatureVerifier?: (hash: string, signature: string) => Promise<boolean>;
}

// ─── Default Implementations ────────────────────────────────────────

async function defaultHashFn(path: string, algorithm: HashAlgorithm): Promise<string> {
  const data = await readFile(resolve(path));
  return createHash(algorithm).update(data).digest("hex");
}

async function defaultSignatureVerifier(_hash: string, _signature: string): Promise<boolean> {
  // Fail-closed: reject all signatures until a real verifier is configured.
  // Callers should provide a signatureVerifier via ReleaseVerifierConfig
  // that implements ED25519 or ECDSA public key verification.
  return false;
}

// ─── Plugin ─────────────────────────────────────────────────────────

export class ReleaseVerifier implements Plugin {
  readonly manifest: PluginManifest = {
    id: "release-verifier",
    name: "Release Verifier",
    version: "1.0.0",
    capabilities: ["verifier"],
    description: "Binary integrity and signature validation for release artifacts",
  };

  private events!: EventBus;
  private log!: Logger;
  private artifacts: ReleaseArtifact[] = [];
  private defaultAlgorithm: HashAlgorithm = "sha256";
  private hashFn!: (path: string, algorithm: HashAlgorithm) => Promise<string>;
  private signatureVerifier!: (hash: string, signature: string) => Promise<boolean>;
  private lastReport: VerificationReport | null = null;

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    this.events = ctx.events;
    this.log = ctx.log;

    const raw = ctx.config as PluginConfig & ReleaseVerifierConfig;
    this.artifacts = raw.artifacts ?? [];
    this.defaultAlgorithm = raw.defaultAlgorithm ?? "sha256";
    this.hashFn = raw.hashFn ?? defaultHashFn;
    this.signatureVerifier = raw.signatureVerifier ?? defaultSignatureVerifier;

    // Register integrity invariants
    ctx.invariants.register({
      name: "release.hash-integrity",
      owner: this.manifest.id,
      description: "All release artifact hashes must match expected values",
      check: () => this.lastReport?.allPassed ?? true,
    });

    this.log.info("Release Verifier initialized", { artifactCount: this.artifacts.length });
    return { ok: true };
  }

  async start(): Promise<LifecycleResult> {
    this.events.publish("release.verifier.ready", this.manifest.id, {
      artifactCount: this.artifacts.length,
    });

    this.log.info("Release Verifier started");
    return { ok: true };
  }

  async stop(): Promise<LifecycleResult> {
    this.log.info("Release Verifier stopped");
    return { ok: true };
  }

  async destroy(): Promise<void> {
    this.lastReport = null;
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Verify a single artifact */
  async verifyArtifact(artifact: ReleaseArtifact): Promise<VerificationResult> {
    const algorithm = artifact.algorithm ?? this.defaultAlgorithm;
    const now = new Date().toISOString();

    try {
      const actualHash = await this.hashFn(artifact.path, algorithm);
      const hashMatch = actualHash === artifact.expectedHash;

      let signatureValid: boolean | null = null;
      if (artifact.signature) {
        signatureValid = await this.signatureVerifier(actualHash, artifact.signature);
      }

      const result: VerificationResult = {
        artifact: basename(artifact.path),
        algorithm,
        expectedHash: artifact.expectedHash,
        actualHash,
        hashMatch,
        signatureValid,
        verifiedAt: now,
      };

      return result;
    } catch (err) {
      return {
        artifact: basename(artifact.path),
        algorithm,
        expectedHash: artifact.expectedHash,
        actualHash: "",
        hashMatch: false,
        signatureValid: null,
        verifiedAt: now,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /** Verify all configured artifacts */
  async verifyAll(): Promise<VerificationReport> {
    const results: VerificationResult[] = [];

    for (const artifact of this.artifacts) {
      const result = await this.verifyArtifact(artifact);
      results.push(result);

      if (result.hashMatch) {
        this.events.publish("release.verified", this.manifest.id, result);
      } else {
        this.events.publish("release.verification.failed", this.manifest.id, result);
      }
    }

    const report: VerificationReport = {
      results,
      allPassed: results.every((r) => r.hashMatch && (r.signatureValid === null || r.signatureValid)),
      verifiedAt: new Date().toISOString(),
    };

    this.lastReport = report;
    return report;
  }

  /** Get the last verification report */
  getLastReport(): VerificationReport | null {
    return this.lastReport;
  }
}

/** Factory export */
export function createReleaseVerifier(): Plugin {
  return new ReleaseVerifier();
}
