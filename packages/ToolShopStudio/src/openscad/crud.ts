import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { OpenSCADPreset, OpenSCADModelAsset } from "./schemas.js";
import type { OpenSCADModelCRUD } from "./types.js";

// ── In-memory OpenSCAD CRUD ──────────────────────────────────────

/**
 * Create an in-memory CRUD store for OpenSCAD model assets.
 * Optionally persists to a JSON file on every write for dev/debug use.
 *
 * Matches the exact factory pattern from FreeCAD's createFreeCADCRUD.
 *
 * @param persistPath - optional path to a JSON file for persistence
 */
export function createOpenSCADCRUD(
  persistPath?: string,
): OpenSCADModelCRUD {
  const store = new Map<string, OpenSCADModelAsset>();

  async function persist(): Promise<void> {
    if (!persistPath) return;
    await mkdir(path.dirname(persistPath), { recursive: true });
    const data = JSON.stringify(Array.from(store.values()), null, 2);
    await writeFile(persistPath, data, "utf8");
  }

  async function hydrate(): Promise<void> {
    if (!persistPath) return;
    try {
      const data = await readFile(persistPath, "utf8");
      const items: OpenSCADModelAsset[] = JSON.parse(data);
      for (const item of items) {
        store.set(item.id, item);
      }
    } catch {
      // File doesn't exist yet — start fresh
    }
  }

  // Hydrate on first access (lazy)
  let hydrated = false;
  async function ensureHydrated(): Promise<void> {
    if (!hydrated) {
      await hydrate();
      hydrated = true;
    }
  }

  return {
    async create(asset: OpenSCADModelAsset): Promise<OpenSCADModelAsset> {
      await ensureHydrated();
      store.set(asset.id, asset);
      await persist();
      return asset;
    },

    async read(id: string): Promise<OpenSCADModelAsset | null> {
      await ensureHydrated();
      return store.get(id) ?? null;
    },

    async list(
      filter?: { preset?: OpenSCADPreset },
    ): Promise<OpenSCADModelAsset[]> {
      await ensureHydrated();
      const all = Array.from(store.values());
      if (filter?.preset) {
        return all.filter((a) => a.preset === filter.preset);
      }
      return all;
    },

    async update(
      id: string,
      patch: Partial<OpenSCADModelAsset>,
    ): Promise<OpenSCADModelAsset> {
      await ensureHydrated();
      const existing = store.get(id);
      if (!existing) throw new Error(`OpenSCAD asset ${id} not found.`);
      const updated = { ...existing, ...patch, id }; // id is immutable
      store.set(id, updated);
      await persist();
      return updated;
    },

    async delete(id: string): Promise<void> {
      await ensureHydrated();
      if (!store.delete(id)) {
        throw new Error(`OpenSCAD asset ${id} not found.`);
      }
      await persist();
    },
  };
}
