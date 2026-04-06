import type { ReceiptKind } from "@receipt-factory/core";

/**
 * A single file entry in the evidence pack manifest.
 */
export interface PackFileEntry {
  algorithm: "sha256";
  digest: string;
  size_bytes: number;
}

/**
 * Evidence pack manifest — describes what's in the pack and how to verify it.
 */
export interface PackManifest {
  pack_version: "1.0";
  kind: ReceiptKind;
  source: string;
  collected_at: string;
  collector_version: string;
  files: Record<string, PackFileEntry>;
}
