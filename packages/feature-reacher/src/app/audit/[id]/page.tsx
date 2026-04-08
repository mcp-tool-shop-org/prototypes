"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAudit } from "@/storage/hooks";
import { AuditSummary, FeatureCard, ExportButtons } from "@/ui";
import { generateHeadline, type AdoptionRiskAudit } from "@/analysis";

export default function AuditViewPage() {
  const params = useParams();
  const id = params.id as string;
  const { audit: persistedAudit, loading, error } = useAudit(id);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading audit...</p>
        </div>
      </div>
    );
  }

  if (error || !persistedAudit) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-5xl px-4 py-6">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to History
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-lg font-medium text-red-900">Audit Not Found</h2>
            <p className="mt-2 text-sm text-red-700">
              {error || "The audit you're looking for doesn't exist or has been deleted."}
            </p>
            <Link
              href="/history"
              className="mt-4 inline-block rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Go to History
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Reconstruct AdoptionRiskAudit from persisted data
  const audit: AdoptionRiskAudit = {
    rankedFeatures: persistedAudit.rankedFeatures,
    summary: persistedAudit.summary,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  href="/history"
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {persistedAudit.name}
                  </h1>
                  <p className="mt-1 text-sm text-zinc-500">
                    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
                      {persistedAudit.auditId}
                    </code>
                    <span className="mx-2">•</span>
                    {new Date(persistedAudit.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/compare?base=${id}`}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Compare
              </Link>
              <ExportButtons audit={audit} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-6">
          {/* Summary */}
          <AuditSummary
            summary={audit.summary}
            headline={generateHeadline(audit)}
          />

          {/* Artifact info */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Source Artifacts ({persistedAudit.artifactRefs.length})
            </h3>
            <ul className="mt-2 space-y-1">
              {persistedAudit.artifactRefs.map((ref) => (
                <li
                  key={ref.id}
                  className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {ref.name}
                  <span className="text-xs text-zinc-400">({ref.charCount.toLocaleString()} chars)</span>
                </li>
              ))}
            </ul>
          </div>

          {/* At-risk features */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              At-Risk Features ({audit.rankedFeatures.filter((rf) => rf.riskLevel !== "low").length})
            </h2>
            <div className="space-y-4">
              {audit.rankedFeatures
                .filter((rf) => rf.riskLevel !== "low")
                .map((rf) => (
                  <FeatureCard
                    key={rf.feature.id}
                    rankedFeature={rf}
                    expanded={expandedFeature === rf.feature.id}
                    onToggle={() =>
                      setExpandedFeature(
                        expandedFeature === rf.feature.id ? null : rf.feature.id
                      )
                    }
                  />
                ))}
              {audit.rankedFeatures.filter((rf) => rf.riskLevel !== "low").length === 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-900/20">
                  <svg
                    className="mx-auto h-10 w-10 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-3 font-medium text-green-800 dark:text-green-300">
                    No significant adoption risks detected
                  </h3>
                </div>
              )}
            </div>
          </div>

          {/* Low risk features (collapsed) */}
          {audit.rankedFeatures.filter((rf) => rf.riskLevel === "low").length > 0 && (
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
                  {audit.rankedFeatures.filter((rf) => rf.riskLevel === "low").length} healthy features (low risk)
                </span>
              </summary>
              <div className="space-y-4 border-t border-zinc-200 p-4 dark:border-zinc-700">
                {audit.rankedFeatures
                  .filter((rf) => rf.riskLevel === "low")
                  .map((rf) => (
                    <FeatureCard
                      key={rf.feature.id}
                      rankedFeature={rf}
                      expanded={expandedFeature === rf.feature.id}
                      onToggle={() =>
                        setExpandedFeature(
                          expandedFeature === rf.feature.id ? null : rf.feature.id
                        )
                      }
                    />
                  ))}
              </div>
            </details>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <p className="text-center text-xs text-zinc-500">
            Feature-Reacher Phase 2 &mdash; Repeatability &amp; Retention
          </p>
        </div>
      </footer>
    </div>
  );
}
