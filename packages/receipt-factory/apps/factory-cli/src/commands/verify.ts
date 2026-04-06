import { existsSync, readFileSync } from "node:fs";
import { dirname, extname } from "node:path";
import { verifyReceipt, formatResult } from "@receipt-factory/verify";
import { loadPolicy } from "@receipt-factory/policy";
import { verifyBlob } from "@receipt-factory/sign";
import { verifyBundle } from "@receipt-factory/bundle";

export interface VerifyOptions {
  offline: boolean;
  strict: boolean;
  follow?: boolean;
  refsStrict?: boolean;
  policy?: string;
  requirePolicySignature?: boolean;
  requireBundleSignature?: boolean;
  receiptsDir?: string;
}

export async function handleVerify(file: string, opts: VerifyOptions): Promise<void> {
  // Auto-detect bundles: if the file is a .zip, delegate to bundle verification
  if (extname(file).toLowerCase() === ".zip") {
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

      const hashPassed = result.hashChecks.filter((c) => c.passed).length;
      const hashTotal = result.hashChecks.length;
      console.log(`Hash checks: ${hashPassed}/${hashTotal} passed`);

      for (const check of result.hashChecks) {
        const icon = check.passed ? "✓" : "✗";
        console.log(`  ${icon} ${check.file}: ${check.message}`);
      }

      const receiptPassed = result.receiptChecks.filter((c) => c.valid).length;
      const receiptTotal = result.receiptChecks.length;
      console.log(`Receipt checks: ${receiptPassed}/${receiptTotal} passed`);

      for (const check of result.receiptChecks) {
        const icon = check.valid ? "✓" : "✗";
        console.log(`  ${icon} ${check.file}: ${check.message}`);
      }

      if (result.valid) {
        console.log("\n✓ Bundle verified");
      } else {
        console.log("\n✗ Bundle verification failed");
        process.exit(3);
      }
      return;
    } catch (err) {
      if (err instanceof Error && "code" in err) {
        console.error(`[${(err as { code: string }).code}] ${err.message}`);
      } else {
        console.error(`[RF_BUNDLE] ${err instanceof Error ? err.message : String(err)}`);
      }
      process.exit(1);
      return;
    }
  }

  try {
    const raw = readFileSync(file, "utf-8");
    const receipt = JSON.parse(raw) as Record<string, unknown>;

    // Load policy rules if a policy file is specified
    const policyRules = opts.policy
      ? loadPolicy(opts.policy).rules
      : undefined;

    // Verify policy signature if required
    if (opts.requirePolicySignature) {
      if (!opts.policy) {
        console.error("[RF_VERIFY] --require-policy-signature requires --policy <path>");
        process.exit(1);
        return;
      }

      const sigPath = `${opts.policy}.sig`;
      if (!existsSync(sigPath)) {
        console.error(`[RF_VERIFY] Policy signature not found: ${sigPath}`);
        console.error("  Sign the policy with: rf policy sign policy.json --keyless");
        process.exit(3);
        return;
      }

      const sigValid = await verifyBlob(opts.policy, { signaturePath: sigPath });
      if (!sigValid) {
        console.error("[RF_VERIFY] Policy signature verification failed");
        process.exit(3);
        return;
      }

      console.log("✓ Policy signature verified");
    }

    // Default receiptsDir to the parent of the receipt file
    const receiptsDir = opts.receiptsDir ?? dirname(file);

    const result = await verifyReceipt(receipt, {
      offline: opts.offline,
      strict: opts.strict,
      follow: opts.follow,
      refsStrict: opts.refsStrict,
      policy: policyRules,
      receiptsDir,
    });
    console.log(formatResult(result));

    if (!result.valid) {
      process.exit(3);
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error(`[RF_PARSE] Failed to parse ${file}: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
