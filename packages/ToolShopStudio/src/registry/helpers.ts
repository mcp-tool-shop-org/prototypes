import type { PresetInfo } from "./types.js";

// ── Helpers for building registry entries from existing specs ─────

/**
 * Convert any PresetSpec-shaped record into a registry PresetInfo record.
 *
 * Works with all five tool spec shapes (FFmpeg PresetSpec, Pandoc, FreeCAD,
 * GDAL, OpenSCAD) because they all share isPremium + fallbackTo.
 *
 * Pure function — no I/O, no side effects.
 */
export function extractPresetInfo<
  T extends {
    isPremium: boolean;
    fallbackTo: string | null;
    outputExt?: string;
    outputFormat?: string;
  },
>(
  specs: Record<string, T>,
  descriptions: Record<string, string>,
): Record<string, PresetInfo> {
  const result: Record<string, PresetInfo> = {};

  for (const [key, spec] of Object.entries(specs)) {
    result[key] = {
      description: descriptions[key] ?? key,
      isPremium: spec.isPremium,
      fallbackTo: spec.fallbackTo,
      outputExt: spec.outputExt ?? "",
      outputFormat: spec.outputFormat ?? "",
    };
  }

  return result;
}

/**
 * Common architectural patterns shared across all tools.
 * Useful for consistency checks and onboarding documentation.
 */
export const SHARED_PATTERNS = [
  "schema-first (Zod parse on entry)",
  "context DI (all side effects injected)",
  "sandbox validation (path traversal prevention)",
  "preflight input check (async, stat-based)",
  "postflight output assertion (async, stat-based)",
  "spec-driven fallback (premium → guaranteed)",
  "AbortSignal cancellation (7+ checkpoints)",
  "typed notifications (progress, warning, ready)",
  "buildAndNotifyAsset helper",
  "CRUD factory with lazy hydration",
  "output polish (auto-extension, metadata, expiry)",
] as const;
