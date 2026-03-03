/**
 * Queue Builder
 *
 * Takes classified trigger events and produces outreach-queue items.
 * Pairs triggers with targets, selects templates, generates subject lines,
 * and enforces rate limits + dedup.
 *
 * Deterministic: same inputs → same queue.
 * No sending — purely advisory.
 */

/**
 * Build the outreach queue from trigger events.
 *
 * @param {import("./outreach-classifier.mjs").TriggerEvent[]} triggers
 * @param {import("../adapters/marketing-site.mjs").MarketingData} marketingData
 * @param {{ entries: object[] }} history
 * @param {object} policy — outreach config (maxPerToolPerWeek, dedupeWindowDays, etc.)
 * @param {object} config — full sync config
 * @param {string} slug   — tool slug
 * @returns {{ items: object[], suppressed: object[], stats: object }}
 */
export function buildQueue(triggers, marketingData, history, policy, config, slug) {
  const now = new Date().toISOString();
  const today = now.split("T")[0];
  const items = [];
  const suppressed = [];
  let seqNum = 0;

  for (const trigger of triggers) {
    seqNum++;
    const id = `q.${slug}.${trigger.triggerCategory}.${today}.${String(seqNum).padStart(3, "0")}`;

    // 1. Select audience
    const { audienceRef, audienceName } = selectAudience(
      trigger,
      marketingData.tool,
      marketingData.audiences
    );

    // 2. Select targets
    const targets = selectTargets(
      trigger,
      audienceRef,
      marketingData.audiences,
      marketingData.targetsData,
      policy.topTargetsPerItem || 3
    );

    // 3. Select template
    const suggestedTemplate = selectTemplate(trigger, targets, marketingData);

    // 4. Generate subject lines
    const toolName = marketingData.tool?.name || slug;
    const claimsUsed = getClaimsUsed(trigger, marketingData.tool);
    const suggestedSubjectLines = generateSubjectLines(trigger, toolName, claimsUsed);

    // 5. Select go-link
    const { goLink, goLinkUrl } = selectGoLink(
      trigger,
      marketingData.linksData,
      slug,
      config
    );

    // 6. Build resource links
    const resourceLinks = {
      presskit: `${config.canonical.presskitBaseUrl}/${slug}/`,
      outreachPack: `${config.canonical.toolPageBase}/${slug}/`,
      partnerPack: null,
    };

    const item = {
      id,
      slug,
      triggerCategory: trigger.triggerCategory,
      triggerSummary: trigger.triggerSummary,
      priority: trigger.priority,
      audienceRef,
      audienceName,
      targets,
      suggestedTemplate,
      suggestedSubjectLines,
      goLink,
      goLinkUrl,
      claimsUsed,
      resourceLinks,
      status: "pending",
      suppressedReason: null,
    };

    // 7. Check suppression rules
    const suppressReason = checkSuppression(item, history, policy, now);
    if (suppressReason) {
      item.status = "suppressed";
      item.suppressedReason = suppressReason;
      suppressed.push(item);
    } else {
      items.push(item);
    }
  }

  return {
    items,
    suppressed,
    stats: {
      totalTriggersEvaluated: triggers.length,
      queued: items.length,
      suppressed: suppressed.length,
    },
  };
}

// ─── Audience Selection ──────────────────────────────────────────────────────────

/**
 * Select the best-fit audience for a trigger event.
 * Matches claim/trigger keywords against audience painPoints.
 */
export function selectAudience(trigger, tool, audiences) {
  if (!audiences || audiences.length === 0) {
    return { audienceRef: null, audienceName: "General" };
  }

  // Extract keywords from trigger summary and claim statements
  const triggerWords = extractKeywords(trigger.triggerSummary || "");

  // Score each audience by keyword overlap with painPoints
  let bestAudience = audiences[0];
  let bestScore = 0;

  for (const aud of audiences) {
    const painWords = (aud.painPoints || []).flatMap((p) => extractKeywords(p));
    const overlap = triggerWords.filter((w) => painWords.includes(w)).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      bestAudience = aud;
    }
  }

  return {
    audienceRef: bestAudience.id,
    audienceName: bestAudience.name,
  };
}

// ─── Target Selection ────────────────────────────────────────────────────────────

/**
 * Select top N targets, optionally filtered by audience keyword overlap.
 */
export function selectTargets(trigger, audienceRef, audiences, targetsData, topN) {
  if (!targetsData?.candidates || targetsData.candidates.length === 0) {
    return [];
  }

  // Start with candidates sorted by score (they should already be sorted)
  const candidates = [...targetsData.candidates].sort((a, b) => b.score - a.score);

  return candidates.slice(0, topN).map((c) => ({
    owner: c.owner,
    repo: c.repo,
    fullName: c.fullName,
    score: c.score,
    ownerType: c.ownerType,
    whyMatched: c.whyMatched || [],
  }));
}

// ─── Template Selection ──────────────────────────────────────────────────────────

/**
 * Pick the best outreach template variant based on trigger and target types.
 */
