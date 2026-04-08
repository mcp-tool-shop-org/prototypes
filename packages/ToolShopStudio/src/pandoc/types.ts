import type { PandocPreset, PandocDocumentAsset } from "./schemas.js";

// ── Resource CRUD interface ───────────────────────────────────────

export interface PandocDocumentCRUD {
  create(asset: PandocDocumentAsset): Promise<PandocDocumentAsset>;
  read(id: string): Promise<PandocDocumentAsset | null>;
  list(filter?: { preset?: PandocPreset }): Promise<PandocDocumentAsset[]>;
  update(id: string, patch: Partial<PandocDocumentAsset>): Promise<PandocDocumentAsset>;
  delete(id: string): Promise<void>;
}

// ── Notification payloads ─────────────────────────────────────────

export interface PandocReady {
  type: "pandoc:ready";
  assetId: string;
  outputPath: string;
  preset: PandocPreset;
  sizeBytes: number;
}

export interface PandocWarning {
  type: "pandoc:warning";
  assetId: string;
  warnings: string[];
  preset: PandocPreset;
}

export interface PandocProgress {
  type: "pandoc:progress";
  assetId: string;
  percent: number;
  preset: PandocPreset;
}

export type PandocNotification =
  | PandocReady
  | PandocWarning
  | PandocProgress;
