"use client";

import Link from "next/link";
import { FeatureTrendView } from "@/ui";

export default function TrendsPage() {
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
                  Feature Trends
                </h1>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Track how feature risk evolves across audits
              </p>
            </div>
            <Link
              href="/"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              New Audit
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <FeatureTrendView />

        {/* Legend */}
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Reading the Sparkline
          </h3>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg">▓</span>
              <span className="text-zinc-600 dark:text-zinc-400">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg">▒</span>
              <span className="text-zinc-600 dark:text-zinc-400">High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg">░</span>
              <span className="text-zinc-600 dark:text-zinc-400">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg">·</span>
              <span className="text-zinc-600 dark:text-zinc-400">Low</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Each character represents one audit, from oldest (left) to newest (right).
          </p>
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
