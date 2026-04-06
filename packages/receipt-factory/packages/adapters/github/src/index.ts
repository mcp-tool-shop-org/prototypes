import { RfError } from "@receipt-factory/core";
import { detectContext } from "./context.js";
import { isGhAvailable } from "./gh.js";
import { fetchRun } from "./runs.js";
import { fetchJobs } from "./jobs.js";
import { fetchArtifacts } from "./artifacts.js";
import type { GitHubCIEvidence, FetchOptions } from "./types.js";

export type { GitHubCIEvidence, FetchOptions } from "./types.js";
export type { GitHubReleaseEvidence, GitHubReleaseAsset } from "./releases.js";
export { detectContext } from "./context.js";
export { isGhAvailable } from "./gh.js";
export { fetchRelease } from "./releases.js";

/**
 * Fetch all CI evidence for a GitHub Actions run.
 *
 * Resolves run ID and repo from options or environment variables.
 * Requires `gh` CLI to be installed and authenticated.
 */
export async function fetchCIEvidence(
  opts: FetchOptions = {},
): Promise<GitHubCIEvidence> {
  const ctx = detectContext();

  const runId = opts.runId ?? ctx.runId;
  const repo = opts.repo ?? ctx.repository;

  if (!runId) {
    throw new RfError({
      code: "RF_MISSING_RUN_ID",
      message: "No run ID provided and GITHUB_RUN_ID not set",
      hint: "Pass --run <id> or run inside a GitHub Actions workflow",
    });
  }

  if (!repo) {
    throw new RfError({
      code: "RF_MISSING_REPO",
      message: "No repository provided and GITHUB_REPOSITORY not set",
      hint: "Pass --repo owner/name or run inside a GitHub Actions workflow",
    });
  }

  const ghOk = await isGhAvailable();
  if (!ghOk) {
    throw new RfError({
      code: "RF_GH_NOT_FOUND",
      message: "gh CLI not found",
      hint: "Install the GitHub CLI: https://cli.github.com/",
    });
  }

  const [runData, jobs, artifacts] = await Promise.all([
    fetchRun(repo, runId),
    fetchJobs(repo, runId),
    fetchArtifacts(repo, runId),
  ]);

  return {
    ...runData,
    jobs,
    artifacts,
  };
}
