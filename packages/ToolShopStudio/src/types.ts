import type { Preset, YouTubeMediaAsset } from "./schemas.js";

// ── Resource CRUD interface ───────────────────────────────────────

export interface YouTubeMediaAssetCRUD {
  create(asset: YouTubeMediaAsset): Promise<YouTubeMediaAsset>;
  read(id: string): Promise<YouTubeMediaAsset | null>;
  list(filter?: { userId?: string }): Promise<YouTubeMediaAsset[]>;
  update(id: string, patch: Partial<YouTubeMediaAsset>): Promise<YouTubeMediaAsset>;
  delete(id: string): Promise<void>;
}

// ── Notification payloads ─────────────────────────────────────────

export interface YouTubeReady {
  type: "youtube:ready";
  assetId: string;
  outputPath: string;
  preset: Preset;
  durationSec: number;
  fileSizeBytes: number;
}

export interface YouTubeWarning {
  type: "youtube:warning";
  assetId: string;
  warnings: string[];
  preset: Preset;
}

export interface YouTubeProgress {
  type: "youtube:progress";
  assetId: string;
  percent: number;
  eta: number | null; // seconds remaining, null if unknown
  preset: Preset;
  warnings: string[];
}

export type YouTubeNotification =
  | YouTubeReady
  | YouTubeWarning
  | YouTubeProgress;
