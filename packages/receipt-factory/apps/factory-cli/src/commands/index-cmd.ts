import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildIndex } from "@receipt-factory/index";

export interface IndexOptions {
  output?: string;
  validate?: boolean;
}

export async function handleIndex(dir: string, opts: IndexOptions): Promise<void> {
  const receiptsDir = dir || "receipts";
  const outputPath = opts.output ?? join(receiptsDir, "index.json");

  const index = await buildIndex(receiptsDir, {
    validate: opts.validate ?? false,
  });

  writeFileSync(outputPath, JSON.stringify(index, null, 2), "utf-8");

  console.log(`Index written: ${outputPath}`);
  console.log(`  Receipts: ${index.count}`);
  if (opts.validate) {
    const valid = index.receipts.filter((r) => r.valid).length;
    const invalid = index.count - valid;
    console.log(`  Valid: ${valid}, Invalid: ${invalid}`);
  }
}
