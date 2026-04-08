/**
 * Ranking & Prioritization
 *
 * Combines scores and diagnoses into a ranked list of at-risk features.
 * Deterministic and explainable—same input always produces same output.
 */

import type { Feature, Evidence, Diagnosis } from "@/domain";
import type { FeatureScore } from "./scoring";
import { getPrimaryDiagnosis } from "./diagnose";

/**
 * A ranked feature with all its analysis data.
 */
export interface RankedFeature {
  /** Rank position (1 = highest risk) */
  rank: number;
  /** The feature */
  feature: Feature;
  /** Computed scores */
  score: FeatureScore;
  /** Primary diagnosis (most severe) */
  primaryDiagnosis: Diagnosis | undefined;
  /** All diagnoses for this feature */
  allDiagnoses: Diagnosis[];
  /** Supporting evidence */
  evidence: Evidence[];
  /** Combined risk score (0-1) */
  riskScore: number;
  /** Human-readable risk level */
  riskLevel: "critical" | "high" | "medium" | "low";
}

/**
 * Audit summary statistics.
 */
export interface AuditSummary {
  /** Deterministic audit identifier (AUD-XXXXXX) */
  auditId: string;
  /** Total features analyzed */
  totalFeatures: number;
  /** Features at each risk level */
  byRiskLevel: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  /** Top risk factors across all features */
  topRiskFactors: string[];
  /** Artifacts analyzed */
  artifactsAnalyzed: number;
  /** Total evidence points */
  totalEvidence: number;
  /** Timestamp of analysis */
  analyzedAt: string;
}

/**
 * Generates a deterministic audit ID based on input content.
 * Same input always produces same ID.
 */
