import { useMemo, useState } from "react";
import {
  classifyGuidance,
  type GuidanceResult,
  type ImpactArea,
  type PreFlightCheck,
} from "./classifyGuidance";
import "./commandGuidance.css";

type CommandPlanSlice = {
  command: string;
  risk: "low" | "medium" | "high";
  destructive: boolean;
  touchesFiles: boolean;
  touchesNetwork: boolean;
  escalatesPrivileges: boolean;
  assumptions: string[];
  explanation: string;
  source: "raw" | "semantic";
};

type Props = {
  plan: CommandPlanSlice;
};

/**
 * CommandGuidance — pre-execution briefing surface for semantic commands.
 *
 * Renders structured guidance (impact areas, risk explanation, pre-flight
 * checks, cautions) derived from a CommandPlan. Read-only and advisory:
 * the terminal remains the authoritative execution surface.
 *
 * Only renders for semantic-mode plans with meaningful guidance signal.
 */
export function CommandGuidance({ plan }: Props) {
  const guidance = useMemo(() => classifyGuidance(plan), [plan]);
  const [expanded, setExpanded] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  if (!guidance.hasGuidance) return null;

  function toggleCheck(id: string) {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const hasDetails =
    guidance.preFlightChecks.length > 0 ||
    guidance.cautions.length > 0 ||
    plan.assumptions.length > 0;

  return (
    <div className="cmd-guidance">
      {/* Risk tier + explanation — always visible */}
      <div className="cmd-guidance-risk-row">
        <span className={`risk-badge risk-${plan.risk}`}>{plan.risk} risk</span>
        <span className="cmd-guidance-risk-text">{guidance.riskExplanation}</span>
      </div>

      {/* Impact areas — always visible when present */}
      {guidance.impactAreas.length > 0 && (
        <div className="cmd-guidance-impacts">
          <span className="cmd-guidance-section-label">Affected areas</span>
          <div className="cmd-guidance-impact-list">
            {guidance.impactAreas.map((area, i) => (
              <ImpactTag key={i} area={area} />
            ))}
          </div>
        </div>
      )}

      {/* Expandable detail section */}
      {hasDetails && (
        <>
          <button
            type="button"
            className="cmd-guidance-expand-btn"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? "Hide details" : "Review suggested pre-flight checks"}
            <span
              className="cmd-guidance-chevron"
              data-expanded={expanded}
            />
          </button>

          {expanded && (
            <div className="cmd-guidance-detail">
              {/* Pre-flight checks */}
              {guidance.preFlightChecks.length > 0 && (
                <div className="cmd-guidance-checks">
                  <span className="cmd-guidance-section-label">
                    Suggested pre-flight checks
                  </span>
                  {guidance.preFlightChecks.map((check) => (
                    <label key={check.id} className="cmd-guidance-check-row">
                      <input
                        type="checkbox"
                        checked={checks[check.id] ?? false}
                        onChange={() => toggleCheck(check.id)}
                      />
                      <span>{check.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Assumptions from planner */}
              {plan.assumptions.length > 0 && (
                <div className="cmd-guidance-assumptions">
                  <span className="cmd-guidance-section-label">
                    Planner assumptions
                  </span>
                  <ul className="cmd-guidance-assumption-list">
                    {plan.assumptions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cautions */}
              {guidance.cautions.length > 0 && (
                <div className="cmd-guidance-cautions">
                  {guidance.cautions.map((c, i) => (
                    <div key={i} className="cmd-guidance-caution">
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Single impact tag — colored by severity */
function ImpactTag({ area }: { area: ImpactArea }) {
  return (
    <div className={`cmd-guidance-impact cmd-guidance-impact--${area.severity}`}>
      <span className="cmd-guidance-impact-label">{area.label}</span>
      <span className="cmd-guidance-impact-detail">{area.detail}</span>
    </div>
  );
}
