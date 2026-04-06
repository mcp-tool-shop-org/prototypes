import { signReceipt, signPolicy } from "@receipt-factory/sign";

export interface SignOptions {
  keyless: boolean;
  key?: string;
  embed: boolean;
}

export async function handleSign(file: string, opts: SignOptions): Promise<void> {
  try {
    const result = await signReceipt(file, {
      keyless: opts.keyless,
      keyPath: opts.key,
      embed: opts.embed,
    });

    console.log(`Signed: ${file}`);
    console.log(`  Digest: ${result.digest}`);
    console.log(`  Signed at: ${result.signedAt}`);
    if (result.sidecarPaths?.signature) {
      console.log(`  Signature: ${result.sidecarPaths.signature}`);
    }
    if (result.sidecarPaths?.certificate) {
      console.log(`  Certificate: ${result.sidecarPaths.certificate}`);
    }
    if (opts.embed) {
      console.log(`  Embedded signature into receipt`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[RF_SIGN] ${message}`);
    process.exit(2);
  }
}

export interface SignPolicyOptions {
  keyless: boolean;
  key?: string;
}

export async function handleSignPolicy(
  file: string,
  opts: SignPolicyOptions,
): Promise<void> {
  try {
    const result = await signPolicy(file, {
      keyless: opts.keyless,
      keyPath: opts.key,
    });

    console.log(`Signed policy: ${file}`);
    console.log(`  Policy digest: ${result.digest}`);
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
