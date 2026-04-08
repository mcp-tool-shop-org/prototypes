"use client";

import { useState } from "react";
import Link from "next/link";
import { useSavedAudits } from "../storage/hooks";
import type { AuditListItem, PersistedAuditId } from "../storage/types";

interface AuditHistoryProps {
  onOpenAudit: (id: PersistedAuditId) => void;
  onCompareSelect?: (id: PersistedAuditId) => void;
  compareMode?: boolean;
  selectedForCompare?: PersistedAuditId | null;
}

/**
 * Displays the list of saved audits with quick actions.
 */
export function AuditHistory({
  onOpenAudit,
  onCompareSelect,
  compareMode = false,
  selectedForCompare = null,
}: AuditHistoryProps) {
  const { audits, loading, error, deleteAudit, renameAudit, refresh } = useSavedAudits();
  const [editingId, setEditingId] = useState<PersistedAuditId | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<PersistedAuditId | null>(null);

  const handleStartRename = (audit: AuditListItem) => {
    setEditingId(audit.id);
    setEditName(audit.name);
  };

  const handleSaveRename = async (id: PersistedAuditId) => {
    if (editName.trim()) {
      await renameAudit(id, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = async (id: PersistedAuditId) => {
    await deleteAudit(id);
    setConfirmDelete(null);
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRiskBadge = (audit: AuditListItem) => {
    if (audit.criticalRiskCount > 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
          {audit.criticalRiskCount} critical
        </span>
      );
    }
    if (audit.highRiskCount > 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
          {audit.highRiskCount} high risk
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        All clear
      </span>
    );
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <div className="flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="ml-2 text-gray-500">Loading saved audits...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Error loading audits: {error}</p>
        <button
          onClick={refresh}
          className="mt-2 text-sm text-red-600 underline hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-sm font-medium text-gray-900">No saved audits</h3>
        <p className="mt-1 text-sm text-gray-500">
          Run an audit to see it saved here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Audit History</h2>
          <span className="text-sm text-gray-500">{audits.length} saved</span>
        </div>
        {compareMode && (
          <p className="mt-1 text-sm text-blue-600">
            Select an audit to compare with the current one
          </p>
        )}
      </div>

      <ul className="divide-y divide-gray-200">
        {audits.map((audit) => (
          <li
            key={audit.id}
            className={`px-4 py-4 hover:bg-gray-50 transition-colors ${
              selectedForCompare === audit.id ? "bg-blue-50" : ""
            }`}
          >
            {/* Delete confirmation modal */}
            {confirmDelete === audit.id && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-800">
                  Delete &quot;{audit.name}&quot;? This cannot be undone.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleDelete(audit.id)}
                    className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Name (editable) */}
                {editingId === audit.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(audit.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => handleSaveRename(audit.id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {audit.name}
                  </h3>
                )}

                {/* Audit ID and date */}
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">
                    {audit.auditId}
                  </code>
                  <span>•</span>
                  <span>{formatDate(audit.createdAt)}</span>
                </div>

                {/* Stats */}
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  <span>{audit.artifactCount} artifact{audit.artifactCount !== 1 ? "s" : ""}</span>
                  <span>•</span>
                  <span>{audit.featureCount} feature{audit.featureCount !== 1 ? "s" : ""}</span>
                  <span>•</span>
                  {getRiskBadge(audit)}
                </div>
              </div>

              {/* Actions */}
              <div className="ml-4 flex items-center gap-2">
                {compareMode && onCompareSelect ? (
                  <button
                    onClick={() => onCompareSelect(audit.id)}
                    className={`rounded px-3 py-1.5 text-sm font-medium ${
                      selectedForCompare === audit.id
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    {selectedForCompare === audit.id ? "Selected" : "Select"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onOpenAudit(audit.id)}
                      className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Open
                    </button>
                    <Link
                      href={`/compare?base=${audit.id}`}
                      className="rounded bg-gray-100 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200"
                      title="Compare with another audit"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleStartRename(audit)}
                      className="rounded bg-gray-100 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200"
                      title="Rename"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(audit.id)}
                      className="rounded bg-gray-100 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
