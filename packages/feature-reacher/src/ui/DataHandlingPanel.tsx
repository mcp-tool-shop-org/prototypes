"use client";

import { useState, useEffect } from "react";
import { getStorage } from "@/storage";

/**
 * Data Handling transparency panel.
 * Shows what data is stored and provides controls for deletion.
 */
export function DataHandlingPanel() {
  const [stats, setStats] = useState<{
    auditCount: number;
    artifactSetCount: number;
    estimatedSize: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const storage = getStorage();
      const audits = await storage.listAudits();
      const sets = await storage.listArtifactSets();

      // Estimate storage size (rough approximation)
      const auditSize = audits.length * 50; // ~50KB per audit average
      const setSize = sets.length * 30; // ~30KB per set average
      const totalKB = auditSize + setSize;

      setStats({
        auditCount: audits.length,
        artifactSetCount: sets.length,
        estimatedSize:
          totalKB > 1024
            ? `~${(totalKB / 1024).toFixed(1)} MB`
            : `~${totalKB} KB`,
      });
    } catch (error) {
      console.error("Failed to load storage stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeAll = async () => {
    setPurging(true);
    try {
      const storage = getStorage();

      // Delete all audits
      const audits = await storage.listAudits();
      for (const audit of audits) {
        await storage.deleteAudit(audit.id);
      }

      // Delete all artifact sets
      const sets = await storage.listArtifactSets();
      for (const set of sets) {
        await storage.deleteArtifactSet(set.id);
      }

      // Reset settings
      await storage.setSetting("autoSave", true);

      setPurgeSuccess(true);
      setShowPurgeConfirm(false);
      await loadStats();

      // Clear success message after 3 seconds
      setTimeout(() => setPurgeSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to purge data:", error);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Data Handling
            </h2>
            <p className="text-sm text-zinc-500">
              Transparency about your data storage
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Data Storage Info */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
            Where Your Data Lives
          </h3>
          <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>
                <strong>Local only</strong>: All audits and artifact sets are
                stored in your browser&apos;s IndexedDB
              </span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>
                <strong>No cloud sync</strong>: Nothing is sent to external
                servers
              </span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>
                <strong>User-initiated exports</strong>: Reports are only shared
                when you explicitly export them
              </span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>
                <strong>No tracking</strong>: No cookies, analytics, or
                advertising trackers
              </span>
            </div>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
            Current Storage Usage
          </h3>
          {loading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading...
            </div>
          ) : stats ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div className="rounded bg-zinc-100 p-3 dark:bg-zinc-800">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.auditCount}
                </div>
                <div className="text-xs text-zinc-500">Saved audits</div>
              </div>
              <div className="rounded bg-zinc-100 p-3 dark:bg-zinc-800">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.artifactSetCount}
                </div>
                <div className="text-xs text-zinc-500">Artifact sets</div>
              </div>
              <div className="rounded bg-zinc-100 p-3 dark:bg-zinc-800">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.estimatedSize}
                </div>
                <div className="text-xs text-zinc-500">Estimated size</div>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-zinc-500">
              Unable to load storage stats
            </div>
          )}
        </div>

        {/* Delete Options */}
        <div className="rounded-lg border border-red-200 p-4 dark:border-red-900">
          <h3 className="font-medium text-red-900 dark:text-red-100">
            Delete Data
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            Permanently remove all stored data from your browser. This cannot be
            undone.
          </p>

          {purgeSuccess && (
            <div className="mt-3 flex items-center gap-2 rounded bg-green-100 p-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              All data has been purged successfully.
            </div>
          )}

          {!showPurgeConfirm ? (
            <button
              onClick={() => setShowPurgeConfirm(true)}
              className="mt-3 rounded bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
            >
              Purge All Local Data
            </button>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="rounded border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Are you sure?
                </p>
                <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                  This will permanently delete {stats?.auditCount ?? 0} audits
                  and {stats?.artifactSetCount ?? 0} artifact sets.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePurgeAll}
                  disabled={purging}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {purging ? "Purging..." : "Yes, Purge Everything"}
                </button>
                <button
                  onClick={() => setShowPurgeConfirm(false)}
                  disabled={purging}
                  className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="text-xs text-zinc-500">
          <p>
            <strong>Note:</strong> Clearing your browser&apos;s site data or
            using private/incognito mode will also remove stored data.
            Feature-Reacher has no access to data once it&apos;s deleted.
          </p>
        </div>
      </div>
    </div>
  );
}
