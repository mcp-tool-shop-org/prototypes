"use client";

import { useState } from "react";
import { useArtifactSets } from "../storage/hooks";
import type { ArtifactSet, ArtifactSetId, SavedArtifactRef } from "../storage/types";
import type { Artifact } from "../domain/artifact";
import { generateContentHash, generateStorageId } from "../storage/types";

interface ArtifactSetManagerProps {
  artifacts: Artifact[];
  onLoadSet: (artifacts: { content: string; name: string }[]) => void;
}

/**
 * Manage named artifact sets for repeatable audits.
 */
export function ArtifactSetManager({ artifacts, onLoadSet }: ArtifactSetManagerProps) {
  const { sets, loading, saveSet, deleteSet } = useArtifactSets();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ArtifactSetId | null>(null);

  const handleSaveSet = async () => {
    if (!name.trim() || artifacts.length === 0) return;

    setSaving(true);

    const artifactRefs: SavedArtifactRef[] = artifacts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      charCount: a.rawContent.length,
      hash: generateContentHash(a.rawContent),
    }));

    // Store contents for offline replay
    const artifactContents = new Map<string, string>();
    artifacts.forEach((a) => {
      artifactContents.set(a.id, a.rawContent);
    });

    const newSet: ArtifactSet = {
      id: generateStorageId(),
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      artifactRefs,
      artifactContents,
    };

    await saveSet(newSet);
    setShowSaveForm(false);
    setName("");
    setDescription("");
    setSaving(false);
  };

  const handleLoadSet = (set: ArtifactSet) => {
    if (!set.artifactContents) {
      console.error("Artifact set has no stored contents");
      return;
    }

    const loadedArtifacts = set.artifactRefs.map((ref) => ({
      content: set.artifactContents?.get(ref.id) || "",
      name: ref.name,
    }));

    onLoadSet(loadedArtifacts);
  };

  const handleDelete = async (id: ArtifactSetId) => {
    await deleteSet(id);
    setConfirmDelete(null);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Artifact Sets
          </h3>
          {artifacts.length > 0 && !showSaveForm && (
            <button
              onClick={() => setShowSaveForm(true)}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Save current
            </button>
          )}
        </div>
      </div>

      {/* Save form */}
      {showSaveForm && (
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-700">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Set Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q1 Release Notes + Help Center"
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveSet}
                disabled={!name.trim() || saving}
                className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : `Save ${artifacts.length} artifacts`}
              </button>
              <button
                onClick={() => {
                  setShowSaveForm(false);
                  setName("");
                  setDescription("");
                }}
                className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sets list */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-zinc-500">Loading...</div>
        ) : sets.length === 0 ? (
          <div className="p-4 text-center text-sm text-zinc-500">
            No saved sets yet
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {sets.map((set) => (
              <li key={set.id} className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                {/* Delete confirmation */}
                {confirmDelete === set.id ? (
                  <div className="rounded border border-red-200 bg-red-50 p-2 dark:border-red-900 dark:bg-red-900/20">
                    <p className="text-xs text-red-800 dark:text-red-300">
                      Delete &quot;{set.name}&quot;?
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleDelete(set.id)}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded bg-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {set.name}
                      </h4>
                      {set.description && (
                        <p className="truncate text-xs text-zinc-500">
                          {set.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-zinc-400">
                        {set.artifactRefs.length} artifact{set.artifactRefs.length !== 1 ? "s" : ""} • {formatDate(set.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleLoadSet(set)}
                        className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                        title="Load this set"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => setConfirmDelete(set.id)}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-red-600 dark:hover:bg-zinc-700"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
