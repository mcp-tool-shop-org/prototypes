import { useMemo, useState } from "react";
import type { CommandPlan, PlanReview } from "@commandui/domain";

// ---------------------------------------------------------------------------
// Risk knowledge base -- maps command patterns to structured guidance
// ---------------------------------------------------------------------------

type RiskSignal = {
  pattern: RegExp;
  label: string;
  tier: "low" | "medium" | "high";
  systems: string[];
  consequences: string[];
  checks: string[];
};

const RISK_SIGNALS: RiskSignal[] = [
  // -- High risk --
  {
    pattern: /\brm\s+(-[rRf]+\s+)*\//,
    label: "Recursive delete from root",
    tier: "high",
    systems: ["filesystem"],
    consequences: [
      "Permanently deletes files and directories",
      "Cannot be undone without backups",
      "May remove system-critical paths",
    ],
    checks: [
      "Verify the target path is correct",
      "Confirm backups exist for important data",
      "Consider using --dry-run or -i (interactive) first",
    ],
  },
  {
    pattern: /\brm\s+(-[rRf]+)/,
    label: "Recursive / forced delete",
    tier: "high",
    systems: ["filesystem"],
    consequences: [
      "Permanently deletes matching files and directories",
      "Force flag suppresses confirmation prompts",
    ],
    checks: [
      "Double-check the target path",
      "List contents first with ls to verify scope",
      "Ensure nothing critical lives in the target tree",
    ],
  },
  {
    pattern: /\bgit\s+push\s+.*--force/,
    label: "Force push",
    tier: "high",
    systems: ["git", "remote repository"],
    consequences: [
      "Overwrites remote branch history",
      "Other contributors may lose commits",
      "CI pipelines may break if history diverges",
    ],
    checks: [
      "Confirm no one else has pushed to this branch",
      "Consider --force-with-lease instead",
      "Check if branch protection rules allow force push",
    ],
  },
  {
    pattern: /\bgit\s+reset\s+--hard/,
    label: "Hard reset",
    tier: "high",
    systems: ["git", "working tree"],
    consequences: [
      "Discards all uncommitted changes permanently",
      "Moves HEAD and index to the target commit",
      "Staged and unstaged work is lost",
    ],
    checks: [
      "Run git stash first to preserve work",
      "Verify the target ref is correct",
      "Check git diff to see what will be lost",
    ],
  },
  {
    pattern: /\b(DROP\s+(TABLE|DATABASE)|TRUNCATE)\b/i,
    label: "Destructive SQL",
    tier: "high",
    systems: ["database"],
    consequences: [
      "Permanently removes data or schema objects",
      "May cascade to dependent tables/views",
      "Cannot be rolled back outside a transaction",
    ],
    checks: [
      "Confirm you are on the correct database/environment",
      "Verify a recent backup exists",
      "Wrap in a transaction if the engine supports it",
    ],
  },
  {
    pattern: /\bchmod\s+777\b/,
    label: "World-writable permissions",
    tier: "high",
    systems: ["filesystem", "security"],
    consequences: [
      "Any user on the system can read, write, and execute",
      "Potential security vulnerability in shared environments",
    ],
    checks: [
      "Use more restrictive permissions (e.g. 755 or 644)",
      "Verify this is not a production or shared server",
    ],
  },
  {
    pattern: /\bcurl\b.*\|\s*(ba)?sh/,
    label: "Pipe remote script to shell",
    tier: "high",
    systems: ["network", "shell"],
    consequences: [
      "Executes arbitrary code from a remote URL",
      "No opportunity to review before execution",
      "Source may change between inspections",
    ],
    checks: [
      "Download the script first and review it",
      "Verify the URL is from a trusted source",
      "Check if a package manager alternative exists",
    ],
  },
  {
    pattern: /\bsudo\b/,
    label: "Elevated privileges",
    tier: "medium",
    systems: ["system", "security"],
    consequences: [
      "Runs with superuser permissions",
      "Mistakes affect the entire system",
      "May modify protected system files",
    ],
    checks: [
      "Verify the command actually needs root",
      "Check the target paths are correct",
      "Consider if a user-level alternative exists",
    ],
  },
  // -- Medium risk --
  {
    pattern: /\bgit\s+checkout\s+\./,
    label: "Discard working tree changes",
    tier: "medium",
    systems: ["git", "working tree"],
    consequences: [
      "Reverts all modified tracked files to last commit",
      "Unstaged changes are permanently lost",
    ],
    checks: [
      "Run git diff to see what will be discarded",
      "Stash changes if you might want them later",
    ],
  },
  {
    pattern: /\bgit\s+clean\s+-[fdx]+/,
    label: "Remove untracked files",
    tier: "medium",
    systems: ["git", "filesystem"],
    consequences: [
      "Deletes untracked files from the working tree",
      "May remove build artifacts, local configs, or generated files",
    ],
    checks: [
      "Run git clean -n (dry run) first",
      "Check .gitignore covers files you want to keep",
    ],
  },
  {
    pattern: /\bnpm\s+(publish|unpublish)\b/,
    label: "Package registry publish",
    tier: "medium",
    systems: ["npm registry", "package"],
    consequences: [
      "Makes the package version publicly available (or removes it)",
      "Unpublish has a 72-hour window, then it is permanent",
    ],
    checks: [
      "Verify package.json version is correct",
      "Run npm pack and inspect the tarball first",
      "Confirm you are logged into the correct registry",
    ],
  },
  {
    pattern: /\bdocker\s+(rm|rmi|system\s+prune)\b/,
    label: "Docker resource removal",
    tier: "medium",
    systems: ["docker", "containers"],
    consequences: [
      "Removes containers, images, or unused resources",
      "Dangling data volumes may be affected by prune",
    ],
    checks: [
      "List resources first (docker ps -a / docker images)",
      "Verify no running services depend on these resources",
    ],
  },
  {
    pattern: /\bmkfs\b/,
    label: "Format filesystem",
    tier: "high",
    systems: ["disk", "filesystem"],
    consequences: [
      "Erases all data on the target partition",
      "Creates a new empty filesystem",
    ],
    checks: [
      "Triple-check the device path (e.g. /dev/sdX)",
      "Verify no critical data exists on the target",
      "Unmount the device first",
    ],
  },
  {
    pattern: /\bkill\s+-9\b/,
    label: "Force kill process",
    tier: "medium",
    systems: ["processes"],
    consequences: [
      "Immediately terminates the process with no cleanup",
      "Open files may be left in a corrupt state",
      "Child processes may become orphaned",
    ],
    checks: [
      "Try SIGTERM (kill without -9) first",
      "Verify the PID belongs to the intended process",
    ],
  },
  // -- Low risk with notes --
  {
    pattern: /\bgit\s+stash\s+drop\b/,
    label: "Drop stash entry",
    tier: "low",
    systems: ["git"],
    consequences: ["Permanently removes a stash entry"],
    checks: ["Verify the stash index is correct with git stash list"],
  },
];

