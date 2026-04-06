/**
 * Architecture Regression Tests
 *
 * Validates structural invariants that must hold for all of ConsensusOS v1:
 * - Plugin API v1 is frozen (version constant exists)
 * - Core remains thin (only loader, event-bus, invariant-engine, logger)
 * - No direct module-to-module imports (all communication via event bus)
 * - Event bus isolation (modules only access EventBus interface)
 * - Module boundaries are respected
 * - No hidden production dependencies
 *
 * These tests prevent architectural drift.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "src");

/** Recursively collect all .ts files under a directory */
function collectFiles(dir: string, ext = ".ts"): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full, ext));
    } else if (full.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

// ─── 1. Plugin API Freeze ───────────────────────────────────────────

describe("Plugin API v1 Freeze", () => {
  it("exports ARCHITECTURE_VERSION = 1.0", async () => {
    const api = await import("../src/plugins/api.js");
    expect(api.ARCHITECTURE_VERSION).toBe("1.0");
  });

  it("exports PLUGIN_API_VERSION = 1.0", async () => {
    const api = await import("../src/plugins/api.js");
    expect(api.PLUGIN_API_VERSION).toBe("1.0");
  });

  it("Plugin interface has exactly the required lifecycle methods", async () => {
    // Read the source and verify the Plugin interface shape hasn't changed
    const src = readFileSync(join(SRC, "plugins", "api.ts"), "utf-8");
    expect(src).toContain("init(ctx: PluginContext): Promise<LifecycleResult>");
    expect(src).toContain("start(): Promise<LifecycleResult>");
    expect(src).toContain("stop(): Promise<LifecycleResult>");
    expect(src).toContain("destroy?(): Promise<void>");
    expect(src).toContain("readonly manifest: PluginManifest");
  });

  it("FROZEN banner is present in Plugin API", () => {
    const src = readFileSync(join(SRC, "plugins", "api.ts"), "utf-8");
    expect(src).toContain("FROZEN");
  });
});

// ─── 2. Core Thinness ──────────────────────────────────────────────

describe("Core Thinness", () => {
  const ALLOWED_CORE_FILES = new Set([
    "event-bus.ts",
    "invariant-engine.ts",
    "loader.ts",
    "logger.ts",
  ]);

  it("core/ contains only the allowed files", () => {
    const coreDir = join(SRC, "core");
    const files = readdirSync(coreDir).filter((f) => f.endsWith(".ts"));
    for (const file of files) {
      expect(ALLOWED_CORE_FILES.has(file)).toBe(true);
    }
    // And exactly 4 files
    expect(files.length).toBe(ALLOWED_CORE_FILES.size);
  });

  it("core files do not import from modules/, adapters/, or sdk/", () => {
    const coreFiles = collectFiles(join(SRC, "core"));
    for (const file of coreFiles) {
      const src = readFileSync(file, "utf-8");
      const rel = relative(SRC, file);
      expect(src, `${rel} imports from modules/`).not.toMatch(/from\s+["'].*\/modules\//);
      expect(src, `${rel} imports from adapters/`).not.toMatch(/from\s+["'].*\/adapters\//);
      expect(src, `${rel} imports from sdk/`).not.toMatch(/from\s+["'].*\/sdk\//);
    }
  });
});

// ─── 3. Module Isolation ────────────────────────────────────────────

describe("Module Isolation", () => {
  it("no module imports directly from another module", () => {
    const moduleFiles = collectFiles(join(SRC, "modules"));
    for (const file of moduleFiles) {
      const src = readFileSync(file, "utf-8");
      const rel = relative(SRC, file);

      // Determine which module this file belongs to
      const parts = relative(join(SRC, "modules"), file).split(sep);
      const ownModule = parts[0]; // e.g., "governor", "sandbox", "health"

      // Check all import lines
      const importLines = src.match(/from\s+["'][^"']+["']/g) ?? [];
      for (const imp of importLines) {
        // Extract the path
        const match = imp.match(/from\s+["']([^"']+)["']/);
        if (!match) continue;
        const importPath = match[1];

        // Allowed: imports from own module (relative ./), from core, from plugins
        // Forbidden: imports from other modules or adapters
        if (importPath.includes("/modules/") && !importPath.includes(`/modules/${ownModule}`)) {
          // Relative imports within module are fine — check if it crosses boundaries
          if (importPath.startsWith("../../modules/")) {
            const target = importPath.replace("../../modules/", "").split("/")[0];
            expect(target, `${rel} cross-imports module "${target}"`).toBe(ownModule);
          }
        }
      }
    }
  });

  it("no module imports directly from adapters/", () => {
    const moduleFiles = collectFiles(join(SRC, "modules"));
    for (const file of moduleFiles) {
      const src = readFileSync(file, "utf-8");
      const rel = relative(SRC, file);
      expect(src, `${rel} imports from adapters/`).not.toMatch(/from\s+["'].*\/adapters\//);
    }
  });

  it("modules only access core through plugins/api.ts, core/event-bus.ts, or core/invariant-engine.ts", () => {
    const moduleFiles = collectFiles(join(SRC, "modules"));
    const ALLOWED_CORE_IMPORTS = [
      "plugins/api",
      "core/event-bus",
      "core/invariant-engine",
      "core/logger",
    ];

    for (const file of moduleFiles) {
      const src = readFileSync(file, "utf-8");
      const rel = relative(SRC, file);
      const importLines = src.match(/from\s+["'][^"']+["']/g) ?? [];

      for (const imp of importLines) {
        const match = imp.match(/from\s+["']([^"']+)["']/);
        if (!match) continue;
        const importPath = match[1];

        // Skip relative imports within the module
        if (importPath.startsWith("./") || importPath.startsWith("../")) {
          // Check if it reaches into core
          if (importPath.includes("/core/")) {
            const coreFile = importPath.split("/core/")[1].replace(".js", "");
            const allowed = ALLOWED_CORE_IMPORTS.some((a) => a.endsWith(coreFile));
            expect(allowed, `${rel} imports disallowed core file: ${coreFile}`).toBe(true);
          }
        }
      }
    }
  });
});

// ─── 4. Event Bus Isolation ─────────────────────────────────────────

describe("Event Bus Isolation", () => {
  it("no module instantiates CoreEventBus directly (only core does)", () => {
    const moduleFiles = collectFiles(join(SRC, "modules"));
    const adapterFiles = collectFiles(join(SRC, "adapters"));

    for (const file of [...moduleFiles, ...adapterFiles]) {
      const src = readFileSync(file, "utf-8");
      const rel = relative(SRC, file);

      // AmendmentSimulator creates its own internal event bus — that's acceptable
      // because it's for isolated simulation, not for cross-module communication
      if (rel.includes("amendment-simulator")) continue;

      expect(src, `${rel} instantiates CoreEventBus`).not.toMatch(/new\s+CoreEventBus\s*\(/);
    }
  });
});

// ─── 5. Zero Production Dependencies ────────────────────────────────

describe("Zero Production Dependencies", () => {
  it("package.json has no dependencies field", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
    const deps = Object.keys(pkg.dependencies ?? {});
    expect(deps, "Production dependencies found").toHaveLength(0);
  });

  it("no require() calls in source files", () => {
    const allFiles = collectFiles(SRC);
    for (const file of allFiles) {
      const src = readFileSync(file, "utf-8");
      const rel = relative(SRC, file);
      // Allow type-only requires but not runtime requires
      expect(src, `${rel} uses require()`).not.toMatch(/\brequire\s*\(/);
    }
  });

  it("only imports from node: builtins or relative paths", () => {
    const allFiles = collectFiles(SRC);
    for (const file of allFiles) {
      const src = readFileSync(file, "utf-8");
      const rel = relative(SRC, file);
      const importLines = src.match(/from\s+["']([^"']+)["']/g) ?? [];

      for (const imp of importLines) {
        const match = imp.match(/from\s+["']([^"']+)["']/);
        if (!match) continue;
        const path = match[1];
        // Must be relative (./ or ../) or node: builtin
        const allowed = path.startsWith(".") || path.startsWith("node:");
        expect(allowed, `${rel} imports external package: ${path}`).toBe(true);
      }
    }
  });
});

// ─── 6. Module Boundary Documentation ───────────────────────────────

describe("Module Boundary Documentation", () => {
  const EXPECTED_MODULES = ["config", "governor", "health", "sandbox", "verifier"];
  const EXPECTED_ADAPTERS = ["cosmos", "ethereum", "xrpl"];

  it("all expected modules exist", () => {
    for (const mod of EXPECTED_MODULES) {
      const dir = join(SRC, "modules", mod);
      expect(existsSync(dir), `Module ${mod} missing`).toBe(true);
    }
  });

  it("all expected adapters exist", () => {
    for (const adapter of EXPECTED_ADAPTERS) {
      const dir = join(SRC, "adapters", adapter);
      expect(existsSync(dir), `Adapter ${adapter} missing`).toBe(true);
    }
  });

  it("every plugin file has a manifest with id and capabilities", () => {
    // Check all files that implement Plugin interface
    const pluginFiles = [
      "modules/health/health-sentinel.ts",
      "modules/verifier/release-verifier.ts",
      "modules/config/config-guardian.ts",
      "modules/sandbox/sandbox-plugin.ts",
      "modules/governor/governor-plugin.ts",
    ];

    for (const pf of pluginFiles) {
      const src = readFileSync(join(SRC, pf), "utf-8");
      expect(src, `${pf} missing manifest`).toMatch(/manifest.*PluginManifest/);
      expect(src, `${pf} missing capabilities`).toContain("capabilities:");
    }
  });
});
