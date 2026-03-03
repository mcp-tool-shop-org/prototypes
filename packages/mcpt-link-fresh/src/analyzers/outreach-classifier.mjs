/**
 * Outreach Classifier
 *
 * Evaluates drift events + presskit changes to determine
 * whether outreach is warranted. Conservative by design:
 * false negatives >> false positives.
 *
 * Trigger categories:
 *   claim-change      — proven claim added or statement changed
 *   evidence-added    — new evidenceRef on existing proven claim
 *   release-published — release notes drift with tag change
 *   presskit-material — tagline/valueProps/oneLiner changed materially
 */

/**
 * @typedef {object} TriggerEvent
 * @property {string} triggerCategory  — claim-change | evidence-added | release-published | presskit-material
 * @property {string} triggerSummary   — human-readable explanation
 * @property {string} priority         — high | normal
 * @property {object} driftRef         — the drift object that triggered this
 * @property {string[]} claimIds       — claim IDs involved (if any)
 */

/**
 * Classify drifts into outreach trigger events.
 *
 * @param {import("../planners/drift-detector.mjs").Drift[]} drifts
 * @param {object} currentPresskit    — current presskit.json
 * @param {object|null} previousPresskit — previous run's presskit snapshot (null = first run)
 * @param {object} config
 * @returns {TriggerEvent[]}
 */
export function classifyDrifts(drifts, currentPresskit, previousPresskit, config) {
  const triggers = [];

  // First run — establish baseline, no triggers
  if (!previousPresskit) return triggers;

  // 1. Claim changes (proven claims only)
  const claimChanges = diffClaims(
    currentPresskit.claims || [],
    previousPresskit.claims || []
  );
  for (const change of claimChanges) {
    triggers.push({
      triggerCategory: "claim-change",
      triggerSummary: `Proven claim ${change.type}: ${change.claim.statement}`,
      priority: "high",
      driftRef: drifts[0] || null,
      claimIds: [change.claim.id],
    });
  }

  // 2. Evidence additions on existing proven claims
  const evidenceChanges = diffEvidence(
    currentPresskit.claims || [],
    previousPresskit.claims || []
  );
  for (const change of evidenceChanges) {
    triggers.push({
      triggerCategory: "evidence-added",
      triggerSummary: `New evidence on "${change.claim.statement}": ${change.newRefs.join(", ")}`,
      priority: "normal",
      driftRef: drifts[0] || null,
      claimIds: [change.claim.id],
    });
  }

  // 3. Release notes drift (only if it signals a new release, not just link refresh)
  const releaseDrift = drifts.find((d) => d.surface === "release" && d.field === "releaseNotes");
  if (releaseDrift) {
    // Check if there's also a metadata drift (suggests real content change, not just link injection)
    const hasMetadataDrift = drifts.some(
      (d) => d.surface === "metadata" && (d.field === "description" || d.field === "homepage")
    );
    if (hasMetadataDrift) {
      triggers.push({
        triggerCategory: "release-published",
        triggerSummary: "Release notes updated alongside metadata changes",
        priority: "normal",
        driftRef: releaseDrift,
        claimIds: [],
      });
    }
  }

  // 4. Material presskit changes (tagline, valueProps, oneLiner)
  const materialChanges = diffPositioning(currentPresskit, previousPresskit);
  for (const change of materialChanges) {
    triggers.push({
      triggerCategory: "presskit-material",
      triggerSummary: `${change.field} changed: "${truncate(change.current, 60)}"`,
      priority: "normal",
      driftRef: drifts[0] || null,
      claimIds: [],
    });
  }

  return triggers;
}

// ─── Diff helpers ────────────────────────────────────────────────────────────────

/**
 * Detect added or changed proven claims.
 * Only considers claims with status "proven".
 */
export function diffClaims(currentClaims, previousClaims) {
  const changes = [];
  const prevById = new Map(previousClaims.map((c) => [c.id, c]));

  for (const claim of currentClaims) {
    if (claim.status !== "proven") continue;

    const prev = prevById.get(claim.id);
    if (!prev) {
      // New proven claim
      changes.push({ type: "added", claim });
    } else if (prev.status !== "proven") {
      // Promoted to proven (was aspirational/deprecated)
      changes.push({ type: "promoted", claim });
    } else if (normalize(prev.statement) !== normalize(claim.statement)) {
      // Statement text changed
      changes.push({ type: "changed", claim });
    }
  }

  return changes;
}

/**
 * Detect new evidence refs on existing proven claims.
 */
export function diffEvidence(currentClaims, previousClaims) {
  const changes = [];
  const prevById = new Map(previousClaims.map((c) => [c.id, c]));

  for (const claim of currentClaims) {
    if (claim.status !== "proven") continue;
    const prev = prevById.get(claim.id);
    if (!prev || prev.status !== "proven") continue;

    const prevRefs = new Set(prev.evidenceRefs || []);
    const newRefs = (claim.evidenceRefs || []).filter((r) => !prevRefs.has(r));

    if (newRefs.length > 0) {
      changes.push({ claim, newRefs });
    }
  }

  return changes;
}

/**
 * Detect material changes in positioning fields.
 */
export function diffPositioning(current, previous) {
  const changes = [];

  // Tagline
  if (isMaterialChange(current.tagline, previous.tagline)) {
    changes.push({ field: "tagline", current: current.tagline, previous: previous.tagline });
  }

  // Value props
  const curProps = (current.valueProps || current.positioning?.valueProps || []).join("|");
  const prevProps = (previous.valueProps || previous.positioning?.valueProps || []).join("|");
  if (isMaterialChange(curProps, prevProps)) {
    changes.push({ field: "valueProps", current: curProps, previous: prevProps });
  }

  // OneLiner (in MarketIR tool format)
  const curOneLiner = current.positioning?.oneLiner || "";
  const prevOneLiner = previous.positioning?.oneLiner || "";
  if (isMaterialChange(curOneLiner, prevOneLiner)) {
    changes.push({ field: "oneLiner", current: curOneLiner, previous: prevOneLiner });
  }

  return changes;
}

/**
 * Check if a text change is material (not just whitespace/casing).
 */
export function isMaterialChange(current, previous) {
  if (!current && !previous) return false;
  if (!current || !previous) return true;
  return normalize(current) !== normalize(previous);
}

/**
 * Normalize text for comparison: trim, collapse whitespace, lowercase.
 */
function normalize(s) {
  if (!s) return "";
  return String(s).trim().replace(/\s+/g, " ").toLowerCase();
}

function truncate(s, max) {
  if (!s) return "(empty)";
  const str = String(s);
  return str.length > max ? str.slice(0, max) + "..." : str;
}
