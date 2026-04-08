"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { useTeamsContext } from "@/lib/teams";

/**
 * Teams Tab page - embeddable in Microsoft Teams.
 * Auto-detects Teams context and adjusts UI accordingly.
 */
function TeamsTabContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const isDemo = view === "demo";

  const { isInTeams, theme } = useTeamsContext();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [audit, setAudit] = useState<AdoptionRiskAudit | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-load demo data if demo view
  useEffect(() => {
    if (isDemo) {
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
    } else {
      setIsLoading(false);
    }
  }, [isDemo]);

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
    }, 300);
  }, [artifacts]);

  // Auto-run analysis when demo artifacts are loaded
  useEffect(() => {
    if (isDemo && artifacts.length > 0 && !audit && !isAnalyzing && !isLoading) {
      runAnalysis();
    }
  }, [artifacts, isDemo, isLoading, audit, isAnalyzing, runAnalysis]);

  // Apply Teams theme
  const themeClasses = theme === "dark"
    ? "bg-zinc-900 text-zinc-100"
    : theme === "contrast"
      ? "bg-black text-white"
      : "bg-white text-zinc-900";

  return (
    <div className={`min-h-screen ${themeClasses}`}>
      {/* Compact header for Teams */}
      <header className="border-b border-zinc-200 dark:border-zinc-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              FR
            </div>
            <div>
              <h1 className="font-semibold text-sm">Feature-Reacher</h1>
              {isDemo && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  Demo Mode
                </span>
              )}
            </div>
          </div>
          {isInTeams && (
            <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              Teams
            </span>
          )}
        </div>
      </header>

      <main className="p-4">
        {/* Loading state */}
        {(isLoading || isAnalyzing) && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              {isLoading ? "Loading..." : "Running audit..."}
            </p>
          </div>
        )}

        {/* Audit results */}
        {audit && !isAnalyzing && (
          <div className="space-y-4">
            {/* Demo banner */}
            {isDemo && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm">
                <strong className="text-blue-900 dark:text-blue-100">Demo Audit</strong>
                <span className="text-blue-700 dark:text-blue-300 ml-2">
                  Using sample data. Open in browser for full features.
                </span>
              </div>
            )}

            {/* Compact summary */}
            <AuditSummary
              summary={audit.summary}
              headline={generateHeadline(audit)}
            />

            {/* Export */}
            <div className="flex justify-end">
              <ExportButtons audit={audit} />
            </div>

            {/* Features - more compact for Teams */}
            <div>
              <h2 className="mb-3 text-sm font-semibold">
                At-Risk Features ({audit.rankedFeatures.filter((rf) => rf.riskLevel !== "low").length})
              </h2>
              <div className="space-y-3">
                {audit.rankedFeatures
                  .filter((rf) => rf.riskLevel !== "low")
                  .slice(0, 5) // Show top 5 in Teams
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
                {audit.rankedFeatures.filter((rf) => rf.riskLevel !== "low").length > 5 && (
                  <p className="text-xs text-zinc-500 text-center py-2">
                    +{audit.rankedFeatures.filter((rf) => rf.riskLevel !== "low").length - 5} more features.{" "}
                    <a
                      href={isInTeams ? "https://gentle-bay-0363a0d10.4.azurestaticapps.net" : "/"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Open full app
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state (non-demo) */}
        {!isDemo && !audit && !isLoading && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg className="h-6 w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 font-medium">No audit loaded</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Open the full app to run an adoption risk audit.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href="/teams/tab?view=demo"
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Try Demo
              </Link>
              <a
                href="https://gentle-bay-0363a0d10.4.azurestaticapps.net"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Open Full App
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-2 text-center text-xs text-zinc-500">
        <a href="https://gentle-bay-0363a0d10.4.azurestaticapps.net/methodology" target="_blank" rel="noopener noreferrer" className="hover:underline">
          Methodology
        </a>
        {" · "}
        <a href="https://gentle-bay-0363a0d10.4.azurestaticapps.net/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">
          Privacy
        </a>
      </footer>
    </div>
  );
}

export default function TeamsTabPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
      </div>
    }>
      <TeamsTabContent />
    </Suspense>
  );
}
