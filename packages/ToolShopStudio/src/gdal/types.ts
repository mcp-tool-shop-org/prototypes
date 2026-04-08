import type { GDALPreset, GDALGeoDataAsset } from "./schemas.js";

// ── Resource CRUD interface ───────────────────────────────────────

export interface GDALGeoDataCRUD {
  create(asset: GDALGeoDataAsset): Promise<GDALGeoDataAsset>;
  read(id: string): Promise<GDALGeoDataAsset | null>;
  list(filter?: { preset?: GDALPreset }): Promise<GDALGeoDataAsset[]>;
  update(id: string, patch: Partial<GDALGeoDataAsset>): Promise<GDALGeoDataAsset>;
  delete(id: string): Promise<void>;
}

// ── Notification payloads ─────────────────────────────────────────

export interface GDALReady {
  type: "gdal:ready";
  assetId: string;
  outputPath: string;
  preset: GDALPreset;
  sizeBytes: number;
}

export interface GDALWarning {
  type: "gdal:warning";
  assetId: string;
  warnings: string[];
  preset: GDALPreset;
}

export interface GDALProgress {
  type: "gdal:progress";
  assetId: string;
  percent: number;
  preset: GDALPreset;
}

export type GDALNotification =
  | GDALReady
  | GDALWarning
  | GDALProgress;
