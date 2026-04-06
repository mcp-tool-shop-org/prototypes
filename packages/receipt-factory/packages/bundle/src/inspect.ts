import AdmZip from "adm-zip";
import { RfError } from "@receipt-factory/core";
import type { BundleManifest } from "./types.js";

/**
 * Inspect a bundle — read the manifest without full verification.
 *
 * This is a quick operation: open the zip, read manifest.json, return it.
 * No hash checks, no receipt verification, no extraction.
 */
export function inspectBundle(zipPath: string): BundleManifest {
  let zip: AdmZip;
  try {
    zip = new AdmZip(zipPath);
  } catch (err) {
    throw new RfError({
      code: "RF_BUNDLE_INVALID",
      message: `Failed to open bundle: ${zipPath}`,
      hint: "Ensure the file is a valid zip archive",
      cause: err instanceof Error ? err : undefined,
    });
  }

  const entry = zip.getEntry("manifest.json");
  if (!entry) {
    throw new RfError({
      code: "RF_BUNDLE_NO_MANIFEST",
      message: "Bundle is missing manifest.json",
      hint: "The file may not be a receipt bundle or may be corrupted",
    });
  }

  try {
    const raw = entry.getData().toString("utf-8");
    return JSON.parse(raw) as BundleManifest;
  } catch {
    throw new RfError({
      code: "RF_BUNDLE_NO_MANIFEST",
      message: "Failed to parse manifest.json in bundle",
      hint: "The bundle may be corrupted",
    });
  }
}
