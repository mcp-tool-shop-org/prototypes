import { createHash } from "node:crypto";
import { readFileSync, existsSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import AdmZip from "adm-zip";
import { RfError, computeDigest } from "@receipt-factory/core";
import type {
  BundleManifest,
  BundleHashes,
  CreateBundleOptions,
  CreateBundleResult,
} from "./types.js";

const FACTORY_VERSION = "1.7.2";

interface Reference {
  kind: "receipt" | "evidence_pack";
  hash: string;
  description: string;
  path?: string;
  url?: string;
}

/**
 * Create a receipt bundle — a portable, self-verifying zip archive.
 *
 * The bundle contains:
 * - receipts/root.json — the primary receipt
 * - receipts/<hash>.json — referenced receipts (if --follow)
 * - evidence/ — evidence packs (if --include-evidence)
 * - policy/ — policy file + signatures (if --policy)
 * - signatures/ — receipt signature sidecars
 * - manifest.json — bundle metadata
 * - hashes.json — SHA-256 of every file for tamper-evidence
 * - VERIFY.md — human-readable verification instructions
 */
export function createBundle(
  receiptPath: string,
  opts: CreateBundleOptions = {},
): CreateBundleResult {
  // Read the root receipt
  let rootRaw: string;
  try {
    rootRaw = readFileSync(receiptPath, "utf-8");
  } catch {
    throw new RfError({
      code: "RF_BUNDLE_NOT_FOUND",
      message: `Receipt file not found: ${receiptPath}`,
      hint: "Provide a path to a valid receipt JSON file",
    });
  }

  let rootReceipt: Record<string, unknown>;
  try {
    rootReceipt = JSON.parse(rootRaw) as Record<string, unknown>;
  } catch {
    throw new RfError({
      code: "RF_BUNDLE_INVALID_RECEIPT",
      message: `Receipt is not valid JSON: ${receiptPath}`,
      hint: "Use 'rf make' to create a valid receipt",
    });
  }

  const zip = new AdmZip();

  // Track all files added (path within zip → content) for hash computation
  const fileContents = new Map<string, Buffer>();

  // 1. Add root receipt
  const rootContent = Buffer.from(rootRaw, "utf-8");
  zip.addFile("receipts/root.json", rootContent);
  fileContents.set("receipts/root.json", rootContent);

  // Track receipt paths and evidence paths for manifest
  const receiptPaths: string[] = ["receipts/root.json"];
  const evidencePaths: string[] = [];
  const signaturePaths: string[] = [];
  let policyPath: string | undefined;

  // Add root receipt signatures if they exist
  const rootDir = dirname(receiptPath);
  const rootBase = basename(receiptPath);
  addSignatureSidecars(zip, fileContents, signaturePaths, rootDir, rootBase, "receipts/root");

  // 2. Follow references and collect referenced receipts
  if (opts.follow) {
    const receiptsDir = opts.receiptsDir ?? rootDir;
    const visited = new Set<string>();
    collectReferences(
      rootReceipt,
      receiptsDir,
      zip,
      fileContents,
      receiptPaths,
      evidencePaths,
      signaturePaths,
      visited,
      opts,
    );
  }

  // 3. Include evidence packs if requested
  if (opts.includeEvidence) {
    const receiptsDir = opts.receiptsDir ?? rootDir;
    collectEvidence(
      rootReceipt,
      receiptsDir,
      zip,
      fileContents,
      evidencePaths,
    );
  }

  // 4. Include policy file if specified
  if (opts.policy) {
    if (!existsSync(opts.policy)) {
      throw new RfError({
        code: "RF_BUNDLE_POLICY_NOT_FOUND",
        message: `Policy file not found: ${opts.policy}`,
        hint: "Use 'rf policy init' to create a policy file",
      });
    }

    const policyContent = readFileSync(opts.policy);
    zip.addFile("policy/policy.json", policyContent);
    fileContents.set("policy/policy.json", policyContent);
    policyPath = "policy/policy.json";

    // Add policy signature sidecars if they exist
    const policyDir = dirname(opts.policy);
    const policyBase = basename(opts.policy);
    addSignatureSidecars(zip, fileContents, signaturePaths, policyDir, policyBase, "policy/policy");
  }

  // 5. Compute hashes for all files
  const hashes: BundleHashes = {
    algorithm: "sha256",
    files: {},
  };
  for (const [path, content] of fileContents) {
    hashes.files[path] = createHash("sha256").update(content).digest("hex");
  }

  // 6. Build manifest
  const manifest: BundleManifest = {
    bundle_version: "1.0",
    created_at: new Date().toISOString(),
    root_receipt: "receipts/root.json",
    factory_version: FACTORY_VERSION,
    contents: {
      receipts: receiptPaths,
      evidence: evidencePaths,
      policy: policyPath,
      signatures: signaturePaths,
    },
  };

  // 7. Add manifest and hashes to zip (hash them too)
  const manifestContent = Buffer.from(JSON.stringify(manifest, null, 2), "utf-8");
  zip.addFile("manifest.json", manifestContent);
  hashes.files["manifest.json"] = createHash("sha256").update(manifestContent).digest("hex");

  const hashesContent = Buffer.from(JSON.stringify(hashes, null, 2), "utf-8");
  zip.addFile("hashes.json", hashesContent);
  // hashes.json is NOT in hashes.json — it can't hash itself

  // 8. Generate and add VERIFY.md
  const verifyMd = generateVerifyMd(manifest);
  const verifyContent = Buffer.from(verifyMd, "utf-8");
  zip.addFile("VERIFY.md", verifyContent);
  hashes.files["VERIFY.md"] = createHash("sha256").update(verifyContent).digest("hex");

  // 9. Determine output path
  const rootId = (rootReceipt.id as string) ?? computeDigest(rootReceipt);
  const shortHash = rootId.slice(0, 16);
  const outputPath = opts.output ?? `bundles/${shortHash}.bundle.zip`;

  // Ensure output directory exists
  const outputDir = dirname(outputPath);
  if (outputDir && outputDir !== ".") {
    mkdirSync(outputDir, { recursive: true });
  }

  zip.writeZip(outputPath);

  return { zipPath: outputPath, manifest, hashes };
}

/**
 * Add signature sidecar files (.sig, .cert) if they exist alongside a file.
 */
function addSignatureSidecars(
  zip: AdmZip,
  fileContents: Map<string, Buffer>,
  signaturePaths: string[],
  sourceDir: string,
  sourceBase: string,
  targetPrefix: string,
): void {
  for (const ext of [".sig", ".cert"]) {
    const sidecarPath = join(sourceDir, sourceBase + ext);
    if (existsSync(sidecarPath)) {
      const content = readFileSync(sidecarPath);
      const zipPath = `signatures/${targetPrefix.replace(/\//g, "_")}${ext}`;
      zip.addFile(zipPath, content);
      fileContents.set(zipPath, content);
      signaturePaths.push(zipPath);
    }
  }
}

/**
 * Recursively collect referenced receipts and add them to the bundle.
 */
function collectReferences(
  receipt: Record<string, unknown>,
  receiptsDir: string,
  zip: AdmZip,
  fileContents: Map<string, Buffer>,
  receiptPaths: string[],
  evidencePaths: string[],
  signaturePaths: string[],
  visited: Set<string>,
  opts: CreateBundleOptions,
  depth = 0,
  maxDepth = 5,
): void {
  if (depth >= maxDepth) return;

  const references = receipt.references as Reference[] | undefined;
  if (!references || references.length === 0) return;

  for (const ref of references) {
    if (visited.has(ref.hash)) continue;
    visited.add(ref.hash);

    if (ref.kind === "receipt" && ref.path) {
      const absPath = join(receiptsDir, ref.path);
      if (!existsSync(absPath)) continue;

      let raw: string;
      try {
        raw = readFileSync(absPath, "utf-8");
      } catch {
        continue;
      }

      const shortHash = ref.hash.slice(0, 16);
      const zipPath = `receipts/${shortHash}.json`;

      // Avoid duplicate entries
      if (fileContents.has(zipPath)) continue;

      const content = Buffer.from(raw, "utf-8");
      zip.addFile(zipPath, content);
      fileContents.set(zipPath, content);
      receiptPaths.push(zipPath);

      // Add signatures for this receipt
      const refDir = dirname(absPath);
      const refBase = basename(absPath);
      addSignatureSidecars(zip, fileContents, signaturePaths, refDir, refBase, `receipts/${shortHash}`);

      // Recurse into this receipt's references
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        collectReferences(
          parsed,
          receiptsDir,
          zip,
          fileContents,
          receiptPaths,
          evidencePaths,
          signaturePaths,
          visited,
          opts,
          depth + 1,
          maxDepth,
        );
      } catch {
        // Skip invalid JSON — just don't recurse
      }
    }
  }
}

