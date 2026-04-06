import type { VerificationCheck } from "./types.js";

interface LinkTarget {
  field: string;
  url: string;
}

/**
 * Extract all URLs from a receipt for verification.
 */
function extractLinks(receipt: Record<string, unknown>): LinkTarget[] {
  const links: LinkTarget[] = [];

  const subject = receipt.subject as { url?: string } | undefined;
  if (subject?.url) links.push({ field: "subject.url", url: subject.url });

  const outputs = receipt.outputs as Array<{ url?: string; name?: string }> | undefined;
  if (Array.isArray(outputs)) {
    for (let i = 0; i < outputs.length; i++) {
      if (outputs[i].url) {
        links.push({ field: `outputs[${i}].url`, url: outputs[i].url! });
      }
    }
  }

  const evidence = receipt.evidence as Array<{ url?: string }> | undefined;
  if (Array.isArray(evidence)) {
    for (let i = 0; i < evidence.length; i++) {
      if (evidence[i].url) {
        links.push({ field: `evidence[${i}].url`, url: evidence[i].url! });
      }
    }
  }

  const references = receipt.references as Array<{ url?: string }> | undefined;
  if (Array.isArray(references)) {
    for (let i = 0; i < references.length; i++) {
      if (references[i].url) {
        links.push({ field: `references[${i}].url`, url: references[i].url! });
      }
    }
  }

  return links;
}

/**
 * Check that evidence URLs are reachable (HTTP HEAD).
 * Skippable in offline mode.
 */
export async function checkLinks(
  receipt: Record<string, unknown>,
  opts: { offline?: boolean } = {},
): Promise<VerificationCheck> {
  if (opts.offline) {
    return {
      name: "links",
      passed: true,
      message: "Link check skipped (offline mode)",
    };
  }

  const links = extractLinks(receipt);

  if (links.length === 0) {
    return {
      name: "links",
      passed: true,
      message: "No links to verify",
    };
  }

  const failures: Array<{ field: string; url: string; reason: string }> = [];

  for (const link of links) {
    try {
      const resp = await fetch(link.url, {
        method: "HEAD",
        signal: AbortSignal.timeout(10_000),
      });
      if (resp.status >= 400) {
        failures.push({
          field: link.field,
          url: link.url,
          reason: `HTTP ${resp.status}`,
        });
      }
    } catch (err) {
      failures.push({
        field: link.field,
        url: link.url,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (failures.length === 0) {
    return {
      name: "links",
      passed: true,
      message: `All ${links.length} link(s) reachable`,
    };
  }

  return {
    name: "links",
    passed: false,
    message: `${failures.length} of ${links.length} link(s) unreachable`,
    details: failures,
  };
}
