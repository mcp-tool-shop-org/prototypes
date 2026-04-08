import type { OpenSCADPreset, OpenSCADModelAsset } from "./schemas.js";

// ── CRUD interface ───────────────────────────────────────────────

export interface OpenSCADModelCRUD {
  create(asset: OpenSCADModelAsset): Promise<OpenSCADModelAsset>;
  read(id: string): Promise<OpenSCADModelAsset | null>;
  list(filter?: { preset?: OpenSCADPreset }): Promise<OpenSCADModelAsset[]>;
  update(id: string, patch: Partial<OpenSCADModelAsset>): Promise<OpenSCADModelAsset>;
  delete(id: string): Promise<void>;
}

// ── Notification types ───────────────────────────────────────────

export interface OpenSCADReady {
  type: "openscad:ready";
  assetId: string;
  outputPath: string;
  preset: OpenSCADPreset;
  sizeBytes: number;
}

export interface OpenSCADWarning {
  type: "openscad:warning";
  assetId: string;
  warnings: string[];
  preset: OpenSCADPreset;
}

export interface OpenSCADProgress {
  type: "openscad:progress";
  assetId: string;
  percent: number;
  preset: OpenSCADPreset;
}

export type OpenSCADNotification =
  | OpenSCADReady
  | OpenSCADWarning
  | OpenSCADProgress;
