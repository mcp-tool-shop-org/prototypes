import { readFileSync } from "node:fs";
import { searchIndex } from "@receipt-factory/index";
import type { ReceiptIndex, SearchFilter } from "@receipt-factory/index";
import type { ReceiptKind } from "@receipt-factory/core";

export interface SearchOptions {
  kind?: string;
  repo?: string;
  since?: string;
  until?: string;
  index?: string;
}

export async function handleSearch(opts: SearchOptions): Promise<void> {
  const indexPath = opts.index ?? "receipts/index.json";

  let raw: string;
  try {
    raw = readFileSync(indexPath, "utf-8");
  } catch {
    console.error(`Index not found at ${indexPath}. Run 'rf index' first.`);
    process.exit(1);
    return;
  }

  const index = JSON.parse(raw) as ReceiptIndex;

  const filter: SearchFilter = {};
  if (opts.kind) filter.kind = opts.kind as ReceiptKind;
  if (opts.repo) filter.repo = opts.repo;
  if (opts.since) filter.since = opts.since;
  if (opts.until) filter.until = opts.until;

  const results = searchIndex(index, filter);

  if (results.length === 0) {
    console.log("No receipts found matching the filter.");
    return;
  }

  console.log(`Found ${results.length} receipt(s):\n`);

  for (const entry of results) {
    console.log(`  ${entry.id.slice(0, 12)}...  ${entry.kind.padEnd(10)}  ${entry.created_at.split("T")[0]}  ${entry.subject.name}`);
    console.log(`    ${entry.intent}`);
    console.log(`    File: ${entry.file}`);
    console.log();
  }
}
