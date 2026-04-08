"use client";

/**
 * Artifact List Component
 *
 * Displays uploaded artifacts with their metadata.
 */

import type { Artifact } from "@/domain";

interface ArtifactListProps {
  artifacts: Artifact[];
  onRemove?: (id: string) => void;
}

export function ArtifactList({ artifacts, onRemove }: ArtifactListProps) {
  if (artifacts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500">
          No artifacts uploaded yet. Add some content to analyze.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {artifacts.map((artifact) => (
        <div
          key={artifact.id}
          className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <TypeIcon type={artifact.type} />
            <div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                {artifact.name}
              </div>
              <div className="text-xs text-zinc-500">
                {artifact.wordCount} words &middot; {artifact.headings.length}{" "}
                headings &middot; {formatType(artifact.type)}
              </div>
            </div>
          </div>
          {onRemove && (
            <button
              onClick={() => onRemove(artifact.id)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              title="Remove artifact"
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
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function TypeIcon({ type }: { type: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
      <span className="text-lg">
        {type === "release_notes"
          ? "📋"
          : type === "documentation"
            ? "📖"
            : type === "faq"
              ? "❓"
              : type === "onboarding"
                ? "🚀"
                : type === "marketing"
                  ? "📣"
                  : "📄"}
      </span>
    </div>
  );
}

function formatType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
