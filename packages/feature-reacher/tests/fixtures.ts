/**
 * Golden Test Fixtures
 *
 * These fixtures use the demo artifacts in /public/demo/ to create
 * predictable test cases for various audit states.
 */

import type { Artifact } from "../src/domain/artifact";
import type { AdoptionRiskAudit } from "../src/analysis/ranking";

/**
 * Minimal artifact for testing edge cases.
 */
export const minimalArtifact: Artifact = {
  id: "test-minimal",
  name: "minimal.txt",
  type: "unknown",
  rawContent: "Just a short note.",
  normalizedContent: "Just a short note.",
  uploadedAt: "2024-01-01T00:00:00Z",
  wordCount: 4,
  headings: [],
};

/**
 * Artifact with no features - should result in empty audit.
 */
export const emptyContentArtifact: Artifact = {
  id: "test-empty",
  name: "empty.txt",
  type: "unknown",
  rawContent: "   ",
  normalizedContent: "",
  uploadedAt: "2024-01-01T00:00:00Z",
  wordCount: 0,
  headings: [],
};

/**
 * Well-documented feature artifact - should result in low risk.
 */
export const healthyFeatureArtifact: Artifact = {
  id: "test-healthy",
  name: "healthy-docs.md",
  type: "documentation",
  rawContent: `# Dashboard Feature

The Dashboard is our main feature for data visualization.

## Overview
The Dashboard provides real-time analytics and reporting capabilities.

## Getting Started
1. Navigate to Settings > Dashboard
2. Configure your widgets
3. Save your layout

## Features
- Real-time data updates
- Customizable widgets
- Export to PDF
- Share via link

## FAQ
Q: How do I access the Dashboard?
A: Click the Dashboard icon in the navigation bar.

## Recent Updates (v3.0)
- Added: New chart types
- Improved: Loading performance
- Fixed: Export bug
`,
  normalizedContent: `# Dashboard Feature

The Dashboard is our main feature for data visualization.

## Overview
The Dashboard provides real-time analytics and reporting capabilities.

## Getting Started
1. Navigate to Settings > Dashboard
2. Configure your widgets
3. Save your layout

## Features
- Real-time data updates
- Customizable widgets
- Export to PDF
- Share via link

## FAQ
Q: How do I access the Dashboard?
A: Click the Dashboard icon in the navigation bar.

## Recent Updates (v3.0)
- Added: New chart types
- Improved: Loading performance
- Fixed: Export bug
`,
  uploadedAt: new Date().toISOString(),
  wordCount: 100,
  headings: ["Dashboard Feature", "Overview", "Getting Started", "Features", "FAQ", "Recent Updates"],
};

/**
 * Poorly documented feature artifact - should result in high risk.
 */
export const riskyFeatureArtifact: Artifact = {
  id: "test-risky",
  name: "old-changelog.md",
  type: "release_notes",
  rawContent: `# Changelog

## Version 1.0 (2020)
- Added Advanced Analytics feature
- Added Data Export feature
- Added Custom Reports feature

## Version 0.9 (2019)
- Initial release
- Basic features
`,
  normalizedContent: `# Changelog

## Version 1.0 (2020)
- Added Advanced Analytics feature
- Added Data Export feature
- Added Custom Reports feature

## Version 0.9 (2019)
- Initial release
- Basic features
`,
  uploadedAt: new Date().toISOString(),
  wordCount: 30,
  headings: ["Changelog", "Version 1.0", "Version 0.9"],
};

/**
 * Validates that an audit summary has required fields.
 */
export function validateAuditSummary(audit: AdoptionRiskAudit): string[] {
  const errors: string[] = [];

  if (!audit.summary.auditId) {
    errors.push("Missing audit ID");
  }

  if (!audit.summary.auditId.startsWith("AUD-")) {
    errors.push("Audit ID should start with AUD-");
  }

  if (audit.summary.totalFeatures < 0) {
    errors.push("Total features cannot be negative");
  }

  const riskSum =
    audit.summary.byRiskLevel.critical +
    audit.summary.byRiskLevel.high +
    audit.summary.byRiskLevel.medium +
    audit.summary.byRiskLevel.low;

  if (riskSum !== audit.summary.totalFeatures) {
    errors.push("Risk level counts don't sum to total features");
  }

  if (!audit.summary.analyzedAt) {
    errors.push("Missing analyzedAt timestamp");
  }

  return errors;
}

/**
 * Validates that all features have required fields.
 */
export function validateRankedFeatures(audit: AdoptionRiskAudit): string[] {
  const errors: string[] = [];

  for (const rf of audit.rankedFeatures) {
    if (!rf.feature.id) {
      errors.push(`Feature missing ID: ${rf.feature.name}`);
    }

    if (!rf.feature.name) {
      errors.push("Feature missing name");
    }

    if (rf.riskScore < 0 || rf.riskScore > 1) {
      errors.push(`Invalid risk score for ${rf.feature.name}: ${rf.riskScore}`);
    }

    if (!["critical", "high", "medium", "low"].includes(rf.riskLevel)) {
      errors.push(`Invalid risk level for ${rf.feature.name}: ${rf.riskLevel}`);
    }

    // Every feature should have evidence
    if (rf.evidence.length === 0) {
      errors.push(`No evidence for feature: ${rf.feature.name}`);
    }
  }

  return errors;
}

/**
 * Ensures low input audits degrade gracefully.
 */
export function validateGracefulDegradation(audit: AdoptionRiskAudit): string[] {
  const errors: string[] = [];

  // Should never throw or return null
  if (!audit) {
    errors.push("Audit is null or undefined");
    return errors;
  }

  // Should have a valid structure even with no features
  if (!audit.summary) {
    errors.push("Missing summary object");
  }

  if (!Array.isArray(audit.rankedFeatures)) {
    errors.push("rankedFeatures is not an array");
  }

  return errors;
}

/**
 * Test helper: create a mock audit for snapshot testing.
 */
export function createMockAudit(overrides?: Partial<AdoptionRiskAudit>): AdoptionRiskAudit {
  return {
    rankedFeatures: [],
    summary: {
      auditId: "AUD-TEST01",
      totalFeatures: 0,
      byRiskLevel: { critical: 0, high: 0, medium: 0, low: 0 },
      topRiskFactors: [],
      artifactsAnalyzed: 0,
      totalEvidence: 0,
      analyzedAt: "2024-01-01T00:00:00Z",
    },
    ...overrides,
  };
}
