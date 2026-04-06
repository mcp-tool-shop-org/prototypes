import type { ReceiptIndex, ReceiptIndexEntry, SearchFilter } from "./types.js";

/**
 * Filter index entries by kind, repo name, and/or date range.
 */
export function searchIndex(
  index: ReceiptIndex,
  filter: SearchFilter,
): ReceiptIndexEntry[] {
  let results = index.receipts;

  if (filter.kind) {
    results = results.filter((r) => r.kind === filter.kind);
  }

  if (filter.repo) {
    const repo = filter.repo.toLowerCase();
    results = results.filter((r) =>
      r.subject.name.toLowerCase().includes(repo),
    );
  }

  if (filter.since) {
    const since = filter.since;
    results = results.filter((r) => r.created_at >= since);
  }

  if (filter.until) {
    const until = filter.until;
    results = results.filter((r) => r.created_at <= until);
  }

  return results;
}
