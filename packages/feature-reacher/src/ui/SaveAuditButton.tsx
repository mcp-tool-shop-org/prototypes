"use client";

import { useState } from "react";
import { useSaveAudit, useAutoSaveSetting } from "../storage/hooks";
import type { PersistedAudit, SavedArtifactRef } from "../storage/types";
import type { Artifact } from "../domain/artifact";
import type { AdoptionRiskAudit } from "../analysis/ranking";
import { generateContentHash } from "../storage/types";

interface SaveAuditButtonProps {
  audit: AdoptionRiskAudit;
  artifacts: Artifact[];
  existingAuditId?: string;
  onSaved?: (id: string) => void;
}

/**
 * Button for manually saving an audit.
 */
export function SaveAuditButton({
  audit,
  artifacts,
  existingAuditId,
  onSaved,
}: SaveAuditButtonProps) {
  const { saveAudit, saving, error } = useSaveAudit();
  const [showNameInput, setShowNameInput] = useState(false);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const auditName = name.trim() || `Audit ${new Date().toLocaleDateString()}`;

    const artifactRefs: SavedArtifactRef[] = artifacts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      charCount: a.rawContent.length,
      hash: generateContentHash(a.rawContent),
    }));

    const persistedAudit: PersistedAudit = {
      id: existingAuditId || "",
      auditId: audit.summary.auditId,
      name: auditName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      artifactRefs,
      features: audit.rankedFeatures.map((rf) => rf.feature),
      rankedFeatures: audit.rankedFeatures,
      summary: audit.summary,
      tags: [],
      notes: "",
    };

    const id = await saveAudit(persistedAudit);
    if (id) {
      setSaved(true);
      setShowNameInput(false);
      onSaved?.(id);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (saved) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Saved
      </div>
    );
  }

  if (showNameInput) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Audit name (optional)"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setShowNameInput(false);
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => setShowNameInput(false)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowNameInput(true)}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
      Save Audit
      {error && <span className="text-xs text-red-500">(Error)</span>}
    </button>
  );
}

interface AutoSaveToggleProps {
  className?: string;
}

/**
 * Toggle for enabling/disabling auto-save on audit run.
 */
export function AutoSaveToggle({ className = "" }: AutoSaveToggleProps) {
  const { autoSave, setAutoSaveSetting, loading } = useAutoSaveSetting();

  if (loading) return null;

  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">Auto-save</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={autoSave}
          onChange={(e) => setAutoSaveSetting(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600" />
      </div>
    </label>
  );
}

interface UnsavedChangesIndicatorProps {
  hasUnsavedChanges: boolean;
}

/**
 * Shows when current artifacts differ from last saved audit.
 */
export function UnsavedChangesIndicator({ hasUnsavedChanges }: UnsavedChangesIndicatorProps) {
  if (!hasUnsavedChanges) return null;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
      Unsaved changes
    </div>
  );
}
