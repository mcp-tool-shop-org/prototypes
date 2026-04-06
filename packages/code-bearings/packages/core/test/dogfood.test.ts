import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { BearingsStore } from "../src/graph/store.js";
import { indexProject } from "../src/indexer/extract.js";
import { generateModuleCard } from "../src/cards/module-card.js";
import { generateFunctionCard } from "../src/cards/function-card.js";
import { generateSystemMap } from "../src/cards/system-map.js";
import {
  formatModuleCard,
  formatFunctionCard,
  formatSystemMap,
} from "../src/rendering/format.js";

/**
 * Dogfood harness: run Code Bearings against real repos in the workspace.
 * These tests validate extraction, card generation, and formatting
 * on codebases of varying size and complexity.
 *
 * Repos chosen:
 * - code-bearings (self): meta-test, medium complexity
 * - ai-loadout: CLI tool, resolver + agent runtime
 * - claude-guardian: MCP server, flight computer
 * - sensor-humor: MCP server, Ollama integration
 * - artifact: decision system, larger codebase
 */

const WORKSPACE = path.resolve("F:/AI");

// Only include repos that exist on this machine
const DOGFOOD_REPOS = [
  { name: "code-bearings", path: path.join(WORKSPACE, "code-bearings", "packages", "core") },
  { name: "ai-loadout", path: path.join(WORKSPACE, "ai-loadout") },
  { name: "claude-guardian", path: path.join(WORKSPACE, "claude-guardian") },
  { name: "sensor-humor", path: path.join(WORKSPACE, "sensor-humor") },
  { name: "artifact", path: path.join(WORKSPACE, "artifact") },
].filter((r) => fs.existsSync(path.join(r.path, "src")));

// Skip the entire suite when no repos are available (e.g. on CI)
const describeFn = DOGFOOD_REPOS.length > 0 ? describe : describe.skip;

describeFn("dogfood harness", () => {
  for (const repo of DOGFOOD_REPOS) {
    describe(`repo: ${repo.name}`, () => {
      let store: BearingsStore;
      let dbPath: string;

      beforeEach(() => {
        dbPath = path.join(
          os.tmpdir(),
          `code-bearings-dogfood-${repo.name}-${Date.now()}.db`
        );
        store = new BearingsStore(dbPath);
      });

      afterEach(() => {
        store.close();
        try {
          fs.unlinkSync(dbPath);
        } catch {}
      });

      it("should index without crashing", () => {
        expect(() => {
          indexProject(store, { projectRoot: repo.path });
        }).not.toThrow();
      });

      it("should extract files and symbols", () => {
        indexProject(store, { projectRoot: repo.path });

        const files = store.getAllFiles();
        expect(files.length).toBeGreaterThan(0);

        let totalSymbols = 0;
        for (const file of files) {
          totalSymbols += store.getSymbolsByFile(file.id).length;
        }
        expect(totalSymbols).toBeGreaterThan(0);
      });

      it("should build modules with boundaries", () => {
        indexProject(store, { projectRoot: repo.path });

        const modules = store.getAllModules();
        expect(modules.length).toBeGreaterThan(0);

        // Every module should have boundary metadata
        for (const mod of modules) {
          expect(mod.boundaryKind).toBeTruthy();
          expect(mod.boundaryConfidence).toMatch(/high|medium|low/);
          expect(mod.boundaryReason).toBeTruthy();
        }
      });

      it("should generate module cards for every module", () => {
        indexProject(store, { projectRoot: repo.path });

        const modules = store.getAllModules();
        for (const mod of modules) {
          const card = generateModuleCard(store, mod.name);
          expect(card).toBeDefined();
          expect(card!.name).toBe(mod.name);
          expect(card!.responsibility).toBeTruthy();
          expect(card!.confidence).toMatch(/high|medium|low/);

          // Card should format without crashing
          const text = formatModuleCard(card!);
          expect(text).toContain("# Module:");
          expect(text).toContain("Confidence:");
        }
      });

      it("should generate function cards for exported functions", () => {
        indexProject(store, { projectRoot: repo.path });

        const files = store.getAllFiles();
        let testedCount = 0;

        for (const file of files) {
          const exported = store.getExportedSymbolsByFile(file.id);
          const functions = exported.filter(
            (s) => s.kind === "function" || s.kind === "method"
          );

          for (const fn of functions.slice(0, 3)) {
            // sample up to 3 per file
            const card = generateFunctionCard(store, fn.name);
            if (!card) continue; // name collision possible

            expect(card.name).toBe(fn.name);
            expect(card.signature).toBeTruthy();
            expect(card.purpose).toBeTruthy();

            const text = formatFunctionCard(card);
            expect(text).toContain("# Function:");
            testedCount++;
          }
        }

        expect(testedCount).toBeGreaterThan(0);
      });

      it("should generate a system map", () => {
        indexProject(store, { projectRoot: repo.path });

        const map = generateSystemMap(store);
        expect(map.subsystems.length).toBeGreaterThan(0);

        const text = formatSystemMap(map);
        expect(text).toContain("# System Map");
      });

      it("should produce evidence on module cards", () => {
        indexProject(store, { projectRoot: repo.path });

        const modules = store.getAllModules();
        let totalEvidence = 0;

        for (const mod of modules) {
          const card = generateModuleCard(store, mod.name);
          if (card) {
            totalEvidence += card.evidence.length;
          }
        }

        // At least some modules should have evidence
        expect(totalEvidence).toBeGreaterThan(0);
      });

      it("should detect cross-module dependencies", () => {
        indexProject(store, { projectRoot: repo.path });

        const modules = store.getAllModules();
        if (modules.length < 2) return; // single module, skip

        let hasDeps = false;
        for (const mod of modules) {
          const deps = store.getModuleDeps(mod.id);
          if (deps.length > 0) {
            hasDeps = true;

            // Each dep should point to a real module
            for (const dep of deps) {
              expect(dep.targetModuleId).not.toBe(mod.id); // no self-deps
              expect(dep.weight).toBeGreaterThan(0);
            }
          }
        }

        // Multi-module projects should have at least some cross-module deps
        if (modules.length > 1) {
          expect(hasDeps).toBe(true);
        }
      });
    });
  }
});
