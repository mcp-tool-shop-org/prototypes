"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuditHistory } from "@/ui/AuditHistory";
import { AuditCompare } from "@/ui/AuditCompare";
import { CompareExportButtons } from "@/ui/CompareExportButtons";
import { useAudit, useSavedAudits } from "@/storage/hooks";
import { compareAudits } from "@/analysis/diff";
import type { PersistedAuditId } from "@/storage/types";

function ComparePageContent() {
  const searchParams = useSearchParams();
  const baseId = searchParams.get("base");

  const [compareId, setCompareId] = useState<PersistedAuditId | null>(null);

  const { audit: baseAudit, loading: loadingBase } = useAudit(baseId);
  const { audit: compareAudit, loading: loadingCompare } = useAudit(compareId);
  const { audits } = useSavedAudits();

  // Generate diff when both audits are loaded
  const diff = useMemo(() => {
    if (baseAudit && compareAudit) {
      return compareAudits(baseAudit, compareAudit);
    }
    return null;
  }, [baseAudit, compareAudit]);

  const handleSelectCompare = (id: PersistedAuditId) => {
    setCompareId(id);
  };

  // Filter out the base audit from selection
  const availableAudits = audits.filter((a) => a.id !== baseId);

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
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Compare Audits
                </h1>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                See what changed between two audits
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* No base audit selected */}
        {!baseId && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-900/20">
            <h2 className="text-lg font-medium text-amber-900 dark:text-amber-100">
              Select a base audit
            </h2>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              Go to{" "}
              <Link href="/history" className="underline">
                Audit History
              </Link>{" "}
              and click &quot;Compare&quot; on an audit to start comparing.
            </p>
          </div>
        )}

        {/* Loading base audit */}
        {baseId && loadingBase && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
          </div>
        )}

        {/* Base audit loaded, select compare */}
        {baseAudit && !compareId && (
          <div className="space-y-6">
            {/* Base audit info */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                  Base
                </span>
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    {baseAudit.name}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <code className="font-mono">{baseAudit.auditId}</code>
                    <span className="mx-2">•</span>
                    {new Date(baseAudit.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Select compare audit */}
            {availableAudits.length > 0 ? (
              <>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Select an audit to compare with
                </h2>
                <AuditHistory
                  onOpenAudit={() => {}}
                  onCompareSelect={handleSelectCompare}
                  compareMode={true}
                  selectedForCompare={compareId}
                />
              </>
            ) : (
              <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-zinc-600 dark:text-zinc-400">
                  No other audits available to compare.
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Run Another Audit
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Loading compare audit */}
        {baseAudit && compareId && loadingCompare && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
          </div>
        )}

        {/* Both audits loaded - show diff */}
        {diff && (
          <div className="space-y-6">
            {/* Audit labels */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-900 dark:bg-blue-900/20">
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Base</div>
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {diff.baseAuditName}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {new Date(diff.baseCreatedAt).toLocaleDateString()}
                </div>
              </div>

              <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>

              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 dark:border-green-900 dark:bg-green-900/20">
                <div className="text-xs font-medium text-green-600 dark:text-green-400">Compare</div>
                <div className="text-sm font-medium text-green-900 dark:text-green-100">
                  {diff.compareAuditName}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  {new Date(diff.compareCreatedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <CompareExportButtons diff={diff} />
                <button
                  onClick={() => setCompareId(null)}
                  className="rounded border border-zinc-300 px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Change selection
                </button>
              </div>
            </div>

            {/* Diff view */}
            <AuditCompare diff={diff} />
          </div>
        )}
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

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}
