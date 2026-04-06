import { createHash } from "node:crypto";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import AdmZip from "adm-zip";
import { RfError } from "@receipt-factory/core";
import { isCosignAvailable, verifyBlob } from "@receipt-factory/sign";
import { verifyReceipt } from "@receipt-factory/verify";
import type {
  BundleManifest,
  BundleHashes,
  VerifyBundleOptions,
  VerifyBundleResult,
  BundleHashCheck,
  BundleReceiptCheck,
  BundleSignatureCheck,
} from "./types.js";

/**
 * Verify a receipt bundle — check signature, extract, check hashes, verify each receipt.
 *
 * Verification order:
 * 1. Bundle signature (if requireBundleSignature)
 * 2. File integrity (hashes.json)
 * 3. Semantic integrity (receipt verification)
 *
 * Bundle-internal semantics: reference resolution happens ONLY within
 * the bundle. No network access, no filesystem wandering.
 */
export async function verifyBundle(
  zipPath: string,
  opts: VerifyBundleOptions = {},
): Promise<VerifyBundleResult> {
  // Step 0: Bundle-level signature verification (before unpacking)
  let signatureCheck: BundleSignatureCheck | undefined;

  if (opts.requireBundleSignature) {
    signatureCheck = await verifyBundleSignature(zipPath);

    // If signature fails, return early — no point unpacking a bundle
    // whose provenance can't be established
    if (!signatureCheck.passed) {
      // We still need manifest for the result shape, so open the zip just for that
      let manifest: BundleManifest;
      try {
        const zip = new AdmZip(zipPath);
        manifest = readBundleJson<BundleManifest>(zip, "manifest.json", "RF_BUNDLE_NO_MANIFEST");
      } catch {
        manifest = {
          bundle_version: "1.0",
          created_at: "",
          root_receipt: "",
          factory_version: "",
          contents: { receipts: [], evidence: [], signatures: [] },
        };
      }

      return {
        valid: false,
        manifest,
        signatureCheck,
        hashChecks: [],
        receiptChecks: [],
      };
    }
  }

  // Open the zip
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

  // Extract to a temporary directory
  const tempDir = join(tmpdir(), `rf-bundle-${randomBytes(8).toString("hex")}`);
  mkdirSync(tempDir, { recursive: true });

  try {
    zip.extractAllTo(tempDir, true);

    // 1. Read and validate manifest.json
    const manifest = readBundleJson<BundleManifest>(zip, "manifest.json", "RF_BUNDLE_NO_MANIFEST");

    if (manifest.bundle_version !== "1.0") {
      throw new RfError({
        code: "RF_BUNDLE_UNSUPPORTED_VERSION",
        message: `Unsupported bundle version: ${manifest.bundle_version}`,
        hint: "This version of rf-bundle only supports bundle_version 1.0",
      });
    }

    // 2. Read hashes.json and verify every file
    const hashes = readBundleJson<BundleHashes>(zip, "hashes.json", "RF_BUNDLE_NO_HASHES");

    const hashChecks: BundleHashCheck[] = [];
    for (const [filePath, expectedHash] of Object.entries(hashes.files)) {
      const entry = zip.getEntry(filePath);
      if (!entry) {
        hashChecks.push({
          file: filePath,
          passed: false,
          message: `File missing from bundle: ${filePath}`,
        });
        continue;
      }

      const content = entry.getData();
      const actualHash = createHash("sha256").update(content).digest("hex");

      if (actualHash !== expectedHash) {
        hashChecks.push({
          file: filePath,
          passed: false,
          message: `Hash mismatch: expected ${expectedHash.slice(0, 16)}…, got ${actualHash.slice(0, 16)}…`,
        });
      } else {
        hashChecks.push({
          file: filePath,
          passed: true,
          message: "Hash verified",
        });
      }
    }

    // 3. Verify each receipt within the bundle
    const receiptChecks: BundleReceiptCheck[] = [];
    const receiptsDir = join(tempDir, "receipts");

    for (const receiptFile of manifest.contents.receipts) {
      const entry = zip.getEntry(receiptFile);
      if (!entry) {
        receiptChecks.push({
          file: receiptFile,
          valid: false,
          message: `Receipt missing from bundle: ${receiptFile}`,
        });
        continue;
      }

      try {
        const raw = entry.getData().toString("utf-8");
        const receipt = JSON.parse(raw) as Record<string, unknown>;

        // Verify with bundle-internal resolution:
        // - offline: true (no network)
        // - receiptsDir: bundle's receipts/ directory
        // - follow: false (we verify each receipt individually)
        // - strict: from options
        const result = await verifyReceipt(receipt, {
          offline: true,
          strict: opts.strict ?? false,
          follow: false,
          receiptsDir,
        });

        receiptChecks.push({
          file: receiptFile,
          valid: result.valid,
          message: result.valid
            ? "Receipt verified"
            : `${result.checks.filter((c) => !c.passed).length} check(s) failed`,
        });
      } catch (err) {
        receiptChecks.push({
          file: receiptFile,
          valid: false,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Compute overall validity
    const hashesValid = hashChecks.every((c) => c.passed);
    const receiptsValid = receiptChecks.every((c) => c.valid);
    const sigValid = signatureCheck ? signatureCheck.passed : true;
    const valid = sigValid && hashesValid && receiptsValid;

    return {
      valid,
      manifest,
      ...(signatureCheck ? { signatureCheck } : {}),
      hashChecks,
      receiptChecks,
    };
  } finally {
    // Clean up temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Verify the detached signature of a bundle zip.
 *
 * Looks for sidecar .sig file next to the bundle.
 * The zip contents are never inspected — this verifies the zip artifact itself.
 */
async function verifyBundleSignature(
  zipPath: string,
): Promise<BundleSignatureCheck> {
  const sigPath = `${zipPath}.sig`;
  const certPath = `${zipPath}.cert`;

  if (!existsSync(sigPath)) {
    return {
      passed: false,
      message: `Bundle signature not found: ${sigPath}`,
    };
  }

  const available = await isCosignAvailable();
  if (!available) {
    return {
      passed: false,
      message: "cosign not available — cannot verify bundle signature",
    };
  }

  const hasCert = existsSync(certPath);

  const valid = await verifyBlob(zipPath, {
    signaturePath: sigPath,
    certificatePath: hasCert ? certPath : undefined,
  });

  if (valid) {
    return {
      passed: true,
      message: "Bundle signature verified via cosign",
    };
  }

  return {
    passed: false,
    message: "Bundle signature verification failed — bundle may have been tampered with after signing",
  };
}

/**
 * Read and parse a JSON file from within a zip archive.
 */
function readBundleJson<T>(zip: AdmZip, path: string, errorCode: string): T {
  const entry = zip.getEntry(path);
  if (!entry) {
    throw new RfError({
      code: errorCode,
      message: `Bundle is missing ${path}`,
      hint: "The bundle may be corrupted or was not created with 'rf bundle'",
    });
  }

  try {
    const raw = entry.getData().toString("utf-8");
    return JSON.parse(raw) as T;
  } catch {
    throw new RfError({
      code: errorCode,
      message: `Failed to parse ${path} in bundle`,
      hint: "The bundle may be corrupted",
    });
  }
}
