/**
 * Diagnosis Engine v1
 *
 * Generates adoption risk diagnoses with evidence.
 * No diagnosis without evidence—this is the soul of the product.
 */

import type { Feature, Evidence } from "@/domain";
import {
  type Diagnosis,
  type DiagnosisType,
  type DiagnosisSeverity,
  createDiagnosis,
} from "@/domain";
import type { FeatureScore } from "./scoring";

/**
 * Diagnosis rule configuration.
 */
interface DiagnosisRule {
  type: DiagnosisType;
  title: string;
  check: (score: FeatureScore, evidence: Evidence[]) => boolean;
  severity: (score: FeatureScore, evidence: Evidence[]) => DiagnosisSeverity;
  confidence: (score: FeatureScore, evidence: Evidence[]) => number;
  explain: (score: FeatureScore, evidence: Evidence[]) => string;
  signals: (score: FeatureScore, evidence: Evidence[]) => string[];
}

/**
 * Get evidence for a specific feature.
 */
function getFeatureEvidence(
  featureId: string,
  allEvidence: Evidence[]
): Evidence[] {
  return allEvidence.filter((e) => e.featureId === featureId);
}

/**
 * Diagnosis rules - each rule defines conditions for a specific diagnosis.
 */
const DIAGNOSIS_RULES: DiagnosisRule[] = [
  // Dormant but documented
  {
    type: "dormant_but_documented",
    title: "Dormant but Documented",
    check: (score) => {
      return (
        score.recency.score < 0.4 && // Not mentioned recently
        score.documentationDensity.score > 0.5 // But has docs
      );
    },
    severity: (score) => {
      if (score.adoptionRisk.score > 0.7) return "high";
      if (score.adoptionRisk.score > 0.5) return "medium";
      return "low";
    },
    confidence: (score) => {
      const recencyFactor = 1 - score.recency.score;
      const docsFactor = score.documentationDensity.score;
      return Math.min((recencyFactor + docsFactor) / 2 + 0.2, 0.95);
    },
    explain: (score) => {
      const recencyFactor = score.recency.factors.find(
        (f) => f.name === "Last mention recency"
      );
      return `This feature has documentation but hasn't been mentioned in recent content. ${recencyFactor?.explanation ?? ""}. Users may not know it exists despite being documented.`;
    },
    signals: (score) => [
      `Recency score: ${(score.recency.score * 100).toFixed(0)}%`,
      `Documentation score: ${(score.documentationDensity.score * 100).toFixed(0)}%`,
      "No recent release notes or updates",
    ],
  },

  // Likely invisible
  {
    type: "likely_invisible",
    title: "Likely Invisible to Users",
    check: (score) => {
      return score.visibility.score < 0.4;
    },
    severity: (score) => {
      if (score.visibility.score < 0.2) return "critical";
      if (score.visibility.score < 0.3) return "high";
      return "medium";
    },
    confidence: (score) => {
      return Math.min(1 - score.visibility.score + 0.3, 0.9);
    },
    explain: (score, evidence) => {
      const hasOnboarding = evidence.some(
        (e) => e.signalType === "onboarding"
      );
      const hasHeading = evidence.some((e) =>
        e.location?.includes("Heading")
      );

      let explanation =
        "This feature lacks visibility signals that help users discover it.";

      if (!hasOnboarding) {
        explanation +=
          " It does not appear in onboarding or getting-started content.";
      }
      if (!hasHeading) {
        explanation +=
          " It is not prominently featured in section headings.";
      }

      return explanation;
    },
    signals: (score) => {
      const signals = [
        `Visibility score: ${(score.visibility.score * 100).toFixed(0)}%`,
      ];

      for (const factor of score.visibility.factors) {
        if (factor.contribution < factor.weight * 0.5) {
          signals.push(`Weak: ${factor.explanation}`);
        }
      }

      return signals;
    },
  },

  // Over-referenced but stale
  {
    type: "over_referenced_but_stale",
    title: "Over-Referenced but Stale",
    check: (score) => {
      return (
        score.documentationDensity.score > 0.6 && // Lots of references
        score.recency.score < 0.3 // But all old
      );
    },
    severity: () => "medium",
    confidence: (score) => {
      return Math.min(
        score.documentationDensity.score * (1 - score.recency.score),
        0.85
      );
    },
    explain: () => {
      return `This feature is heavily documented in older content but absent from recent materials. It may have been important historically but could be falling out of favor or superseded by newer features.`;
    },
    signals: (score) => [
      `Evidence density: ${(score.documentationDensity.score * 100).toFixed(0)}%`,
      `Recency: ${(score.recency.score * 100).toFixed(0)}%`,
      "Gap between historical prominence and current silence",
    ],
  },

  // Deprecated candidate
  {
    type: "deprecated_candidate",
    title: "Potential Deprecation Candidate",
    check: (score, evidence) => {
      const hasDeprecationSignal = evidence.some(
        (e) => e.signalType === "deprecation"
      );
      const isVeryStale = score.recency.score < 0.2;
      return hasDeprecationSignal || (isVeryStale && score.visibility.score < 0.3);
    },
    severity: (score) => {
      if (score.recency.score < 0.1) return "high";
      return "medium";
    },
    confidence: (score, evidence) => {
      const hasDeprecationSignal = evidence.some(
        (e) => e.signalType === "deprecation"
      );
      if (hasDeprecationSignal) return 0.85;
      return 0.5;
    },
    explain: (score, evidence) => {
      const hasDeprecationSignal = evidence.some(
        (e) => e.signalType === "deprecation"
      );
      if (hasDeprecationSignal) {
        return "This feature shows explicit deprecation signals in the documentation. Consider whether it should be removed or replaced.";
      }
      return "This feature is extremely stale and nearly invisible. It may be a candidate for deprecation or requires immediate attention to remain viable.";
    },
    signals: (score, evidence) => {
      const signals = [
        `Recency: ${(score.recency.score * 100).toFixed(0)}%`,
        `Visibility: ${(score.visibility.score * 100).toFixed(0)}%`,
      ];
      const hasDeprecationSignal = evidence.some(
        (e) => e.signalType === "deprecation"
      );
      if (hasDeprecationSignal) {
        signals.push("Explicit deprecation signal found");
      }
      return signals;
    },
  },

  // Undiscoverable
  {
    type: "undiscoverable",
    title: "Undiscoverable Feature",
    check: (score) => {
      return (
        score.visibility.score < 0.3 &&
        score.documentationDensity.score < 0.4
      );
    },
    severity: () => "critical",
    confidence: (score) => {
      return Math.min(
        (1 - score.visibility.score) * (1 - score.documentationDensity.score) +
          0.4,
        0.95
      );
    },
    explain: () => {
      return "This feature has no clear entry points for users to discover it. It is neither prominently documented nor visible in onboarding materials. Users are unlikely to find this feature without explicit guidance.";
    },
    signals: (score) => [
      `Visibility: ${(score.visibility.score * 100).toFixed(0)}%`,
      `Documentation density: ${(score.documentationDensity.score * 100).toFixed(0)}%`,
      "No onboarding presence",
      "No prominent placement",
    ],
  },

  // Healthy (no significant risk)
  {
    type: "healthy",
    title: "Healthy Feature",
    check: (score) => {
      return score.adoptionRisk.score < 0.3;
    },
    severity: () => "low",
    confidence: (score) => {
      return Math.min(1 - score.adoptionRisk.score + 0.2, 0.95);
    },
    explain: () => {
      return `This feature appears well-surfaced with recent activity, good visibility, and adequate documentation. Current adoption risk is low.`;
    },
    signals: (score) => [
      `Adoption risk: ${(score.adoptionRisk.score * 100).toFixed(0)}%`,
      `Recency: ${(score.recency.score * 100).toFixed(0)}%`,
      `Visibility: ${(score.visibility.score * 100).toFixed(0)}%`,
    ],
  },
];

