import type {
  TasteSource,
  AntiExample,
  CritiqueNote,
  Principle,
} from "@taste-compiler/core";

export interface NormalizedSource {
  source: TasteSource;
  deduped: {
    critiqueMerges: number;
    principleOverlaps: number;
  };
  derivedNegatives: string[];
}

/**
 * Dedupe critiques by merging notes that target the same thing.
 */
function dedupeCritiques(critiques: CritiqueNote[]): {
  result: CritiqueNote[];
  mergeCount: number;
} {
  const byTarget = new Map<string, CritiqueNote[]>();
  let mergeCount = 0;

  for (const c of critiques) {
    const key = c.target ?? `__unscoped_${c.id}`;
    const existing = byTarget.get(key);
    if (existing) {
      existing.push(c);
    } else {
      byTarget.set(key, [c]);
    }
  }

  const result: CritiqueNote[] = [];
  for (const [, group] of byTarget) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // Merge into strongest severity
      const severityOrder = { critical: 0, important: 1, suggestion: 2 };
      group.sort(
        (a, b) =>
          (severityOrder[a.severity ?? "suggestion"] ?? 2) -
          (severityOrder[b.severity ?? "suggestion"] ?? 2)
      );
      const merged: CritiqueNote = {
        id: group[0].id,
        target: group[0].target,
        note: group.map((g) => g.note).join("; "),
        severity: group[0].severity,
      };
      result.push(merged);
      mergeCount += group.length - 1;
    }
  }

  return { result, mergeCount };
}

/**
 * Detect overlapping principles (same id or very similar statement).
 */
function findPrincipleOverlaps(principles: Principle[]): number {
  const seen = new Set<string>();
  let overlaps = 0;
  for (const p of principles) {
    if (seen.has(p.id)) {
      overlaps++;
    }
    seen.add(p.id);
  }
  return overlaps;
}

/**
 * Derive strong negatives from anti-examples by extracting their reasons
 * into actionable constraint phrases.
 */
function deriveNegatives(antiExamples: AntiExample[]): string[] {
  const negatives: string[] = [];
  for (const ae of antiExamples) {
    if (ae.category) {
      negatives.push(`Anti-${ae.category}: ${ae.reason}`);
    } else {
      negatives.push(`Avoid: ${ae.reason}`);
    }
  }
  return negatives;
}

/**
 * Normalize a TasteSource: dedupe, merge, and derive strong negatives.
 */
export function normalize(source: TasteSource): NormalizedSource {
  const { result: dedupedCritiques, mergeCount: critiqueMerges } =
    dedupeCritiques([...source.critique]);
  const principleOverlaps = findPrincipleOverlaps(source.principles);
  const derivedNegatives = deriveNegatives(source.antiExamples);

  const normalized: TasteSource = {
    ...source,
    critique: dedupedCritiques,
  };

  return {
    source: normalized,
    deduped: {
      critiqueMerges,
      principleOverlaps,
    },
    derivedNegatives,
  };
}
