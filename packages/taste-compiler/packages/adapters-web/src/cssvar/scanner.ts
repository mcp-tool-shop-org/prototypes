import { readFile } from "node:fs/promises";
import type { ExtractedStyle } from "@taste-compiler/check";

// --- Token-bypass detection for CSS-variable-based design systems ---

// Color properties in CSS and JSX style objects
const COLOR_PROPERTIES = [
  "color",
  "background",
  "backgroundColor",
  "background-color",
  "borderColor",
  "border-color",
  "borderTopColor",
  "border-top-color",
  "borderBottomColor",
  "border-bottom-color",
  "borderLeftColor",
  "border-left-color",
  "borderRightColor",
  "border-right-color",
  "outlineColor",
  "outline-color",
  "fill",
  "stroke",
  "boxShadow",
  "box-shadow",
  "textDecorationColor",
  "text-decoration-color",
  "caretColor",
  "caret-color",
  "accentColor",
  "accent-color",
];

// Values that are NOT token bypasses
const ALLOWED_VALUES = new Set([
  "transparent",
  "currentcolor",
  "currentColor",
  "inherit",
  "initial",
  "unset",
  "none",
  "revert",
]);

// Patterns that indicate a tokenized value (not a bypass)
function isTokenized(value: string): boolean {
  const trimmed = value.trim();
  if (ALLOWED_VALUES.has(trimmed)) return true;
  if (trimmed.startsWith("var(")) return true;
  // CSS functions referencing vars
  if (trimmed.includes("var(--")) return true;
  return false;
}

// Raw color literal patterns
const HEX_RE = /#([0-9a-fA-F]{3,8})\b/;
const RGB_RE = /rgba?\s*\(/;
const HSL_RE = /hsla?\s*\(/;

function isRawColorLiteral(value: string): boolean {
  const trimmed = value.trim();
  if (HEX_RE.test(trimmed)) return true;
  if (RGB_RE.test(trimmed)) return true;
  if (HSL_RE.test(trimmed)) return true;
  return false;
}

// --- CSS file scanning ---

// Match property: value pairs in CSS (including inside :root, selectors, etc.)
const CSS_PROP_VALUE_RE =
  /([a-zA-Z-]+)\s*:\s*([^;{}]+);/g;

/**
 * Scan a CSS file for raw color literals that bypass the var() token system.
 *
 * Skips :root variable definitions (those ARE the tokens).
 */
export async function scanCssVarFile(
  filePath: string
): Promise<ExtractedStyle[]> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const styles: ExtractedStyle[] = [];

  // Track whether we're inside a :root block (definitions, not bypasses)
  let rootDepth = 0;
  let braceDepth = 0;
  let inRoot = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Track :root blocks
    if (line.includes(":root")) {
      inRoot = true;
    }
    for (const ch of line) {
      if (ch === "{") {
        braceDepth++;
        if (inRoot && rootDepth === 0) rootDepth = braceDepth;
      }
      if (ch === "}") {
        if (braceDepth === rootDepth) {
          rootDepth = 0;
          inRoot = false;
        }
        braceDepth--;
      }
    }

    // Skip :root variable definitions — those ARE the tokens
    if (rootDepth > 0) continue;

    // Skip CSS custom property definitions anywhere
    if (line.trim().startsWith("--")) continue;

    // Check property: value pairs
    CSS_PROP_VALUE_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = CSS_PROP_VALUE_RE.exec(line)) !== null) {
      const prop = match[1].trim();
      const value = match[2].trim();

      // Only check color properties
      const propLower = prop.toLowerCase();
      if (!COLOR_PROPERTIES.some((cp) => cp.toLowerCase() === propLower)) {
        continue;
      }

      if (!isTokenized(value) && isRawColorLiteral(value)) {
        styles.push({
          file: filePath,
          line: lineNum,
          type: "color",
          value: extractColorLiteral(value),
          isRaw: true,
          snippet: line.trim(),
        });
      }
    }
  }

  return styles;
}

// --- TSX/JSX inline style scanning ---

// Match style={{ ... }} or style={someObject} patterns
// and CSSProperties object literals like { color: "#fff" }
const JSX_STYLE_PROP_RE =
  /(\w+)\s*:\s*["']([^"']+)["']/g;

/**
 * Scan a TSX/JSX/TS file for raw color literals in:
 * - JSX inline style objects: style={{ color: "#fff" }}
 * - CSSProperties typed objects: { backgroundColor: "#abc" }
 * - Template literals with color values
 */
export async function scanInlineStyles(
  filePath: string
): Promise<ExtractedStyle[]> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const styles: ExtractedStyle[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    JSX_STYLE_PROP_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = JSX_STYLE_PROP_RE.exec(line)) !== null) {
      const prop = match[1];
      const value = match[2];

      // Check if this is a color property with a raw literal
      if (!COLOR_PROPERTIES.includes(prop)) continue;
      if (isTokenized(value)) continue;
      if (!isRawColorLiteral(value)) continue;

      styles.push({
        file: filePath,
        line: lineNum,
        type: "color",
        value: extractColorLiteral(value),
        isRaw: true,
        snippet: line.trim(),
      });
    }

    // Also catch: backgroundColor: "#hex" (without quotes in some patterns)
    // and inline style={{ backgroundColor: "#hex" }}
    const inlineHexRe = /(\w+)\s*:\s*["']?(#[0-9a-fA-F]{3,8})["']?/g;
    inlineHexRe.lastIndex = 0;
    while ((match = inlineHexRe.exec(line)) !== null) {
      const prop = match[1];
      const value = match[2];

      if (!COLOR_PROPERTIES.includes(prop)) continue;

      // Dedupe: skip if already captured by JSX_STYLE_PROP_RE
      const alreadyCaptured = styles.some(
        (s) => s.file === filePath && s.line === lineNum && s.value === value
      );
      if (alreadyCaptured) continue;

      styles.push({
        file: filePath,
        line: lineNum,
        type: "color",
        value,
        isRaw: true,
        snippet: line.trim(),
      });
    }
  }

  return styles;
}

function extractColorLiteral(value: string): string {
  const hexMatch = value.match(/#[0-9a-fA-F]{3,8}/);
  if (hexMatch) return hexMatch[0];

  const rgbMatch = value.match(/rgba?\s*\([^)]+\)/);
  if (rgbMatch) return rgbMatch[0];

  const hslMatch = value.match(/hsla?\s*\([^)]+\)/);
  if (hslMatch) return hslMatch[0];

  return value;
}
