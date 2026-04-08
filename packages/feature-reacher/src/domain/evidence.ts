/**
 * Evidence Model
 *
 * Represents a piece of evidence linking a feature to an artifact.
 * Every diagnosis must be backed by evidence—no exceptions.
 */

import type { ArtifactId, FeatureId } from "./feature";

/**
 * Types of signals that evidence can represent.
 * Each signal type has specific implications for adoption risk.
 */
export type SignalType =
  | "recency" // How recently the feature was mentioned
  | "visibility" // How prominently the feature is surfaced
  | "redundancy" // Feature mentioned but potentially duplicated
  | "onboarding" // Feature appears in onboarding/getting-started context
  | "deprecation" // Signals of potential deprecation
  | "update" // Feature was recently updated or changed
  | "documentation" // Feature has dedicated documentation
  | "faq" // Feature mentioned in FAQ context
  | "release_note"; // Feature mentioned in release notes

/**
 * A piece of evidence extracted from an artifact.
 */
export interface Evidence {
  /** Unique identifier */
  id: string;

  /** The artifact this evidence was extracted from */
  artifactId: ArtifactId;

  /** The feature this evidence relates to */
  featureId: FeatureId;

  /** The exact text excerpt from the artifact */
  excerpt: string;

  /** What type of signal this evidence represents */
  signalType: SignalType;

  /** Where in the artifact this was found (line number, section, etc.) */
  location?: string;

  /** ISO timestamp of when this evidence was created */
  timestamp: string;

  /** Optional confidence score (0-1) for extracted evidence */
  confidence?: number;
}

/**
 * Creates a new Evidence instance.
 */
export function createEvidence(
  id: string,
  artifactId: ArtifactId,
  featureId: FeatureId,
  excerpt: string,
  signalType: SignalType,
  timestamp: string,
  options?: {
    location?: string;
    confidence?: number;
  }
): Evidence {
  return {
    id,
    artifactId,
    featureId,
    excerpt,
    signalType,
    timestamp,
    location: options?.location,
    confidence: options?.confidence,
  };
}

/**
 * Groups evidence by feature ID.
 */
export function groupEvidenceByFeature(
  evidenceList: Evidence[]
): Map<FeatureId, Evidence[]> {
  const grouped = new Map<FeatureId, Evidence[]>();

  for (const evidence of evidenceList) {
    const existing = grouped.get(evidence.featureId) ?? [];
    grouped.set(evidence.featureId, [...existing, evidence]);
  }

  return grouped;
}

/**
 * Filters evidence by signal type.
 */
export function filterEvidenceBySignal(
  evidenceList: Evidence[],
  signalType: SignalType
): Evidence[] {
  return evidenceList.filter((e) => e.signalType === signalType);
}
