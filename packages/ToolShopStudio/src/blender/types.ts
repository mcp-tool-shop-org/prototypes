import type { BlenderPreset, BlenderRenderAsset } from "./schemas.js";

// ── CRUD interface ───────────────────────────────────────────────

export interface BlenderRenderCRUD {
  create(asset: BlenderRenderAsset): Promise<BlenderRenderAsset>;
  read(id: string): Promise<BlenderRenderAsset | null>;
  list(filter?: { preset?: BlenderPreset }): Promise<BlenderRenderAsset[]>;
  update(id: string, patch: Partial<BlenderRenderAsset>): Promise<BlenderRenderAsset>;
  delete(id: string): Promise<void>;
}

// ── Notification types ───────────────────────────────────────────

export interface BlenderReady {
  type: "blender:ready";
  assetId: string;
  outputPath: string;
  preset: BlenderPreset;
  sizeBytes: number;
}

export interface BlenderWarning {
  type: "blender:warning";
  assetId: string;
  warnings: string[];
  preset: BlenderPreset;
}

export interface BlenderProgress {
  type: "blender:progress";
  assetId: string;
  percent: number;
  preset: BlenderPreset;
}

export type BlenderNotification =
  | BlenderReady
  | BlenderWarning
  | BlenderProgress;

// ── Context DI ──────────────────────────────────────────────────
// Canonical RenderBlendContext lives in render.ts (Phase 3).
// Re-exported from the barrel via render.js.
