import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { FreeCADPreset, FreeCADPartAsset } from "./schemas.js";
import type { FreeCADPartCRUD } from "./types.js";

// ── In-memory FreeCAD CRUD ──────────────────────────────────────

/**
 * Create an in-memory CRUD store for FreeCAD part assets.
 * Optionally persists to a JSON file on every write for dev/debug use.
 *
 * Matches the exact factory pattern from Pandoc's createPandocCRUD.
 *
 * @param persistPath - optional path to a JSON file for persistence
 */
export function createFreeCADCRUD(
  persistPath?: string,
): FreeCADPartCRUD {
  const store = new Map<string, FreeCADPartAsset>();

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
      const items: FreeCADPartAsset[] = JSON.parse(data);
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
    async create(asset: FreeCADPartAsset): Promise<FreeCADPartAsset> {
      await ensureHydrated();
      store.set(asset.id, asset);
      await persist();
      return asset;
    },

    async read(id: string): Promise<FreeCADPartAsset | null> {
      await ensureHydrated();
      return store.get(id) ?? null;
    },

    async list(
      filter?: { preset?: FreeCADPreset },
    ): Promise<FreeCADPartAsset[]> {
      await ensureHydrated();
      const all = Array.from(store.values());
      if (filter?.preset) {
        return all.filter((a) => a.preset === filter.preset);
      }
      return all;
    },

    async update(
      id: string,
      patch: Partial<FreeCADPartAsset>,
    ): Promise<FreeCADPartAsset> {
      await ensureHydrated();
      const existing = store.get(id);
      if (!existing) throw new Error(`FreeCAD asset ${id} not found.`);
      const updated = { ...existing, ...patch, id }; // id is immutable
      store.set(id, updated);
      await persist();
      return updated;
    },

    async delete(id: string): Promise<void> {
      await ensureHydrated();
      if (!store.delete(id)) {
        throw new Error(`FreeCAD asset ${id} not found.`);
      }
      await persist();
    },
  };
}
