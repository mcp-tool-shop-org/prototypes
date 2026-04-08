import { useMemo, useState } from "react";
import { useHistoryStore } from "@commandui/state";
import { useComposerStore } from "@commandui/state";
import type { HistoryItem } from "@commandui/domain";
import "./failedCommandRecovery.css";

// ---------------------------------------------------------------------------
// Failure classification — deterministic, no AI framing
// ---------------------------------------------------------------------------

type FailureCategory =
  | "permission"
  | "not-found"
  | "network"
  | "syntax"
  | "timeout"
  | "unknown";

type FailureClassification = {
  category: FailureCategory;
  label: string;
  hint: string;
};

function classifyFailure(item: HistoryItem): FailureClassification {
  const exitCode = item.exitCode ?? 1;

  if (exitCode === 126 || exitCode === 13) {
    return {
      category: "permission",
      label: "Permission denied",
      hint: "Command requires elevated privileges",
    };
  }

  if (exitCode === 127) {
    return {
      category: "not-found",
      label: "Command not found",
      hint: "Binary not in PATH or not installed",
    };
  }

  if (exitCode === 6 || exitCode === 7 || exitCode === 28) {
    return {
      category: "network",
      label: "Network error",
      hint: "Host unreachable or connection timed out",
    };
  }

  if (exitCode === 2) {
    return {
      category: "syntax",
      label: "Usage error",
      hint: "Check command syntax or flags",
    };
  }

  if (exitCode === 124 || exitCode === 137) {
    return {
      category: "timeout",
      label: "Timed out or killed",
      hint: "Process exceeded time limit or was terminated by signal",
    };
  }

  return {
    category: "unknown",
    label: `Failed (exit ${exitCode})`,
    hint: "Check terminal output above for details",
  };
}

// ---------------------------------------------------------------------------
// Component — inline failure context, not a panel
// ---------------------------------------------------------------------------

type Props = {
  historyItemId: string;
  onDismiss: () => void;
};

export function FailedCommandRecovery({ historyItemId, onDismiss }: Props) {
  const { items } = useHistoryStore();
  const { setInputValue, setInputMode } = useComposerStore();

  const item = useMemo(
    () => items.find((i) => i.id === historyItemId),
    [items, historyItemId],
  );

  const classification = useMemo(
    () => (item ? classifyFailure(item) : null),
    [item],
  );

  const [expanded, setExpanded] = useState(false);

  if (!item || !classification) return null;

  const handleRetry = () => {
    setInputValue(item.executedCommand ?? "");
    setInputMode("command");
    onDismiss();
  };

  return (
    <div className="failure-context">
      {/* Failure summary — one line */}
      <div className="failure-summary">
        <span
          className="failure-category"
          data-category={classification.category}
        >
          {classification.label}
        </span>
        <code className="failure-command">{item.executedCommand}</code>
        <button className="failure-dismiss" onClick={onDismiss}>
          ×
        </button>
      </div>

      {/* Hint — terse, factual */}
      <div className="failure-hint">{classification.hint}</div>

      {/* Expandable: exit code, duration, session */}
      {expanded && (
        <div className="failure-details">
          <span>exit {item.exitCode}</span>
          {item.durationMs != null && <span>{item.durationMs}ms</span>}
          <span>{item.source}</span>
        </div>
      )}

      {/* Actions: retry (primary), expand details */}
      <div className="failure-actions">
        <button className="failure-retry" onClick={handleRetry}>
          Retry
        </button>
        <button
          className="failure-toggle"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Less" : "Details"}
        </button>
      </div>
    </div>
  );
}
