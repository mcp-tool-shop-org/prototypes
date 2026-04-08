import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { YouTubeMediaAsset } from "./schemas.js";
import type { YouTubeMediaAssetCRUD } from "./types.js";

// ── In-memory CRUD ────────────────────────────────────────────────

/**
 * Create an in-memory CRUD store. Optionally persists to a JSON file
 * on every write for dev/debug use.
 *
 * @param persistPath - optional path to a JSON file for persistence
 */
export function createInMemoryCRUD(
  persistPath?: string,
): YouTubeMediaAssetCRUD {
  const store = new Map<string, YouTubeMediaAsset>();

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
      const items: YouTubeMediaAsset[] = JSON.parse(data);
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
    async create(asset: YouTubeMediaAsset): Promise<YouTubeMediaAsset> {
      await ensureHydrated();
      store.set(asset.id, asset);
      await persist();
      return asset;
    },

    async read(id: string): Promise<YouTubeMediaAsset | null> {
      await ensureHydrated();
      return store.get(id) ?? null;
    },

    async list(filter?: { userId?: string }): Promise<YouTubeMediaAsset[]> {
      await ensureHydrated();
      const all = Array.from(store.values());
      // userId filter is a no-op for now (assets don't store userId)
      return filter?.userId ? all : all;
    },

    async update(
      id: string,
      patch: Partial<YouTubeMediaAsset>,
    ): Promise<YouTubeMediaAsset> {
      await ensureHydrated();
      const existing = store.get(id);
      if (!existing) throw new Error(`Asset ${id} not found.`);
      const updated = { ...existing, ...patch, id }; // id is immutable
      store.set(id, updated);
      await persist();
      return updated;
    },

    async delete(id: string): Promise<void> {
      await ensureHydrated();
      if (!store.delete(id)) {
        throw new Error(`Asset ${id} not found.`);
      }
      await persist();
    },
  };
}
