/**
 * Audit Diff Engine v1
 *
 * Compares two audits to detect:
 * - Added/removed features
 * - Risk score increases/decreases
 * - Diagnosis changes
 *
 * Output is deterministic and evidence-aware.
 */

import type { FeatureId } from "../domain/feature";
import type { DiagnosisType } from "../domain/diagnosis";
import type { RankedFeature } from "./ranking";
import type { PersistedAudit } from "../storage/types";

/**
 * Risk level as a numeric value for comparison.
 */
const RISK_LEVEL_VALUES: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Change type for a feature between audits.
 */
export type FeatureChangeType =
  | "added" // Feature appears in new audit but not old
  | "removed" // Feature was in old audit but not new
  | "risk_increased" // Risk level went up
  | "risk_decreased" // Risk level went down
  | "diagnosis_changed" // Same risk level but different diagnosis
  | "unchanged"; // No significant changes

/**
 * Detailed change information for a single feature.
 */
export interface FeatureDiff {
  featureId: FeatureId;
  featureName: string;
  changeType: FeatureChangeType;

  // Before state (null if added)
  before: {
    riskLevel: string;
    score: number;
    diagnosis: DiagnosisType;
  } | null;

  // After state (null if removed)
  after: {
    riskLevel: string;
    score: number;
    diagnosis: DiagnosisType;
  } | null;

  // Change magnitude (-3 to +3 for risk level changes)
  riskDelta: number;

  // Human-readable change summary
  changeSummary: string;
}

/**
 * Summary of changes between two audits.
 */
export interface AuditDiff {
  // Identifiers
  baseAuditId: string;
  compareAuditId: string;
  baseAuditName: string;
  compareAuditName: string;

  // Timestamps
  baseCreatedAt: string;
  compareCreatedAt: string;

  // High-level summary
  summary: {
    newRisks: number; // Features that became high/critical risk
    resolvedRisks: number; // Features that dropped to low risk
    addedFeatures: number;
    removedFeatures: number;
    riskIncreases: number;
    riskDecreases: number;
    diagnosisChanges: number;
    unchangedFeatures: number;
  };

  // "Biggest movers" - features with largest risk changes
  biggestMovers: FeatureDiff[];

  // All feature changes, sorted by significance
  allChanges: FeatureDiff[];

  // Headline summary
  headline: string;
}

/**
 * Compare two audits and generate a diff.
 */
