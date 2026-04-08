/**
 * Analysis Layer
 *
 * Diagnostics, heuristics, and scoring logic.
 * Feature extraction, risk assessment, and evidence gathering live here.
 */

// Text normalization
export {
  normalizeText,
  extractHeadings,
  chunkContent,
  detectTimestamp,
} from "./normalizer";

// Artifact ingestion
export type { PastedTextInput, FileUploadInput, IngestResult } from "./ingest";
export {
  ingestPastedText,
  ingestUploadedFile,
  validateArtifact,
} from "./ingest";

// Feature extraction
export type { ExtractionResult } from "./extractor";
export {
  extractFeaturesFromArtifact,
  mergeExtractionResults,
} from "./extractor";

// Scoring heuristics
export type {
  ScoreBreakdown,
  ScoreFactor,
  FeatureScore,
  ScoringConfig,
} from "./scoring";
export {
  calculateRecencyScore,
  calculateVisibilityScore,
  calculateDensityScore,
  calculateAdoptionRisk,
  scoreFeature,
  scoreAllFeatures,
} from "./scoring";

// Diagnosis engine
export {
  diagnoseFeature,
  diagnoseAllFeatures,
  getPrimaryDiagnosis,
} from "./diagnose";

// Ranking & prioritization
export type {
  RankedFeature,
  AuditSummary,
  AdoptionRiskAudit,
} from "./ranking";
export {
  rankFeatures,
  generateAudit,
  getTopAtRiskFeatures,
  filterByRiskLevel,
  generateHeadline,
} from "./ranking";

// Action recommendations
export type { RecommendedAction } from "./actions";
export {
  getActionsForDiagnosis,
  getTopActions,
  formatActionAsText,
  formatActionsAsText,
} from "./actions";

// Export
export {
  generateTextSummary,
  generateHtmlReport,
  generateCompareTextReport,
  generateExecutiveNarrative,
  generateCompareExecutiveNarrative,
} from "./export";

// Diff engine
export type { FeatureChangeType, FeatureDiff, AuditDiff } from "./diff";
export { compareAudits, getNewRisks, getResolvedRisks } from "./diff";

// Trend analysis
export type { TrendPoint, FeatureTrend, TrendSummary } from "./trend";
export { generateTrendData, getFeatureTrend, generateSparklineText } from "./trend";
