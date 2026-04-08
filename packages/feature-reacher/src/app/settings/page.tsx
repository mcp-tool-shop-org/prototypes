"use client";

import Link from "next/link";
import { DataHandlingPanel } from "@/ui/DataHandlingPanel";

/**
 * Settings page with data handling transparency panel.
 */
export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Settings
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Manage data storage and preferences
              </p>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Back to App
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-8">
          {/* Data Handling Panel */}
          <DataHandlingPanel />

          {/* About */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              About Feature-Reacher
            </h2>
            <div className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                <strong>Version:</strong> Phase 3 — Marketplace-Ready
              </p>
              <p>
                <strong>License:</strong> MIT
              </p>
              <p>
                <strong>Repository:</strong>{" "}
                <a
                  href="https://github.com/mcp-tool-shop-org/feature-reacher"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  github.com/mcp-tool-shop-org/feature-reacher
                </a>
              </p>
            </div>
          </section>

          {/* Quick Links */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Quick Links
            </h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link
                href="/privacy"
                className="rounded border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="rounded border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Terms of Service
              </Link>
              <Link
                href="/support"
                className="rounded border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Support
              </Link>
              <Link
                href="/methodology"
                className="rounded border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Methodology
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <p className="text-center text-xs text-zinc-500">
            Feature-Reacher — Your data, your control
          </p>
        </div>
      </footer>
    </div>
  );
}
