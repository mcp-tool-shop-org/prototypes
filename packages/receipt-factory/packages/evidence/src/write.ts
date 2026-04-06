import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ReceiptKind } from "@receipt-factory/core";
import type { PackManifest } from "./types.js";

/**
 * Write an evidence pack to disk.
 *
 * Creates:
 *   <outputDir>/manifest.json
 *   <outputDir>/evidence/data.json
 *
 * The manifest includes a SHA-256 hash of each file for tamper detection.
 */
export function writeEvidencePack(
  outputDir: string,
  kind: ReceiptKind,
  source: string,
  data: unknown,
  collectorVersion = "1.2.0",
): PackManifest {
  const evidenceDir = join(outputDir, "evidence");
  mkdirSync(evidenceDir, { recursive: true });

  // Serialize evidence data
  const json = JSON.stringify(data, null, 2);
  const dataPath = join(evidenceDir, "data.json");
  writeFileSync(dataPath, json, "utf-8");

  // Compute hash and size
  const digest = createHash("sha256").update(json, "utf-8").digest("hex");
  const sizeBytes = Buffer.byteLength(json, "utf-8");

  const manifest: PackManifest = {
    pack_version: "1.0",
    kind,
    source,
    collected_at: new Date().toISOString(),
    collector_version: collectorVersion,
    files: {
      "evidence/data.json": {
        algorithm: "sha256",
        digest,
        size_bytes: sizeBytes,
      },
    },
  };

  writeFileSync(
    join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8",
  );

  return manifest;
}
