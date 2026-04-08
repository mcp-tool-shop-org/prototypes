"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTeamsContext } from "@/lib/teams";

/**
 * Teams Tab Configuration page.
 * Shown when adding a configurable tab to a channel/chat.
 */
export default function TeamsConfigPage() {
  const { isInTeams, notifySuccess } = useTeamsContext();
  const [tabName, setTabName] = useState("Feature-Reacher");
  const [startWithDemo, setStartWithDemo] = useState(true);

  // Notify Teams that configuration is ready
  useEffect(() => {
    if (typeof window !== "undefined" && (window as unknown as { microsoftTeams?: unknown }).microsoftTeams) {
      // Teams SDK will handle the settings.setValidityState
    }
  }, [tabName]);

  const handleSave = () => {
    const contentUrl = startWithDemo
      ? "https://gentle-bay-0363a0d10.4.azurestaticapps.net/teams/tab?view=demo"
      : "https://gentle-bay-0363a0d10.4.azurestaticapps.net/teams/tab";

    notifySuccess({
      entityId: `featurereacher-${Date.now()}`,
      contentUrl,
      suggestedDisplayName: tabName,
      websiteUrl: "https://gentle-bay-0363a0d10.4.azurestaticapps.net",
    });
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
            FR
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              Configure Feature-Reacher
            </h1>
            <p className="text-sm text-zinc-500">
              Set up the tab for your team
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Tab name */}
          <div>
            <label
              htmlFor="tabName"
              className="block text-sm font-medium text-zinc-700"
            >
              Tab Name
            </label>
            <input
              type="text"
              id="tabName"
              value={tabName}
              onChange={(e) => setTabName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Feature-Reacher"
            />
            <p className="mt-1 text-xs text-zinc-500">
              This name appears in the channel tab bar
            </p>
          </div>

          {/* Start with demo */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="startWithDemo"
              checked={startWithDemo}
              onChange={(e) => setStartWithDemo(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <label
                htmlFor="startWithDemo"
                className="block text-sm font-medium text-zinc-700"
              >
                Start with demo data
              </label>
              <p className="text-xs text-zinc-500">
                Load sample release notes automatically so team members can see
                Feature-Reacher in action immediately
              </p>
            </div>
          </div>

          {/* What the tab shows */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="text-sm font-medium text-zinc-700">
              What this tab provides
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Adoption risk audits from documentation
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Evidence-backed feature diagnoses
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Exportable reports for stakeholders
              </li>
            </ul>
          </div>

          {/* Privacy note */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Privacy:</strong> All data is stored locally in each user&apos;s
            browser. No data is shared with servers or other team members.
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save Tab
          </button>
        </div>

        {/* Non-Teams fallback */}
        {!isInTeams && (
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center">
            <p className="text-sm text-zinc-600">
              This page is designed for Microsoft Teams tab configuration.
            </p>
            <Link
              href="/"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              Go to main app &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
