import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { safeValidateReceipt, verifyIntegrity } from "@receipt-factory/core";
import type { ReceiptIndex, ReceiptIndexEntry } from "./types.js";

export interface BuildOptions {
  /** Run schema + hash validation on each receipt. Default: false. */
  validate?: boolean;
}

/**
 * Scan a directory recursively for receipt JSON files and build an index.
 *
 * Skips:
 * - index.json itself
 * - Non-JSON files
 * - JSON files that don't parse as valid receipts (via safe schema check)
 */
export async function buildIndex(
  receiptsDir: string,
  opts: BuildOptions = {},
): Promise<ReceiptIndex> {
  const entries: ReceiptIndexEntry[] = [];
  const jsonFiles = findJsonFiles(receiptsDir);

  for (const absPath of jsonFiles) {
    const relPath = relative(receiptsDir, absPath);

    // Skip index.json
    if (relPath === "index.json") continue;

    let raw: string;
    try {
      raw = readFileSync(absPath, "utf-8");
    } catch {
      continue;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      continue;
    }

    // Must look like a receipt (has receipt_version, kind, id)
    if (!parsed.receipt_version || !parsed.kind || !parsed.id) {
      continue;
    }

    // Safe schema validation — skip if it's not a receipt
    const validation = safeValidateReceipt(parsed);
    if (!validation.success) {
      continue;
    }

    const receipt = validation.data;
    let valid = true;

    if (opts.validate) {
      valid = verifyIntegrity(parsed);
    }

    const entry: ReceiptIndexEntry = {
      id: receipt.id,
      kind: receipt.kind,
      created_at: receipt.created_at,
      subject: receipt.subject,
      intent: receipt.intent,
      file: relPath,
      valid,
    };

    // Extract reference hashes for the graph
    if (receipt.references && Array.isArray(receipt.references) && receipt.references.length > 0) {
      entry.references = (receipt.references as Array<{ hash: string }>).map((r) => r.hash);
    }

    entries.push(entry);
  }

  // Sort by created_at descending (newest first)
  entries.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return {
    index_version: "1.0",
    generated_at: new Date().toISOString(),
    count: entries.length,
    receipts: entries,
  };
}

/**
 * Recursively find all .json files in a directory.
 */
function findJsonFiles(dir: string): string[] {
  const results: string[] = [];

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      results.push(...findJsonFiles(fullPath));
    } else if (entry.endsWith(".json")) {
      results.push(fullPath);
    }
  }

  return results;
}
