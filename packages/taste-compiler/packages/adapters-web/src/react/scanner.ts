import { readFile } from "node:fs/promises";
import type {
  ExtractedComponent,
  ExtractedScreen,
} from "@taste-compiler/check";

// Regex-based scanning for Phase 1 — pragmatic, not full AST.
const IMPORT_RE =
  /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+["']([^"']+)["']/g;
const JSX_COMPONENT_RE = /<([A-Z]\w+)(?:\s|\/|>)/g;
const PRIMARY_VARIANT_RE =
  /variant\s*=\s*["']primary["']/g;

/**
 * Extract component imports and JSX usage from a TSX/JSX file.
 */
export async function scanReactFile(
  filePath: string
): Promise<{
  components: ExtractedComponent[];
  screen: ExtractedScreen;
}> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const components: ExtractedComponent[] = [];
  const usedComponents = new Set<string>();
  let primaryActionCount = 0;

  // Extract imports
  IMPORT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IMPORT_RE.exec(content)) !== null) {
    const importPath = match[3];
    const names = match[1]
      ? match[1].split(",").map((n) => n.trim().split(" as ")[0].trim())
      : [match[2]];

    const lineNum = content.slice(0, match.index).split("\n").length;

    for (const name of names) {
      if (name) {
        components.push({
          file: filePath,
          line: lineNum,
          name,
          importPath,
          snippet: lines[lineNum - 1]?.trim() ?? "",
        });
      }
    }
  }

  // Extract JSX component usage
  JSX_COMPONENT_RE.lastIndex = 0;
  while ((match = JSX_COMPONENT_RE.exec(content)) !== null) {
    usedComponents.add(match[1]);
  }

  // Count primary actions
  PRIMARY_VARIANT_RE.lastIndex = 0;
  while (PRIMARY_VARIANT_RE.exec(content) !== null) {
    primaryActionCount++;
  }

  return {
    components,
    screen: {
      file: filePath,
      primaryActionCount,
      components: [...usedComponents],
    },
  };
}
