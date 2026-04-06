import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { RfError } from "@receipt-factory/core";

const execFileAsync = promisify(execFile);

/**
 * Check if `cosign` CLI is available.
 */
export async function isCosignAvailable(): Promise<boolean> {
  try {
    await execFileAsync("cosign", ["version"]);
    return true;
  } catch {
    return false;
  }
}

export interface SignBlobOptions {
  keyless?: boolean;
  keyPath?: string;
  outputSignature?: string;
  outputCertificate?: string;
}

export interface SignBlobResult {
  signature: string;
  certificate?: string;
}

/**
 * Sign a blob (file) using cosign.
 *
 * In keyless mode, uses OIDC token exchange via Sigstore Fulcio + Rekor.
 * In key mode, uses the provided private key.
 */
export async function signBlob(
  filePath: string,
  opts: SignBlobOptions = {},
): Promise<SignBlobResult> {
  const args = ["sign-blob", filePath];

  if (opts.keyless) {
    args.push("--yes");
  } else if (opts.keyPath) {
    args.push("--key", opts.keyPath);
  } else {
    throw new RfError({
      code: "RF_SIGN_CONFIG",
      message: "Either --keyless or --key must be specified",
      hint: "Use --keyless in CI (requires OIDC token) or --key <path> locally",
    });
  }

  if (opts.outputSignature) {
    args.push("--output-signature", opts.outputSignature);
  }
  if (opts.outputCertificate) {
    args.push("--output-certificate", opts.outputCertificate);
  }

  // If no output paths, capture from stdout
  if (!opts.outputSignature) {
    args.push("--output-signature", "/dev/stdout");
  }

  try {
    const { stdout } = await execFileAsync("cosign", args, {
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        COSIGN_EXPERIMENTAL: "1",
      },
    });

    return {
      signature: stdout.trim(),
      certificate: opts.outputCertificate ? undefined : undefined,
    };
  } catch (err) {
    throw new RfError({
      code: "RF_COSIGN_SIGN",
      message: `cosign sign-blob failed for ${filePath}`,
      hint: "Is cosign installed? Run: cosign version. For keyless, ensure OIDC token is available (CI: id-token: write permission)",
      cause: err instanceof Error ? err : new Error(String(err)),
    });
  }
}

export interface VerifyBlobOptions {
  keyPath?: string;
  signaturePath: string;
  certificatePath?: string;
  certificateIdentity?: string;
  certificateOidcIssuer?: string;
}

/**
 * Verify a blob signature using cosign.
 */
export async function verifyBlob(
  filePath: string,
  opts: VerifyBlobOptions,
): Promise<boolean> {
  const args = ["verify-blob", filePath, "--signature", opts.signaturePath];

  if (opts.keyPath) {
    args.push("--key", opts.keyPath);
  } else if (opts.certificatePath) {
    args.push("--certificate", opts.certificatePath);
    if (opts.certificateIdentity) {
      args.push("--certificate-identity", opts.certificateIdentity);
    }
    if (opts.certificateOidcIssuer) {
      args.push(
        "--certificate-oidc-issuer",
        opts.certificateOidcIssuer,
      );
    }
  }

  try {
    await execFileAsync("cosign", args, {
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        COSIGN_EXPERIMENTAL: "1",
      },
    });
    return true;
  } catch {
    return false;
  }
}