export function selectTemplate(trigger, targets, marketingData) {
  // High-priority claim changes with press data → journalist template
  if (
    trigger.priority === "high" &&
    trigger.triggerCategory === "claim-change" &&
    marketingData.tool?.press?.boilerplate
  ) {
    if (marketingData.outreachFiles.includes("email-journalist.md")) {
      return "email-journalist";
    }
  }

  // Determine by primary target type
  if (targets.length > 0) {
    const primaryTarget = targets[0];
    if (primaryTarget.ownerType === "Organization") {
      return "email-partner";
    }
    if (primaryTarget.ownerType === "User") {
      return "dm-short";
    }
  }

  return "email-integrator";
}

// ─── Subject Line Generation ─────────────────────────────────────────────────────

/**
 * Generate deterministic subject line suggestions.
 * Pure string templating — no LLM.
 */
export function generateSubjectLines(trigger, toolName, claimsUsed) {
  const lines = [];

  switch (trigger.triggerCategory) {
    case "claim-change":
      if (claimsUsed.length > 0) {
        lines.push(`${toolName}: ${claimsUsed[0].statement} (verified)`);
        lines.push(`New proven claim for ${toolName}`);
      }
      break;
    case "evidence-added":
      lines.push(`${toolName}: new evidence backing our claims`);
      lines.push(`Fresh proof for ${toolName}`);
      break;
    case "release-published":
      lines.push(`${toolName}: new release with updated capabilities`);
      lines.push(`${toolName} just shipped — here's what's new`);
      break;
    case "presskit-material":
      lines.push(`${toolName}: updated positioning and messaging`);
      lines.push(`What's new with ${toolName}`);
      break;
  }

  // Always have at least one
  if (lines.length === 0) {
    lines.push(`Update from ${toolName}`);
  }

  return lines.slice(0, 2);
}

// ─── Go-Link Selection ──────────────────────────────────────────────────────────

/**
 * Pick the most relevant go-link CTA for a trigger.
 */
export function selectGoLink(trigger, linksData, slug, config) {
  if (!linksData || !Array.isArray(linksData)) {
    return { goLink: null, goLinkUrl: null };
  }

  const slugLinks = linksData.filter((l) => l.slug === slug);
  if (slugLinks.length === 0) {
    return { goLink: null, goLinkUrl: null };
  }

  // Prefer channel-specific go-links based on trigger
  const channelPrefs = {
    "claim-change": "github",
    "evidence-added": "github",
    "release-published": "npm",
    "presskit-material": "web",
  };

  const preferredChannel = channelPrefs[trigger.triggerCategory] || "github";
  const preferred = slugLinks.find((l) => l.channel === preferredChannel);
  const link = preferred || slugLinks[0];

  return {
    goLink: link.id,
    goLinkUrl: `https://mcptoolshop.com/go/${link.id}/`,
  };
}

// ─── Claims Extraction ──────────────────────────────────────────────────────────

/**
 * Get the proven claims referenced by a trigger event.
 */
function getClaimsUsed(trigger, tool) {
  if (!tool?.claims || !trigger.claimIds || trigger.claimIds.length === 0) {
    return [];
  }

  return trigger.claimIds
    .map((id) => tool.claims.find((c) => c.id === id))
    .filter((c) => c && c.status === "proven")
    .map((c) => ({ id: c.id, status: c.status, statement: c.statement }));
}

// ─── Suppression Rules ──────────────────────────────────────────────────────────

/**
 * Check if an item should be suppressed.
 * Returns the reason string, or null if not suppressed.
 */
function checkSuppression(item, history, policy, now) {
  // Quiet hours
  if (policy.quietHours) {
    const { start, end } = policy.quietHours;
    const hour = new Date(now).getUTCHours();
    const startHour = parseInt(start.split(":")[0], 10);
    const endHour = parseInt(end.split(":")[0], 10);

    // Simple UTC-based check (ignores timezone for determinism in tests)
    if (startHour > endHour) {
      // Crosses midnight: e.g., 22:00 → 08:00
      if (hour >= startHour || hour < endHour) {
        return "quiet-hours";
      }
    } else {
      if (hour >= startHour && hour < endHour) {
        return "quiet-hours";
      }
    }
  }

  // Rate limit: maxPerToolPerWeek
  if (policy.maxPerToolPerWeek) {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const recentForSlug = history.entries.filter(
      (e) => e.slug === item.slug && e.queuedAt > weekAgo
    );
    if (recentForSlug.length >= policy.maxPerToolPerWeek) {
      return "rate-limit";
    }
  }

  // Dedup: same {slug, triggerCategory, targetFullName} within window
  if (policy.dedupeWindowDays) {
    const windowStart = new Date(
      Date.now() - policy.dedupeWindowDays * 86400000
    ).toISOString();
    const itemTargetNames = (item.targets || []).map((t) => `${t.owner}/${t.repo}`);

    for (const entry of history.entries) {
      if (
        entry.slug === item.slug &&
        entry.triggerCategory === item.triggerCategory &&
        entry.queuedAt > windowStart
      ) {
        // Check if any target overlaps
        const overlap = itemTargetNames.some((n) =>
          entry.targetFullNames.includes(n)
        );
        if (overlap) return "dedup";
      }
    }
  }

  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

/**
 * Extract lowercase keywords (3+ chars) from text for matching.
 */
function extractKeywords(text) {
  return (text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
}
