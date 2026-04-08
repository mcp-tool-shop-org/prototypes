"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuditHistory } from "@/ui/AuditHistory";

export default function HistoryPage() {
  const router = useRouter();

  const handleOpenAudit = (id: string) => {
    // Navigate to audit view with the ID
    router.push(`/audit/${id}`);
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
                  href="/"
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
                  Audit History
                </h1>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                View, compare, and manage your saved audits
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/trends"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Trends
              </Link>
              <Link
                href="/"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                New Audit
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <AuditHistory onOpenAudit={handleOpenAudit} />
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
