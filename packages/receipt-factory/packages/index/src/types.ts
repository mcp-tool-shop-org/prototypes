import type { ReceiptKind, ReceiptSubject } from "@receipt-factory/core";

/**
 * A summary entry for a receipt in the index.
 * Contains just enough to filter and link — not the full receipt.
 */
export interface ReceiptIndexEntry {
  id: string;
  kind: ReceiptKind;
  created_at: string;
  subject: ReceiptSubject;
  intent: string;
  file: string;
  valid: boolean;
  references?: string[];
}

/**
 * A receipt index — a machine-readable listing of all receipts in a directory.
 */
export interface ReceiptIndex {
  index_version: "1.0";
  generated_at: string;
  count: number;
  receipts: ReceiptIndexEntry[];
}

/**
 * Filter options for searching the index.
 */
export interface SearchFilter {
  kind?: ReceiptKind;
  repo?: string;
  since?: string;
  until?: string;
}
