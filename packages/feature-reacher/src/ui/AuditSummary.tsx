"use client";

/**
 * Audit Summary Component
 *
 * Displays headline insight and key statistics.
 */

import type { AuditSummary as AuditSummaryType } from "@/analysis";

interface AuditSummaryProps {
  summary: AuditSummaryType;
  headline: string;
}

export function AuditSummary({ summary, headline }: AuditSummaryProps) {
  const hasRisk =
    summary.byRiskLevel.critical > 0 ||
    summary.byRiskLevel.high > 0 ||
    summary.byRiskLevel.medium > 0;

  return (
    <div className="space-y-4">
      {/* Scope boundary banner */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-800 dark:bg-amber-900/20">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <span className="font-medium">Scope:</span> This audit is based on
          provided artifacts only (no live usage telemetry).
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header with Audit ID */}
        <div className="flex items-start justify-between gap-4">
          <h2
            className={`text-2xl font-bold ${
              summary.byRiskLevel.critical > 0
                ? "text-red-600 dark:text-red-400"
                : summary.byRiskLevel.high > 0
                  ? "text-orange-600 dark:text-orange-400"
                  : hasRisk
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-green-600 dark:text-green-400"
            }`}
          >
            {headline}
          </h2>
          <div className="flex-shrink-0 rounded bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {summary.auditId}
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBox
            label="Features Analyzed"
            value={summary.totalFeatures}
            color="zinc"
          />
          <StatBox
            label="Critical Risk"
            value={summary.byRiskLevel.critical}
            color="red"
          />
          <StatBox
            label="High Risk"
            value={summary.byRiskLevel.high}
            color="orange"
          />
          <StatBox
            label="Medium Risk"
            value={summary.byRiskLevel.medium}
            color="yellow"
          />
        </div>

        {/* Risk factors */}
        {summary.topRiskFactors.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Top Risk Factors
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {summary.topRiskFactors.map((factor, i) => (
                <span
                  key={i}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
          <span>{summary.artifactsAnalyzed} artifacts analyzed</span>
          <span>{summary.totalEvidence} evidence points</span>
          <span>
            Analyzed {new Date(summary.analyzedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "zinc" | "red" | "orange" | "yellow" | "green";
}) {
  const colorStyles = {
    zinc: "text-zinc-900 dark:text-zinc-100",
    red: "text-red-600 dark:text-red-400",
    orange: "text-orange-600 dark:text-orange-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    green: "text-green-600 dark:text-green-400",
  };

  return (
    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
      <div className={`text-2xl font-bold ${colorStyles[color]}`}>{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
