import { readFile } from "node:fs/promises";
import type { ExtractedCopy } from "@taste-compiler/check";

// Regex-based copy extraction for Phase 1.
// Matches JSX text content and user-facing string props.
const USER_FACING_PROPS = [
  "title",
  "label",
  "placeholder",
  "description",
  "alt",
  "aria-label",
  "helperText",
  "errorText",
  "tooltip",
  "heading",
  "subtitle",
  "caption",
];

const PROP_VALUE_RE = new RegExp(
  `(?:${USER_FACING_PROPS.join("|")})\\s*=\\s*["']([^"']{3,})["']`,
  "g"
);

// Match text between JSX tags (simplified)
const JSX_TEXT_RE = />([^<>{]{3,})</g;

/**
 * Extract user-facing copy from TSX/JSX files.
 */
export async function scanCopyInFile(
  filePath: string
): Promise<ExtractedCopy[]> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const copyBlocks: ExtractedCopy[] = [];

  // Extract prop values
  PROP_VALUE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PROP_VALUE_RE.exec(content)) !== null) {
    const text = match[1].trim();
    if (text.length > 2) {
      const lineNum = content.slice(0, match.index).split("\n").length;
      copyBlocks.push({
        file: filePath,
        line: lineNum,
        text,
        snippet: lines[lineNum - 1]?.trim() ?? "",
      });
    }
  }

  // Extract JSX text content
  JSX_TEXT_RE.lastIndex = 0;
  while ((match = JSX_TEXT_RE.exec(content)) !== null) {
    const text = match[1].trim();
    // Skip comments and code-like content
    if (
      text.length > 2 &&
      !text.startsWith("//") &&
      !text.startsWith("{") &&
      !text.startsWith("/*")
    ) {
      const lineNum = content.slice(0, match.index).split("\n").length;
      copyBlocks.push({
        file: filePath,
        line: lineNum,
        text,
        snippet: lines[lineNum - 1]?.trim() ?? "",
      });
    }
  }

  return copyBlocks;
}