export function compareAudits(
  baseAudit: PersistedAudit,
  compareAudit: PersistedAudit
): AuditDiff {
  const allChanges: FeatureDiff[] = [];

  // Index features by name (normalized) for matching
  const baseFeaturesByName = new Map<string, RankedFeature>();
  const compareFeaturesByName = new Map<string, RankedFeature>();

  for (const rf of baseAudit.rankedFeatures) {
    baseFeaturesByName.set(normalizeFeatureName(rf.feature.name), rf);
  }

  for (const rf of compareAudit.rankedFeatures) {
    compareFeaturesByName.set(normalizeFeatureName(rf.feature.name), rf);
  }

  // Find all unique feature names
  const allFeatureNames = new Set<string>([
    ...baseFeaturesByName.keys(),
    ...compareFeaturesByName.keys(),
  ]);

  // Compare each feature
  for (const name of allFeatureNames) {
    const baseFeat = baseFeaturesByName.get(name);
    const compareFeat = compareFeaturesByName.get(name);

    const diff = compareFeature(baseFeat, compareFeat);
    allChanges.push(diff);
  }

  // Sort by significance (risk delta magnitude, then by type)
  allChanges.sort((a, b) => {
    // Prioritize added/removed
    if (a.changeType === "added" && b.changeType !== "added") return -1;
    if (b.changeType === "added" && a.changeType !== "added") return 1;
    if (a.changeType === "removed" && b.changeType !== "removed") return -1;
    if (b.changeType === "removed" && a.changeType !== "removed") return 1;

    // Then by risk delta magnitude
    return Math.abs(b.riskDelta) - Math.abs(a.riskDelta);
  });

  // Calculate summary stats
  const summary = {
    newRisks: 0,
    resolvedRisks: 0,
    addedFeatures: 0,
    removedFeatures: 0,
    riskIncreases: 0,
    riskDecreases: 0,
    diagnosisChanges: 0,
    unchangedFeatures: 0,
  };

  for (const diff of allChanges) {
    switch (diff.changeType) {
      case "added":
        summary.addedFeatures++;
        if (diff.after && ["high", "critical"].includes(diff.after.riskLevel)) {
          summary.newRisks++;
        }
        break;
      case "removed":
        summary.removedFeatures++;
        if (diff.before && ["high", "critical"].includes(diff.before.riskLevel)) {
          summary.resolvedRisks++;
        }
        break;
      case "risk_increased":
        summary.riskIncreases++;
        if (
          diff.after &&
          ["high", "critical"].includes(diff.after.riskLevel) &&
          diff.before &&
          !["high", "critical"].includes(diff.before.riskLevel)
        ) {
          summary.newRisks++;
        }
        break;
      case "risk_decreased":
        summary.riskDecreases++;
        if (
          diff.before &&
          ["high", "critical"].includes(diff.before.riskLevel) &&
          diff.after &&
          diff.after.riskLevel === "low"
        ) {
          summary.resolvedRisks++;
        }
        break;
      case "diagnosis_changed":
        summary.diagnosisChanges++;
        break;
      case "unchanged":
        summary.unchangedFeatures++;
        break;
    }
  }

  // Get biggest movers (top 5 by risk delta)
  const biggestMovers = allChanges
    .filter((d) => d.changeType !== "unchanged")
    .slice(0, 5);

  // Generate headline
  const headline = generateDiffHeadline(summary);

  return {
    baseAuditId: baseAudit.auditId,
    compareAuditId: compareAudit.auditId,
    baseAuditName: baseAudit.name,
    compareAuditName: compareAudit.name,
    baseCreatedAt: baseAudit.createdAt,
    compareCreatedAt: compareAudit.createdAt,
    summary,
    biggestMovers,
    allChanges,
    headline,
  };
}

/**
 * Compare a single feature between base and compare audits.
 */
