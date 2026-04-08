import { resolve, join } from "node:path";
import { readdir, stat } from "node:fs/promises";
import type { ExtractedTarget } from "@taste-compiler/check";
import { scanReactFile } from "./react/scanner.js";
import { scanTailwindFile } from "./tailwind/scanner.js";
import { scanCssVarFile, scanInlineStyles } from "./cssvar/scanner.js";
import { scanRoutes } from "./routes/scanner.js";
import { scanCopyInFile } from "./copy/scanner.js";

/**
 * Recursively collect files matching extensions.
 */
async function collectFiles(
  dir: string,
  extensions: string[]
): Promise<string[]> {
  const result: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist") continue;
        result.push(...(await collectFiles(full, extensions)));
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        result.push(full);
      }
    }
  } catch {
    // Directory doesn't exist or not readable
  }

  return result;
}

/**
 * Extract all taste-checkable data from a web app target directory.
 */
export async function extractTarget(
  targetDir: string
): Promise<ExtractedTarget> {
  const absDir = resolve(targetDir);
  const tsxFiles = await collectFiles(absDir, [".tsx", ".jsx"]);

  const allComponents: ExtractedTarget["components"] = [];
  const allScreens: ExtractedTarget["screens"] = [];
  const allStyles: ExtractedTarget["styles"] = [];
  const allClasses: ExtractedTarget["classes"] = [];
  const allCopy: ExtractedTarget["copyBlocks"] = [];

  // Scan React files
  for (const file of tsxFiles) {
    try {
      const { components, screen } = await scanReactFile(file);
      allComponents.push(...components);
      allScreens.push(screen);
    } catch {
      // Skip files that fail to parse
    }
  }

  // Scan TSX/JSX/HTML for Tailwind/style patterns
  // CSS files are handled by the CSS-var scanner which is :root-aware
  const tailwindFiles = await collectFiles(absDir, [
    ".tsx",
    ".jsx",
    ".html",
  ]);
  for (const file of tailwindFiles) {
    try {
      const { styles, classes } = await scanTailwindFile(file);
      allStyles.push(...styles);
      allClasses.push(...classes);
    } catch {
      // Skip files that fail to parse
    }
  }

  // Scan CSS files for var() token bypass
  const cssFiles = await collectFiles(absDir, [".css"]);
  for (const file of cssFiles) {
    try {
      const styles = await scanCssVarFile(file);
      allStyles.push(...styles);
    } catch {
      // Skip files that fail to parse
    }
  }

  // Scan TSX/JSX/TS files for inline style token bypass
  const styleFiles = await collectFiles(absDir, [".tsx", ".jsx", ".ts"]);
  for (const file of styleFiles) {
    try {
      const styles = await scanInlineStyles(file);
      allStyles.push(...styles);
    } catch {
      // Skip files that fail to parse
    }
  }

  // Scan copy
  for (const file of tsxFiles) {
    try {
      const copy = await scanCopyInFile(file);
      allCopy.push(...copy);
    } catch {
      // Skip files that fail to parse
    }
  }

  // Scan routes
  const { routes } = await scanRoutes(absDir);

  return {
    styles: allStyles,
    components: allComponents,
    screens: allScreens,
    copyBlocks: allCopy,
    metrics: {
      topLevelNavItems: undefined, // Would need more specific detection
      routeCount: routes.length,
    },
    classes: allClasses,
    interactions: [],
  };
}
