"use client";

/**
 * Action List Component
 *
 * Displays recommended actions with copy functionality.
 */

import { useState } from "react";
import type { RecommendedAction } from "@/analysis";

interface ActionListProps {
  actions: RecommendedAction[];
  featureName?: string;
}

const PRIORITY_STYLES = {
  urgent: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    label: "Urgent",
  },
  high: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    label: "High",
  },
  medium: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-300",
    label: "Medium",
  },
  low: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
    label: "Low",
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  onboarding: "🚀",
  ui: "🎨",
  documentation: "📖",
  product: "💡",
  communication: "📣",
};

export function ActionList({ actions, featureName }: ActionListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (action: RecommendedAction, index: number) => {
    const text = `[${action.priority.toUpperCase()}] ${action.title}\n${action.description}${
      featureName ? `\n\nFeature: ${featureName}` : ""
    }`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {actions.map((action, index) => {
        const priorityStyle = PRIORITY_STYLES[action.priority];
        const categoryIcon = CATEGORY_ICONS[action.category] ?? "📋";

        return (
          <div
            key={index}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">{categoryIcon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {action.title}
                    </h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}
                    >
                      {priorityStyle.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {action.description}
                  </p>
                  <div className="mt-2 flex gap-2 text-xs text-zinc-500">
                    <span className="capitalize">{action.category}</span>
                    <span>&middot;</span>
                    <span className="capitalize">{action.effort} effort</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCopy(action, index)}
                className="flex-shrink-0 rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                title="Copy to clipboard"
              >
                {copiedIndex === index ? (
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
