import { readFile } from "node:fs/promises";
import type { ExtractedStyle } from "@taste-compiler/check";
import type { ExtractedClassUsage } from "@taste-compiler/check";

// Hex color pattern in Tailwind or inline styles
const HEX_COLOR_RE = /(?:bg|text|border|ring|fill|stroke)-\[#([0-9a-fA-F]{3,8})\]/g;
const INLINE_HEX_RE = /(?:color|background(?:-color)?|border(?:-color)?)\s*:\s*#([0-9a-fA-F]{3,8})/g;

// Raw spacing in Tailwind bracket notation
const RAW_SPACING_RE = /(?:p|m|gap|space|w|h)-\[(\d+px)\]/g;

// Grid column patterns (for forbidden pattern detection)
const GRID_COLS_RE = /grid-cols-(\d+)/g;

/**
 * Scan a file for Tailwind class usage and inline style patterns.
 */
export async function scanTailwindFile(
  filePath: string
): Promise<{
  styles: ExtractedStyle[];
  classes: ExtractedClassUsage[];
}> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const styles: ExtractedStyle[] = [];
  const classes: ExtractedClassUsage[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Raw hex colors in Tailwind
    let match: RegExpExecArray | null;
    HEX_COLOR_RE.lastIndex = 0;
    while ((match = HEX_COLOR_RE.exec(line)) !== null) {
      styles.push({
        file: filePath,
        line: lineNum,
        type: "color",
        value: `#${match[1]}`,
        isRaw: true,
        snippet: line.trim(),
      });
    }

    // Inline hex colors (skip custom property definitions like --border: #hex)
    INLINE_HEX_RE.lastIndex = 0;
    while ((match = INLINE_HEX_RE.exec(line)) !== null) {
      if (line.trim().startsWith("--")) continue;
      styles.push({
        file: filePath,
        line: lineNum,
        type: "color",
        value: `#${match[1]}`,
        isRaw: true,
        snippet: line.trim(),
      });
    }

    // Raw spacing
    RAW_SPACING_RE.lastIndex = 0;
    while ((match = RAW_SPACING_RE.exec(line)) !== null) {
      styles.push({
        file: filePath,
        line: lineNum,
        type: "spacing",
        value: match[1],
        isRaw: true,
        snippet: line.trim(),
      });
    }

    // Grid columns (for forbidden pattern detection)
    GRID_COLS_RE.lastIndex = 0;
    while ((match = GRID_COLS_RE.exec(line)) !== null) {
      classes.push({
        file: filePath,
        line: lineNum,
        className: match[0],
        snippet: line.trim(),
      });
    }
  }

  return { styles, classes };
}
