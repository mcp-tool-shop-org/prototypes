import path from "node:path";
import fs from "node:fs";
import { SourceFile } from "ts-morph";
import { BearingsStore } from "../graph/store.js";
import type { Confidence, ModuleOverride, ModuleRecord } from "../types.js";

/**
 * Module Boundary Law
 *
 * Module identity is determined by a priority chain:
 * 1. User overrides (highest confidence)
 * 2. Package boundaries (package.json)
 * 3. Barrel/index exports (index.ts / barrel re-export files)
 * 4. Directory grouping (fallback)
 *
 * Each module gets a boundary confidence and a reason explaining
 * why it exists as a module.
 */

interface FileInfo {
  filePath: string;
  fileId: number;
  relativePath: string;
}

interface BarrelInfo {
  /** Directory that the barrel represents */
  dir: string;
  /** Path to the barrel file */
  barrelPath: string;
  /** Number of re-exports from the barrel */
  reExportCount: number;
}

/**
 * Build module boundaries using the priority chain.
 */
export function buildModuleBoundaries(
  store: BearingsStore,
  sourceFiles: SourceFile[],
  fileIdMap: Map<string, number>,
  projectRoot: string,
  overrides?: ModuleOverride[]
): void {
  const files: FileInfo[] = [];
  for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();
    const fileId = fileIdMap.get(filePath);
    if (fileId === undefined) continue;
    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, "/");
    files.push({ filePath, fileId, relativePath });
  }

  // Track which files have been assigned to a module
  const assignedFiles = new Set<number>();
  const moduleIdMap = new Map<string, number>();

  // Priority 1: User overrides
  if (overrides && overrides.length > 0) {
    applyOverrides(store, files, overrides, assignedFiles, moduleIdMap);
  }

  // Priority 2: Package boundaries
  applyPackageBoundaries(store, files, projectRoot, assignedFiles, moduleIdMap);

  // Priority 3: Barrel/index exports
  const barrels = detectBarrels(sourceFiles, fileIdMap, projectRoot);
  applyBarrelBoundaries(store, files, barrels, assignedFiles, moduleIdMap);

  // Priority 4: Directory fallback for remaining files
  applyDirectoryFallback(store, files, assignedFiles, moduleIdMap);

  // Build module-level dependency edges
  buildModuleDeps(store, files, moduleIdMap);
}

function applyOverrides(
  store: BearingsStore,
  files: FileInfo[],
  overrides: ModuleOverride[],
  assignedFiles: Set<number>,
  moduleIdMap: Map<string, number>
): void {
  for (const override of overrides) {
    const matchingFiles = files.filter((f) => {
      if (assignedFiles.has(f.fileId)) return false;
      return override.include.some((pattern) => matchGlob(f.relativePath, pattern));
    });

    // Apply excludes
    const filteredFiles = override.exclude
      ? matchingFiles.filter(
          (f) => !override.exclude!.some((pattern) => matchGlob(f.relativePath, pattern))
        )
      : matchingFiles;

    if (filteredFiles.length === 0) continue;

    const reason = override.responsibility
      ? `User override: ${override.responsibility}`
      : `User override with ${override.include.length} include pattern(s)`;

    const moduleId = store.insertModule(override.name, "override", {
      boundaryConfidence: "high",
      boundaryReason: reason,
    });
    moduleIdMap.set(override.name, moduleId);

    for (const f of filteredFiles) {
      store.linkModuleFile(moduleId, f.fileId);
      assignedFiles.add(f.fileId);
    }
  }
}

function applyPackageBoundaries(
  store: BearingsStore,
  files: FileInfo[],
  projectRoot: string,
  assignedFiles: Set<number>,
  moduleIdMap: Map<string, number>
): void {
  // Find all package.json files in subdirectories (monorepo packages)
  const packageDirs = new Map<string, string>(); // relative dir → package name

  const dirsToCheck = new Set<string>();
  for (const f of files) {
    const parts = f.relativePath.split("/");
    // Check each parent directory for package.json
    for (let i = 1; i < parts.length; i++) {
      dirsToCheck.add(parts.slice(0, i).join("/"));
    }
  }

  for (const dir of dirsToCheck) {
    const pkgPath = path.join(projectRoot, dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        const pkgName = pkg.name ?? dir;
        packageDirs.set(dir, pkgName);
      } catch {
        // Invalid package.json — skip
      }
    }
  }

  // Sort by depth (deepest first) so nested packages win
  const sortedDirs = Array.from(packageDirs.entries()).sort(
    (a, b) => b[0].split("/").length - a[0].split("/").length
  );

  for (const [dir, pkgName] of sortedDirs) {
    const matchingFiles = files.filter((f) => {
      if (assignedFiles.has(f.fileId)) return false;
      return f.relativePath.startsWith(dir + "/");
    });

    if (matchingFiles.length === 0) continue;

    const moduleId = store.insertModule(pkgName, "package", {
      boundaryConfidence: "high",
      boundaryReason: `Package boundary: has package.json in ${dir}/`,
      hasPackageJson: true,
    });
    moduleIdMap.set(pkgName, moduleId);

    for (const f of matchingFiles) {
      store.linkModuleFile(moduleId, f.fileId);
      assignedFiles.add(f.fileId);
    }
  }
}

