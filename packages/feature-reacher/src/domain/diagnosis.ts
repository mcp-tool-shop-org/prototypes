/**
 * Diagnosis Model
 *
 * Represents an adoption risk diagnosis for a feature.
 * Every diagnosis must include triggering signals, cited evidence, and confidence.
 */

import type { Evidence } from "./evidence";
import type { FeatureId } from "./feature";

/**
 * Types of adoption risk diagnoses.
 * These will be expanded in Commit 6 (Diagnosis Engine v1).
 */
export type DiagnosisType =
  | "dormant_but_documented" // Feature exists in docs but hasn't been mentioned recently
  | "likely_invisible" // Feature lacks visibility signals (not in onboarding, sparse docs)
  | "over_referenced_but_stale" // Mentioned frequently in old content, silent in new
  | "deprecated_candidate" // Shows deprecation signals
  | "undiscoverable" // Buried deep, no entry points
  | "healthy"; // No significant adoption risk detected

/**
 * Severity levels for diagnoses.
 */
export type DiagnosisSeverity = "low" | "medium" | "high" | "critical";

/**
 * An adoption risk diagnosis for a feature.
 */
export interface Diagnosis {
  /** Unique identifier */
  id: string;

  /** The feature this diagnosis applies to */
  featureId: FeatureId;

  /** Type of diagnosis */
  type: DiagnosisType;

  /** Human-readable title */
  title: string;

  /** Detailed explanation of why this diagnosis was made */
  explanation: string;

  /** Severity level */
  severity: DiagnosisSeverity;

  /** Confidence score (0-1) based on evidence strength */
  confidence: number;

  /** The signals that triggered this diagnosis */
  triggeringSignals: string[];

  /** Evidence supporting this diagnosis */
  supportingEvidence: Evidence[];

  /** ISO timestamp of when this diagnosis was generated */
  generatedAt: string;
}

/**
 * Creates a new Diagnosis.
 */
export function createDiagnosis(
  id: string,
  featureId: FeatureId,
  type: DiagnosisType,
  title: string,
  explanation: string,
  options: {
    severity: DiagnosisSeverity;
    confidence: number;
    triggeringSignals: string[];
    supportingEvidence: Evidence[];
  }
): Diagnosis {
  return {
    id,
    featureId,
    type,
    title,
    explanation,
    severity: options.severity,
    confidence: options.confidence,
    triggeringSignals: options.triggeringSignals,
    supportingEvidence: options.supportingEvidence,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Severity ranking for sorting (higher = worse).
 */
export function severityRank(severity: DiagnosisSeverity): number {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

/**
 * Sorts diagnoses by severity (descending) then confidence (descending).
 */
export function sortDiagnosesByRisk(diagnoses: Diagnosis[]): Diagnosis[] {
  return [...diagnoses].sort((a, b) => {
    const severityDiff = severityRank(b.severity) - severityRank(a.severity);
    if (severityDiff !== 0) return severityDiff;
    return b.confidence - a.confidence;
  });
}
