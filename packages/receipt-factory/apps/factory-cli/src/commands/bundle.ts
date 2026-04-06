import {
  createBundle,
  verifyBundle,
  inspectBundle,
} from "@receipt-factory/bundle";
import { signBundle } from "@receipt-factory/sign";

export interface BundleCreateOptions {
  follow?: boolean;
  includeEvidence?: boolean;
  policy?: string;
  out?: string;
  receiptsDir?: string;
}

export interface BundleVerifyOptions {
  strict?: boolean;
  requireBundleSignature?: boolean;
}

export interface BundleSignOptions {
  keyless: boolean;
  key?: string;
  out?: string;
}

/**
 * Handle `rf bundle create <receipt.json>` — create a bundle.
 */
export async function handleBundleCreate(
  file: string,
  opts: BundleCreateOptions,
): Promise<void> {
  try {
    const result = createBundle(file, {
      follow: opts.follow,
      includeEvidence: opts.includeEvidence,
      policy: opts.policy,
      output: opts.out,
      receiptsDir: opts.receiptsDir,
    });

    const receiptCount = result.manifest.contents.receipts.length;
    const fileCount = Object.keys(result.hashes.files).length;

    console.log(`✓ Bundle created: ${result.zipPath}`);
    console.log(`  ${receiptCount} receipt${receiptCount !== 1 ? "s" : ""}, ${fileCount} files hashed`);

    if (result.manifest.contents.policy) {
      console.log(`  Policy: ${result.manifest.contents.policy}`);
    }
    if (result.manifest.contents.signatures.length > 0) {
      console.log(`  ${result.manifest.contents.signatures.length} signature sidecar(s)`);
    }
  } catch (err) {
    if (err instanceof Error && "code" in err) {
      console.error(`[${(err as { code: string }).code}] ${err.message}`);
    } else {
      console.error(`[RF_BUNDLE] ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exit(1);
  }
}

/**
 * Handle `rf bundle verify <bundle.zip>` — verify a bundle.
 */
export async function handleBundleVerify(
  file: string,
  opts: BundleVerifyOptions,
): Promise<void> {
  try {
    const result = await verifyBundle(file, {
      strict: opts.strict,
      requireBundleSignature: opts.requireBundleSignature,
    });

    // Report signature check (if present)
    if (result.signatureCheck) {
      const icon = result.signatureCheck.passed ? "✓" : "✗";
      console.log(`Signature: ${icon} ${result.signatureCheck.message}`);
    }

    // Report hash checks
    const hashPassed = result.hashChecks.filter((c) => c.passed).length;
    const hashTotal = result.hashChecks.length;
    console.log(`Hash checks: ${hashPassed}/${hashTotal} passed`);

    for (const check of result.hashChecks) {
      const icon = check.passed ? "✓" : "✗";
      console.log(`  ${icon} ${check.file}: ${check.message}`);
    }

    // Report receipt checks
    const receiptPassed = result.receiptChecks.filter((c) => c.valid).length;
    const receiptTotal = result.receiptChecks.length;
    console.log(`Receipt checks: ${receiptPassed}/${receiptTotal} passed`);

    for (const check of result.receiptChecks) {
      const icon = check.valid ? "✓" : "✗";
      console.log(`  ${icon} ${check.file}: ${check.message}`);
    }

    // Overall result
    if (result.valid) {
      console.log("\n✓ Bundle verified");
    } else {
      console.log("\n✗ Bundle verification failed");
      process.exit(3);
    }
  } catch (err) {
    if (err instanceof Error && "code" in err) {
      console.error(`[${(err as { code: string }).code}] ${err.message}`);
    } else {
      console.error(`[RF_BUNDLE] ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exit(1);
  }
}

/**
 * Handle `rf bundle sign <bundle.zip>` — sign a bundle with cosign.
 */
export async function handleBundleSign(
  file: string,
  opts: BundleSignOptions,
): Promise<void> {
  try {
    const result = await signBundle(file, {
      keyless: opts.keyless,
      keyPath: opts.key,
    });

    console.log(`Signed bundle: ${file}`);
    console.log(`  Digest: ${result.digest}`);
    console.log(`  Signed at: ${result.signedAt}`);
    if (result.sidecarPaths?.signature) {
      console.log(`  Signature: ${result.sidecarPaths.signature}`);
    }
    if (result.sidecarPaths?.certificate) {
      console.log(`  Certificate: ${result.sidecarPaths.certificate}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[RF_SIGN] ${message}`);
    process.exit(2);
  }
}

/**
 * Handle `rf bundle inspect <bundle.zip>` — quick capsule summary.
 */
export function handleBundleInspect(file: string): void {
  try {
    const manifest = inspectBundle(file);

    console.log(`Bundle: ${file}`);
    console.log(`  Version: ${manifest.bundle_version}`);
    console.log(`  Created: ${manifest.created_at}`);
    console.log(`  Factory: ${manifest.factory_version}`);
    console.log(`  Root receipt: ${manifest.root_receipt}`);
    console.log(`  Receipts: ${manifest.contents.receipts.length}`);

    for (const r of manifest.contents.receipts) {
      console.log(`    - ${r}`);
    }

    if (manifest.contents.evidence.length > 0) {
      console.log(`  Evidence: ${manifest.contents.evidence.length} file(s)`);
    }

    if (manifest.contents.policy) {
      console.log(`  Policy: ${manifest.contents.policy}`);
    }

    if (manifest.contents.signatures.length > 0) {
      console.log(`  Signatures: ${manifest.contents.signatures.length}`);
    }
  } catch (err) {
    if (err instanceof Error && "code" in err) {
      console.error(`[${(err as { code: string }).code}] ${err.message}`);
    } else {
      console.error(`[RF_BUNDLE] ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exit(1);
  }
}
