import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderMarkdown, renderHtml } from "@receipt-factory/render";
import { canonicalize } from "@receipt-factory/core";
import type { Receipt } from "@receipt-factory/core";
import { collect, type ReleaseFetchOptions } from "./collect.js";
import { assemble } from "./assemble.js";

export interface PipelineResult {
  receipt: Receipt;
  files: {
    json: string;
    md: string;
    html: string;
  };
}

/**
 * Run the release receipts pipeline end-to-end:
 * collect → assemble → render → write
 */
export async function runReleasePipeline(
  source: "github",
  opts: ReleaseFetchOptions = {},
  outputDir = "receipts",
): Promise<PipelineResult> {
  // 1. Collect evidence
  const evidence = await collect(source, opts);

  // 2. Assemble receipt
  const receipt = assemble(evidence);

  // 3. Render
  const md = renderMarkdown(receipt);
  const html = renderHtml(receipt);
  const json = JSON.stringify(JSON.parse(canonicalize(receipt)), null, 2);

  // 4. Write files
  const date = (evidence.release.published_at || evidence.release.created_at).split("T")[0];
  const tag = evidence.release.tag_name;
  const dir = join(outputDir, "release", date);
  mkdirSync(dir, { recursive: true });

  const basePath = join(dir, tag);
  const jsonPath = `${basePath}.json`;
  const mdPath = `${basePath}.md`;
  const htmlPath = `${basePath}.html`;

  writeFileSync(jsonPath, json, "utf-8");
  writeFileSync(mdPath, md, "utf-8");
  writeFileSync(htmlPath, html, "utf-8");

  return {
    receipt,
    files: { json: jsonPath, md: mdPath, html: htmlPath },
  };
}
