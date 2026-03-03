/**
 * README Block Manager
 *
 * Manages delimited blocks in README files:
 *   <!-- mcpt:links:start -->
 *   ... managed content ...
 *   <!-- mcpt:links:end -->
 *
 * Never touches content outside the markers.
 */

const START_MARKER = "<!-- mcpt:links:start -->";
const END_MARKER = "<!-- mcpt:links:end -->";

/**
 * Build the managed links block content.
 *
 * @param {object} presskit — parsed presskit.json
 * @param {object} config   — sync config (for base URLs)
 * @returns {string} Markdown block (without markers)
 */
export function buildLinksBlock(presskit, config) {
  const slug = presskit.slug;
  const lines = [];

  lines.push("### Links");
  lines.push("");
  lines.push(`- [Tool page](${config.canonical.toolPageBase}/${slug}/)`);

  if (presskit.press) {
    lines.push(`- [Press page](${config.canonical.pressPageBase}/${slug}/)`);
  }

  lines.push(`- [Press kit](${config.canonical.presskitBaseUrl}/${slug}/)`);

  // Add tracked links if present
  if (presskit.trackedLinks?.length > 0) {
    for (const link of presskit.trackedLinks) {
      lines.push(`- [${link.id}](https://mcptoolshop.com/go/${link.id}/)`);
    }
  }

  return lines.join("\n");
}

/**
 * Inject or replace the managed block in README content.
 *
 * @param {string} readmeContent — current README text
 * @param {string} block         — new block content (without markers)
 * @returns {{ content: string, changed: boolean }}
 */
export function injectBlock(readmeContent, block) {
  const fullBlock = `${START_MARKER}\n${block}\n${END_MARKER}`;

  const startIdx = readmeContent.indexOf(START_MARKER);
  const endIdx = readmeContent.indexOf(END_MARKER);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    // Replace existing block
    const before = readmeContent.slice(0, startIdx);
    const after = readmeContent.slice(endIdx + END_MARKER.length);
    const newContent = before + fullBlock + after;
    return {
      content: newContent,
      changed: newContent !== readmeContent,
    };
  }

  // No markers found — append at end
  const newContent = readmeContent.trimEnd() + "\n\n" + fullBlock + "\n";
  return {
    content: newContent,
    changed: true,
  };
}
