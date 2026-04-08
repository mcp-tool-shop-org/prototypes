/**
 * Scoring Heuristics
 *
 * Implements recency and visibility scoring for features.
 * Clear heuristics, no ML—every score is explainable.
 */

import type { Feature, Evidence, Artifact } from "@/domain";

/**
 * Score breakdown with explanations.
 */
export interface ScoreBreakdown {
  /** Overall score (0-1) */
  score: number;
  /** Human-readable explanation of the score */
  explanation: string;
  /** Individual factor contributions */
  factors: ScoreFactor[];
}

/**
 * A single factor contributing to a score.
 */
export interface ScoreFactor {
  name: string;
  value: number;
  weight: number;
  contribution: number;
  explanation: string;
}

/**
 * Complete score for a feature.
 */
export interface FeatureScore {
  featureId: string;
  featureName: string;
  recency: ScoreBreakdown;
  visibility: ScoreBreakdown;
  documentationDensity: ScoreBreakdown;
  /** Combined risk score (higher = more at risk) */
  adoptionRisk: ScoreBreakdown;
}

/**
 * Configuration for scoring calculations.
 */
export interface ScoringConfig {
  /** How many days until a feature is considered "stale" */
  staleDays: number;
  /** Weight for recency in combined score */
  recencyWeight: number;
  /** Weight for visibility in combined score */
  visibilityWeight: number;
  /** Weight for documentation density in combined score */
  densityWeight: number;
}

const DEFAULT_CONFIG: ScoringConfig = {
  staleDays: 180, // 6 months
  recencyWeight: 0.4,
  visibilityWeight: 0.35,
  densityWeight: 0.25,
};

/**
 * Calculates days since a timestamp.
 */
