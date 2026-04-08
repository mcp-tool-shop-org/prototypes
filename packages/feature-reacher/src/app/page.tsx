"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import type { Artifact, ArtifactType } from "@/domain";
import {
  ingestPastedText,
  ingestUploadedFile,
  extractFeaturesFromArtifact,
  mergeExtractionResults,
  scoreAllFeatures,
  diagnoseAllFeatures,
  generateAudit,
  generateHeadline,
  type AdoptionRiskAudit,
} from "@/analysis";
import {
  ArtifactUpload,
  ArtifactList,
  AuditSummary,
  FeatureCard,
  ExportButtons,
  DemoLoader,
} from "@/ui";
import {
  SaveAuditButton,
  AutoSaveToggle,
  UnsavedChangesIndicator,
} from "@/ui/SaveAuditButton";
import { ArtifactSetManager } from "@/ui/ArtifactSetManager";
import { OnboardingTour } from "@/ui/OnboardingTour";
import { useAutoSaveSetting, useSaveAudit } from "@/storage/hooks";
import type { PersistedAudit, SavedArtifactRef } from "@/storage/types";
import { generateContentHash } from "@/storage/types";

export default function Home() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [audit, setAudit] = useState<AdoptionRiskAudit | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedAuditId, setSavedAuditId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { autoSave } = useAutoSaveSetting();
  const { saveAudit } = useSaveAudit();
  const lastSavedHashRef = useRef<string>("");

  // Track unsaved changes when artifacts change after a saved audit
  useEffect(() => {
    if (!savedAuditId || !audit) {
      setHasUnsavedChanges(false);
      return;
    }

    const currentHash = artifacts.map((a) => generateContentHash(a.rawContent)).join("-");
    setHasUnsavedChanges(currentHash !== lastSavedHashRef.current);
  }, [artifacts, savedAuditId, audit]);

  const handleUpload = useCallback(
    (content: string, name: string, type?: ArtifactType) => {
      try {
        const result = name.includes(".")
          ? ingestUploadedFile({ content, filename: name, type })
          : ingestPastedText({ content, name, type });

        setArtifacts((prev) => [...prev, result.artifact]);
        setAudit(null);
        setSavedAuditId(null);
      } catch (error) {
        console.error("Failed to ingest artifact:", error);
      }
    },
    []
  );

  const handleDemoLoad = useCallback(
    (demoArtifacts: { content: string; name: string }[]) => {
      const ingested: Artifact[] = [];
      for (const demo of demoArtifacts) {
        try {
          const result = demo.name.includes(".")
            ? ingestUploadedFile({ content: demo.content, filename: demo.name })
            : ingestPastedText({ content: demo.content, name: demo.name });
          ingested.push(result.artifact);
        } catch (error) {
          console.error("Failed to ingest demo artifact:", error);
        }
      }
      setArtifacts(ingested);
      setAudit(null);
      setSavedAuditId(null);
    },
    []
  );

  const handleRemove = useCallback((id: string) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
    setAudit(null);
    setSavedAuditId(null);
  }, []);

  const performAutoSave = useCallback(
    async (newAudit: AdoptionRiskAudit, currentArtifacts: Artifact[]) => {
      const artifactRefs: SavedArtifactRef[] = currentArtifacts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        charCount: a.rawContent.length,
        hash: generateContentHash(a.rawContent),
      }));

      const persistedAudit: PersistedAudit = {
        id: "",
        auditId: newAudit.summary.auditId,
        name: `Audit ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        artifactRefs,
        features: newAudit.rankedFeatures.map((rf) => rf.feature),
        rankedFeatures: newAudit.rankedFeatures,
        summary: newAudit.summary,
        tags: [],
        notes: "",
      };

      const id = await saveAudit(persistedAudit);
      if (id) {
        setSavedAuditId(id);
        lastSavedHashRef.current = currentArtifacts
          .map((a) => generateContentHash(a.rawContent))
          .join("-");
        setHasUnsavedChanges(false);
      }
    },
    [saveAudit]
  );

  const handleAnalyze = useCallback(() => {
    if (artifacts.length === 0) return;

    setIsAnalyzing(true);

    setTimeout(async () => {
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

        // Auto-save if enabled
        if (autoSave) {
          await performAutoSave(newAudit, artifacts);
        }
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 100);
  }, [artifacts, autoSave, performAutoSave]);

  const handleSaved = useCallback((id: string) => {
    setSavedAuditId(id);
    lastSavedHashRef.current = artifacts
      .map((a) => generateContentHash(a.rawContent))
      .join("-");
    setHasUnsavedChanges(false);
  }, [artifacts]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Feature-Reacher
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Surface underutilized features before they become technical debt
              </p>
            </div>
            <div className="flex items-center gap-4">
              {audit && (
                <>
                  <div className="font-mono text-sm text-zinc-500">
                    {audit.summary.auditId}
                  </div>
                  <UnsavedChangesIndicator hasUnsavedChanges={hasUnsavedChanges} />
                </>
              )}
              <Link
                href="/history"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Processing state */}
            {isAnalyzing && (
              <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
                <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  Analyzing artifacts...
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Extracting features, scoring visibility, generating diagnoses
                </p>
              </div>
            )}

            {/* Audit results */}
            {audit && !isAnalyzing && (
              <>
                <AuditSummary
                  summary={audit.summary}
                  headline={generateHeadline(audit)}
                />

                {/* Save and export options */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <SaveAuditButton
                      audit={audit}
                      artifacts={artifacts}
                      existingAuditId={savedAuditId || undefined}
                      onSaved={handleSaved}
                    />
                    <AutoSaveToggle />
                  </div>
                  <div data-tour="export-buttons">
                    <ExportButtons audit={audit} />
                  </div>
                </div>

                <div data-tour="feature-cards">
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
                              expandedFeature === rf.feature.id
                                ? null
                                : rf.feature.id
                            )
                          }
                        />
                      ))}
                    {audit.rankedFeatures.filter((rf) => rf.riskLevel !== "low")
                      .length === 0 && (
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
                        <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                          Your features appear well-surfaced in the provided artifacts.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Low risk features (collapsed) */}
                {audit.rankedFeatures.filter((rf) => rf.riskLevel === "low")
                  .length > 0 && (
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
                        {
                          audit.rankedFeatures.filter(
                            (rf) => rf.riskLevel === "low"
                          ).length
                        }{" "}
                        healthy features (low risk)
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
                                expandedFeature === rf.feature.id
                                  ? null
                                  : rf.feature.id
                              )
                            }
                          />
                        ))}
                    </div>
                  </details>
                )}
              </>
            )}

            {/* Empty state */}
            {!audit && !isAnalyzing && artifacts.length === 0 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
                  <svg
                    className="mx-auto h-12 w-12 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    No artifacts yet
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Upload your product documentation, release notes, or FAQs to
                    get started.
                  </p>
                </div>

                {/* Demo loader */}
                <div data-tour="demo-loader">
                  <DemoLoader onLoad={handleDemoLoad} />
                </div>
              </div>
            )}

            {/* Ready to analyze */}
            {!audit && !isAnalyzing && artifacts.length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                      Ready to analyze
                    </h3>
                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      {artifacts.length} artifact{artifacts.length !== 1 ? "s" : ""}{" "}
                      uploaded. Run the adoption risk audit to identify at-risk features.
                    </p>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    data-tour="run-audit"
                    className="flex-shrink-0 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Run Audit
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ArtifactUpload onUpload={handleUpload} />
            <ArtifactList artifacts={artifacts} onRemove={handleRemove} />
            <ArtifactSetManager artifacts={artifacts} onLoadSet={handleDemoLoad} />

            {/* Quick actions when audit exists */}
            {audit && (
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Quick Actions
                </h3>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => {
                      setAudit(null);
                      setArtifacts([]);
                      setSavedAuditId(null);
                    }}
                    className="w-full rounded border border-zinc-300 px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Start new audit
                  </button>
                  <button
                    onClick={handleAnalyze}
                    className="w-full rounded border border-zinc-300 px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Re-run analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <p className="text-center text-xs text-zinc-500">
            Feature-Reacher Phase 3 &mdash; Marketplace Ready
          </p>
        </div>
      </footer>

      {/* Onboarding Tour */}
      <OnboardingTour />
    </div>
  );
}
