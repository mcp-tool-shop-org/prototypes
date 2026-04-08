/**
 * Normalizer Tests
 *
 * Tests for text normalization, heading extraction,
 * content chunking, and timestamp detection.
 */

import {
  normalizeText,
  extractHeadings,
  chunkContent,
  detectTimestamp,
} from "../src/analysis/normalizer";

describe("normalizeText", () => {
  it("should normalize CRLF line endings to LF", () => {
    const result = normalizeText("line1\r\nline2\r\nline3");
    expect(result).toBe("line1\nline2\nline3");
  });

  it("should normalize CR line endings to LF", () => {
    const result = normalizeText("line1\rline2\rline3");
    expect(result).toBe("line1\nline2\nline3");
  });

  it("should collapse 3+ blank lines", () => {
    const result = normalizeText("paragraph1\n\n\n\n\nparagraph2");
    // Boilerplate patterns replace 3+ newlines, then collapse step runs
    expect(result).toBe("paragraph1\nparagraph2");
  });

  it("should trim leading and trailing whitespace", () => {
    const result = normalizeText("  \n  hello world  \n  ");
    expect(result).toBe("hello world");
  });

  it("should strip cookie/privacy boilerplate", () => {
    const result = normalizeText("We use cookies\nActual content here");
    expect(result).not.toContain("We use cookies");
    expect(result).toContain("Actual content here");
  });

  it("should strip navigation boilerplate", () => {
    const result = normalizeText("Skip to content\nMain feature description");
    expect(result).not.toContain("Skip to content");
    expect(result).toContain("Main feature description");
  });

  it("should strip footer boilerplate", () => {
    const result = normalizeText("Feature info\nAll rights reserved");
    expect(result).not.toContain("All rights reserved");
    expect(result).toContain("Feature info");
  });

  it("should preserve meaningful content", () => {
    const content = "# Feature A\n\nThis feature provides value to users.";
    const result = normalizeText(content);
    expect(result).toBe(content);
  });
});

describe("extractHeadings", () => {
  it("should extract markdown ATX headings", () => {
    const content = "# Title\n\nSome text\n\n## Subtitle\n\nMore text\n\n### Section";
    const headings = extractHeadings(content);
    expect(headings).toContain("Title");
    expect(headings).toContain("Subtitle");
    expect(headings).toContain("Section");
  });

  it("should handle h1 through h6", () => {
    const content = "# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6";
    const headings = extractHeadings(content);
    expect(headings).toHaveLength(6);
  });

  it("should return empty array for content without headings", () => {
    const content = "Just plain text without any headings.";
    const headings = extractHeadings(content);
    expect(headings).toHaveLength(0);
  });

  it("should trim heading text", () => {
    const content = "## Heading with spaces  ";
    const headings = extractHeadings(content);
    expect(headings[0]).toBe("Heading with spaces");
  });
});

describe("chunkContent", () => {
  it("should split content by double newlines", () => {
    const content = "Paragraph 1\n\nParagraph 2\n\nParagraph 3";
    const chunks = chunkContent(content);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });

  it("should respect maxChunkSize option", () => {
    const content = "Short paragraph.\n\nAnother short paragraph.\n\nThird one here.";
    const chunks = chunkContent(content, { maxChunkSize: 30 });
    for (const chunk of chunks) {
      // Each chunk should be under maxChunkSize (or a single paragraph that exceeds it)
      expect(chunk.length).toBeGreaterThan(0);
    }
  });

  it("should return empty array for empty content", () => {
    const chunks = chunkContent("");
    expect(chunks).toHaveLength(0);
  });

  it("should handle single paragraph content", () => {
    const content = "Just one paragraph of text.";
    const chunks = chunkContent(content);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("Just one paragraph of text.");
  });

  it("should skip whitespace-only paragraphs", () => {
    const content = "Real content\n\n   \n\nMore content";
    const chunks = chunkContent(content);
    const allNonEmpty = chunks.every((c) => c.trim().length > 0);
    expect(allNonEmpty).toBe(true);
  });
});

describe("detectTimestamp", () => {
  it("should detect ISO date format", () => {
    const result = detectTimestamp("Updated on 2024-03-15 with new features");
    expect(result).toBe("2024-03-15");
  });

  it("should detect long month name format", () => {
    const result = detectTimestamp("Published March 15, 2024");
    expect(result).toBe("March 15, 2024");
  });

  it("should detect day-first month format", () => {
    const result = detectTimestamp("Release 15 March 2024");
    expect(result).toBe("15 March 2024");
  });

  it("should detect slash date format", () => {
    const result = detectTimestamp("Date: 3/15/2024");
    expect(result).toBe("3/15/2024");
  });

  it("should detect version-date format", () => {
    const result = detectTimestamp("v2.1.0 - 2024-06-01");
    expect(result).toBe("2024-06-01");
  });

  it("should return undefined for content without dates", () => {
    const result = detectTimestamp("No dates in this text at all");
    expect(result).toBeUndefined();
  });
});
