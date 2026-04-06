import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { runCIPipeline, assemble as assembleCi } from "@receipt-factory/pipeline-ci";
import { runReleasePipeline, assemble as assembleRelease } from "@receipt-factory/pipeline-release";
import { assemble as assembleRegistrySync } from "@receipt-factory/pipeline-registry-sync";
import { assemble as assembleSecurityAudit } from "@receipt-factory/pipeline-security-audit";
import { assemble as assembleSbom } from "@receipt-factory/pipeline-sbom";
import { RfError, canonicalize } from "@receipt-factory/core";
import { renderMarkdown, renderHtml } from "@receipt-factory/render";
import { readEvidencePack } from "@receipt-factory/evidence";
import type { GitHubCIEvidence } from "@receipt-factory/adapter-github";
import type { GitHubReleaseEvidence } from "@receipt-factory/adapter-github";
import type { RegistrySyncEvidence } from "@receipt-factory/pipeline-registry-sync";
import type { SecurityAuditEvidence } from "@receipt-factory/pipeline-security-audit";
import type { SbomEvidence } from "@receipt-factory/pipeline-sbom";

export interface MakeOptions {
  from: string;
  run?: string;
  repo?: string;
  tag?: string;
  pack?: string;
  output?: string;
}

export async function handleMake(kind: string, opts: MakeOptions): Promise<void> {
  if (opts.from !== "github" && opts.from !== "evidence") {
    console.error(`Unknown source: ${opts.from}. Supported: github, evidence`);
    process.exit(1);
  }

  try {
    if (opts.from === "evidence") {
      await handleMakeFromEvidence(kind, opts);
    } else if (kind === "ci") {
      const result = await runCIPipeline(
        "github",
        { runId: opts.run, repo: opts.repo },
        opts.output ?? "receipts",
      );

      console.log(`Receipt created: ${result.receipt.id.slice(0, 12)}...`);
      console.log(`  JSON: ${result.files.json}`);
      console.log(`  MD:   ${result.files.md}`);
      console.log(`  HTML: ${result.files.html}`);
    } else if (kind === "release") {
      const result = await runReleasePipeline(
        "github",
        { repo: opts.repo, tag: opts.tag },
        opts.output ?? "receipts",
      );

      console.log(`Receipt created: ${result.receipt.id.slice(0, 12)}...`);
      console.log(`  JSON: ${result.files.json}`);
      console.log(`  MD:   ${result.files.md}`);
      console.log(`  HTML: ${result.files.html}`);
    } else if (kind === "registry-sync" || kind === "security-audit" || kind === "sbom") {
      // Supply chain kinds are evidence-only (no live API source yet)
      console.error(`"${kind}" receipts require --from evidence. Use: rf collect ${kind} ... first, then rf make ${kind} --from evidence --pack <dir>`);
      process.exit(1);
    } else {
      console.error(`Unknown receipt kind: ${kind}. Supported: ci, release, registry-sync, security-audit, sbom`);
      process.exit(1);
    }
  } catch (err) {
    if (err instanceof RfError) {
      console.error(err.toCliText());
      process.exit(2);
    }
    throw err;
  }
}

async function handleMakeFromEvidence(kind: string, opts: MakeOptions): Promise<void> {
  if (!opts.pack) {
    console.error("--pack <dir> is required when using --from evidence");
    process.exit(1);
  }

  const { manifest, data } = readEvidencePack(opts.pack);

  // Map CLI kind names to evidence pack kind values
  const kindMap: Record<string, string> = {
    ci: "ci_run",
    release: "release",
    "registry-sync": "registry_sync",
    "security-audit": "audit",
    sbom: "sbom",
  };
  const expectedKind = kindMap[kind] ?? kind;
  if (manifest.kind !== expectedKind) {
    console.error(
      `Evidence pack kind "${manifest.kind}" does not match requested kind "${kind}"`,
    );
    process.exit(1);
  }

  let receipt;
  if (kind === "ci") {
    receipt = assembleCi(data as GitHubCIEvidence);
  } else if (kind === "release") {
    receipt = assembleRelease(data as GitHubReleaseEvidence);
  } else if (kind === "registry-sync") {
    receipt = assembleRegistrySync(data as RegistrySyncEvidence);
  } else if (kind === "security-audit") {
    receipt = assembleSecurityAudit(data as SecurityAuditEvidence);
  } else if (kind === "sbom") {
    receipt = assembleSbom(data as SbomEvidence);
  } else {
    console.error(`Unknown receipt kind: ${kind}. Supported: ci, release, registry-sync, security-audit, sbom`);
    process.exit(1);
    return;
  }

  // Render
  const md = renderMarkdown(receipt);
  const html = renderHtml(receipt);
  const json = JSON.stringify(JSON.parse(canonicalize(receipt)), null, 2);

  // Write files
  const outputDir = opts.output ?? "receipts";
  const date = receipt.created_at.split("T")[0];
  const slug = kind === "ci"
    ? String((data as GitHubCIEvidence).run.id)
    : kind === "release"
      ? (data as GitHubReleaseEvidence).release.tag_name
      : receipt.id.slice(0, 12);
  const dir = join(outputDir, kind, date);
  mkdirSync(dir, { recursive: true });

  const basePath = join(dir, slug);
  const jsonPath = `${basePath}.json`;
  const mdPath = `${basePath}.md`;
  const htmlPath = `${basePath}.html`;

  writeFileSync(jsonPath, json, "utf-8");
  writeFileSync(mdPath, md, "utf-8");
  writeFileSync(htmlPath, html, "utf-8");

  console.log(`Receipt created from evidence pack: ${receipt.id.slice(0, 12)}...`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  MD:   ${mdPath}`);
  console.log(`  HTML: ${htmlPath}`);
}
