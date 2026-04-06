/**
 * Deterministic JSON serialization.
 *
 * Rules:
 * - Keys sorted recursively (lexicographic)
 * - No trailing whitespace
 * - No indentation (compact)
 * - Arrays preserve order (they're ordered by definition)
 * - undefined values are omitted
 */
export function canonicalize(obj: unknown): string {
  return JSON.stringify(obj, replacer);
}

/**
 * Replacer that sorts object keys recursively.
 */
function replacer(_key: string, value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const sorted: Record<string, unknown> = {};
  for (const k of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[k] = (value as Record<string, unknown>)[k];
  }
  return sorted;
}
