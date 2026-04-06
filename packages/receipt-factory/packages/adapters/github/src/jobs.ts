import { ghApi } from "./gh.js";

interface JobsResponse {
  jobs: Array<{
    name: string;
    status: string;
    conclusion: string | null;
    runner_name: string;
    labels: string[];
    steps: Array<{
      name: string;
      status: string;
      conclusion: string | null;
    }>;
  }>;
}

export async function fetchJobs(repo: string, runId: string | number) {
  const data = await ghApi<JobsResponse>(
    `/repos/${repo}/actions/runs/${runId}/jobs`,
  );

  return data.jobs.map((job) => ({
    name: job.name,
    status: job.status,
    conclusion: job.conclusion,
    runner_os: job.labels.find((l) =>
      ["ubuntu-latest", "windows-latest", "macos-latest"].includes(l),
    ) ?? job.labels[0] ?? "unknown",
    steps: job.steps.map((s) => ({
      name: s.name,
      status: s.status,
      conclusion: s.conclusion,
    })),
  }));
}
