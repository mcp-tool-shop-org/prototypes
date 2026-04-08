import { useState, useMemo } from "react";
import { useHistoryStore } from "@commandui/state";
import { useComposerStore } from "@commandui/state";
import { useExecutionStore } from "@commandui/state";
import type { HistoryItem } from "@commandui/domain";
import "./failedCommandRecovery.css";

// ---------------------------------------------------------------------------
// Failure analysis
// ---------------------------------------------------------------------------

type FailureCategory =
  | "permission"
  | "not-found"
  | "network"
  | "syntax"
  | "timeout"
  | "unknown";

type FailureAnalysis = {
  category: FailureCategory;
  title: string;
  description: string;
  suggestion: string;
  canAutoFix: boolean;
  fixCommand?: string;
};

function analyzeFailure(item: HistoryItem): FailureAnalysis {
  const cmd = item.executedCommand ?? "";
  const exitCode = item.exitCode ?? 1;

  // Permission denied
  if (exitCode === 126 || exitCode === 13 || cmd.match(/permission denied/i)) {
    return {
      category: "permission",
      title: "Permission Denied",
      description:
        "I noticed that this command failed because you don't have the required permissions. This usually happens when trying to modify system files or run privileged operations.",
      suggestion:
        "I can help fix this by re-running the command with elevated privileges. Would you like me to try with sudo?",
      canAutoFix: true,
      fixCommand: `sudo ${cmd}`,
    };
  }

  // Command not found
  if (exitCode === 127 || cmd.match(/not found|no such file/i)) {
    const binary = cmd.split(/\s+/)[0];
    return {
      category: "not-found",
      title: "Command Not Found",
      description: `It looks like "${binary}" isn't installed or isn't in your PATH. Don't worry — this is a common issue that's easy to resolve.`,
      suggestion: `I'd recommend installing "${binary}" first. Here are some options I've identified that might work for your system:`,
      canAutoFix: true,
      fixCommand: `which ${binary} || echo "Try: brew install ${binary} or apt install ${binary}"`,
    };
  }

  // Network error
  if (
    cmd.match(/curl|wget|fetch|npm install|pip install/i) &&
    (exitCode === 6 || exitCode === 7 || exitCode === 28)
  ) {
    return {
      category: "network",
      title: "Network Issue Detected",
      description:
        "It seems like there's a network connectivity problem. I've checked and it appears the connection might be unstable or the target host is unreachable.",
      suggestion:
        "Let me verify your network connectivity first, then I'll retry the command automatically once the connection is restored.",
      canAutoFix: true,
      fixCommand: `ping -c 3 8.8.8.8 && ${cmd}`,
    };
  }

  // Syntax error
  if (exitCode === 2) {
    return {
      category: "syntax",
      title: "Syntax Error",
      description:
        "I've analyzed the command and it appears there's a syntax issue. Let me help you identify what went wrong and suggest the correct syntax.",
      suggestion:
        "Based on my analysis, here's what I think might fix the issue. I can also look up the man page for you if you'd prefer.",
      canAutoFix: false,
    };
  }

  // Timeout
  if (exitCode === 124 || exitCode === 137) {
    return {
      category: "timeout",
      title: "Command Timed Out",
      description:
        "The command took too long to complete and was terminated. This might indicate a hung process or a resource-intensive operation that needs more time.",
      suggestion:
        "I can retry with a longer timeout, or we could try breaking this into smaller operations. What would you prefer?",
      canAutoFix: true,
      fixCommand: `timeout 300 ${cmd}`,
    };
  }

  return {
    category: "unknown",
    title: "Command Failed",
    description: `Something went wrong with this command (exit code ${exitCode}). I'm not entirely sure what caused the failure, but I'll try to help you figure it out.`,
    suggestion:
      "Would you like me to look into this further? I can check the logs, search for similar issues, or suggest alternative approaches.",
    canAutoFix: false,
  };
}

// ---------------------------------------------------------------------------
// Category icons & colors
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<
  FailureCategory,
  { icon: string; color: string; bg: string }