/**
 * Generates a unique diagnosis ID.
 */
function generateDiagnosisId(featureId: string, type: DiagnosisType): string {
  return `diagnosis_${featureId}_${type}_${Date.now()}`;
}

/**
 * Runs diagnosis rules for a single feature.
 */
export function diagnoseFeature(
  feature: Feature,
  score: FeatureScore,
  evidence: Evidence[]
): Diagnosis[] {
  const diagnoses: Diagnosis[] = [];
  const featureEvidence = getFeatureEvidence(feature.id, evidence);

  for (const rule of DIAGNOSIS_RULES) {
    if (rule.check(score, featureEvidence)) {
      const severity = rule.severity(score, featureEvidence);
      const confidence = rule.confidence(score, featureEvidence);

      // Skip low-confidence diagnoses
      if (confidence < 0.3) continue;

      // Don't add healthy diagnosis if there are risk diagnoses
      if (
        rule.type === "healthy" &&
        diagnoses.some((d) => d.type !== "healthy")
      ) {
        continue;
      }

      diagnoses.push(
        createDiagnosis(
          generateDiagnosisId(feature.id, rule.type),
          feature.id,
          rule.type,
          rule.title,
          rule.explain(score, featureEvidence),
          {
            severity,
            confidence,
            triggeringSignals: rule.signals(score, featureEvidence),
            supportingEvidence: featureEvidence.slice(0, 5),
          }
        )
      );
    }
  }

  // If no diagnoses matched and risk is moderate, add a generic warning
  if (diagnoses.length === 0 && score.adoptionRisk.score > 0.4) {
    diagnoses.push(
      createDiagnosis(
        generateDiagnosisId(feature.id, "likely_invisible"),
        feature.id,
        "likely_invisible",
        "Moderate Adoption Risk",
        "This feature shows moderate risk signals but doesn't match a specific diagnosis pattern. Review the score breakdown for details.",
        {
          severity: "medium",
          confidence: 0.5,
          triggeringSignals: [
            `Adoption risk: ${(score.adoptionRisk.score * 100).toFixed(0)}%`,
          ],
          supportingEvidence: featureEvidence.slice(0, 3),
        }
      )
    );
  }

  return diagnoses;
}

/**
 * Runs diagnosis on all features.
 */
export function diagnoseAllFeatures(
  features: Feature[],
  scores: FeatureScore[],
  evidence: Evidence[]
): Diagnosis[] {
  const allDiagnoses: Diagnosis[] = [];

  for (const feature of features) {
    const score = scores.find((s) => s.featureId === feature.id);
    if (!score) continue;

    const featureDiagnoses = diagnoseFeature(feature, score, evidence);
    allDiagnoses.push(...featureDiagnoses);
  }

  return allDiagnoses;
}

/**
 * Gets the most severe diagnosis for a feature.
 */
export function getPrimaryDiagnosis(
  featureId: string,
  diagnoses: Diagnosis[]
): Diagnosis | undefined {
  const featureDiagnoses = diagnoses.filter((d) => d.featureId === featureId);
  if (featureDiagnoses.length === 0) return undefined;

  const sorted = [...featureDiagnoses].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff =
      severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.confidence - a.confidence;
  });

  return sorted[0];
}