function detectBarrels(
  sourceFiles: SourceFile[],
  fileIdMap: Map<string, number>,
  projectRoot: string
): BarrelInfo[] {
  const barrels: BarrelInfo[] = [];

  for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();
    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, "/");
    const basename = path.basename(relativePath, path.extname(relativePath));

    // Only index.ts/index.tsx files are barrel candidates
    if (basename !== "index") continue;

    const dir = path.dirname(relativePath);
    if (dir === ".") continue; // Root index is not a barrel

    // Count re-exports: export { ... } from '...' and export * from '...'
    let reExportCount = 0;
    const exportDecls = sf.getExportDeclarations();
    for (const ed of exportDecls) {
      if (ed.getModuleSpecifierValue()) {
        reExportCount++;
      }
    }

    // Also count re-exported assignments
    const exportAssignments = sf.getExportAssignments();
    reExportCount += exportAssignments.length;

    // A barrel should mostly re-export, not define new logic
    const ownFunctions = sf.getFunctions().length;
    const ownClasses = sf.getClasses().length;
    const ownLogic = ownFunctions + ownClasses;

    // Barrel heuristic: more re-exports than own logic
    if (reExportCount > 0 && reExportCount >= ownLogic) {
      barrels.push({
        dir,
        barrelPath: relativePath,
        reExportCount,
      });
    }
  }

  return barrels;
}

function applyBarrelBoundaries(
  store: BearingsStore,
  files: FileInfo[],
  barrels: BarrelInfo[],
  assignedFiles: Set<number>,
  moduleIdMap: Map<string, number>
): void {
  // Sort by depth (deepest first) so nested barrels win
  const sortedBarrels = barrels.sort(
    (a, b) => b.dir.split("/").length - a.dir.split("/").length
  );

  for (const barrel of sortedBarrels) {
    const matchingFiles = files.filter((f) => {
      if (assignedFiles.has(f.fileId)) return false;
      return f.relativePath.startsWith(barrel.dir + "/");
    });

    if (matchingFiles.length === 0) continue;

    const moduleId = store.insertModule(barrel.dir, "barrel", {
      boundaryConfidence: "high",
      boundaryReason: `Barrel export: ${barrel.barrelPath} re-exports ${barrel.reExportCount} module(s)`,
      hasBarrel: true,
    });
    moduleIdMap.set(barrel.dir, moduleId);

    for (const f of matchingFiles) {
      store.linkModuleFile(moduleId, f.fileId);
      assignedFiles.add(f.fileId);
    }
  }
}

function applyDirectoryFallback(
  store: BearingsStore,
  files: FileInfo[],
  assignedFiles: Set<number>,
  moduleIdMap: Map<string, number>
): void {
  const dirToFiles = new Map<string, FileInfo[]>();

  for (const f of files) {
    if (assignedFiles.has(f.fileId)) continue;

    const dir = path.dirname(f.relativePath);
    const moduleName =
      dir === "."
        ? path.basename(f.relativePath, path.extname(f.relativePath))
        : dir;

    if (!dirToFiles.has(moduleName)) {
      dirToFiles.set(moduleName, []);
    }
    dirToFiles.get(moduleName)!.push(f);
  }

  for (const [moduleName, moduleFiles] of dirToFiles) {
    // Check if this is already a known module (from override/package/barrel)
    if (moduleIdMap.has(moduleName)) {
      const existingModuleId = moduleIdMap.get(moduleName)!;
      for (const f of moduleFiles) {
        store.linkModuleFile(existingModuleId, f.fileId);
        assignedFiles.add(f.fileId);
      }
      continue;
    }

    const boundaryKind = moduleFiles.length === 1 ? "file" as const : "directory" as const;
    const confidence: Confidence = moduleFiles.length === 1 ? "low" : "medium";
    const reason =
      moduleFiles.length === 1
        ? `Single file at top level — weak module boundary`
        : `Directory grouping: ${moduleFiles.length} files in ${moduleName}/`;

    const moduleId = store.insertModule(moduleName, boundaryKind, {
      boundaryConfidence: confidence,
      boundaryReason: reason,
    });
    moduleIdMap.set(moduleName, moduleId);

    for (const f of moduleFiles) {
      store.linkModuleFile(moduleId, f.fileId);
      assignedFiles.add(f.fileId);
    }
  }
}

function buildModuleDeps(
  store: BearingsStore,
  files: FileInfo[],
  moduleIdMap: Map<string, number>
): void {
  // Build file → module mapping
  const fileToModule = new Map<number, number>();
  const allModules = store.getAllModules();
  for (const mod of allModules) {
    for (const fileId of mod.fileIds) {
      fileToModule.set(fileId, mod.id);
    }
  }

  // Walk edges and create module-level deps
  for (const f of files) {
    const sourceModuleId = fileToModule.get(f.fileId);
    if (sourceModuleId === undefined) continue;

    const symbols = store.getSymbolsByFile(f.fileId);
    for (const sym of symbols) {
      const edges = store.getEdgesFrom(sym.id);
      for (const edge of edges) {
        if (edge.kind !== "imports" && edge.kind !== "calls") continue;
        const targetSym = store.getSymbol(edge.targetSymbolId);
        if (!targetSym) continue;
        const targetModuleId = fileToModule.get(targetSym.fileId);
        if (targetModuleId === undefined || targetModuleId === sourceModuleId) continue;
        store.upsertModuleDep(sourceModuleId, targetModuleId, 1);
      }
    }
  }
}

/**
 * Simple glob matching — supports * and ** patterns.
 */
function matchGlob(filePath: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\{\{GLOBSTAR\}\}/g, ".*");
  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(filePath);
}

/**
 * Load module overrides from a code-bearings config file.
 */
export function loadOverrides(projectRoot: string): ModuleOverride[] {
  const configPaths = [
    path.join(projectRoot, ".code-bearings", "modules.json"),
    path.join(projectRoot, "code-bearings.modules.json"),
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        if (Array.isArray(content)) {
          return content as ModuleOverride[];
        }
        if (content.modules && Array.isArray(content.modules)) {
          return content.modules as ModuleOverride[];
        }
      } catch {
        // Invalid config — skip
      }
    }
  }

  return [];
}