> = {
  permission: { icon: "🔒", color: "#ffb4c0", bg: "rgba(255, 180, 192, 0.08)" },
  "not-found": { icon: "🔍", color: "#ffd488", bg: "rgba(255, 212, 136, 0.08)" },
  network: { icon: "🌐", color: "#8dc4ff", bg: "rgba(141, 196, 255, 0.08)" },
  syntax: { icon: "⚠️", color: "#ffd488", bg: "rgba(255, 212, 136, 0.08)" },
  timeout: { icon: "⏱️", color: "#ffb4c0", bg: "rgba(255, 180, 192, 0.08)" },
  unknown: { icon: "❓", color: "#98a2b3", bg: "rgba(152, 162, 179, 0.08)" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  historyItemId: string;
  onDismiss: () => void;
};

export function FailedCommandRecovery({ historyItemId, onDismiss }: Props) {
  const { items } = useHistoryStore();
  const { setInputValue, setInputMode } = useComposerStore();
  const { setExecutionStatus } = useExecutionStore();

  const item = useMemo(
    () => items.find((i) => i.id === historyItemId),
    [items, historyItemId],
  );

  const analysis = useMemo(
    () => (item ? analyzeFailure(item) : null),
    [item],
  );

  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  if (!item || !analysis) return null;

  const config = CATEGORY_CONFIG[analysis.category];

  const handleRetry = () => {
    setInputValue(item.executedCommand ?? "");
    setInputMode("command");
    onDismiss();
  };

  const handleAutoFix = () => {
    if (!analysis.fixCommand) return;
    setIsRetrying(true);
    setInputValue(analysis.fixCommand);
    setInputMode("command");
    onDismiss();
  };

  const handleAskForHelp = () => {
    setInputValue(
      `Help me fix this error: "${item.executedCommand}" failed with exit code ${item.exitCode}`,
    );
    setInputMode("ask");
    onDismiss();
  };

  return (
    <div className="recovery-panel">
      {/* Header */}
      <div className="recovery-header" style={{ borderLeftColor: config.color }}>
        <div className="recovery-icon">{config.icon}</div>
        <div className="recovery-title-block">
          <h3 className="recovery-title">{analysis.title}</h3>
          <span className="recovery-exit-code">Exit code: {item.exitCode}</span>
        </div>
        <button className="recovery-dismiss" onClick={onDismiss}>
          ×
        </button>
      </div>

      {/* Failed command display */}
      <div className="recovery-command-box">
        <span className="recovery-prompt">$</span>
        <code className="recovery-command">{item.executedCommand}</code>
      </div>

      {/* AI Analysis */}
      <div className="recovery-analysis" style={{ background: config.bg }}>
        <p className="recovery-description">{analysis.description}</p>
        <p className="recovery-suggestion">{analysis.suggestion}</p>
      </div>

      {/* Suggested fix preview */}
      {analysis.fixCommand && (
        <div className="recovery-fix-preview">
          <div className="recovery-fix-label">Suggested fix:</div>
          <div className="recovery-fix-command">
            <span className="recovery-prompt">$</span>
            <code>{analysis.fixCommand}</code>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="recovery-actions">
        {analysis.canAutoFix && analysis.fixCommand && (
          <button
            className="recovery-btn recovery-btn-primary"
            onClick={handleAutoFix}
            disabled={isRetrying}
          >
            {isRetrying ? "Applying fix..." : "✨ Apply Fix"}
          </button>
        )}
        <button className="recovery-btn recovery-btn-secondary" onClick={handleRetry}>
          Retry Original
        </button>
        <button
          className="recovery-btn recovery-btn-ghost"
          onClick={handleAskForHelp}
        >
          🤖 Ask AI for Help
        </button>
      </div>

      {/* Expandable details */}
      <button
        className="recovery-details-toggle"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? "▼ Hide Details" : "▶ Show Details"}
      </button>
      {showDetails && (
        <div className="recovery-details">
          <div className="recovery-detail-row">
            <span className="recovery-detail-label">Category</span>
            <span className="recovery-detail-value">{analysis.category}</span>
          </div>
          <div className="recovery-detail-row">
            <span className="recovery-detail-label">Duration</span>
            <span className="recovery-detail-value">
              {item.durationMs ? `${item.durationMs}ms` : "—"}
            </span>
          </div>
          <div className="recovery-detail-row">
            <span className="recovery-detail-label">Session</span>
            <span className="recovery-detail-value">{item.sessionId}</span>
          </div>
          <div className="recovery-detail-row">
            <span className="recovery-detail-label">Source</span>
            <span className="recovery-detail-value">{item.source}</span>
          </div>
        </div>
      )}
    </div>
  );
}
