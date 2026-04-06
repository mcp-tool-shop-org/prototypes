import { collect as collectCI } from "@receipt-factory/pipeline-ci";
import { collect as collectRelease } from "@receipt-factory/pipeline-release";
import { writeEvidencePack } from "@receipt-factory/evidence";
import { RfError } from "@receipt-factory/core";
import { join } from "node:path";

export interface CollectOptions {
  from: string;
  run?: string;
  repo?: string;
  tag?: string;
  output?: string;
}

export async function handleCollect(kind: string, opts: CollectOptions): Promise<void> {
  if (opts.from !== "github") {
    console.error(`Unknown source: ${opts.from}. Supported: github`);
    process.exit(1);
  }

  try {
    const date = new Date().toISOString().split("T")[0];

    if (kind === "ci") {
      const evidence = await collectCI("github", { runId: opts.run, repo: opts.repo });
      const baseDir = opts.output ?? "evidence";
      const packDir = join(baseDir, "ci", date, String(evidence.run.id));
      const manifest = writeEvidencePack(packDir, "ci_run", "github", evidence);

      console.log(`Evidence pack written: ${packDir}`);
      console.log(`  Kind: ${manifest.kind}`);
      console.log(`  Source: ${manifest.source}`);
      console.log(`  Files: ${Object.keys(manifest.files).length}`);
    } else if (kind === "release") {
      const evidence = await collectRelease("github", { repo: opts.repo, tag: opts.tag });
      const baseDir = opts.output ?? "evidence";
      const tag = evidence.release.tag_name;
      const packDir = join(baseDir, "release", date, tag);
      const manifest = writeEvidencePack(packDir, "release", "github", evidence);

      console.log(`Evidence pack written: ${packDir}`);
      console.log(`  Kind: ${manifest.kind}`);
      console.log(`  Source: ${manifest.source}`);
      console.log(`  Files: ${Object.keys(manifest.files).length}`);
    } else if (kind === "registry-sync" || kind === "security-audit" || kind === "sbom") {
      console.error(
        `"${kind}" collection is not yet automated. Write evidence JSON manually, then:\n` +
        `  rf make ${kind} --from evidence --pack <dir>`,
      );
      process.exit(1);
    } else {
      console.error(`Unknown kind: ${kind}. Supported: ci, release, registry-sync, security-audit, sbom`);
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
