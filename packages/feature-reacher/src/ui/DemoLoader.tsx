"use client";

/**
 * Demo Loader Component
 *
 * Loads curated demo artifacts for instant "wow" experience.
 */

import { useState } from "react";

interface DemoLoaderProps {
  onLoad: (artifacts: { content: string; name: string }[]) => void;
  disabled?: boolean;
}

const DEMO_FILES = [
  { path: "/demo/saas-changelog.md", name: "Acme Changelog (v2.0-3.2)" },
  { path: "/demo/help-center.md", name: "Acme Help Center" },
  { path: "/demo/faq.txt", name: "Acme FAQ" },
];

/**
 * Embedded demo content for sync loading (e.g., /demo page).
 * This is a subset of the full demo files for instant loading.
 */
const EMBEDDED_DEMO_CONTENT = [
  {
    name: "Acme Changelog (v2.0-3.2)",
    content: `# Acme Analytics Platform - Release Notes

## Version 3.2.0 - January 2026

### New Features

- **Real-time Dashboard**: Live metrics update every 5 seconds without page refresh
- **Custom Alerts**: Set threshold-based alerts for any metric
- **Team Workspaces**: Collaborate with role-based access controls

### Improvements

- Dashboard loading time reduced by 40%
- Export to CSV now includes all custom fields

---

## Version 3.1.0 - October 2025

### New Features

- **Scheduled Reports**: Automate weekly/monthly report delivery via email
- **Data Retention Policies**: Configure how long raw data is stored
- **API Rate Limiting Dashboard**: Monitor your API usage in real-time

---

## Version 3.0.0 - July 2025

### Major Release

- **Funnel Analysis**: Track user journeys through multi-step funnels
- **Cohort Analysis**: Compare behavior across user segments
- **Custom Dimensions**: Define your own tracking dimensions
- **Webhook Integrations**: Push events to external systems

---

## Version 2.5.0 - March 2025

### New Features

- **Saved Filters**: Save and reuse complex filter combinations
- **Annotation Support**: Add notes to timeline events
- **Dark Mode**: Full dark theme support

---

## Version 2.0.0 - December 2024

### Platform Rewrite

- **New Query Engine**: 10x faster query performance
- **Improved UI**: Completely redesigned interface
- **Mobile App**: Native iOS and Android apps
`,
  },
  {
    name: "Acme Help Center",
    content: `# Acme Analytics Help Center

## Getting Started

### Creating Your First Dashboard

1. Click "New Dashboard" in the top navigation
2. Select a template or start from scratch
3. Add widgets by clicking the + button
4. Configure each widget's data source

### Understanding Metrics

Our platform tracks:
- **Page Views**: Total page loads
- **Unique Visitors**: Distinct users by session
- **Conversion Rate**: Goal completions / visitors

## Advanced Features

### Real-time Dashboard

The Real-time Dashboard shows live data with 5-second refresh intervals. Enable it from Dashboard Settings > Real-time Mode.

### Custom Alerts

Set up alerts to notify you when metrics cross thresholds:
1. Go to Settings > Alerts
2. Click "New Alert"
3. Define your condition and notification channel

### Funnel Analysis

Track user journeys through defined steps:
1. Navigate to Analysis > Funnels
2. Define your funnel steps
3. View drop-off rates between steps

Note: Funnel Analysis requires the Business plan or higher.

### API Integration

Access your data programmatically via our REST API. See the API documentation for endpoints and authentication details.
`,
  },
  {
    name: "Acme FAQ",
    content: `Frequently Asked Questions

Q: How do I reset my password?
A: Click "Forgot Password" on the login page and follow the email instructions.

Q: What browsers are supported?
A: Chrome, Firefox, Safari, and Edge (latest 2 versions).

Q: How do I export my data?
A: Go to any report and click the Export button. Choose CSV or PDF format.

Q: Can I share dashboards with non-users?
A: Yes, use the "Public Link" feature to create a read-only shareable URL.

Q: What is the data retention period?
A: Default is 12 months. Enterprise plans can configure custom retention via Data Retention Policies.

Q: How do Custom Alerts work?
A: Alerts monitor metrics and notify you via email or Slack when thresholds are crossed.

Q: Is there a mobile app?
A: Yes, native apps are available for iOS and Android since v2.0.

Q: How do I contact support?
A: Email support@acme-analytics.example or use the in-app chat widget.
`,
  },
];

/**
 * Get demo artifacts synchronously (embedded content).
 * Use this for instant loading without fetch calls.
 */
export function getDemoArtifacts(): { content: string; name: string }[] {
  return EMBEDDED_DEMO_CONTENT;
}

export function DemoLoader({ onLoad, disabled }: DemoLoaderProps) {
  const [loading, setLoading] = useState(false);

  const handleLoadDemo = async () => {
    setLoading(true);

    try {
      const artifacts = await Promise.all(
        DEMO_FILES.map(async (file) => {
          const response = await fetch(file.path);
          const content = await response.text();
          return { content, name: file.name };
        })
      );

      onLoad(artifacts);
    } catch (error) {
      console.error("Failed to load demo data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-medium text-blue-900 dark:text-blue-100">
            Try with demo data
          </h3>
          <p className="mt-0.5 text-sm text-blue-700 dark:text-blue-300">
            Load sample SaaS product docs to see Feature-Reacher in action
          </p>
        </div>
        <button
          onClick={handleLoadDemo}
          disabled={loading || disabled}
          className="flex-shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading...
            </span>
          ) : (
            "Load Demo Data"
          )}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEMO_FILES.map((file) => (
          <span
            key={file.path}
            className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-800 dark:text-blue-200"
          >
            {file.name}
          </span>
        ))}
      </div>
    </div>
  );
}
