/**
 * Artifact Ingestion Pipeline
 *
 * Handles the intake of raw artifacts and prepares them for analysis.
 */

import {
  type Artifact,
  type ArtifactId,
  type ArtifactType,
  createArtifact,
  inferArtifactType,
} from "@/domain";
import {
  normalizeText,
  extractHeadings,
  detectTimestamp,
} from "./normalizer";

/**
 * Content quality signals that indicate code, HTML, or minified content
 * rather than human-readable product documentation.
 */
interface ContentAnalysis {
  isCodeLike: boolean;
  isHtmlHeavy: boolean;
  isMinified: boolean;
  codeSignalRatio: number;
  reasons: string[];
}

/**
 * Analyzes content to detect code, HTML, or minified artifacts
 * that would produce garbage analysis results.
 */
function analyzeContentQuality(content: string): ContentAnalysis {
  const reasons: string[] = [];
  const totalChars = content.length;

  if (totalChars === 0) {
    return { isCodeLike: false, isHtmlHeavy: false, isMinified: false, codeSignalRatio: 0, reasons };
  }

  // Count code-like characters: < > { } ( ) ; = / \
  const codeChars = (content.match(/[<>{}();=\\/]/g) || []).length;
  const codeSignalRatio = codeChars / totalChars;

  // Detect HTML tags
  const htmlTagCount = (content.match(/<\/?[a-z][a-z0-9]*[\s>]/gi) || []).length;
  const isHtmlHeavy = htmlTagCount > 20 || (htmlTagCount > 5 && codeSignalRatio > 0.05);

  // Detect minified content (very long lines)
  const lines = content.split("\n");
  const longLines = lines.filter((line) => line.length > 500).length;
  const isMinified = longLines >= 3 || (lines.length > 0 && lines.some((l) => l.length > 2000));

  // Detect code patterns
  const codePatterns = [
    /<script[\s>]/i,
    /<style[\s>]/i,
    /function\s*\(/,
    /\bconst\s+\w/,
    /\bvar\s+\w/,
    /\blet\s+\w/,
    /=>\s*[{(]/,
    /import\s+.*\s+from\s+['"`]/,
    /require\s*\(\s*['"`]/,
    /\bclass\s+\w+\s*\{/,
    /\/\*\*?\s/,
    /module\.exports/,
  ];
  const codePatternHits = codePatterns.filter((p) => p.test(content)).length;
  const isCodeLike = codePatternHits >= 3 || codeSignalRatio > 0.08;

  // Build reasons
  if (isHtmlHeavy) {
    reasons.push(`Contains ${htmlTagCount} HTML tags — this looks like a web page or HTML export`);
  }
  if (isMinified) {
    reasons.push("Contains very long lines typical of minified/bundled code");
  }
  if (isCodeLike && !isHtmlHeavy) {
    reasons.push(`High density of code syntax characters (${(codeSignalRatio * 100).toFixed(1)}%)`);
  }
  if (codePatternHits >= 3) {
    reasons.push(`Detected ${codePatternHits} code-like patterns (function, const, import, etc.)`);
  }

  return { isCodeLike, isHtmlHeavy, isMinified, codeSignalRatio, reasons };
}

/**
 * Generates a unique artifact ID.
 */
function generateArtifactId(): ArtifactId {
  return `artifact_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Input for ingesting a pasted text artifact.
 */
export interface PastedTextInput {
  content: string;
  name?: string;
  type?: ArtifactType;
}

/**
 * Input for ingesting an uploaded file artifact.
 */
export interface FileUploadInput {
  content: string;
  filename: string;
  type?: ArtifactType;
}

/**
 * Result of artifact ingestion.
 */
export interface IngestResult {
  artifact: Artifact;
  warnings: string[];
}

/**
 * Ingests pasted text content.
 */
export function ingestPastedText(input: PastedTextInput): IngestResult {
  const warnings: string[] = [];

  const rawContent = input.content;

  // Validate content
  if (!rawContent.trim()) {
    throw new Error("Content cannot be empty");
  }

  // Warn about very short content
  const wordCount = rawContent.split(/\s+/).filter(Boolean).length;
  if (wordCount < 20) {
    warnings.push(
      "Content is very short. Analysis may be limited."
    );
  }

  // Check for code/HTML content
  const quality = analyzeContentQuality(rawContent);
  if (quality.isHtmlHeavy || quality.isCodeLike || quality.isMinified) {
    warnings.push(
      "⚠️ This content looks like code or HTML rather than product documentation. " +
      "Feature-Reacher works best with release notes, help articles, FAQs, and product docs. " +
      quality.reasons.join(". ") + "."
    );
  }

  // Normalize content
  const normalizedContent = normalizeText(rawContent);

  // Extract headings
  const headings = extractHeadings(normalizedContent);

  // Detect timestamp
  const contentTimestamp = detectTimestamp(normalizedContent);

  // Infer or use provided type
  const type =
    input.type ?? inferArtifactType(input.name ?? "untitled", normalizedContent);

  // Create artifact (tag it if code-like so the extractor can be cautious)
  const artifact = createArtifact(
    generateArtifactId(),
    input.name ?? "Pasted content",
    type,
    rawContent,
    normalizedContent,
    {
      contentTimestamp,
      headings,
      isCodeLike: quality.isCodeLike || quality.isHtmlHeavy || quality.isMinified,
    }
  );

  return { artifact, warnings };
}

/**
 * Ingests an uploaded file.
 */
export function ingestUploadedFile(input: FileUploadInput): IngestResult {
  const warnings: string[] = [];

  const rawContent = input.content;

  // Validate content
  if (!rawContent.trim()) {
    throw new Error("File content cannot be empty");
  }

  // Check file extension
  const extension = input.filename.split(".").pop()?.toLowerCase();
  if (extension && !["txt", "md", "markdown"].includes(extension)) {
    warnings.push(
      `File type .${extension} may not be fully supported. Best results with .txt or .md files.`
    );
  }

  // Warn about very short content
  const wordCount = rawContent.split(/\s+/).filter(Boolean).length;
  if (wordCount < 20) {
    warnings.push(
      "File content is very short. Analysis may be limited."
    );
  }

  // Check for code/HTML content
  const quality = analyzeContentQuality(rawContent);
  if (quality.isHtmlHeavy || quality.isCodeLike || quality.isMinified) {
    warnings.push(
      "⚠️ This file looks like code or HTML rather than product documentation. " +
      "Feature-Reacher works best with release notes, help articles, FAQs, and product docs. " +
      quality.reasons.join(". ") + "."
    );
  }

  // Normalize content
  const normalizedContent = normalizeText(rawContent);

  // Extract headings
  const headings = extractHeadings(normalizedContent);

  // Detect timestamp
  const contentTimestamp = detectTimestamp(normalizedContent);

  // Infer or use provided type
  const type =
    input.type ?? inferArtifactType(input.filename, normalizedContent);

  // Create artifact (tag it if code-like so the extractor can be cautious)
  const artifact = createArtifact(
    generateArtifactId(),
    input.filename,
    type,
    rawContent,
    normalizedContent,
    {
      contentTimestamp,
      headings,
      isCodeLike: quality.isCodeLike || quality.isHtmlHeavy || quality.isMinified,
    }
  );

  return { artifact, warnings };
}

/**
 * Validates artifact content quality.
 */
export function validateArtifact(artifact: Artifact): string[] {
  const issues: string[] = [];

  if (artifact.wordCount < 10) {
    issues.push("Content is too short for meaningful analysis");
  }

  if (artifact.headings.length === 0 && artifact.wordCount > 100) {
    issues.push(
      "No headings detected. Consider adding section headers for better analysis."
    );
  }

  if (artifact.type === "unknown") {
    issues.push(
      "Could not determine content type. Manual classification may improve results."
    );
  }

  return issues;
}
