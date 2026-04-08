import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { GDALPreset, GDALGeoDataAsset } from "./schemas.js";
import type { GDALGeoDataCRUD } from "./types.js";

// ── In-memory GDAL CRUD ────────────────────────────────────────

/**
 * Create an in-memory CRUD store for GDAL geo data assets.
 * Optionally persists to a JSON file on every write for dev/debug use.
 *
 * Matches the exact factory pattern from FreeCAD's createFreeCADCRUD.
 *
 * @param persistPath - optional path to a JSON file for persistence
 */
export function createGDALCRUD(
  persistPath?: string,
): GDALGeoDataCRUD {
  const store = new Map<string, GDALGeoDataAsset>();

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
      const items: GDALGeoDataAsset[] = JSON.parse(data);
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
    async create(asset: GDALGeoDataAsset): Promise<GDALGeoDataAsset> {
      await ensureHydrated();
      store.set(asset.id, asset);
      await persist();
      return asset;
    },

    async read(id: string): Promise<GDALGeoDataAsset | null> {
      await ensureHydrated();
      return store.get(id) ?? null;
    },

    async list(
      filter?: { preset?: GDALPreset },
    ): Promise<GDALGeoDataAsset[]> {
      await ensureHydrated();
      const all = Array.from(store.values());
      if (filter?.preset) {
        return all.filter((a) => a.preset === filter.preset);
      }
      return all;
    },

    async update(
      id: string,
      patch: Partial<GDALGeoDataAsset>,
    ): Promise<GDALGeoDataAsset> {
      await ensureHydrated();
      const existing = store.get(id);
      if (!existing) throw new Error(`GDAL asset ${id} not found.`);
      const updated = { ...existing, ...patch, id }; // id is immutable
      store.set(id, updated);
      await persist();
      return updated;
    },

    async delete(id: string): Promise<void> {
      await ensureHydrated();
      if (!store.delete(id)) {
        throw new Error(`GDAL asset ${id} not found.`);
      }
      await persist();
    },
  };
}
