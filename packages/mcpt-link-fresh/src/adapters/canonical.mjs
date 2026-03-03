/**
 * Canonical data adapter.
 *
 * Fetches press kit JSON and links JSON from the live marketing site.
 */

import { validateUrl } from "../lib/sanitize.mjs";

/**
 * Fetch the press kit JSON for a slug.
 * @returns {object|null} parsed presskit.json, or null if not found
 */
export async function fetchPresskit(baseUrl, slug) {
  const url = validateUrl(`${baseUrl}/${slug}/presskit.json`, {
    label: `presskit[${slug}]`,
  });

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch presskit for "${slug}": ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch the canonical links registry.
 * @returns {object|null} parsed links.json, or null if not found
 */
export async function fetchLinks(linksUrl) {
  const url = validateUrl(linksUrl, { label: "links.json" });

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch links: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
