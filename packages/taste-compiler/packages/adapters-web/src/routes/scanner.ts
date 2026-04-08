import { readFile } from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { readdir, stat } from "node:fs/promises";

/**
 * Extract routes from a Next.js/React Router-style file structure.
 * Looks for page files in an app/ or pages/ directory.
 */
export async function scanRoutes(
  targetDir: string
): Promise<{ routes: string[]; routeFiles: Map<string, string> }> {
  const routes: string[] = [];
  const routeFiles = new Map<string, string>();

  // Try app/ directory (Next.js app router)
  const appDir = join(targetDir, "app");
  const pagesDir = join(targetDir, "pages");
  const srcAppDir = join(targetDir, "src", "app");
  const srcPagesDir = join(targetDir, "src", "pages");

  for (const dir of [appDir, pagesDir, srcAppDir, srcPagesDir]) {
    try {
      const s = await stat(dir);
      if (s.isDirectory()) {
        await collectRoutes(dir, dir, routes, routeFiles);
      }
    } catch {
      // Directory doesn't exist
    }
  }

  // Also try to extract from a router config file
  for (const routerFile of [
    "src/routes.tsx",
    "src/routes.ts",
    "src/router.tsx",
    "src/router.ts",
    "src/App.tsx",
  ]) {
    try {
      const filePath = resolve(targetDir, routerFile);
      const content = await readFile(filePath, "utf-8");
      const routePattern = /path\s*[:=]\s*["']([^"']+)["']/g;
      let match: RegExpExecArray | null;
      while ((match = routePattern.exec(content)) !== null) {
        const route = match[1];
        if (!routes.includes(route)) {
          routes.push(route);
          routeFiles.set(route, filePath);
        }
      }
    } catch {
      // File doesn't exist
    }
  }

  return { routes, routeFiles };
}

async function collectRoutes(
  baseDir: string,
  currentDir: string,
  routes: string[],
  routeFiles: Map<string, string>
): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(currentDir, entry.name);

    if (entry.isDirectory()) {
      await collectRoutes(baseDir, fullPath, routes, routeFiles);
    } else if (isPageFile(entry.name)) {
      const rel = relative(baseDir, currentDir);
      const route = "/" + rel.replace(/\\/g, "/");
      if (!routes.includes(route)) {
        routes.push(route);
        routeFiles.set(route, fullPath);
      }
    }
  }
}

function isPageFile(name: string): boolean {
  return /^(page|index)\.(tsx?|jsx?)$/.test(name);
}
