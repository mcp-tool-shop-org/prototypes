"use client";

import { useState, useEffect } from "react";
import { useSavedAudits } from "../storage/hooks";
import {
  generateTrendData,
  generateSparklineText,
  type TrendSummary,
  type FeatureTrend,
} from "../analysis/trend";
import { getStorage, type PersistedAudit } from "../storage";

interface FeatureTrendViewProps {
  className?: string;
}

/**
 * Lightweight feature trend view across saved audits.
 */
export function FeatureTrendView({ className = "" }: FeatureTrendViewProps) {
  const { audits, loading: loadingList } = useSavedAudits();
  const [trendData, setTrendData] = useState<TrendSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Load full audits for trend analysis
  useEffect(() => {
    async function loadTrends() {
      if (audits.length === 0) {
        setTrendData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const storage = getStorage();

      // Load all audits
      const fullAudits = await Promise.all(
        audits.map((a) => storage.getAudit(a.id))
      );

      const validAudits = fullAudits.filter((a) => a !== null) as PersistedAudit[];
      const data = generateTrendData(validAudits);
      setTrendData(data);
      setLoading(false);
    }

    if (!loadingList) {
      loadTrends();
    }
  }, [audits, loadingList]);

  if (loading || loadingList) {
    return (
      <div className={`rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="ml-2 text-sm text-zinc-500">Loading trends...</span>
        </div>
      </div>
    );
  }

  if (!trendData || trendData.auditsAnalyzed < 2) {
    return (
      <div className={`rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
          Feature Trends
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          Run at least 2 audits to see trend data.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      {/* Header */}
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Feature Trends
          </h3>
          <span className="text-xs text-zinc-500">
            {trendData.auditsAnalyzed} audits
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {formatDateRange(trendData.dateRange.from, trendData.dateRange.to)}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2 border-b border-zinc-200 p-3 dark:border-zinc-700">
        <TrendStat
          label="Improving"
          value={trendData.improving}
          color="green"
        />
        <TrendStat
          label="Worsening"
          value={trendData.worsening}
          color="red"
        />
        <TrendStat
          label="Stable"
          value={trendData.stable}
          color="zinc"
        />
        <TrendStat
          label="New"
          value={trendData.newFeatures}
          color="blue"
        />
      </div>

      {/* Feature list */}
      <div className="max-h-80 overflow-y-auto">
        {trendData.featureTrends.length === 0 ? (
          <div className="p-4 text-center text-sm text-zinc-500">
            No features tracked yet.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {trendData.featureTrends.map((trend, i) => (
              <TrendRow key={i} trend={trend} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


interface TrendStatProps {
  label: string;
  value: number;
  color: "green" | "red" | "zinc" | "blue";
}

function TrendStat({ label, value, color }: TrendStatProps) {
  const colorClasses = {
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
    zinc: "text-zinc-600 dark:text-zinc-400",
    blue: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

interface TrendRowProps {
  trend: FeatureTrend;
}

function TrendRow({ trend }: TrendRowProps) {
  const getDirectionIcon = () => {
    switch (trend.direction) {
      case "improving":
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        );
      case "worsening":
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  const getRiskBadge = () => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    };
    return (
      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors[trend.currentRiskLevel]}`}>
        {trend.currentRiskLevel}
      </span>
    );
  };

  const sparkline = generateSparklineText(trend.points);

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {getDirectionIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {trend.featureName}
          </span>
          {getRiskBadge()}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-mono tracking-wider" title="Risk history (oldest to newest)">
            {sparkline}
          </span>
          {trend.diagnosisChanges > 0 && (
            <span className="text-amber-600">
              {trend.diagnosisChanges} diagnosis change{trend.diagnosisChanges !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function formatDateRange(from: string, to: string): string {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };

  if (fromDate.getFullYear() !== toDate.getFullYear()) {
    return `${fromDate.toLocaleDateString("en-US", { ...opts, year: "numeric" })} - ${toDate.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  }

  return `${fromDate.toLocaleDateString("en-US", opts)} - ${toDate.toLocaleDateString("en-US", opts)}, ${toDate.getFullYear()}`;
}
