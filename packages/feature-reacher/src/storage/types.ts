/**
 * Storage layer types for audit persistence.
 * Designed with a thin interface to support future server DB migration.
 */

import { ArtifactId } from "../domain/feature";
import { Feature } from "../domain/feature";
import { RankedFeature, AuditSummary } from "../analysis/ranking";

/**
 * Unique identifier for a persisted audit.
 */
export type PersistedAuditId = string;

/**
 * Unique identifier for an artifact set.
 */
export type ArtifactSetId = string;

/**
 * A saved artifact reference (not the full content, to save space).
 */
export interface SavedArtifactRef {
  id: ArtifactId;
  name: string;
  type: string;
  charCount: number;
  hash: string; // Content hash for change detection
}

/**
 * A fully persisted audit with all data needed for reconstruction.
 */
export interface PersistedAudit {
  id: PersistedAuditId;
  auditId: string; // The deterministic AUD-XXXXXX
  name: string;
  createdAt: string;
  updatedAt: string;

  // Source data
  artifactRefs: SavedArtifactRef[];
  artifactSetId?: ArtifactSetId; // If run from a saved set

  // Extracted data
  features: Feature[];

  // Analysis results
  rankedFeatures: RankedFeature[];
  summary: AuditSummary;

  // Metadata
  tags: string[];
  notes: string;
}

/**
 * A named collection of artifacts for repeatable audits.
 */
export interface ArtifactSet {
  id: ArtifactSetId;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;

  // Artifact references with content hashes
  artifactRefs: SavedArtifactRef[];

  // Optional: store full content for offline replay
  artifactContents?: Map<ArtifactId, string>;
}

/**
 * Lightweight audit reference for listing.
 */
export interface AuditListItem {
  id: PersistedAuditId;
  auditId: string;
  name: string;
  createdAt: string;
  artifactCount: number;
  featureCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
}

/**
 * Storage interface - thin abstraction for future DB migration.
 */
export interface AuditStorage {
  // Audits
  saveAudit(audit: PersistedAudit): Promise<PersistedAuditId>;
  getAudit(id: PersistedAuditId): Promise<PersistedAudit | null>;
  listAudits(): Promise<AuditListItem[]>;
  deleteAudit(id: PersistedAuditId): Promise<boolean>;
  updateAuditName(id: PersistedAuditId, name: string): Promise<boolean>;

  // Artifact Sets
  saveArtifactSet(set: ArtifactSet): Promise<ArtifactSetId>;
  getArtifactSet(id: ArtifactSetId): Promise<ArtifactSet | null>;
  listArtifactSets(): Promise<ArtifactSet[]>;
  deleteArtifactSet(id: ArtifactSetId): Promise<boolean>;

  // Settings
  getSetting<T>(key: string): Promise<T | null>;
  setSetting<T>(key: string, value: T): Promise<void>;
}

/**
 * Generate a unique ID for storage.
 */
export function generateStorageId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Generate a content hash for change detection.
 */
export function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}