function daysSince(timestamp: string, now: Date = new Date()): number {
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculates recency score for a feature.
 * Lower score = less recent = higher risk.
 */
export function calculateRecencyScore(
  feature: Feature,
  config: ScoringConfig = DEFAULT_CONFIG
): ScoreBreakdown {
  const factors: ScoreFactor[] = [];
  const now = new Date();

  // Factor 1: Days since last mention
  const daysSinceLastMention = daysSince(feature.lastSeen, now);
  const recencyDecay = Math.max(0, 1 - daysSinceLastMention / config.staleDays);

  factors.push({
    name: "Last mention recency",
    value: daysSinceLastMention,
    weight: 0.6,
    contribution: recencyDecay * 0.6,
    explanation: `Last mentioned ${daysSinceLastMention} days ago`,
  });

  // Factor 2: Span between first and last mention
  const daysSinceFirstMention = daysSince(feature.firstSeen, now);
  const mentionSpan = daysSinceFirstMention - daysSinceLastMention;
  const isActivelyMaintained = mentionSpan > 30 && daysSinceLastMention < 90;
  const maintenanceScore = isActivelyMaintained ? 1 : 0.5;

  factors.push({
    name: "Active maintenance",
    value: mentionSpan,
    weight: 0.4,
    contribution: maintenanceScore * 0.4,
    explanation: isActivelyMaintained
      ? `Feature has ${mentionSpan} day mention span and recent activity`
      : `Feature mention span: ${mentionSpan} days`,
  });

  const totalScore = factors.reduce((sum, f) => sum + f.contribution, 0);

  return {
    score: totalScore,
    explanation:
      totalScore > 0.7
        ? "Recently mentioned and actively maintained"
        : totalScore > 0.4
          ? "Moderately recent mentions"
          : "Stale - not mentioned recently",
    factors,
  };
}

/**
 * Calculates visibility score for a feature.
 * Based on where and how the feature is mentioned.
 * Lower score = less visible = higher risk.
 */
export function calculateVisibilityScore(
  feature: Feature,
  evidence: Evidence[],
  artifacts: Artifact[]
): ScoreBreakdown {
  const factors: ScoreFactor[] = [];
  const featureEvidence = evidence.filter((e) => e.featureId === feature.id);

  // Factor 1: Presence in onboarding content
  const hasOnboarding = featureEvidence.some(
    (e) => e.signalType === "onboarding"
  );
  const onboardingScore = hasOnboarding ? 1 : 0;

  factors.push({
    name: "Onboarding presence",
    value: hasOnboarding ? 1 : 0,
    weight: 0.35,
    contribution: onboardingScore * 0.35,
    explanation: hasOnboarding
      ? "Feature appears in onboarding/getting-started content"
      : "Feature NOT in onboarding content",
  });

  // Factor 2: Number of artifacts mentioning this feature
  const artifactCount = feature.sourceArtifacts.length;
  const totalArtifacts = artifacts.length;
  const artifactCoverage =
    totalArtifacts > 0 ? Math.min(artifactCount / totalArtifacts, 1) : 0;

  factors.push({
    name: "Cross-artifact visibility",
    value: artifactCount,
    weight: 0.3,
    contribution: artifactCoverage * 0.3,
    explanation: `Mentioned in ${artifactCount} of ${totalArtifacts} artifacts`,
  });

  // Factor 3: Evidence from high-visibility locations (headings, etc.)
  const headingEvidence = featureEvidence.filter(
    (e) => e.location?.includes("Heading")
  );
  const hasProminentPlacement = headingEvidence.length > 0;
  const prominenceScore = hasProminentPlacement ? 1 : 0.3;

  factors.push({
    name: "Prominent placement",
    value: headingEvidence.length,
    weight: 0.2,
    contribution: prominenceScore * 0.2,
    explanation: hasProminentPlacement
      ? "Feature appears in section headings"
      : "Feature buried in body text",
  });

  // Factor 4: Documentation signal
  const hasDocsSignal = featureEvidence.some(
    (e) => e.signalType === "documentation"
  );
  const docsScore = hasDocsSignal ? 1 : 0;

  factors.push({
    name: "Documentation presence",
    value: hasDocsSignal ? 1 : 0,
    weight: 0.15,
    contribution: docsScore * 0.15,
    explanation: hasDocsSignal
      ? "Feature has dedicated documentation"
      : "No dedicated documentation found",
  });

  const totalScore = factors.reduce((sum, f) => sum + f.contribution, 0);

  return {
    score: totalScore,
    explanation:
      totalScore > 0.7
        ? "Highly visible across documentation"
        : totalScore > 0.4
          ? "Moderate visibility"
          : "Low visibility - likely undiscoverable",
    factors,
  };
}

/**
 * Calculates documentation density score for a feature.
 * Based on how much evidence exists for the feature.
 */
export function calculateDensityScore(
  feature: Feature,
  evidence: Evidence[]
): ScoreBreakdown {
  const factors: ScoreFactor[] = [];
  const featureEvidence = evidence.filter((e) => e.featureId === feature.id);

  // Factor 1: Total evidence count
  const evidenceCount = featureEvidence.length;
  const evidenceScore = Math.min(evidenceCount / 5, 1); // Caps at 5+ mentions

  factors.push({
    name: "Evidence density",
    value: evidenceCount,
    weight: 0.5,
    contribution: evidenceScore * 0.5,
    explanation: `${evidenceCount} evidence point(s) found`,
  });

  // Factor 2: Signal type diversity
  const signalTypes = new Set(featureEvidence.map((e) => e.signalType));
  const typeCount = signalTypes.size;
  const diversityScore = Math.min(typeCount / 3, 1); // Ideal: 3+ types

  factors.push({
    name: "Signal diversity",
    value: typeCount,
    weight: 0.3,
    contribution: diversityScore * 0.3,
    explanation: `${typeCount} different signal type(s): ${Array.from(signalTypes).join(", ")}`,
  });

  // Factor 3: Average confidence
  const avgConfidence =
    featureEvidence.length > 0
      ? featureEvidence.reduce((sum, e) => sum + (e.confidence ?? 0.5), 0) /
        featureEvidence.length
      : 0;

  factors.push({
    name: "Extraction confidence",
    value: avgConfidence,
    weight: 0.2,
    contribution: avgConfidence * 0.2,
    explanation: `Average extraction confidence: ${(avgConfidence * 100).toFixed(0)}%`,
  });

  const totalScore = factors.reduce((sum, f) => sum + f.contribution, 0);

  return {
    score: totalScore,
    explanation:
      totalScore > 0.7
        ? "Well-documented with diverse evidence"
        : totalScore > 0.4
          ? "Moderate documentation coverage"
          : "Sparse documentation",
    factors,
  };
}

/**
 * Calculates combined adoption risk score.
 * Higher score = higher risk of low adoption.
 */
export function calculateAdoptionRisk(
  recency: ScoreBreakdown,
  visibility: ScoreBreakdown,
  density: ScoreBreakdown,
  config: ScoringConfig = DEFAULT_CONFIG
): ScoreBreakdown {
  const factors: ScoreFactor[] = [];

  // Invert scores - low recency/visibility/density = high risk
  const recencyRisk = 1 - recency.score;
  const visibilityRisk = 1 - visibility.score;
  const densityRisk = 1 - density.score;

  factors.push({
    name: "Recency risk",
    value: recencyRisk,
    weight: config.recencyWeight,
    contribution: recencyRisk * config.recencyWeight,
    explanation: recency.explanation,
  });

  factors.push({
    name: "Visibility risk",
    value: visibilityRisk,
    weight: config.visibilityWeight,
    contribution: visibilityRisk * config.visibilityWeight,
    explanation: visibility.explanation,
  });

  factors.push({
    name: "Documentation risk",
    value: densityRisk,
    weight: config.densityWeight,
    contribution: densityRisk * config.densityWeight,
    explanation: density.explanation,
  });

  const totalRisk = factors.reduce((sum, f) => sum + f.contribution, 0);

  return {
    score: totalRisk,
    explanation:
      totalRisk > 0.7
        ? "HIGH RISK: Feature likely undiscoverable"
        : totalRisk > 0.4
          ? "MEDIUM RISK: Feature may be underutilized"
          : "LOW RISK: Feature appears well-surfaced",
    factors,
  };
}

/**
 * Calculates all scores for a feature.
 */
export function scoreFeature(
  feature: Feature,
  evidence: Evidence[],
  artifacts: Artifact[],
  config: ScoringConfig = DEFAULT_CONFIG
): FeatureScore {
  const recency = calculateRecencyScore(feature, config);
  const visibility = calculateVisibilityScore(feature, evidence, artifacts);
  const documentationDensity = calculateDensityScore(feature, evidence);
  const adoptionRisk = calculateAdoptionRisk(
    recency,
    visibility,
    documentationDensity,
    config
  );

  return {
    featureId: feature.id,
    featureName: feature.name,
    recency,
    visibility,
    documentationDensity,
    adoptionRisk,
  };
}

/**
 * Scores all features and returns sorted by risk (highest first).
 */
export function scoreAllFeatures(
  features: Feature[],
  evidence: Evidence[],
  artifacts: Artifact[],
  config: ScoringConfig = DEFAULT_CONFIG
): FeatureScore[] {
  const scores = features.map((f) =>
    scoreFeature(f, evidence, artifacts, config)
  );

  // Sort by adoption risk (highest first)
  return scores.sort(
    (a, b) => b.adoptionRisk.score - a.adoptionRisk.score
  );
}
