import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { BearingsStore } from "../src/graph/store.js";
import { indexProject } from "../src/indexer/extract.js";
import { generateModuleCard } from "../src/cards/module-card.js";

const BARREL_FIXTURE = path.resolve(
  import.meta.dirname,
  "fixtures/barrel-project"
);

const SAMPLE_FIXTURE = path.resolve(
  import.meta.dirname,
  "fixtures/sample-project"
);

describe("module boundary law", () => {
  let store: BearingsStore;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `code-bearings-mod-test-${Date.now()}.db`);
    store = new BearingsStore(dbPath);
  });

  afterEach(() => {
    store.close();
    try {
      fs.unlinkSync(dbPath);
    } catch {}
  });

  describe("barrel detection", () => {
    it("should detect barrel/index as a module boundary", () => {
      indexProject(store, { projectRoot: BARREL_FIXTURE });

      const modules = store.getAllModules();
      const moduleNames = modules.map((m) => m.name);

      // billing/ should be detected as a barrel-based module
      const billingModule = modules.find((m) => m.name.includes("billing"));
      expect(billingModule).toBeDefined();
      expect(billingModule!.boundaryKind).toBe("barrel");
      expect(billingModule!.hasBarrel).toBe(true);
      expect(billingModule!.boundaryConfidence).toBe("high");
    });

    it("should include all billing files under the barrel module", () => {
      indexProject(store, { projectRoot: BARREL_FIXTURE });

      const billingModule = store.getAllModules().find((m) => m.name.includes("billing"));
      expect(billingModule).toBeDefined();

      // Should include types.ts, create.ts, send.ts, index.ts
      expect(billingModule!.fileIds.length).toBeGreaterThanOrEqual(3);
    });

    it("should surface barrel info in module card", () => {
      indexProject(store, { projectRoot: BARREL_FIXTURE });

      const billingModule = store.getAllModules().find((m) => m.name.includes("billing"));
      expect(billingModule).toBeDefined();

      const card = generateModuleCard(store, billingModule!.name);
      expect(card).toBeDefined();
      expect(card!.boundary.kind).toBe("barrel");
      expect(card!.boundary.hasBarrel).toBe(true);
      expect(card!.boundary.confidence).toBe("high");
      expect(card!.boundary.reason).toContain("Barrel export");
    });
  });

  describe("boundary confidence", () => {
    it("should assign low confidence to single-file top-level modules", () => {
      indexProject(store, { projectRoot: BARREL_FIXTURE });

      const modules = store.getAllModules();
      // api.ts at the top level should be a low-confidence file module
      const apiModule = modules.find(
        (m) => m.name.includes("api") && m.boundaryKind === "file"
      );
      if (apiModule) {
        expect(apiModule.boundaryConfidence).toBe("low");
      }
    });

    it("should assign medium confidence to directory-based modules", () => {
      indexProject(store, { projectRoot: SAMPLE_FIXTURE });

      const modules = store.getAllModules();
      const dirModules = modules.filter((m) => m.boundaryKind === "directory");
      for (const mod of dirModules) {
        expect(mod.boundaryConfidence).toBe("medium");
      }
    });
  });

  describe("boundary reason", () => {
    it("should include a reason for every module boundary", () => {
      indexProject(store, { projectRoot: BARREL_FIXTURE });

      const modules = store.getAllModules();
      for (const mod of modules) {
        expect(mod.boundaryReason).toBeTruthy();
        expect(mod.boundaryReason.length).toBeGreaterThan(0);
      }
    });
  });

  describe("module overrides", () => {
    it("should apply user overrides with highest priority", () => {
      indexProject(store, {
        projectRoot: SAMPLE_FIXTURE,
        moduleOverrides: [
          {
            name: "invoice-system",
            include: ["src/billing.*", "src/store.*"],
            responsibility: "Invoice creation, persistence, and delivery",
          },
        ],
      });

      const modules = store.getAllModules();
      const override = modules.find((m) => m.name === "invoice-system");
      expect(override).toBeDefined();
      expect(override!.boundaryKind).toBe("override");
      expect(override!.boundaryConfidence).toBe("high");
      expect(override!.boundaryReason).toContain("Invoice creation");
    });
  });

  describe("module identity consistency", () => {
    it("should produce consistent module identity across card and overview", () => {
      indexProject(store, { projectRoot: BARREL_FIXTURE });

      const modules = store.getAllModules();
      for (const mod of modules) {
        const card = generateModuleCard(store, mod.name);
        expect(card).toBeDefined();
        expect(card!.name).toBe(mod.name);
        expect(card!.boundary.kind).toBe(mod.boundaryKind);
        expect(card!.boundary.confidence).toBe(mod.boundaryConfidence);
      }
    });
  });
});