// ---------------------------------------------------------------------------
// Analysis engine
// ---------------------------------------------------------------------------

export type GuidanceAnalysis = {
  overallTier: "low" | "medium" | "high";
  signals: {
    label: string;
    tier: "low" | "medium" | "high";
    systems: string[];
    consequences: string[];
    checks: string[];
  }[];
  affectedSystems: string[];
  allChecks: string[];
  planFlags: string[];
};

/**
 * Analyze a command string (and optionally a CommandPlan) to produce
 * structured guidance for the user.
 */
export function analyzeCommand(
  command: string,
  plan?: CommandPlan | null,
  review?: PlanReview | null,
): GuidanceAnalysis {
  const matched = RISK_SIGNALS.filter((s) => s.pattern.test(command));

  // Determine overall tier: highest matched signal, or fall back to plan risk
  let overallTier: "low" | "medium" | "high" = plan?.risk ?? "low";
  const tierRank = { low: 0, medium: 1, high: 2 };
  for (const m of matched) {
    if (tierRank[m.tier] > tierRank[overallTier]) {
      overallTier = m.tier;
    }
  }

  // Collect affected systems (deduplicated)
  const systemSet = new Set<string>();
  for (const m of matched) {
    for (const s of m.systems) systemSet.add(s);
  }
  // Add plan-level signals
  if (plan?.touchesFiles) systemSet.add("filesystem");
  if (plan?.touchesNetwork) systemSet.add("network");
  if (plan?.escalatesPrivileges) systemSet.add("security");

  // Merge checks
  const checkSet = new Set<string>();
  for (const m of matched) {
    for (const c of m.checks) checkSet.add(c);
  }

  // Plan-level flags (safety + ambiguity from PlanReview)
  const planFlags: string[] = [];
  if (review) {
    for (const f of review.safetyFlags) planFlags.push(f);
    for (const f of review.ambiguityFlags) planFlags.push(f);
  }
  if (plan?.destructive) planFlags.push("Command is flagged as destructive");

  return {
    overallTier,
    signals: matched.map((m) => ({
      label: m.label,
      tier: m.tier,
      systems: m.systems,
      consequences: m.consequences,
      checks: m.checks,
    })),
    affectedSystems: [...systemSet],
    allChecks: [...checkSet],
    planFlags,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  command: string;
  plan?: CommandPlan | null;
  review?: PlanReview | null;
  /** Explanation from the planner (shown as the "what it does" summary) */
  explanation?: string;
  /** Collapse the guidance by default when risk is low */
  autoCollapseOnLow?: boolean;
  /** Called when the user clicks "I've reviewed this" */
  onAcknowledge?: () => void;
};

const TIER_LABELS: Record<string, string> = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
};

