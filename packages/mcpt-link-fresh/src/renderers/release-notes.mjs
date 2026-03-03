/**
 * Release Notes Section Manager
 *
 * Manages a bounded section in GitHub release notes:
 *   <!-- mcpt:links:start -->
 *   ### Links + Proof (mcptoolshop.com)
 *   - [Tool page](...)
 *   ...
 *   <!-- mcpt:links:end -->
 *
 * Idempotent: if markers present, replace; if absent, append.
 * Never rewrites the rest of the release notes.
 */

const START_MARKER = "<!-- mcpt:links:start -->";
const END_MARKER = "<!-- mcpt:links:end -->";

/**
 * Build the managed release notes section.
 *
 * @param {object} presskit — parsed presskit.json
 * @param {object} config   — sync config
 * @returns {string} section content (without markers)
 */
export function buildReleaseSection(presskit, config) {
  const slug = presskit.slug;
  const lines = [];

  lines.push("### Links + Proof (mcptoolshop.com)");
  lines.push("");
  lines.push(`- [Tool page](${config.canonical.toolPageBase}/${slug}/)`);

  if (presskit.press) {
    lines.push(`- [Press page](${config.canonical.pressPageBase}/${slug}/)`);
  }

  lines.push(`- [Press kit](${config.canonical.presskitBaseUrl}/${slug}/)`);

  // Add tracked links
  if (presskit.trackedLinks?.length > 0) {
    for (const link of presskit.trackedLinks) {
      lines.push(`- [${link.id}](https://mcptoolshop.com/go/${link.id}/) (${link.channel})`);
    }
  }

  // Add proven claims summary
  if (presskit.provenClaims?.length > 0) {
    lines.push("");
    lines.push("**Verified claims:**");
    for (const claim of presskit.provenClaims) {
      lines.push(`- ${claim.statement}`);
    }
  }

  return lines.join("\n");
}

/**
 * Inject or replace the managed section in release notes.
 *
 * @param {string} body    — current release body
 * @param {string} section — new section content (without markers)
 * @returns {{ body: string, changed: boolean }}
 */
export function injectReleaseSection(body, section) {
  const fullSection = `${START_MARKER}\n${section}\n${END_MARKER}`;

  if (!body) {
    return { body: fullSection + "\n", changed: true };
  }

  const startIdx = body.indexOf(START_MARKER);
  const endIdx = body.indexOf(END_MARKER);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = body.slice(0, startIdx);
    const after = body.slice(endIdx + END_MARKER.length);
    const newBody = before + fullSection + after;
    return {
      body: newBody,
      changed: newBody !== body,
    };
  }

  // No markers — append
  const newBody = body.trimEnd() + "\n\n" + fullSection + "\n";
  return { body: newBody, changed: true };
}
