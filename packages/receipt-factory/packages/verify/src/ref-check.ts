import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeDigest, verifyIntegrity } from "@receipt-factory/core";
import type { VerificationCheck } from "./types.js";

interface Reference {
  kind: "receipt" | "evidence_pack";
  hash: string;
  description: string;
  path?: string;
  url?: string;
}

export interface RefCheckOptions {
  /** Recursively verify referenced receipts. */
  follow?: boolean;
  /** Directory to resolve relative reference paths. */
  receiptsDir?: string;
  /** Maximum recursion depth for --follow (default: 5). */
  maxDepth?: number;
  /** Maximum total nodes visited to prevent graph explosion (default: 200). */
  maxNodes?: number;
  /** Strict references: missing or unreadable references fail verification (default: false). */
  refsStrict?: boolean;
}

/**
 * Verify referenced receipts exist and hashes match.
 * In follow mode, recursively verify referenced receipts up to maxDepth.
 * Cycle detection prevents infinite loops; maxNodes prevents explosion.
 */
export async function checkReferences(
  receipt: Record<string, unknown>,
  opts: RefCheckOptions = {},
): Promise<VerificationCheck[]> {
  const references = receipt.references as Reference[] | undefined;

  if (!references || references.length === 0) {
    return [
      {
        name: "references",
        passed: true,
        message: "No references to verify",
      },
    ];
  }

  const checks: VerificationCheck[] = [];
  const visited = new Set<string>();
  const maxDepth = opts.maxDepth ?? 5;
  const maxNodes = opts.maxNodes ?? 200;
  const refsStrict = opts.refsStrict ?? false;
  const state = { nodesVisited: 0, maxNodes };

  for (const ref of references) {
    const refChecks = await verifyReference(ref, opts, visited, 0, maxDepth, state, refsStrict);
    checks.push(...refChecks);
  }

  return checks;
}

interface TraversalState {
  nodesVisited: number;
  maxNodes: number;
}

async function verifyReference(
  ref: Reference,
  opts: RefCheckOptions,
  visited: Set<string>,
  depth: number,
  maxDepth: number,
  state: TraversalState,
  refsStrict: boolean,
): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];
  const label = `ref:${ref.kind}:${ref.hash.slice(0, 12)}`;

  // Max nodes guard — prevent graph explosion
  if (state.nodesVisited >= state.maxNodes) {
    checks.push({
      name: label,
      passed: false,
      message: `Max nodes visited (${state.maxNodes}) — graph traversal halted to prevent explosion`,
      details: { hash: ref.hash, description: ref.description },
    });
    return checks;
  }
  state.nodesVisited++;

  // Cycle detection — report clearly
  if (visited.has(ref.hash)) {
    checks.push({
      name: label,
      passed: true,
      message: `Cycle detected, already verified: ${ref.description}`,
    });
    return checks;
  }
  visited.add(ref.hash);

  // If we have a local path, verify the file exists and hash matches
  if (ref.path && opts.receiptsDir) {
    const absPath = join(opts.receiptsDir, ref.path);
    let raw: string;
    try {
      raw = readFileSync(absPath, "utf-8");
    } catch {
      checks.push({
        name: label,
        passed: !refsStrict,
        message: `Referenced file not found: ${ref.path}`,
        details: { path: ref.path, description: ref.description },
      });
      return checks;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      checks.push({
        name: label,
        passed: !refsStrict,
        message: `Referenced file is not valid JSON: ${ref.path}`,
        details: { path: ref.path },
      });
      return checks;
    }

    // For receipts, verify the hash matches the receipt's integrity digest
    if (ref.kind === "receipt") {
      const { id: _id, integrity: _integrity, ...draft } = parsed;
      const computedHash = computeDigest(draft);

      if (computedHash !== ref.hash) {
        checks.push({
          name: label,
          passed: false,
          message: `Hash mismatch for referenced receipt: ${ref.description}`,
          details: {
            expected: ref.hash,
            actual: computedHash,
            path: ref.path,
          },
        });
        return checks;
      }

      checks.push({
        name: label,
        passed: true,
        message: `Reference verified: ${ref.description}`,
      });

      // If follow mode, recursively verify the referenced receipt
      if (opts.follow && depth < maxDepth) {
        // Verify the referenced receipt's own integrity
        const integrityOk = verifyIntegrity(parsed);
        if (!integrityOk) {
          checks.push({
            name: `${label}:integrity`,
            passed: false,
            message: `Referenced receipt has invalid integrity: ${ref.path}`,
          });
        }

        // Recurse into its references
        const subRefs = parsed.references as Reference[] | undefined;
        if (subRefs && subRefs.length > 0) {
          for (const subRef of subRefs) {
            const subChecks = await verifyReference(
              subRef,
              opts,
              visited,
              depth + 1,
              maxDepth,
              state,
              refsStrict,
            );
            checks.push(...subChecks);
          }
        }
      }
    } else {
      // Evidence pack — just verify the file is readable + hash is present
      checks.push({
        name: label,
        passed: true,
        message: `Evidence pack reference exists: ${ref.description}`,
      });
    }

    return checks;
  }

  // URL-only reference — check reachability
  if (ref.url) {
    try {
      const resp = await fetch(ref.url, {
        method: "HEAD",
        signal: AbortSignal.timeout(10_000),
      });
      if (resp.status >= 400) {
        checks.push({
          name: label,
          passed: !refsStrict,
          message: `Referenced URL unreachable (HTTP ${resp.status}): ${ref.url}`,
          details: { url: ref.url, description: ref.description },
        });
      } else {
        checks.push({
          name: label,
          passed: true,
          message: `Reference URL reachable: ${ref.description}`,
        });
      }
    } catch (err) {
      checks.push({
        name: label,
        passed: !refsStrict,
        message: `Referenced URL unreachable: ${ref.url}`,
        details: {
          url: ref.url,
          reason: err instanceof Error ? err.message : String(err),
        },
      });
    }
    return checks;
  }

  // No path or URL — we can only note the reference exists
  checks.push({
    name: label,
    passed: true,
    message: `Reference declared (no path or URL to verify): ${ref.description}`,
  });

  return checks;
}
