/**
 * Feature Trend Analysis
 *
 * Tracks a feature's risk trajectory across multiple audits.
 * Shows when diagnosis changed and risk level movements.
 */

import type { DiagnosisType } from "../domain/diagnosis";
import type { PersistedAudit } from "../storage/types";

/**
 * A single point in a feature's history.
 */
export interface TrendPoint {
  auditId: string;
  auditName: string;
  date: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  riskScore: number;
  diagnosis: DiagnosisType;
}

/**
 * A feature's trend across multiple audits.
 */
export interface FeatureTrend {
  featureName: string;
  currentRiskLevel: "critical" | "high" | "medium" | "low";
  currentDiagnosis: DiagnosisType;
  points: TrendPoint[];

  // Trend indicators
  direction: "improving" | "worsening" | "stable";
  diagnosisChanges: number;
  riskLevelChanges: number;

  // First/last seen
  firstSeen: string;
  lastSeen: string;
}

/**
 * Summary of trends across all features.
 */
export interface TrendSummary {
  auditsAnalyzed: number;
  dateRange: { from: string; to: string };
  featureTrends: FeatureTrend[];

  // Aggregates
  improving: number;
  worsening: number;
  stable: number;
  newFeatures: number; // Only in most recent audit
}

/**
 * Generate trend data for all features across saved audits.
 * Audits should be sorted oldest to newest.
 */
export function generateTrendData(audits: PersistedAudit[]): TrendSummary {
  if (audits.length === 0) {
    return {
      auditsAnalyzed: 0,
      dateRange: { from: "", to: "" },
      featureTrends: [],
      improving: 0,
      worsening: 0,
      stable: 0,
      newFeatures: 0,
    };
  }

  // Sort audits by date (oldest first)
  const sortedAudits = [...audits].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Build feature history map
  const featureHistory = new Map<string, TrendPoint[]>();

  for (const audit of sortedAudits) {
    for (const rf of audit.rankedFeatures) {
      const normalizedName = normalizeFeatureName(rf.feature.name);

      if (!featureHistory.has(normalizedName)) {
        featureHistory.set(normalizedName, []);
      }

      featureHistory.get(normalizedName)!.push({
        auditId: audit.auditId,
        auditName: audit.name,
        date: audit.createdAt,
        riskLevel: rf.riskLevel,
        riskScore: rf.riskScore,
        diagnosis: rf.primaryDiagnosis?.type ?? "healthy",
      });
    }
  }

  // Generate trends for each feature
  const featureTrends: FeatureTrend[] = [];
  const latestAuditDate = sortedAudits[sortedAudits.length - 1].createdAt;

  for (const [name, points] of featureHistory.entries()) {
    const trend = calculateFeatureTrend(name, points);
    featureTrends.push(trend);
  }

  // Sort by current risk level (critical first), then by worsening trend
  featureTrends.sort((a, b) => {
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const riskDiff = riskOrder[a.currentRiskLevel] - riskOrder[b.currentRiskLevel];
    if (riskDiff !== 0) return riskDiff;

    // Worsening trends first
    if (a.direction === "worsening" && b.direction !== "worsening") return -1;
    if (b.direction === "worsening" && a.direction !== "worsening") return 1;

    return 0;
  });

  // Calculate summary stats
  let improving = 0;
  let worsening = 0;
  let stable = 0;
  let newFeatures = 0;

  for (const trend of featureTrends) {
    switch (trend.direction) {
      case "improving":
        improving++;
        break;
      case "worsening":
        worsening++;
        break;
      case "stable":
        stable++;
        break;
    }

    // New feature = only appears in latest audit
    if (trend.points.length === 1 && trend.points[0].date === latestAuditDate) {
      newFeatures++;
    }
  }

  return {
    auditsAnalyzed: sortedAudits.length,
    dateRange: {
      from: sortedAudits[0].createdAt,
      to: sortedAudits[sortedAudits.length - 1].createdAt,
    },
    featureTrends,
    improving,
    worsening,
    stable,
    newFeatures,
  };
}

/**
 * Calculate trend for a single feature.
 */
function calculateFeatureTrend(
  name: string,
  points: TrendPoint[]
): FeatureTrend {
  const current = points[points.length - 1];

  // Count changes
  let diagnosisChanges = 0;
  let riskLevelChanges = 0;

  for (let i = 1; i < points.length; i++) {
    if (points[i].diagnosis !== points[i - 1].diagnosis) {
      diagnosisChanges++;
    }
    if (points[i].riskLevel !== points[i - 1].riskLevel) {
      riskLevelChanges++;
    }
  }

  // Determine direction
  let direction: "improving" | "worsening" | "stable" = "stable";

  if (points.length >= 2) {
    const first = points[0];
    const last = points[points.length - 1];

    const riskValues = { critical: 4, high: 3, medium: 2, low: 1 };
    const firstValue = riskValues[first.riskLevel];
    const lastValue = riskValues[last.riskLevel];

    if (lastValue < firstValue) {
      direction = "improving";
    } else if (lastValue > firstValue) {
      direction = "worsening";
    }
  }

  return {
    featureName: current.auditName ? points[0].auditName : name, // Use original name from first point
    currentRiskLevel: current.riskLevel,
    currentDiagnosis: current.diagnosis,
    points,
    direction,
    diagnosisChanges,
    riskLevelChanges,
    firstSeen: points[0].date,
    lastSeen: current.date,
  };
}

/**
 * Get trend for a specific feature.
 */
export function getFeatureTrend(
  featureName: string,
  audits: PersistedAudit[]
): FeatureTrend | null {
  const normalized = normalizeFeatureName(featureName);
  const summary = generateTrendData(audits);

  return (
    summary.featureTrends.find(
      (t) => normalizeFeatureName(t.featureName) === normalized
    ) || null
  );
}

/**
 * Normalize feature name for matching.
 */
function normalizeFeatureName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Generate a simple sparkline representation (text-based).
 */
export function generateSparklineText(points: TrendPoint[]): string {
  const chars = { critical: "▓", high: "▒", medium: "░", low: "·" };
  return points.map((p) => chars[p.riskLevel]).join("");
}
