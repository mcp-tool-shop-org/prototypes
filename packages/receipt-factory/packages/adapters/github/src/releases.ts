import { ghApi } from "./gh.js";

export interface GitHubReleaseAsset {
  name: string;
  size: number;
  download_url: string;
  content_type: string;
}

export interface GitHubReleaseEvidence {
  release: {
    tag_name: string;
    name: string;
    body: string;
    draft: boolean;
    prerelease: boolean;
    created_at: string;
    published_at: string;
    url: string;
    html_url: string;
    author: string;
  };
  assets: GitHubReleaseAsset[];
  commit: {
    sha: string;
    url: string;
  };
  repository: {
    full_name: string;
    url: string;
  };
}

interface GhReleaseResponse {
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  html_url: string;
  url: string;
  target_commitish: string;
  author: { login: string };
  assets: Array<{
    name: string;
    size: number;
    browser_download_url: string;
    content_type: string;
  }>;
}

/**
 * Fetch release data from GitHub via `gh api`.
 */
export async function fetchRelease(
  repo: string,
  tag: string,
): Promise<GitHubReleaseEvidence> {
  const data = await ghApi<GhReleaseResponse>(
    `/repos/${repo}/releases/tags/${tag}`,
  );

  const commitSha = data.target_commitish;

  return {
    release: {
      tag_name: data.tag_name,
      name: data.name || data.tag_name,
      body: data.body || "",
      draft: data.draft,
      prerelease: data.prerelease,
      created_at: data.created_at,
      published_at: data.published_at,
      url: data.url,
      html_url: data.html_url,
      author: data.author.login,
    },
    assets: data.assets.map((a) => ({
      name: a.name,
      size: a.size,
      download_url: a.browser_download_url,
      content_type: a.content_type,
    })),
    commit: {
      sha: commitSha,
      url: `https://github.com/${repo}/commit/${commitSha}`,
    },
    repository: {
      full_name: repo,
      url: `https://github.com/${repo}`,
    },
  };
}
