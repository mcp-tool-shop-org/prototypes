/**
 * GitHub API adapter.
 *
 * All GitHub interactions go through this module.
 * Least-privilege: only requests what's needed.
 */

const TOKEN = process.env.GITHUB_TOKEN || "";

async function ghApi(endpoint, { method = "GET", body = null } = {}) {
  const url = `https://api.github.com/${endpoint}`;
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (TOKEN) headers["Authorization"] = `token ${TOKEN}`;

  const opts = { method, headers };
  if (body) {
    opts.body = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API ${method} ${endpoint}: ${res.status} ${res.statusText} ${text}`);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

/**
 * Fetch repo metadata (description, homepage, topics).
 */
export async function getRepoMeta(owner, repo) {
  const data = await ghApi(`repos/${owner}/${repo}`);
  return {
    description: data.description || "",
    homepage: data.homepage || "",
    topics: data.topics || [],
    defaultBranch: data.default_branch,
    archived: data.archived,
  };
}

/**
 * Update repo metadata (description, homepage).
 */
export async function updateRepoMeta(owner, repo, { description, homepage }) {
  const body = {};
  if (description !== undefined) body.description = description;
  if (homepage !== undefined) body.homepage = homepage;
  return ghApi(`repos/${owner}/${repo}`, { method: "PATCH", body });
}

/**
 * Replace repo topics.
 */
export async function setRepoTopics(owner, repo, topics) {
  return ghApi(`repos/${owner}/${repo}/topics`, {
    method: "PUT",
    body: { names: topics },
  });
}

/**
 * Get the latest release.
 */
export async function getLatestRelease(owner, repo) {
  try {
    return await ghApi(`repos/${owner}/${repo}/releases/latest`);
  } catch (err) {
    if (err.message.includes("404")) return null;
    throw err;
  }
}

/**
 * Update release body.
 */
export async function updateReleaseBody(owner, repo, releaseId, body) {
  return ghApi(`repos/${owner}/${repo}/releases/${releaseId}`, {
    method: "PATCH",
    body: { body },
  });
}

/**
 * Get file content from a repo (for README).
 */
export async function getFileContent(owner, repo, path, branch) {
  const data = await ghApi(
    `repos/${owner}/${repo}/contents/${path}?ref=${branch}`
  );
  return {
    content: Buffer.from(data.content, "base64").toString("utf8"),
    sha: data.sha,
  };
}

/**
 * Create or update a file on a branch.
 */
export async function putFileContent(owner, repo, path, { content, sha, branch, message }) {
  return ghApi(`repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    body: {
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha,
      branch,
    },
  });
}

/**
 * Create a branch from a ref.
 */
export async function createBranch(owner, repo, branchName, fromSha) {
  return ghApi(`repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: {
      ref: `refs/heads/${branchName}`,
      sha: fromSha,
    },
  });
}

/**
 * Get the SHA of a branch tip.
 */
export async function getBranchSha(owner, repo, branch) {
  const data = await ghApi(`repos/${owner}/${repo}/git/ref/heads/${branch}`);
  return data.object.sha;
}

/**
 * Create a pull request.
 */
export async function createPR(owner, repo, { title, body, head, base }) {
  return ghApi(`repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: { title, body, head, base },
  });
}
