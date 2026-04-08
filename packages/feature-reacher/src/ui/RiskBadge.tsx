"use client";

/**
 * Risk Badge Component
 *
 * Displays risk level with appropriate color coding.
 */

type RiskLevel = "critical" | "high" | "medium" | "low";

interface RiskBadgeProps {
  level: RiskLevel;
  showLabel?: boolean;
}

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  critical: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    label: "Critical",
  },
  high: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-800 dark:text-orange-300",
    label: "High",
  },
  medium: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-300",
    label: "Medium",
  },
  low: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
    label: "Low",
  },
};

export function RiskBadge({ level, showLabel = true }: RiskBadgeProps) {
  const style = RISK_STYLES[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          level === "critical"
            ? "bg-red-500"
            : level === "high"
              ? "bg-orange-500"
              : level === "medium"
                ? "bg-yellow-500"
                : "bg-green-500"
        }`}
      />
      {showLabel && style.label}
    </span>
  );
}
