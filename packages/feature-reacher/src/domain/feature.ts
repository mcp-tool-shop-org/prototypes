/**
 * Canonical Feature Model
 *
 * The core data structure representing a product feature.
 * Everything in the analysis layer hangs off this model.
 */

/**
 * Unique identifier for a feature.
 */
export type FeatureId = string;

/**
 * Unique identifier for an artifact.
 */
export type ArtifactId = string;

/**
 * A product feature extracted from documentation.
 */
export interface Feature {
  /** Unique identifier */
  id: FeatureId;

  /** Canonical name of the feature */
  name: string;

  /** Alternative names, abbreviations, or references to this feature */
  aliases: string[];

  /** IDs of artifacts where this feature was mentioned */
  sourceArtifacts: ArtifactId[];

  /** ISO timestamp of first mention across all artifacts */
  firstSeen: string;

  /** ISO timestamp of most recent mention across all artifacts */
  lastSeen: string;
}

/**
 * Creates a new Feature with default values.
 */
export function createFeature(
  id: FeatureId,
  name: string,
  artifactId: ArtifactId,
  timestamp: string
): Feature {
  return {
    id,
    name,
    aliases: [],
    sourceArtifacts: [artifactId],
    firstSeen: timestamp,
    lastSeen: timestamp,
  };
}

/**
 * Merges a new mention into an existing feature.
 */
export function mergeFeatureMention(
  feature: Feature,
  artifactId: ArtifactId,
  timestamp: string
): Feature {
  const sourceArtifacts = feature.sourceArtifacts.includes(artifactId)
    ? feature.sourceArtifacts
    : [...feature.sourceArtifacts, artifactId];

  return {
    ...feature,
    sourceArtifacts,
    firstSeen:
      timestamp < feature.firstSeen ? timestamp : feature.firstSeen,
    lastSeen:
      timestamp > feature.lastSeen ? timestamp : feature.lastSeen,
  };
}
