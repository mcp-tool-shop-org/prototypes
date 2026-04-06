/**
 * Detect GitHub Actions environment variables.
 * When running inside a workflow, these are set automatically.
 */
export interface GitHubContext {
  isActions: boolean;
  runId?: string;
  repository?: string;
  sha?: string;
  ref?: string;
  actor?: string;
  workflow?: string;
  serverUrl: string;
}

export function detectContext(): GitHubContext {
  const isActions = process.env.GITHUB_ACTIONS === "true";

  return {
    isActions,
    runId: process.env.GITHUB_RUN_ID,
    repository: process.env.GITHUB_REPOSITORY,
    sha: process.env.GITHUB_SHA,
    ref: process.env.GITHUB_REF,
    actor: process.env.GITHUB_ACTOR,
    workflow: process.env.GITHUB_WORKFLOW,
    serverUrl: process.env.GITHUB_SERVER_URL ?? "https://github.com",
  };
}
