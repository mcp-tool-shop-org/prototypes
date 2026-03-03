/**
 * Shared sanitization utilities.
 * Mirrors the marketing site's scripts/lib/sanitize.mjs contract.
 */

const ALLOWED_PROTOCOLS = new Set(["https:", "http:"]);

/**
 * Validate a URL string and enforce protocol allowlist.
 * Returns the canonical URL string on success, throws on failure.
 */
export function validateUrl(raw, { label = "URL" } = {}) {
  const url = new URL(raw);
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new Error(`${label}: disallowed protocol "${url.protocol}"`);
  }
  return url.toString();
}

/**
 * Sanitize a string for safe inclusion in GitHub Markdown.
 * Strips control characters, trims, and enforces max length.
 */
export function sanitizeText(s, { maxLength = 350 } = {}) {
  return String(s)
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize GitHub topics: lowercase, alphanumeric + hyphens only, max 50 chars each.
 */
export function sanitizeTopic(t) {
  return String(t)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
