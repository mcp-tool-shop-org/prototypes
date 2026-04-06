/**
 * GitHub Actions CI evidence — the data we collect from a workflow run.
 */
export interface GitHubCIEvidence {
  run: {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    url: string;
    created_at: string;
    updated_at: string;
  };
  commit: {
    sha: string;
    message: string;
    author: string;
    ref: string;
    url: string;
  };
  jobs: Array<{
    name: string;
    status: string;
    conclusion: string | null;
    runner_os: string;
    steps: Array<{
      name: string;
      status: string;
      conclusion: string | null;
    }>;
  }>;
  artifacts: Array<{
    name: string;
    size: number;
    url: string;
  }>;
  repository: {
    full_name: string;
    url: string;
  };
  workflow: {
    name: string;
    path: string;
  };
}

/**
 * Options for fetching CI evidence.
 */
export interface FetchOptions {
  /** GitHub Actions run ID. Falls back to GITHUB_RUN_ID env var. */
  runId?: string | number;
  /** Repository in owner/repo format. Falls back to GITHUB_REPOSITORY. */
  repo?: string;
}
