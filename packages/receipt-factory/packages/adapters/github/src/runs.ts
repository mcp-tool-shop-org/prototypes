import { ghApi } from "./gh.js";

interface RunResponse {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  head_sha: string;
  head_branch: string;
  head_commit: {
    message: string;
    author: { name: string };
  };
  repository: {
    full_name: string;
    html_url: string;
  };
  workflow_id: number;
  path: string;
}

export async function fetchRun(repo: string, runId: string | number) {
  const data = await ghApi<RunResponse>(
    `/repos/${repo}/actions/runs/${runId}`,
  );

  return {
    run: {
      id: data.id,
      name: data.name,
      status: data.status,
      conclusion: data.conclusion,
      url: data.html_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
    commit: {
      sha: data.head_sha,
      message: data.head_commit.message,
      author: data.head_commit.author.name,
      ref: data.head_branch,
      url: `${data.repository.html_url}/commit/${data.head_sha}`,
    },
    repository: {
      full_name: data.repository.full_name,
      url: data.repository.html_url,
    },
    workflow: {
      name: data.name,
      path: data.path,
    },
  };
}
