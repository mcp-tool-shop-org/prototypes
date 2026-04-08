/**
 * Analysis Layer Tests
 *
 * These tests ensure the analysis pipeline produces consistent,
 * valid results and handles edge cases gracefully.
 */

import {
  ingestPastedText,
  extractFeaturesFromArtifact,
  scoreAllFeatures,
  diagnoseAllFeatures,
  generateAudit,
} from "../src/analysis";
import {
  minimalArtifact,
  healthyFeatureArtifact,
  riskyFeatureArtifact,
  validateAuditSummary,
  validateRankedFeatures,
  validateGracefulDegradation,
} from "./fixtures";

describe("Analysis Pipeline", () => {
  describe("Artifact Ingestion", () => {
    it("should ingest pasted text successfully", () => {
      const result = ingestPastedText({
        content: "Test content with a Feature mentioned.",
        name: "test",
      });

      expect(result.artifact).toBeDefined();
      expect(result.artifact.name).toBe("test");
      expect(result.artifact.rawContent).toContain("Feature");
    });

    it("should throw error for empty content", () => {
      expect(() => {
        ingestPastedText({
          content: "   ",
          name: "empty",
        });
      }).toThrow("Content cannot be empty");
    });
  });

  describe("Feature Extraction", () => {
    it("should extract features from well-documented artifact", () => {
      const result = extractFeaturesFromArtifact(healthyFeatureArtifact);

      expect(result.features.length).toBeGreaterThan(0);
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it("should handle minimal artifact without crashing", () => {
      const result = extractFeaturesFromArtifact(minimalArtifact);

      expect(Array.isArray(result.features)).toBe(true);
      expect(Array.isArray(result.evidence)).toBe(true);
    });
  });

  describe("Scoring", () => {
    it("should produce valid scores for all features", () => {
      const extraction = extractFeaturesFromArtifact(healthyFeatureArtifact);
      const scores = scoreAllFeatures(
        extraction.features,
        extraction.evidence,
        [healthyFeatureArtifact]
      );

      for (const score of scores) {
        expect(score.adoptionRisk.score).toBeGreaterThanOrEqual(0);
        expect(score.adoptionRisk.score).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("Audit Generation", () => {
    it("should generate valid audit from healthy artifact", () => {
      const extraction = extractFeaturesFromArtifact(healthyFeatureArtifact);
      const scores = scoreAllFeatures(
        extraction.features,
        extraction.evidence,
        [healthyFeatureArtifact]
      );
      const diagnoses = diagnoseAllFeatures(
        extraction.features,
        scores,
        extraction.evidence
      );
      const audit = generateAudit(
        extraction.features,
        scores,
        diagnoses,
        extraction.evidence,
        1
      );

      const summaryErrors = validateAuditSummary(audit);
      const featureErrors = validateRankedFeatures(audit);
      const degradationErrors = validateGracefulDegradation(audit);

      expect(summaryErrors).toEqual([]);
      expect(featureErrors).toEqual([]);
      expect(degradationErrors).toEqual([]);
    });

    it("should handle audit with no features gracefully", () => {
      const audit = generateAudit([], [], [], [], 1);

      const errors = validateGracefulDegradation(audit);
      expect(errors).toEqual([]);
      expect(audit.summary.totalFeatures).toBe(0);
    });
  });
});

describe("Guardrails", () => {
  it("should never produce negative risk scores", () => {
    const artifacts = [healthyFeatureArtifact, riskyFeatureArtifact, minimalArtifact];

    for (const artifact of artifacts) {
      const extraction = extractFeaturesFromArtifact(artifact);
      const scores = scoreAllFeatures(extraction.features, extraction.evidence, [artifact]);

      for (const score of scores) {
        expect(score.adoptionRisk.score).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("should never produce risk scores above 1", () => {
    const artifacts = [healthyFeatureArtifact, riskyFeatureArtifact];

    for (const artifact of artifacts) {
      const extraction = extractFeaturesFromArtifact(artifact);
      const scores = scoreAllFeatures(extraction.features, extraction.evidence, [artifact]);

      for (const score of scores) {
        expect(score.adoptionRisk.score).toBeLessThanOrEqual(1);
      }
    }
  });

  it("should always have audit ID starting with AUD-", () => {
    const extraction = extractFeaturesFromArtifact(healthyFeatureArtifact);
    const scores = scoreAllFeatures(
      extraction.features,
      extraction.evidence,
      [healthyFeatureArtifact]
    );
    const diagnoses = diagnoseAllFeatures(
      extraction.features,
      scores,
      extraction.evidence
    );
    const audit = generateAudit(
      extraction.features,
      scores,
      diagnoses,
      extraction.evidence,
      1
    );

    expect(audit.summary.auditId).toMatch(/^AUD-[A-F0-9]{6}$/);
  });
});
