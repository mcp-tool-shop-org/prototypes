import { TOOL_REGISTRY } from "./tools.js";
import { SHARED_PATTERNS } from "./helpers.js";

// ── Consistency checks — pure cross-tool assertions ──────────────

/**
 * Check that ALL tools implement a specific architectural pattern.
 * Uses case-insensitive substring matching.
 *
 * Returns true if every registered tool has at least one
 * commonPattern entry that contains the given string.
 */
export function checkAllToolsHavePattern(pattern: string): boolean {
  const lower = pattern.toLowerCase();
  return Object.values(TOOL_REGISTRY).every((tool) =>
    tool.commonPatterns.some((p) => p.toLowerCase().includes(lower)),
  );
}

/**
 * Get tools that are MISSING a specific architectural pattern.
 * Useful for finding tools that need to be updated.
 */
export function getToolsMissingPattern(pattern: string): string[] {
  const lower = pattern.toLowerCase();
  return Object.entries(TOOL_REGISTRY)
    .filter(
      ([, tool]) =>
        !tool.commonPatterns.some((p) => p.toLowerCase().includes(lower)),
    )
    .map(([id]) => id);
}

/**
 * Check that all tools share the same version string.
 * Returns the version if consistent, throws if mismatched.
 */
export function checkVersionConsistency(): string {
  const versions = new Set(
    Object.values(TOOL_REGISTRY).map((t) => t.version),
  );
  if (versions.size !== 1) {
    const details = Object.entries(TOOL_REGISTRY)
      .map(([id, t]) => `  ${id}: ${t.version}`)
      .join("\n");
    throw new Error(`Version mismatch across tools:\n${details}`);
  }
  return [...versions][0]!;
}

/**
 * Get the version of a specific tool.
 * Returns null if the tool is not registered.
 */
export function getToolVersion(id: string): string | null {
  return TOOL_REGISTRY[id]?.version ?? null;
}

/**
 * Check that all shared patterns from SHARED_PATTERNS are present
 * in every tool. Returns an array of { toolId, missingPattern } entries.
 * Empty array means fully consistent.
 */
export function checkSharedPatternCoverage(): Array<{
  toolId: string;
  missingPattern: string;
}> {
  const gaps: Array<{ toolId: string; missingPattern: string }> = [];

  for (const [toolId, tool] of Object.entries(TOOL_REGISTRY)) {
    for (const required of SHARED_PATTERNS) {
      const found = tool.commonPatterns.some((p) =>
        p.toLowerCase().includes(required.toLowerCase()),
      );
      if (!found) {
        gaps.push({ toolId, missingPattern: required });
      }
    }
  }

  return gaps;
}

/**
 * Get a summary of the registry: tool count, total presets,
 * premium count, guaranteed count, unique output formats.
 */
export function getRegistrySummary(): {
  toolCount: number;
  totalPresets: number;
  premiumPresets: number;
  guaranteedPresets: number;
  uniqueOutputFormats: string[];
  version: string;
} {
  const tools = Object.values(TOOL_REGISTRY);
  let totalPresets = 0;
  let premiumPresets = 0;
  const formats = new Set<string>();

  for (const tool of tools) {
    for (const info of Object.values(tool.presets)) {
      totalPresets++;
      if (info.isPremium) premiumPresets++;
      if (info.outputFormat) formats.add(info.outputFormat.toUpperCase());
    }
  }

  return {
    toolCount: tools.length,
    totalPresets,
    premiumPresets,
    guaranteedPresets: totalPresets - premiumPresets,
    uniqueOutputFormats: [...formats].sort(),
    version: tools[0]?.version ?? "unknown",
  };
}