const TIER_ICONS: Record<string, string> = {
  low: "\u2713",    // checkmark
  medium: "\u26A0", // warning
  high: "\u2716",   // cross/stop
};

export function CommandGuidance({
  command,
  plan,
  review,
  explanation,
  autoCollapseOnLow = true,
  onAcknowledge,
}: Props) {
  const analysis = useMemo(
    () => analyzeCommand(command, plan, review),
    [command, plan, review],
  );

  const [collapsed, setCollapsed] = useState(
    autoCollapseOnLow && analysis.overallTier === "low",
  );
  const [acknowledged, setAcknowledged] = useState(false);

  // If the command changes, reset acknowledgement
  useMemo(() => {
    setAcknowledged(false);
    setCollapsed(autoCollapseOnLow && analysis.overallTier === "low");
  }, [command, analysis.overallTier, autoCollapseOnLow]);

  const showGuidance = analysis.signals.length > 0 || analysis.planFlags.length > 0;

  if (!showGuidance && analysis.overallTier === "low") {
    // Nothing risky detected -- no guidance surface needed
    return null;
  }

  function handleAcknowledge() {
    setAcknowledged(true);
    onAcknowledge?.();
  }

  return (
    <div
      className={`cmd-guidance cmd-guidance--${analysis.overallTier}`}
      role="region"
      aria-label="Command guidance"
    >
      {/* -- Header bar -- */}
      <button
        type="button"
        className="cmd-guidance-header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className={`cmd-guidance-icon cmd-guidance-icon--${analysis.overallTier}`}>
          {TIER_ICONS[analysis.overallTier]}
        </span>
        <span className="cmd-guidance-title">
          {TIER_LABELS[analysis.overallTier]}
        </span>
        {analysis.affectedSystems.length > 0 && (
          <span className="cmd-guidance-systems">
            {analysis.affectedSystems.join(" / ")}
          </span>
        )}
        <span className="cmd-guidance-chevron">
          {collapsed ? "\u25B6" : "\u25BC"}
        </span>
      </button>

      {/* -- Expanded body -- */}
      {!collapsed && (
        <div className="cmd-guidance-body">
          {/* What it does */}
          {explanation && (
            <div className="cmd-guidance-section">
              <span className="cmd-guidance-label">What it does</span>
              <p className="cmd-guidance-text">{explanation}</p>
            </div>
          )}

          {/* Matched risk signals */}
          {analysis.signals.length > 0 && (
            <div className="cmd-guidance-section">
              <span className="cmd-guidance-label">Risk signals</span>
              <div className="cmd-guidance-signals">
                {analysis.signals.map((sig, i) => (
                  <div key={i} className="cmd-guidance-signal">
                    <div className="cmd-guidance-signal-header">
                      <span className={`risk-badge risk-${sig.tier}`}>
                        {sig.tier}
                      </span>
                      <span className="cmd-guidance-signal-label">
                        {sig.label}
                      </span>
                    </div>
                    <ul className="cmd-guidance-consequences">
                      {sig.consequences.map((c, j) => (
                        <li key={j}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan-level flags */}
          {analysis.planFlags.length > 0 && (
            <div className="cmd-guidance-section">
              <span className="cmd-guidance-label">Planner flags</span>
              <ul className="cmd-guidance-flags">
                {analysis.planFlags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Pre-flight checks */}
          {analysis.allChecks.length > 0 && (
            <div className="cmd-guidance-section">
              <span className="cmd-guidance-label">Check before running</span>
              <ul className="cmd-guidance-checks">
                {analysis.allChecks.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Acknowledge button for medium/high */}
          {analysis.overallTier !== "low" && (
            <div className="cmd-guidance-ack">
              {acknowledged ? (
                <span className="cmd-guidance-ack-done">Reviewed</span>
              ) : (
                <button
                  type="button"
                  className="cmd-guidance-ack-btn"
                  onClick={handleAcknowledge}
                >
                  I have reviewed the risks
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
