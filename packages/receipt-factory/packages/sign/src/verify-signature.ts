import { existsSync } from "node:fs";
import { isCosignAvailable, verifyBlob } from "./cosign.js";
import type { VerifySignatureOptions } from "./types.js";

export interface SignatureVerificationCheck {
  name: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

/**
 * Verify the signature of a receipt.
 *
 * Looks for sidecar .sig (and optionally .cert) files next to the receipt.
 * Returns a check result compatible with the verify package.
 */
export async function verifySignature(
  receiptPath: string,
  opts: VerifySignatureOptions = {},
): Promise<SignatureVerificationCheck> {
  const sigPath = `${receiptPath}.sig`;
  const certPath = `${receiptPath}.cert`;

  if (!existsSync(sigPath)) {
    return {
      name: "signature",
      passed: false,
      message: "No signature file found (expected .sig sidecar)",
      details: { expected: sigPath },
    };
  }

  const available = await isCosignAvailable();
  if (!available) {
    return {
      name: "signature",
      passed: false,
      message: "cosign not available — cannot verify signature",
    };
  }

  const hasCert = existsSync(certPath);

  const valid = await verifyBlob(receiptPath, {
    keyPath: opts.keyPath,
    signaturePath: sigPath,
    certificatePath: hasCert ? certPath : undefined,
    certificateIdentity: opts.certificateIdentity,
    certificateOidcIssuer: opts.certificateOidcIssuer,
  });

  if (valid) {
    return {
      name: "signature",
      passed: true,
      message: "Signature verified via cosign",
    };
  }

  return {
    name: "signature",
    passed: false,
    message: "Signature verification failed — receipt may have been tampered with after signing",
  };
}
