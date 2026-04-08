/**
 * Domain Layer
 *
 * Core feature model and business logic.
 * All feature-related types, interfaces, and domain operations live here.
 */

// Feature model
export type { Feature, FeatureId, ArtifactId } from "./feature";
export { createFeature, mergeFeatureMention } from "./feature";

// Evidence model
export type { Evidence, SignalType } from "./evidence";
export {
  createEvidence,
  groupEvidenceByFeature,
  filterEvidenceBySignal,
} from "./evidence";

// Diagnosis model
export type { Diagnosis, DiagnosisType, DiagnosisSeverity } from "./diagnosis";
export {
  createDiagnosis,
  severityRank,
  sortDiagnosesByRisk,
} from "./diagnosis";

// Artifact model
export type { Artifact, ArtifactType } from "./artifact";
export { createArtifact, inferArtifactType } from "./artifact";
