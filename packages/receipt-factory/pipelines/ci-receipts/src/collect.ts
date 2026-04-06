import { fetchCIEvidence } from "@receipt-factory/adapter-github";
import type { GitHubCIEvidence, FetchOptions } from "@receipt-factory/adapter-github";

export type { GitHubCIEvidence };

/**
 * Collect CI evidence from the specified source.
 * Currently only supports GitHub Actions.
 */
export async function collect(
  source: "github",
  opts: FetchOptions = {},
): Promise<GitHubCIEvidence> {
  if (source !== "github") {
    throw new Error(`Unsupported source: ${source}. Only "github" is supported.`);
  }

  return fetchCIEvidence(opts);
}
