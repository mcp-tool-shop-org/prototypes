import { useMemo, useState } from "react";
import { useProjectStore } from "../store/project-store.js";
import { exportToEngine } from "@world-forge/export-ai-rpg";
import { validateProject } from "@world-forge/schema";
import type { WorldProject } from "@world-forge/schema";
import {
  sectionHeader,
  cardItem,
  badgePill,
  hintText,
} from "../ui/styles.js";

// ---------------------------------------------------------------------------
// Diff computation — read-only comparison, no mutations
// ---------------------------------------------------------------------------

type DiffEntry = {
  path: string;
  kind: "matched" | "diverged" | "dropped";
  detail?: string;
};

function computeExportDiff(project: WorldProject): {
  entries: DiffEntry[];
  validation: { errors: number; warnings: number };
  exportable: boolean;
} {
  // Pre-validation — same gate the export modal uses
  const precheck = validateProject(project);
  const validationErrors = precheck.errors?.filter((e: any) => e.severity === "error") ?? [];
  const validationWarnings = precheck.errors?.filter((e: any) => e.severity === "warning") ?? [];

  if (!precheck.valid) {
    return {
      entries: [],
      validation: { errors: validationErrors.length, warnings: validationWarnings.length },
      exportable: false,
    };
  }

  const result = exportToEngine(project);
  if (!result.success) {
    return {
      entries: [],
      validation: { errors: (result.errors ?? []).length, warnings: 0 },
      exportable: false,
    };
  }

  const entries: DiffEntry[] = [];
  const pack = result.contentPack;

  // Zones → Locations
  for (const zone of project.zones) {
    const location = pack.locations?.find((l: any) => l.id === zone.id);
    if (!location) {
      entries.push({
        path: `zones/${zone.name}`,
        kind: "dropped",
        detail: "Zone not present in engine pack",
      });
    } else if (zone.name !== location.name) {
      entries.push({
        path: `zones/${zone.name}`,
        kind: "diverged",
        detail: `Name: "${zone.name}" → "${location.name}"`,
      });
    } else {
      entries.push({ path: `zones/${zone.name}`, kind: "matched" });
    }
  }

  // Entities → Characters
  for (const entity of project.entityPlacements) {
    const label = entity.name ?? entity.entityId;
    const char = pack.characters?.find((c: any) => c.id === entity.entityId);
    if (!char) {
      entries.push({
        path: `entities/${label}`,
        kind: "dropped",
        detail: "Entity not converted to character",
      });
    } else {
      entries.push({ path: `entities/${label}`, kind: "matched" });
    }
  }

  // Connections
  for (const conn of project.connections) {
    const from = project.zones.find((z) => z.id === conn.fromZoneId);
    const to = project.zones.find((z) => z.id === conn.toZoneId);
    entries.push({
      path: `connections/${from?.name ?? "?"} → ${to?.name ?? "?"}`,
      kind: "matched",
    });
  }

  return {
    entries,
    validation: { errors: validationErrors.length, warnings: validationWarnings.length },
    exportable: true,
  };
}

// ---------------------------------------------------------------------------
// Component — read-only diff, no export trigger, no mutations
// ---------------------------------------------------------------------------

export function ExportPreviewDiff() {
  const { project } = useProjectStore();
  const [showAll, setShowAll] = useState(false);

  const diff = useMemo(() => computeExportDiff(project), [project]);

  const issueEntries = diff.entries.filter((e) => e.kind !== "matched");
  const displayEntries = showAll ? diff.entries : issueEntries;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--wf-space-2)",
        fontSize: "var(--wf-font-md)",
      }}
    >
      <div style={sectionHeader}>Export Fidelity</div>

      {/* Validation gate status */}
      {!diff.exportable && (
        <div
          style={{
            padding: "var(--wf-space-2)",
            background: "color-mix(in srgb, var(--wf-danger) 8%, transparent)",
            borderRadius: "var(--wf-radius-sm)",
            borderLeft: "2px solid var(--wf-danger-text)",
            fontSize: "var(--wf-font-sm)",
            color: "var(--wf-text-primary)",
          }}
        >
          Export blocked — {diff.validation.errors} validation{" "}
          {diff.validation.errors === 1 ? "error" : "errors"}.
          Check the Issues tab.
        </div>
      )}

      {/* Summary line */}
      <div
        style={{
          fontSize: "var(--wf-font-sm)",
          color: "var(--wf-text-muted)",
          display: "flex",
          gap: "var(--wf-space-3)",
        }}
      >
        <span>{diff.entries.length} items checked</span>
        {issueEntries.length > 0 ? (
          <span style={{ color: "var(--wf-warning)" }}>
            {issueEntries.length} {issueEntries.length === 1 ? "issue" : "issues"}
          </span>
        ) : (
          <span style={{ color: "var(--wf-success-text)" }}>All matched</span>
        )}
      </div>

      {/* Filter toggle */}
      {diff.entries.length > 0 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          style={{
            background: "none",
            border: "none",
            color: "var(--wf-text-faint)",
            fontSize: "var(--wf-font-xs)",
            cursor: "pointer",
            padding: 0,
            textAlign: "left",
          }}
        >
          {showAll
            ? `Show issues only (${issueEntries.length})`
            : `Show all ${diff.entries.length} items`}
        </button>
      )}

      {/* Diff entries */}
      {displayEntries.map((entry, i) => (
        <div
          key={i}
          style={{
            ...cardItem,
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--wf-space-2)",
            padding: "var(--wf-space-1) var(--wf-space-2)",
            background:
              entry.kind === "dropped"
                ? "color-mix(in srgb, var(--wf-danger) 6%, transparent)"
                : entry.kind === "diverged"
                ? "color-mix(in srgb, var(--wf-warning) 6%, transparent)"
                : "transparent",
            borderColor:
              entry.kind === "dropped"
                ? "color-mix(in srgb, var(--wf-danger) 20%, var(--wf-border-default))"
                : entry.kind === "diverged"
                ? "color-mix(in srgb, var(--wf-warning) 20%, var(--wf-border-default))"
                : "var(--wf-border-default)",
          }}
        >
          <span
            style={{
              ...badgePill,
              flexShrink: 0,
              background:
                entry.kind === "dropped"
                  ? "color-mix(in srgb, var(--wf-danger) 15%, transparent)"
                  : entry.kind === "diverged"
                  ? "color-mix(in srgb, var(--wf-warning) 15%, transparent)"
                  : "var(--wf-bg-hover)",
              color:
                entry.kind === "dropped"
                  ? "var(--wf-danger-text)"
                  : entry.kind === "diverged"
                  ? "var(--wf-warning)"
                  : "var(--wf-text-muted)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {entry.kind === "dropped"
              ? "lost"
              : entry.kind === "diverged"
              ? "drift"
              : "ok"}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "var(--wf-text-primary)" }}>{entry.path}</div>
            {entry.detail && (
              <div style={hintText}>{entry.detail}</div>
            )}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {displayEntries.length === 0 && diff.exportable && (
        <div style={hintText}>
          {showAll ? "No items to compare." : "No fidelity issues detected."}
        </div>
      )}
    </div>
  );
}
