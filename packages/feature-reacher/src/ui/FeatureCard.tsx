"use client";

/**
 * Feature Card Component
 *
 * Displays a single feature with its diagnosis and supporting evidence.
 * Includes explainability drawer showing confidence factors.
 */

import type { RankedFeature } from "@/analysis";
import { getActionsForDiagnosis } from "@/analysis";
import { RiskBadge } from "./RiskBadge";
import { ActionList } from "./ActionList";

interface FeatureCardProps {
  rankedFeature: RankedFeature;
  expanded?: boolean;
  onToggle?: () => void;
}

export function FeatureCard({
  rankedFeature,
  expanded = false,
  onToggle,
}: FeatureCardProps) {
  const { feature, primaryDiagnosis, score, evidence, riskLevel, riskScore } =
    rankedFeature;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {feature.name}
            </h3>
            <RiskBadge level={riskLevel} />
          </div>
          {primaryDiagnosis && (
            <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {primaryDiagnosis.title}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {Math.round(riskScore * 100)}%
          </div>
          <div className="text-xs text-zinc-500">Risk Score</div>
        </div>
      </div>

      {/* Diagnosis explanation */}
      {primaryDiagnosis && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {primaryDiagnosis.explanation}
        </p>
      )}

      {/* Toggle button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
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
          {expanded ? "Hide explainability details" : "Show explainability details"}
        </button>
      )}

      {/* Expanded explainability drawer */}
      {expanded && (
        <div className="mt-4 space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          {/* Score breakdown with factor details */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Score Breakdown
            </h4>
            <div className="mt-3 space-y-4">
              <ScoreSection
                title="Recency"
                score={score.recency.score}
                explanation={score.recency.explanation}
                factors={score.recency.factors}
              />
              <ScoreSection
                title="Visibility"
                score={score.visibility.score}
                explanation={score.visibility.explanation}
                factors={score.visibility.factors}
              />
              <ScoreSection
                title="Documentation Density"
                score={score.documentationDensity.score}
                explanation={score.documentationDensity.explanation}
                factors={score.documentationDensity.factors}
              />
            </div>
          </div>

          {/* Confidence indicator */}
          {primaryDiagnosis && (
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Confidence: {Math.round(primaryDiagnosis.confidence * 100)}%
              </h4>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {primaryDiagnosis.confidence >= 0.8
                  ? "High confidence: Strong evidence supports this diagnosis"
                  : primaryDiagnosis.confidence >= 0.6
                    ? "Moderate confidence: Evidence is suggestive but not definitive"
                    : "Lower confidence: Limited evidence, consider manual review"}
              </p>
              <div className="mt-2 text-xs text-zinc-500">
                <span className="font-medium">What lowers confidence:</span>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {score.recency.score < 0.5 && evidence.length < 3 && (
                    <li>Limited evidence points ({evidence.length})</li>
                  )}
                  {score.visibility.score > 0.6 && score.recency.score < 0.4 && (
                    <li>Mixed signals (visible but stale)</li>
                  )}
                  {evidence.every((e) => (e.confidence ?? 0.5) < 0.7) && (
                    <li>Extraction confidence is moderate</li>
                  )}
                  {evidence.length === 0 && <li>No direct evidence found</li>}
                </ul>
              </div>
            </div>
          )}

          {/* Triggering signals */}
          {primaryDiagnosis && primaryDiagnosis.triggeringSignals.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Why This Was Flagged
              </h4>
              <ul className="mt-2 space-y-1">
                {primaryDiagnosis.triggeringSignals.map((signal, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Supporting evidence */}
          {evidence.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Evidence Excerpts ({evidence.length})
              </h4>
              <div className="mt-2 space-y-2">
                {evidence.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className="rounded border border-zinc-200 bg-zinc-50 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                        {e.location ?? e.signalType}
                      </span>
                      {e.confidence && (
                        <span className="text-xs text-zinc-400">
                          {Math.round(e.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-zinc-700 dark:text-zinc-300">
                      &ldquo;{truncate(e.excerpt, 150)}&rdquo;
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended actions */}
          {primaryDiagnosis && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Recommended Actions
              </h4>
              <div className="mt-2">
                <ActionList
                  actions={getActionsForDiagnosis(
                    primaryDiagnosis.type,
                    primaryDiagnosis.severity
                  ).slice(0, 2)}
                  featureName={feature.name}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreSection({
  title,
  score,
  explanation,
  factors,
}: {
  title: string;
  score: number;
  explanation: string;
  factors: { name: string; explanation: string; contribution: number; weight: number }[];
}) {
  const percentage = Math.round(score * 100);

  return (
    <div className="rounded border border-zinc-200 p-3 dark:border-zinc-700">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {title}
        </span>
        <span
          className={`text-sm font-bold ${
            score >= 0.7
              ? "text-green-600"
              : score >= 0.4
                ? "text-yellow-600"
                : "text-red-600"
          }`}
        >
          {percentage}%
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className={`h-1.5 rounded-full ${
            score >= 0.7 ? "bg-green-500" : score >= 0.4 ? "bg-yellow-500" : "bg-red-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-zinc-500">{explanation}</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
          Factor details
        </summary>
        <ul className="mt-1 space-y-1 pl-2 text-xs text-zinc-500">
          {factors.map((f, i) => (
            <li key={i}>
              <span className="font-medium">{f.name}:</span> {f.explanation}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
