import { ghApi } from "./gh.js";

interface ArtifactsResponse {
  artifacts: Array<{
    name: string;
    size_in_bytes: number;
    archive_download_url: string;
  }>;
}

export async function fetchArtifacts(repo: string, runId: string | number) {
  const data = await ghApi<ArtifactsResponse>(
    `/repos/${repo}/actions/runs/${runId}/artifacts`,
  );

  return data.artifacts.map((a) => ({
    name: a.name,
    size: a.size_in_bytes,
    url: a.archive_download_url,
  }));
}