/**
 * Collect evidence packs from receipt outputs/evidence and add to bundle.
 * Looks for evidence/ directories in the same directory as the receipt.
 */
function collectEvidence(
  receipt: Record<string, unknown>,
  receiptsDir: string,
  zip: AdmZip,
  fileContents: Map<string, Buffer>,
  evidencePaths: string[],
): void {
  // Look for evidence directories referenced by receipts
  const evidence = receipt.evidence as Array<{ type: string; url?: string }> | undefined;
  if (!evidence) return;

  // Check for a local evidence/ directory alongside the receipts
  const evidenceDir = join(receiptsDir, "evidence");
  if (existsSync(evidenceDir) && statSync(evidenceDir).isDirectory()) {
    addDirectoryToZip(zip, fileContents, evidencePaths, evidenceDir, "evidence");
  }
}

/**
 * Recursively add a directory's files to the zip.
 */
function addDirectoryToZip(
  zip: AdmZip,
  fileContents: Map<string, Buffer>,
  trackedPaths: string[],
  sourceDir: string,
  zipPrefix: string,
): void {
  const entries = readdirSync(sourceDir);
  for (const entry of entries) {
    const fullPath = join(sourceDir, entry);
    const stat = statSync(fullPath);
    const zipPath = `${zipPrefix}/${entry}`;

    if (stat.isDirectory()) {
      addDirectoryToZip(zip, fileContents, trackedPaths, fullPath, zipPath);
    } else {
      const content = readFileSync(fullPath);
      zip.addFile(zipPath, content);
      fileContents.set(zipPath, content);
      trackedPaths.push(zipPath);
    }
  }
}

