import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { PandocPreset, PandocDocumentAsset } from "./schemas.js";
import type { PandocDocumentCRUD } from "./types.js";

// ── In-memory Pandoc CRUD ────────────────────────────────────────

/**
 * Create an in-memory CRUD store for Pandoc document assets.
 * Optionally persists to a JSON file on every write for dev/debug use.
 *
 * Matches the exact factory pattern from FFmpeg's createInMemoryCRUD.
 *
 * @param persistPath - optional path to a JSON file for persistence
 */
export function createPandocCRUD(
  persistPath?: string,
): PandocDocumentCRUD {
  const store = new Map<string, PandocDocumentAsset>();

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
      const items: PandocDocumentAsset[] = JSON.parse(data);
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
    async create(asset: PandocDocumentAsset): Promise<PandocDocumentAsset> {
      await ensureHydrated();
      store.set(asset.id, asset);
      await persist();
      return asset;
    },

    async read(id: string): Promise<PandocDocumentAsset | null> {
      await ensureHydrated();
      return store.get(id) ?? null;
    },

    async list(
      filter?: { preset?: PandocPreset },
    ): Promise<PandocDocumentAsset[]> {
      await ensureHydrated();
      const all = Array.from(store.values());
      if (filter?.preset) {
        return all.filter((a) => a.preset === filter.preset);
      }
      return all;
    },

    async update(
      id: string,
      patch: Partial<PandocDocumentAsset>,
    ): Promise<PandocDocumentAsset> {
      await ensureHydrated();
      const existing = store.get(id);
      if (!existing) throw new Error(`Pandoc asset ${id} not found.`);
      const updated = { ...existing, ...patch, id }; // id is immutable
      store.set(id, updated);
      await persist();
      return updated;
    },

    async delete(id: string): Promise<void> {
      await ensureHydrated();
      if (!store.delete(id)) {
        throw new Error(`Pandoc asset ${id} not found.`);
      }
      await persist();
    },
  };
}
