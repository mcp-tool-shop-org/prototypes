import { fetchRelease } from "@receipt-factory/adapter-github";
import type { GitHubReleaseEvidence } from "@receipt-factory/adapter-github";

export type { GitHubReleaseEvidence };

export interface ReleaseFetchOptions {
  repo?: string;
  tag?: string;
}

/**
 * Collect release evidence from the specified source.
 * Currently only supports GitHub releases.
 */
export async function collect(
  source: "github",
  opts: ReleaseFetchOptions = {},
): Promise<GitHubReleaseEvidence> {
  if (source !== "github") {
    throw new Error(`Unsupported source: ${source}. Only "github" is supported.`);
  }

  const repo = opts.repo ?? process.env.GITHUB_REPOSITORY;
  const tag = opts.tag ?? extractTagFromRef(process.env.GITHUB_REF);

  if (!repo) {
    throw new Error(
      "No repository provided. Pass --repo owner/name or set GITHUB_REPOSITORY",
    );
  }
  if (!tag) {
    throw new Error(
      "No tag provided. Pass --tag <tag> or run from a release/tag event (GITHUB_REF)",
    );
  }

  return fetchRelease(repo, tag);
}

function extractTagFromRef(ref?: string): string | undefined {
  if (!ref) return undefined;
  // refs/tags/v1.2.3 → v1.2.3
  const match = ref.match(/^refs\/tags\/(.+)$/);
  return match ? match[1] : undefined;
}
