/**
 * Drift Detector
 *
 * Compares canonical truth (presskit.json) against current GitHub surfaces.
 * Produces a list of drifts with action types.
 */

import { sanitizeText, sanitizeTopic } from "../lib/sanitize.mjs";

/**
 * @typedef {object} Drift
 * @property {string} surface   — what drifted (metadata|release|readme)
 * @property {string} field     — specific field (description|homepage|topics|releaseNotes|readmeBlock)
 * @property {string} action    — DIRECT_UPDATE | PR_REQUIRED | RELEASE_REQUIRED
 * @property {string} current   — current value on surface
 * @property {string} canonical — expected value from truth
 * @property {string} slug      — tool slug
 */

/**
 * Detect drift between canonical presskit and current GitHub state.
 *
 * @param {object} presskit   — parsed presskit.json
 * @param {object} repoMeta   — current GitHub repo metadata
 * @param {object} target     — config target entry
 * @param {object} config     — full config (for canonical URLs)
 * @returns {Drift[]}
 */
export function detectDrift(presskit, repoMeta, target, config) {
  const drifts = [];
  const slug = target.slug;

  // ── 1. Description ──
  const canonicalDesc = sanitizeText(presskit.tagline || "");
  if (canonicalDesc && repoMeta.description !== canonicalDesc) {
    drifts.push({
      surface: "metadata",
      field: "description",
      action: "DIRECT_UPDATE",
      current: repoMeta.description,
      canonical: canonicalDesc,
      slug,
    });
  }

  // ── 2. Homepage ──
  const canonicalHomepage = `${config.canonical.toolPageBase}/${slug}/`;
  if (repoMeta.homepage !== canonicalHomepage) {
    drifts.push({
      surface: "metadata",
      field: "homepage",
      action: "DIRECT_UPDATE",
      current: repoMeta.homepage,
      canonical: canonicalHomepage,
      slug,
    });
  }

  // ── 3. Topics ──
  const maxTopics = target.topicsMax || 12;
  const canonicalTopics = deriveTopics(presskit, maxTopics);
  const currentTopicsSorted = [...repoMeta.topics].sort();
  const canonicalTopicsSorted = [...canonicalTopics].sort();

  if (JSON.stringify(currentTopicsSorted) !== JSON.stringify(canonicalTopicsSorted)) {
    drifts.push({
      surface: "metadata",
      field: "topics",
      action: "DIRECT_UPDATE",
      current: repoMeta.topics.join(", "),
      canonical: canonicalTopics.join(", "),
      slug,
    });
  }

  return drifts;
}

/**
 * Derive GitHub topics from presskit data.
 * Uses kind, stability, and any tags from the tool.
 */
function deriveTopics(presskit, maxTopics) {
  const topics = new Set();

  // Always include "mcp" if it's an MCP tool
  if (presskit.kind && presskit.kind.startsWith("mcp")) {
    topics.add("mcp");
  }

  // Add kind as topic
  if (presskit.kind) {
    topics.add(sanitizeTopic(presskit.kind));
  }

  // Add stability
  if (presskit.stability) {
    topics.add(sanitizeTopic(presskit.stability));
  }

  // Add value props as keyword-derived topics (simple extraction)
  if (presskit.valueProps) {
    for (const vp of presskit.valueProps) {
      // Extract likely topic keywords from value props
      const words = vp.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
      for (const w of words.slice(0, 2)) {
        if (!STOP_WORDS.has(w)) {
          topics.add(sanitizeTopic(w));
        }
      }
    }
  }

  return [...topics].slice(0, maxTopics);
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "are",
  "has", "have", "can", "not", "all", "any", "our", "you", "its",
  "into", "over", "than", "when", "each", "but", "use", "via", "per",
]);
