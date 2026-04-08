import type { TastePack, TasteViolation } from "@taste-compiler/core";
import type { ExtractedComponent } from "./grammar-checker.js";

export interface ExtractedClassUsage {
  file: string;
  line: number;
  className: string;
  snippet: string;
}

/**
 * Check forbidden pattern violations.
 */
export function checkForbiddenPatternViolations(
  pack: TastePack,
  components: ExtractedComponent[],
  classes: ExtractedClassUsage[]
): TasteViolation[] {
  const violations: TasteViolation[] = [];

  for (const fp of pack.artifacts.forbiddenPatterns) {
    if (!fp.detection) continue;

    // Check component names
    if (fp.detection.componentNames) {
      for (const comp of components) {
        if (fp.detection.componentNames.includes(comp.name)) {
          violations.push({
            id: `fp-comp-${comp.file}-${comp.line}-${fp.id}`,
            severity: fp.severity,
            class: "forbidden-pattern",
            ruleId: "FP-002",
            message: `Forbidden component "${comp.name}" detected: ${fp.pattern}`,
            rationale: fp.reason,
            evidence: [
              {
                file: comp.file,
                line: comp.line,
                snippet: comp.snippet,
                value: comp.name,
              },
            ],
            suggestedFix: `Remove "${comp.name}" — this pattern is explicitly forbidden`,
          });
        }
      }
    }

    // Check class patterns
    if (fp.detection.classPatterns) {
      for (const cls of classes) {
        for (const pattern of fp.detection.classPatterns) {
          if (cls.className.includes(pattern)) {
            violations.push({
              id: `fp-class-${cls.file}-${cls.line}-${fp.id}`,
              severity: fp.severity,
              class: "forbidden-pattern",
              ruleId: "FP-001",
              message: `Forbidden layout pattern "${pattern}" detected: ${fp.pattern}`,
              rationale: fp.reason,
              evidence: [
                {
                  file: cls.file,
                  line: cls.line,
                  snippet: cls.snippet,
                  value: cls.className,
                },
              ],
              suggestedFix: `Remove class "${pattern}" — this layout pattern is forbidden`,
            });
          }
        }
      }
    }

    // Check import patterns
    if (fp.detection.importPatterns) {
      for (const comp of components) {
        for (const pattern of fp.detection.importPatterns) {
          if (comp.importPath.includes(pattern)) {
            violations.push({
              id: `fp-import-${comp.file}-${comp.line}-${fp.id}`,
              severity: fp.severity,
              class: "forbidden-pattern",
              ruleId: "FP-003",
              message: `Forbidden import pattern "${pattern}" detected: ${fp.pattern}`,
              rationale: fp.reason,
              evidence: [
                {
                  file: comp.file,
                  line: comp.line,
                  snippet: comp.snippet,
                  value: comp.importPath,
                },
              ],
              suggestedFix: `Remove import from "${pattern}" — this pattern is forbidden`,
            });
          }
        }
      }
    }
  }

  return violations;
}