/**
 * Generate the VERIFY.md file for a bundle.
 */
function generateVerifyMd(manifest: BundleManifest): string {
  const receiptCount = manifest.contents.receipts.length;
  const evidenceCount = manifest.contents.evidence.length;
  const hasPolicy = !!manifest.contents.policy;
  const sigCount = manifest.contents.signatures.length;

  const lines: string[] = [
    "# How to Verify This Bundle",
    "",
    "This bundle is a portable truth capsule containing:",
    "",
    `- **${receiptCount}** receipt${receiptCount !== 1 ? "s" : ""} (root: \`${manifest.root_receipt}\`)`,
  ];

  if (evidenceCount > 0) {
    lines.push(`- **${evidenceCount}** evidence file${evidenceCount !== 1 ? "s" : ""}`);
  }
  if (hasPolicy) {
    lines.push(`- Policy: \`${manifest.contents.policy}\``);
  }
  if (sigCount > 0) {
    lines.push(`- **${sigCount}** signature sidecar${sigCount !== 1 ? "s" : ""}`);
  }

  lines.push(
    "",
    `Created: ${manifest.created_at}`,
    `Factory version: ${manifest.factory_version}`,
    "",
    "## Automated Verification",
    "",
    "```bash",
    "rf bundle verify <this-bundle.zip>",
    "```",
    "",
    "Or equivalently:",
    "",
    "```bash",
    "rf verify <this-bundle.zip>",
    "```",
    "",
    "## Manual Verification",
    "",
    "1. Extract the zip archive",
    "2. Read `hashes.json` — compute SHA-256 of every listed file and compare",
    "3. Read `manifest.json` — confirm the root receipt and contents",
    "4. For each receipt in `receipts/`: run `rf verify <receipt.json> --offline`",
    "5. Cross-check that receipt references point to files inside the bundle",
    "",
    "## Bundle-Internal Semantics",
    "",
    "This bundle is self-contained. Verification resolves references only within",
    "the bundle — no network access, no filesystem wandering. If a referenced",
    "receipt is not in the bundle, the reference check reports it as unresolvable.",
    "",
  );

  return lines.join("\n");
}
