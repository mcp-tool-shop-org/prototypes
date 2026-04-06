import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RfError } from "@receipt-factory/core";
import type { PackManifest } from "./types.js";

/**
 * Read and verify an evidence pack from disk.
 *
 * Checks that every file in the manifest exists and its hash matches.
 * Throws RfError if the pack is missing, incomplete, or tampered.
 */
export function readEvidencePack(
  packDir: string,
): { manifest: PackManifest; data: unknown } {
  // Read manifest
  let manifestRaw: string;
  try {
    manifestRaw = readFileSync(join(packDir, "manifest.json"), "utf-8");
  } catch {
    throw new RfError({
      code: "RF_PACK_NOT_FOUND",
      message: `Evidence pack not found at ${packDir}`,
      hint: "Run 'rf collect' first to create an evidence pack",
    });
  }

  const manifest = JSON.parse(manifestRaw) as PackManifest;

  if (manifest.pack_version !== "1.0") {
    throw new RfError({
      code: "RF_PACK_UNSUPPORTED_VERSION",
      message: `Unsupported pack version: ${manifest.pack_version}`,
      hint: "This version of rf-evidence only supports pack_version 1.0",
    });
  }

  // Verify and read each file
  for (const [relPath, entry] of Object.entries(manifest.files)) {
    const absPath = join(packDir, relPath);
    let content: string;
    try {
      content = readFileSync(absPath, "utf-8");
    } catch {
      throw new RfError({
        code: "RF_PACK_FILE_MISSING",
        message: `Evidence file missing: ${relPath}`,
        hint: "The evidence pack may be incomplete or corrupted",
      });
    }

    // Verify size
    const actualSize = Buffer.byteLength(content, "utf-8");
    if (actualSize !== entry.size_bytes) {
      throw new RfError({
        code: "RF_PACK_SIZE_MISMATCH",
        message: `Size mismatch for ${relPath}: expected ${entry.size_bytes}, got ${actualSize}`,
        hint: "The evidence file may have been modified after collection",
      });
    }

    // Verify hash
    const actualDigest = createHash("sha256").update(content, "utf-8").digest("hex");
    if (actualDigest !== entry.digest) {
      throw new RfError({
        code: "RF_PACK_HASH_MISMATCH",
        message: `Hash mismatch for ${relPath}: expected ${entry.digest.slice(0, 12)}..., got ${actualDigest.slice(0, 12)}...`,
        hint: "The evidence file has been tampered with or corrupted",
      });
    }
  }

  // Read evidence data
  const dataRaw = readFileSync(join(packDir, "evidence", "data.json"), "utf-8");
  const data = JSON.parse(dataRaw) as unknown;

  return { manifest, data };
}