function compareFeature(
  base: RankedFeature | undefined,
  compare: RankedFeature | undefined
): FeatureDiff {
  // Added feature
  if (!base && compare) {
    const diagnosisType = compare.primaryDiagnosis?.type ?? "healthy";
    return {
      featureId: compare.feature.id,
      featureName: compare.feature.name,
      changeType: "added",
      before: null,
      after: {
        riskLevel: compare.riskLevel,
        score: compare.riskScore,
        diagnosis: diagnosisType,
      },
      riskDelta: RISK_LEVEL_VALUES[compare.riskLevel],
      changeSummary: `New feature detected: ${compare.feature.name} (${compare.riskLevel} risk)`,
    };
  }

  // Removed feature
  if (base && !compare) {
    const diagnosisType = base.primaryDiagnosis?.type ?? "healthy";
    return {
      featureId: base.feature.id,
      featureName: base.feature.name,
      changeType: "removed",
      before: {
        riskLevel: base.riskLevel,
        score: base.riskScore,
        diagnosis: diagnosisType,
      },
      after: null,
      riskDelta: -RISK_LEVEL_VALUES[base.riskLevel],
      changeSummary: `Feature no longer detected: ${base.feature.name}`,
    };
  }

  // Both exist - compare them
  if (base && compare) {
    const baseLevel = RISK_LEVEL_VALUES[base.riskLevel];
    const compareLevel = RISK_LEVEL_VALUES[compare.riskLevel];
    const riskDelta = compareLevel - baseLevel;

    const baseDiagnosisType = base.primaryDiagnosis?.type ?? "healthy";
    const compareDiagnosisType = compare.primaryDiagnosis?.type ?? "healthy";

    const before = {
      riskLevel: base.riskLevel,
      score: base.riskScore,
      diagnosis: baseDiagnosisType,
    };

    const after = {
      riskLevel: compare.riskLevel,
      score: compare.riskScore,
      diagnosis: compareDiagnosisType,
    };

    // Determine change type
    let changeType: FeatureChangeType;
    let changeSummary: string;

    if (riskDelta > 0) {
      changeType = "risk_increased";
      changeSummary = `${compare.feature.name}: risk increased from ${base.riskLevel} to ${compare.riskLevel}`;
    } else if (riskDelta < 0) {
      changeType = "risk_decreased";
      changeSummary = `${compare.feature.name}: risk decreased from ${base.riskLevel} to ${compare.riskLevel}`;
    } else if (baseDiagnosisType !== compareDiagnosisType) {
      changeType = "diagnosis_changed";
      changeSummary = `${compare.feature.name}: diagnosis changed from "${formatDiagnosis(baseDiagnosisType)}" to "${formatDiagnosis(compareDiagnosisType)}"`;
    } else {
      changeType = "unchanged";
      changeSummary = `${compare.feature.name}: no significant changes`;
    }

    return {
      featureId: compare.feature.id,
      featureName: compare.feature.name,
      changeType,
      before,
      after,
      riskDelta,
      changeSummary,
    };
  }

  // Should never reach here
  throw new Error("Invalid comparison state");
}

/**
 * Normalize feature name for matching across audits.
 */
function normalizeFeatureName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Format diagnosis type for display.
 */
function formatDiagnosis(type: DiagnosisType): string {
  return type.replace(/_/g, " ");
}

/**
 * Generate a headline summarizing the diff.
 */
function generateDiffHeadline(
  summary: AuditDiff["summary"]
): string {
  const parts: string[] = [];

  if (summary.newRisks > 0) {
    parts.push(`${summary.newRisks} new risk${summary.newRisks !== 1 ? "s" : ""}`);
  }

  if (summary.resolvedRisks > 0) {
    parts.push(`${summary.resolvedRisks} resolved`);
  }

  if (summary.addedFeatures > 0) {
    parts.push(`${summary.addedFeatures} added`);
  }

  if (summary.removedFeatures > 0) {
    parts.push(`${summary.removedFeatures} removed`);
  }

  if (parts.length === 0) {
    if (summary.diagnosisChanges > 0) {
      return `${summary.diagnosisChanges} diagnosis change${summary.diagnosisChanges !== 1 ? "s" : ""}, no risk level changes`;
    }
    return "No significant changes detected";
  }

  return parts.join(" • ");
}

/**
 * Get features that became new risks (went from low/medium to high/critical).
 */
export function getNewRisks(diff: AuditDiff): FeatureDiff[] {
  return diff.allChanges.filter((d) => {
    if (d.changeType === "added") {
      return d.after && ["high", "critical"].includes(d.after.riskLevel);
    }
    if (d.changeType === "risk_increased") {
      return (
        d.after &&
        ["high", "critical"].includes(d.after.riskLevel) &&
        d.before &&
        !["high", "critical"].includes(d.before.riskLevel)
      );
    }
    return false;
  });
}

/**
 * Get features that had risks resolved (went to low risk).
 */
export function getResolvedRisks(diff: AuditDiff): FeatureDiff[] {
  return diff.allChanges.filter((d) => {
    if (d.changeType === "removed") {
      return d.before && ["high", "critical"].includes(d.before.riskLevel);
    }
    if (d.changeType === "risk_decreased") {
      return (
        d.before &&
        ["high", "critical"].includes(d.before.riskLevel) &&
        d.after &&
        d.after.riskLevel === "low"
      );
    }
    return false;
  });
}