function generateAuditId(
  featureCount: number,
  evidenceCount: number,
  timestamp: string
): string {
  // Simple hash based on inputs for determinism
  const input = `${featureCount}-${evidenceCount}-${timestamp.slice(0, 10)}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(6, "0");
  return `AUD-${hexHash.slice(0, 6)}`;
}

/**
 * Complete audit result.
 */
export interface AdoptionRiskAudit {
  /** Summary statistics */
  summary: AuditSummary;
  /** Ranked features (highest risk first) */
  rankedFeatures: RankedFeature[];
}

/**
 * Determines risk level from score.
 */
function getRiskLevel(riskScore: number): "critical" | "high" | "medium" | "low" {
  if (riskScore >= 0.75) return "critical";
  if (riskScore >= 0.55) return "high";
  if (riskScore >= 0.35) return "medium";
  return "low";
}

/**
 * Calculates combined risk score from multiple factors.
 */
function calculateCombinedRisk(
  score: FeatureScore,
  diagnoses: Diagnosis[]
): number {
  // Base risk from scoring
  let risk = score.adoptionRisk.score;

  // Boost risk if there are severe diagnoses
  const severeDiagnoses = diagnoses.filter(
    (d) => d.severity === "critical" || d.severity === "high"
  );

  if (severeDiagnoses.length > 0) {
    // Add 10% for each severe diagnosis, capped at 20% boost
    const diagnosisBoost = Math.min(severeDiagnoses.length * 0.1, 0.2);
    risk = Math.min(risk + diagnosisBoost, 1);
  }

  // Apply confidence weighting from diagnoses
  if (diagnoses.length > 0) {
    const avgConfidence =
      diagnoses.reduce((sum, d) => sum + d.confidence, 0) / diagnoses.length;
    // Blend with confidence (80% score, 20% confidence adjustment)
    risk = risk * 0.8 + risk * avgConfidence * 0.2;
  }

  return Math.min(Math.max(risk, 0), 1);
}

/**
 * Identifies top risk factors across all features.
 */
function identifyTopRiskFactors(
  rankedFeatures: RankedFeature[],
  limit: number = 5
): string[] {
  const factorCounts = new Map<string, number>();

  for (const rf of rankedFeatures) {
    if (rf.riskLevel === "critical" || rf.riskLevel === "high") {
      // Count weak factors from scores
      for (const factor of rf.score.adoptionRisk.factors) {
        if (factor.contribution > factor.weight * 0.5) {
          const key = factor.name;
          factorCounts.set(key, (factorCounts.get(key) ?? 0) + 1);
        }
      }

      // Count diagnosis types
      for (const diagnosis of rf.allDiagnoses) {
        factorCounts.set(
          diagnosis.title,
          (factorCounts.get(diagnosis.title) ?? 0) + 1
        );
      }
    }
  }

  // Sort by count and take top N
  return Array.from(factorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([factor]) => factor);
}

/**
 * Ranks all features by adoption risk.
 */
export function rankFeatures(
  features: Feature[],
  scores: FeatureScore[],
  diagnoses: Diagnosis[],
  evidence: Evidence[]
): RankedFeature[] {
  const rankedFeatures: RankedFeature[] = [];

  for (const feature of features) {
    const score = scores.find((s) => s.featureId === feature.id);
    if (!score) continue;

    const featureDiagnoses = diagnoses.filter(
      (d) => d.featureId === feature.id
    );
    const featureEvidence = evidence.filter(
      (e) => e.featureId === feature.id
    );

    const riskScore = calculateCombinedRisk(score, featureDiagnoses);
    const primaryDiagnosis = getPrimaryDiagnosis(feature.id, diagnoses);

    rankedFeatures.push({
      rank: 0, // Will be set after sorting
      feature,
      score,
      primaryDiagnosis,
      allDiagnoses: featureDiagnoses,
      evidence: featureEvidence,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
    });
  }

  // Sort by risk score (highest first)
  rankedFeatures.sort((a, b) => {
    // Primary sort: risk score
    const scoreDiff = b.riskScore - a.riskScore;
    if (Math.abs(scoreDiff) > 0.01) return scoreDiff;

    // Secondary sort: number of severe diagnoses
    const aServe = a.allDiagnoses.filter(
      (d) => d.severity === "critical" || d.severity === "high"
    ).length;
    const bServe = b.allDiagnoses.filter(
      (d) => d.severity === "critical" || d.severity === "high"
    ).length;
    if (aServe !== bServe) return bServe - aServe;

    // Tertiary sort: evidence count (more evidence = more confident)
    return b.evidence.length - a.evidence.length;
  });

  // Assign ranks
  rankedFeatures.forEach((rf, index) => {
    rf.rank = index + 1;
  });

  return rankedFeatures;
}

/**
 * Generates a complete adoption risk audit.
 */
export function generateAudit(
  features: Feature[],
  scores: FeatureScore[],
  diagnoses: Diagnosis[],
  evidence: Evidence[],
  artifactCount: number
): AdoptionRiskAudit {
  const rankedFeatures = rankFeatures(features, scores, diagnoses, evidence);

  const byRiskLevel = {
    critical: rankedFeatures.filter((rf) => rf.riskLevel === "critical").length,
    high: rankedFeatures.filter((rf) => rf.riskLevel === "high").length,
    medium: rankedFeatures.filter((rf) => rf.riskLevel === "medium").length,
    low: rankedFeatures.filter((rf) => rf.riskLevel === "low").length,
  };

  const topRiskFactors = identifyTopRiskFactors(rankedFeatures);
  const analyzedAt = new Date().toISOString();
  const auditId = generateAuditId(features.length, evidence.length, analyzedAt);

  const summary: AuditSummary = {
    auditId,
    totalFeatures: features.length,
    byRiskLevel,
    topRiskFactors,
    artifactsAnalyzed: artifactCount,
    totalEvidence: evidence.length,
    analyzedAt,
  };

  return {
    summary,
    rankedFeatures,
  };
}

/**
 * Gets the top N at-risk features.
 */
export function getTopAtRiskFeatures(
  audit: AdoptionRiskAudit,
  limit: number = 10
): RankedFeature[] {
  return audit.rankedFeatures
    .filter((rf) => rf.riskLevel !== "low")
    .slice(0, limit);
}

/**
 * Filters ranked features by risk level.
 */
export function filterByRiskLevel(
  audit: AdoptionRiskAudit,
  level: "critical" | "high" | "medium" | "low"
): RankedFeature[] {
  return audit.rankedFeatures.filter((rf) => rf.riskLevel === level);
}

/**
 * Generates a headline insight for the audit.
 */
export function generateHeadline(audit: AdoptionRiskAudit): string {
  const { summary } = audit;
  const criticalCount = summary.byRiskLevel.critical;
  const highCount = summary.byRiskLevel.high;

  if (criticalCount > 0) {
    return `${criticalCount} feature${criticalCount > 1 ? "s" : ""} at critical adoption risk`;
  }

  if (highCount > 0) {
    return `${highCount} feature${highCount > 1 ? "s" : ""} at high adoption risk`;
  }

  const atRiskCount =
    summary.byRiskLevel.critical +
    summary.byRiskLevel.high +
    summary.byRiskLevel.medium;

  if (atRiskCount > 0) {
    return `${atRiskCount} feature${atRiskCount > 1 ? "s" : ""} showing adoption risk signals`;
  }

  return "No significant adoption risks detected";
}
