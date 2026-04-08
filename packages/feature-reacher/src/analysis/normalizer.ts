/**
 * Text Normalizer
 *
 * Transforms raw input into clean, analyzable text.
 * Strips boilerplate while preserving semantic structure.
 */

/**
 * Common boilerplate patterns to strip from documents.
 */
const BOILERPLATE_PATTERNS: RegExp[] = [
  // Navigation and UI
  /^(skip to (main )?content|jump to|menu|navigation|search|sign (in|up|out)|log (in|out))[\s:]*$/gim,
  // Social media links
  /^(follow us|share (this|on)|tweet|facebook|linkedin|instagram|twitter|youtube)[\s:]*$/gim,
  // Cookie/privacy notices
  /^(we use cookies|accept (all )?cookies|cookie (policy|settings)|privacy (policy|settings))[\s:]*$/gim,
  // Footer content
  /^(copyright|©|all rights reserved|\d{4}\s*-?\s*\d{4}|terms (of (use|service))?|contact us|about us)[\s:]*$/gim,
  // Empty or whitespace-only lines (keep structure but remove excessive)
  /\n{3,}/g,
];

/**
 * Normalizes raw text content for analysis.
 */
export function normalizeText(rawContent: string): string {
  let content = rawContent;

  // Normalize line endings
  content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Strip boilerplate patterns
  for (const pattern of BOILERPLATE_PATTERNS) {
    content = content.replace(pattern, "\n");
  }

  // Collapse multiple blank lines to max 2
  content = content.replace(/\n{3,}/g, "\n\n");

  // Trim leading/trailing whitespace
  content = content.trim();

  return content;
}

/**
 * Extracts headings from content.
 */
export function extractHeadings(content: string): string[] {
  const headings: string[] = [];

  // Markdown headings
  const mdHeadings = content.matchAll(/^#{1,6}\s+(.+)$/gm);
  for (const match of mdHeadings) {
    headings.push(match[1].trim());
  }

  // Setext-style headings (underlined with = or -)
  const setextH1 = content.matchAll(/^(.+)\n[=]{3,}$/gm);
  for (const match of setextH1) {
    headings.push(match[1].trim());
  }

  const setextH2 = content.matchAll(/^(.+)\n[-]{3,}$/gm);
  for (const match of setextH2) {
    headings.push(match[1].trim());
  }

  return headings;
}

/**
 * Splits content into semantic chunks for analysis.
 */
export function chunkContent(
  content: string,
  options?: { maxChunkSize?: number }
): string[] {
  const maxSize = options?.maxChunkSize ?? 1000;
  const chunks: string[] = [];

  // Split by double newlines (paragraphs)
  const paragraphs = content.split(/\n\n+/);

  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length > maxSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmed;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmed;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Detects if content contains date/version information.
 */
export function detectTimestamp(content: string): string | undefined {
  // ISO date patterns
  const isoMatch = content.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    return isoMatch[1];
  }

  // Common date formats
  const datePatterns = [
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i,
    /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i,
    /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      // Return the matched date string (we'll parse it later if needed)
      return match[0];
    }
  }

  // Version with date in release notes
  const versionDateMatch = content.match(
    /v?\d+\.\d+(?:\.\d+)?\s*[-–]\s*(\d{4}-\d{2}-\d{2})/i
  );
  if (versionDateMatch) {
    return versionDateMatch[1];
  }

  return undefined;
}
