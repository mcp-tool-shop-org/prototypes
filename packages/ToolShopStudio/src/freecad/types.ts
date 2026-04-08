import type { FreeCADPreset, FreeCADPartAsset } from "./schemas.js";

// ── Resource CRUD interface ───────────────────────────────────────

export interface FreeCADPartCRUD {
  create(asset: FreeCADPartAsset): Promise<FreeCADPartAsset>;
  read(id: string): Promise<FreeCADPartAsset | null>;
  list(filter?: { preset?: FreeCADPreset }): Promise<FreeCADPartAsset[]>;
  update(id: string, patch: Partial<FreeCADPartAsset>): Promise<FreeCADPartAsset>;
  delete(id: string): Promise<void>;
}

// ── Notification payloads ─────────────────────────────────────────

export interface FreeCADReady {
  type: "freecad:ready";
  assetId: string;
  outputPath: string;
  preset: FreeCADPreset;
  sizeBytes: number;
}

export interface FreeCADWarning {
  type: "freecad:warning";
  assetId: string;
  warnings: string[];
  preset: FreeCADPreset;
}

export interface FreeCADProgress {
  type: "freecad:progress";
  assetId: string;
  percent: number;
  preset: FreeCADPreset;
}

export type FreeCADNotification =
  | FreeCADReady
  | FreeCADWarning
  | FreeCADProgress;
