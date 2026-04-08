import type { TastePack, TasteViolation } from "@taste-compiler/core";

/**
 * Maximum line gap for grouping consecutive color violations into one finding.
 * Violations within the same file separated by ≤ this many lines are merged.
 */
const GROUP_LINE_GAP = 5;

/**
 * Group consecutive raw-color violations within the same file into a single
 * violation with multiple evidence items. A constant map like ROLE_COLORS
 * spanning 6 lines becomes 1 finding (with 6 evidence entries), not 6.
 */
function groupColorViolations(
  styles: ExtractedStyle[]
): Map<string, ExtractedStyle[][]> {
  // Partition by file
  const byFile = new Map<string, ExtractedStyle[]>();
  for (const s of styles) {
    if (s.type !== "color" || !s.isRaw) continue;
    const arr = byFile.get(s.file) ?? [];
    arr.push(s);
    byFile.set(s.file, arr);
  }

  // Within each file, group by proximity
  const grouped = new Map<string, ExtractedStyle[][]>();
  for (const [file, items] of byFile) {
    items.sort((a, b) => a.line - b.line);
    const groups: ExtractedStyle[][] = [];
    let current: ExtractedStyle[] = [items[0]];

    for (let i = 1; i < items.length; i++) {
      if (items[i].line - items[i - 1].line <= GROUP_LINE_GAP) {
        current.push(items[i]);
      } else {
        groups.push(current);
        current = [items[i]];
      }
    }
    groups.push(current);
    grouped.set(file, groups);
  }

  return grouped;
}

/**
 * Check for raw hex color usage that bypasses the token system.
 *
 * Groups consecutive inline-style violations within the same file into a
 * single finding (CR-1), so a constant map or dense style block reports as
 * one violation with multiple evidence items rather than N separate ones.
 */
export function checkTokenViolations(
  pack: TastePack,
  extractedStyles: ExtractedStyle[]
): TasteViolation[] {
  const violations: TasteViolation[] = [];

  // --- Grouped color violations (CR-1) ---
  const colorGroups = groupColorViolations(extractedStyles);
  for (const [file, groups] of colorGroups) {
    for (const group of groups) {
      const uniqueValues = [...new Set(group.map((s) => s.value))];
      const firstLine = group[0].line;
      const lastLine = group[group.length - 1].line;
      const lineRange =
        firstLine === lastLine ? `line ${firstLine}` : `lines ${firstLine}-${lastLine}`;

      violations.push({
        id: `tok-${file}-${firstLine}`,
        severity: "error",
        class: "visual-token",
        ruleId: "TOK-001",
        message:
          group.length === 1
            ? `Raw color "${group[0].value}" used outside token system`
            : `${group.length} raw color literals at ${lineRange}: ${uniqueValues.slice(0, 4).join(", ")}${uniqueValues.length > 4 ? ` (+${uniqueValues.length - 4} more)` : ""}`,
        rationale:
          "All colors should reference semantic token roles to maintain visual consistency",
        evidence: group.map((s) => ({
          file: s.file,
          line: s.line,
          snippet: s.snippet,
          value: s.value,
        })),
        suggestedFix: `Replace with semantic color tokens`,
      });
    }
  }

  // --- Spacing violations (ungrouped — typically sparse) ---
  for (const style of extractedStyles) {
    if (style.type === "spacing" && style.isRaw) {
      const allowedValues = pack.artifacts.visualTokens.spacing.map(
        (s) => s.value
      );
      if (!allowedValues.includes(style.value)) {
        violations.push({
          id: `tok-spacing-${style.file}-${style.line}`,
          severity: "warn",
          class: "visual-token",
          ruleId: "TOK-002",
          message: `Spacing value "${style.value}" not on allowed scale`,
          rationale:
            "Consistent spacing reinforces the product's visual rhythm",
          evidence: [
            {
              file: style.file,
              line: style.line,
              snippet: style.snippet,
              value: style.value,
            },
          ],
          suggestedFix: `Use one of: ${allowedValues.join(", ")}`,
        });
      }
    }
  }

  return violations;
}

export interface ExtractedStyle {
  file: string;
  line: number;
  type: "color" | "spacing" | "typography" | "radius" | "other";
  value: string;
  isRaw: boolean;
  snippet: string;
}
