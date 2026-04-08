/**
 * Artifact Model
 *
 * Represents a source document that has been uploaded for analysis.
 * Artifacts are the raw input from which features and evidence are extracted.
 */

import type { ArtifactId } from "./feature";

/**
 * Types of artifacts that can be analyzed.
 */
export type ArtifactType =
  | "release_notes" // Changelog, release announcements
  | "documentation" // Technical docs, guides, tutorials
  | "faq" // FAQ pages, help articles
  | "onboarding" // Getting started guides, quickstarts
  | "marketing" // Landing pages, feature announcements
  | "support" // Support tickets, common issues
  | "unknown"; // Unclassified content

/**
 * A source artifact uploaded for analysis.
 */
export interface Artifact {
  /** Unique identifier */
  id: ArtifactId;

  /** Original filename or title */
  name: string;

  /** Type of artifact */
  type: ArtifactType;

  /** Raw text content as uploaded */
  rawContent: string;

  /** Normalized text content (boilerplate stripped, cleaned) */
  normalizedContent: string;

  /** ISO timestamp from the artifact (if detectable) */
  contentTimestamp?: string;

  /** ISO timestamp of when this artifact was uploaded */
  uploadedAt: string;

  /** Word count of normalized content */
  wordCount: number;

  /** Detected headings/sections in the artifact */
  headings: string[];

  /** Whether the content was flagged as code/HTML/minified (used to gate extraction) */
  isCodeLike?: boolean;
}

/**
 * Creates a new Artifact.
 */
export function createArtifact(
  id: ArtifactId,
  name: string,
  type: ArtifactType,
  rawContent: string,
  normalizedContent: string,
  options?: {
    contentTimestamp?: string;
    headings?: string[];
    isCodeLike?: boolean;
  }
): Artifact {
  return {
    id,
    name,
    type,
    rawContent,
    normalizedContent,
    contentTimestamp: options?.contentTimestamp,
    uploadedAt: new Date().toISOString(),
    wordCount: normalizedContent.split(/\s+/).filter(Boolean).length,
    headings: options?.headings ?? [],
    isCodeLike: options?.isCodeLike,
  };
}

/**
 * Infers artifact type from filename or content patterns.
 */
export function inferArtifactType(
  filename: string,
  content: string
): ArtifactType {
  const lowerFilename = filename.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Check filename patterns
  if (
    lowerFilename.includes("changelog") ||
    lowerFilename.includes("release") ||
    lowerFilename.includes("whatsnew")
  ) {
    return "release_notes";
  }

  if (
    lowerFilename.includes("faq") ||
    lowerFilename.includes("help") ||
    lowerFilename.includes("questions")
  ) {
    return "faq";
  }

  if (
    lowerFilename.includes("quickstart") ||
    lowerFilename.includes("getting-started") ||
    lowerFilename.includes("onboarding")
  ) {
    return "onboarding";
  }

  // Check content patterns
  if (
    lowerContent.includes("version ") &&
    (lowerContent.includes("fixed") ||
      lowerContent.includes("added") ||
      lowerContent.includes("changed"))
  ) {
    return "release_notes";
  }

  if (lowerContent.includes("frequently asked") || lowerContent.includes("q:")) {
    return "faq";
  }

  if (
    lowerContent.includes("getting started") ||
    lowerContent.includes("first steps") ||
    lowerContent.includes("quick start")
  ) {
    return "onboarding";
  }

  if (
    lowerContent.includes("documentation") ||
    lowerContent.includes("api reference") ||
    lowerContent.includes("## usage")
  ) {
    return "documentation";
  }

  return "unknown";
}
