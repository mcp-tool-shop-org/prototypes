"use client";

import { useState } from "react";
import type { AuditDiff } from "../analysis/diff";
import {
  generateCompareTextReport,
  generateCompareExecutiveNarrative,
} from "../analysis/export";

interface CompareExportButtonsProps {
  diff: AuditDiff;
}

/**
 * Export buttons for audit comparison reports.
 */
export function CompareExportButtons({ diff }: CompareExportButtonsProps) {
  const [showNarrative, setShowNarrative] = useState(false);

  const handleExportText = () => {
    const text = generateCompareTextReport(diff);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compare-${diff.baseAuditId}-${diff.compareAuditId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyNarrative = async () => {
    const narrative = generateCompareExecutiveNarrative(diff);
    await navigator.clipboard.writeText(narrative);
    setShowNarrative(true);
    setTimeout(() => setShowNarrative(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopyNarrative}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        title="Copy executive summary to clipboard"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        {showNarrative ? "Copied!" : "Copy Summary"}
      </button>

      <button
        onClick={handleExportText}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        title="Download full comparison report as text file"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export TXT
      </button>
    </div>
  );
}
