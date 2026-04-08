"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Artifact } from "@/domain";
import {
  ingestPastedText,
  extractFeaturesFromArtifact,
  mergeExtractionResults,
  scoreAllFeatures,
  diagnoseAllFeatures,
  generateAudit,
  generateHeadline,
  type AdoptionRiskAudit,
} from "@/analysis";
import {
  AuditSummary,
  FeatureCard,
  ExportButtons,
} from "@/ui";
import { getDemoArtifacts } from "@/ui/DemoLoader";

/**
 * Public demo page that auto-loads sample data.
 * Always works without auth—designed for partner reviewers.
 */
export default function DemoPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [audit, setAudit] = useState<AdoptionRiskAudit | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-load demo data on mount
  useEffect(() => {
    const demoArtifacts = getDemoArtifacts();
    const ingested: Artifact[] = [];

    for (const demo of demoArtifacts) {
      try {
        const result = ingestPastedText({ content: demo.content, name: demo.name });
        ingested.push(result.artifact);
      } catch (error) {
        console.error("Failed to ingest demo artifact:", error);
      }
    }

    setArtifacts(ingested);
    setIsLoading(false);
  }, []);

  const runAnalysis = useCallback(() => {
    if (artifacts.length === 0) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      try {
        const extractionResults = artifacts.map((a) =>
          extractFeaturesFromArtifact(a)
        );
        const merged = mergeExtractionResults(extractionResults);

        const scores = scoreAllFeatures(
          merged.features,
          merged.evidence,
          artifacts
        );

        const diagnoses = diagnoseAllFeatures(
          merged.features,
          scores,
          merged.evidence
        );

        const newAudit = generateAudit(
          merged.features,
          scores,
          diagnoses,
          merged.evidence,
          artifacts.length
        );

        setAudit(newAudit);
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 500); // Slight delay for visual feedback
  }, [artifacts]);

  // Auto-run analysis when artifacts are loaded
  useEffect(() => {
    if (artifacts.length > 0 && !audit && !isAnalyzing && !isLoading) {
      runAnalysis();
    }
  }, [artifacts, isLoading, audit, isAnalyzing, runAnalysis]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/landing"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm"
              >
                FR
              </Link>
              <div>
                <h1 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Feature-Reacher Demo
                </h1>
                <p className="text-xs text-zinc-500">
                  Sample data loaded automatically
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Demo Mode
              </span>
              <Link
                href="/"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Use Your Data
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Loading state */}
        {(isLoading || isAnalyzing) && (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
            <h3 className="mt-6 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              {isLoading ? "Loading demo data..." : "Running Adoption Risk Audit..."}
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {isLoading
                ? "Preparing sample release notes and documentation"
                : "Extracting features, scoring visibility, generating diagnoses"}
            </p>
          </div>
        )}

        {/* Audit results */}
        {audit && !isAnalyzing && (
          <div className="space-y-6">
            {/* Demo banner */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    This is a demo audit
                  </h3>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    Using sample release notes from a fictional product. Results show what a real
                    audit looks like—expand features to see evidence and recommendations.
                  </p>
                </div>
                <Link
                  href="/"
                  className="flex-shrink-0 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Try with your data
                </Link>
              </div>
            </div>

            {/* Audit summary */}
            <AuditSummary
              summary={audit.summary}
              headline={generateHeadline(audit)}
            />

            {/* Export */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-500">
                {artifacts.length} sample artifact{artifacts.length !== 1 ? "s" : ""} analyzed
              </div>
              <ExportButtons audit={audit} />
            </div>

            {/* Features */}
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
              </div>
            </div>

            {/* Healthy features */}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {audit.rankedFeatures.filter((rf) => rf.riskLevel === "low").length} healthy features
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

            {/* Next steps */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                What&apos;s Next?
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      Upload Your Docs
                    </div>
                    <div className="text-xs text-zinc-500">
                      Run a real audit
                    </div>
                  </div>
                </Link>

                <Link
                  href="/history"
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      View History
                    </div>
                    <div className="text-xs text-zinc-500">
                      See saved audits
                    </div>
                  </div>
                </Link>

                <Link
                  href="/methodology"
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      Methodology
                    </div>
                    <div className="text-xs text-zinc-500">
                      How scoring works
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Feature-Reacher Demo</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-zinc-700">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-700">Terms</Link>
              <Link href="/support" className="hover:text-zinc-700">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
