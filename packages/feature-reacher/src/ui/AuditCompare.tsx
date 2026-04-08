"use client";

import type { AuditDiff, FeatureDiff } from "../analysis/diff";

interface AuditCompareProps {
  diff: AuditDiff;
}

/**
 * Main compare view showing diff between two audits.
 */
export function AuditCompare({ diff }: AuditCompareProps) {
  return (
    <div className="space-y-6">
      {/* Header summary tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          label="New Risks"
          value={diff.summary.newRisks}
          color="red"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <SummaryTile
          label="Resolved Risks"
          value={diff.summary.resolvedRisks}
          color="green"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <SummaryTile
          label="Risk Increases"
          value={diff.summary.riskIncreases}
          color="orange"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <SummaryTile
          label="Risk Decreases"
          value={diff.summary.riskDecreases}
          color="blue"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          }
        />
      </div>

      {/* Headline */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {diff.headline}
        </h2>
        <div className="mt-2 flex items-center gap-4 text-sm text-zinc-500">
          <span>
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
              {diff.baseAuditId}
            </code>
            <span className="mx-2">→</span>
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
              {diff.compareAuditId}
            </code>
          </span>
        </div>
      </div>

      {/* Biggest movers */}
      {diff.biggestMovers.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Biggest Movers
          </h3>
          <div className="space-y-3">
            {diff.biggestMovers.map((change) => (
              <FeatureDiffCard key={change.featureId} diff={change} />
            ))}
          </div>
        </div>
      )}

      {/* All changes by category */}
      <div className="space-y-6">
        {/* Added features */}
        {diff.allChanges.filter((d) => d.changeType === "added").length > 0 && (
          <ChangeSection
            title="Added Features"
            changes={diff.allChanges.filter((d) => d.changeType === "added")}
            color="blue"
          />
        )}

        {/* Removed features */}
        {diff.allChanges.filter((d) => d.changeType === "removed").length > 0 && (
          <ChangeSection
            title="Removed Features"
            changes={diff.allChanges.filter((d) => d.changeType === "removed")}
            color="gray"
          />
        )}

        {/* Risk increases */}
        {diff.allChanges.filter((d) => d.changeType === "risk_increased").length > 0 && (
          <ChangeSection
            title="Risk Increased"
            changes={diff.allChanges.filter((d) => d.changeType === "risk_increased")}
            color="orange"
          />
        )}

        {/* Risk decreases */}
        {diff.allChanges.filter((d) => d.changeType === "risk_decreased").length > 0 && (
          <ChangeSection
            title="Risk Decreased"
            changes={diff.allChanges.filter((d) => d.changeType === "risk_decreased")}
            color="green"
          />
        )}

        {/* Diagnosis changes */}
        {diff.allChanges.filter((d) => d.changeType === "diagnosis_changed").length > 0 && (
          <ChangeSection
            title="Diagnosis Changed"
            changes={diff.allChanges.filter((d) => d.changeType === "diagnosis_changed")}
            color="purple"
          />
        )}

        {/* Unchanged (collapsible) */}
        {diff.summary.unchangedFeatures > 0 && (
          <details className="group rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <summary className="cursor-pointer p-4 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 transition-transform group-open:rotate-90"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {diff.summary.unchangedFeatures} unchanged features
              </span>
            </summary>
            <div className="border-t border-zinc-200 p-4 dark:border-zinc-700">
              <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                {diff.allChanges
                  .filter((d) => d.changeType === "unchanged")
                  .map((d) => (
                    <li key={d.featureId}>{d.featureName}</li>
                  ))}
              </ul>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

interface SummaryTileProps {
  label: string;
  value: number;
  color: "red" | "green" | "orange" | "blue";
  icon: React.ReactNode;
}

function SummaryTile({ label, value, color, icon }: SummaryTileProps) {
  const colorClasses = {
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300",
    green: "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300",
    orange: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-900/20 dark:text-orange-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-300",
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm opacity-80">{label}</div>
        </div>
      </div>
    </div>
  );
}

interface ChangeSectionProps {
  title: string;
  changes: FeatureDiff[];
  color: "red" | "green" | "orange" | "blue" | "purple" | "gray";
}

function ChangeSection({ title, changes, color }: ChangeSectionProps) {
  const headerColors = {
    red: "text-red-700 dark:text-red-300",
    green: "text-green-700 dark:text-green-300",
    orange: "text-orange-700 dark:text-orange-300",
    blue: "text-blue-700 dark:text-blue-300",
    purple: "text-purple-700 dark:text-purple-300",
    gray: "text-zinc-700 dark:text-zinc-300",
  };

  return (
    <div>
      <h3 className={`mb-3 text-sm font-semibold ${headerColors[color]}`}>
        {title} ({changes.length})
      </h3>
      <div className="space-y-2">
        {changes.map((change) => (
          <FeatureDiffCard key={change.featureId} diff={change} compact />
        ))}
      </div>
    </div>
  );
}

interface FeatureDiffCardProps {
  diff: FeatureDiff;
  compact?: boolean;
}

function FeatureDiffCard({ diff, compact = false }: FeatureDiffCardProps) {
  const getChangeIcon = () => {
    switch (diff.changeType) {
      case "added":
        return (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </span>
        );
      case "removed":
        return (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </span>
        );
      case "risk_increased":
        return (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </span>
        );
      case "risk_decreased":
        return (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        );
      case "diagnosis_changed":
        return (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </span>
        );
      default:
        return null;
    }
  };

  const getRiskBadge = (level: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[level] || colors.low}`}>
        {level}
      </span>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        {getChangeIcon()}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {diff.featureName}
          </span>
        </div>
        {diff.before && diff.after && (
          <div className="flex items-center gap-2">
            {getRiskBadge(diff.before.riskLevel)}
            <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            {getRiskBadge(diff.after.riskLevel)}
          </div>
        )}
        {!diff.before && diff.after && getRiskBadge(diff.after.riskLevel)}
        {diff.before && !diff.after && (
          <span className="text-xs text-zinc-500 line-through">{diff.before.riskLevel}</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        {getChangeIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
            {diff.featureName}
          </h4>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {diff.changeSummary}
          </p>

          {/* Before/After comparison */}
          {diff.before && diff.after && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="rounded border border-zinc-200 p-2 dark:border-zinc-700">
                <div className="text-xs font-medium text-zinc-500">Before</div>
                <div className="mt-1 flex items-center gap-2">
                  {getRiskBadge(diff.before.riskLevel)}
                  <span className="text-xs text-zinc-500">
                    {formatDiagnosis(diff.before.diagnosis)}
                  </span>
                </div>
              </div>
              <div className="rounded border border-zinc-200 p-2 dark:border-zinc-700">
                <div className="text-xs font-medium text-zinc-500">After</div>
                <div className="mt-1 flex items-center gap-2">
                  {getRiskBadge(diff.after.riskLevel)}
                  <span className="text-xs text-zinc-500">
                    {formatDiagnosis(diff.after.diagnosis)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDiagnosis(type: string): string {
  return type.replace(/_/g, " ");
}
