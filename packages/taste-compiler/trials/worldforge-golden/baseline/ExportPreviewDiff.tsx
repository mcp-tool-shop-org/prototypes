import { useState, useMemo, useCallback } from "react";
import { useProjectStore } from "../store/project-store.js";
import { useEditorStore } from "../store/editor-store.js";
import { useModalStore } from "../store/modal-store.js";
import { exportToEngine } from "@world-forge/export-ai-rpg";
import type { WorldProject } from "@world-forge/schema";

// ---------------------------------------------------------------------------
// Diff computation
// ---------------------------------------------------------------------------

type DiffEntry = {
  path: string;
  kind: "added" | "removed" | "changed" | "unchanged";
  editorValue?: string;
  engineValue?: string;
};

function computeExportDiff(project: WorldProject): {
  entries: DiffEntry[];
  stats: { added: number; removed: number; changed: number; total: number };
  warnings: string[];
} {
  const result = exportToEngine(project);
  if (!result.success) {
    return {
      entries: [],
      stats: { added: 0, removed: 0, changed: 0, total: 0 },
      warnings: result.errors ?? [],
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
        kind: "removed",
        editorValue: JSON.stringify(zone, null, 2),
      });
    } else {
      const zoneStr = JSON.stringify({ name: zone.name, tags: zone.tags, light: zone.light });
      const locStr = JSON.stringify({ name: location.name, tags: location.tags, light: location.lightLevel });
      entries.push({
        path: `zones/${zone.name}`,
        kind: zoneStr === locStr ? "unchanged" : "changed",
        editorValue: zoneStr,
        engineValue: locStr,
      });
    }
  }

  // Entities → Characters
  for (const entity of project.entityPlacements) {
    const char = pack.characters?.find((c: any) => c.id === entity.entityId);
    if (!char) {
      entries.push({
        path: `entities/${entity.name ?? entity.entityId}`,
        kind: "removed",
        editorValue: JSON.stringify(entity, null, 2),
      });
    } else {
      entries.push({
        path: `entities/${entity.name ?? entity.entityId}`,
        kind: "unchanged",
        editorValue: entity.role,
        engineValue: char.role,
      });
    }
  }

  // Connections
  for (const conn of project.connections) {
    const fromZone = project.zones.find((z) => z.id === conn.fromZoneId);
    const toZone = project.zones.find((z) => z.id === conn.toZoneId);
    entries.push({
      path: `connections/${fromZone?.name ?? conn.fromZoneId} → ${toZone?.name ?? conn.toZoneId}`,
      kind: "unchanged",
    });
  }

  const stats = {
    added: entries.filter((e) => e.kind === "added").length,
    removed: entries.filter((e) => e.kind === "removed").length,
    changed: entries.filter((e) => e.kind === "changed").length,
    total: entries.length,
  };

  return { entries, stats, warnings: result.warnings ?? [] };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const KIND_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  added: { bg: "rgba(58, 201, 122, 0.1)", text: "#3ac97a", label: "NEW" },
  removed: { bg: "rgba(232, 84, 84, 0.1)", text: "#e85454", label: "LOST" },
  changed: { bg: "rgba(232, 167, 68, 0.1)", text: "#e8a744", label: "CHANGED" },
  unchanged: { bg: "transparent", text: "#8b949e", label: "OK" },
};

export function ExportPreviewDiff() {
  const { project, updateZone } = useProjectStore();
  const { setRightTab } = useEditorStore();
  const { open: openModal } = useModalStore();

  const [filter, setFilter] = useState<"all" | "issues">("all");
  const [selectedEntry, setSelectedEntry] = useState<DiffEntry | null>(null);
  const [autoFixing, setAutoFixing] = useState(false);

  const diff = useMemo(() => computeExportDiff(project), [project]);

  const filteredEntries = useMemo(
    () =>
      filter === "issues"
        ? diff.entries.filter((e) => e.kind !== "unchanged")
        : diff.entries,
    [diff.entries, filter],
  );

  const handleExport = useCallback(() => {
    openModal("export");
  }, [openModal]);

  const handleAutoFix = useCallback(() => {
    setAutoFixing(true);
    // Attempt to fix changed entries by syncing editor state
    for (const entry of diff.entries) {
      if (entry.kind === "changed" && entry.engineValue) {
        try {
          const engineData = JSON.parse(entry.engineValue);
          const zone = project.zones.find((z) => z.name === entry.path.replace("zones/", ""));
          if (zone && engineData.light !== undefined) {
            updateZone(zone.id, { light: engineData.light });
          }
        } catch {
          // Skip unparseable entries
        }
      }
    }
    setAutoFixing(false);
  }, [diff.entries, project.zones, updateZone]);

  return (
    <div style={{ padding: 10, fontSize: 12 }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#c9d1d9" }}>
          Export Preview
        </h3>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setFilter(filter === "all" ? "issues" : "all")}
            style={{
              padding: "3px 8px",
              fontSize: 10,
              borderRadius: 10,
              cursor: "pointer",
              border: "1px solid #30363d",
              background: filter === "issues" ? "#e8a744" : "#21262d",
              color: filter === "issues" ? "#000" : "#8b949e",
            }}
          >
            {filter === "issues" ? "Issues Only" : "Show All"}
          </button>
        </div>
      </div>

      {/* Stats dashboard */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{
          flex: 1,
          textAlign: "center",
          padding: "8px 4px",
          background: "#161b22",
          borderRadius: 6,
          border: "1px solid #30363d",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#c9d1d9" }}>
            {diff.stats.total}
          </div>
          <div style={{ fontSize: 9, color: "#8b949e", textTransform: "uppercase" }}>Total</div>
        </div>
        <div style={{
          flex: 1,
          textAlign: "center",
          padding: "8px 4px",
          background: "rgba(232, 84, 84, 0.06)",
          borderRadius: 6,
          border: "1px solid rgba(232, 84, 84, 0.15)",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e85454" }}>
            {diff.stats.removed}
          </div>
          <div style={{ fontSize: 9, color: "#e85454", textTransform: "uppercase" }}>Lost</div>
        </div>
        <div style={{
          flex: 1,
          textAlign: "center",
          padding: "8px 4px",
          background: "rgba(232, 167, 68, 0.06)",
          borderRadius: 6,
          border: "1px solid rgba(232, 167, 68, 0.15)",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e8a744" }}>
            {diff.stats.changed}
          </div>
          <div style={{ fontSize: 9, color: "#e8a744", textTransform: "uppercase" }}>Changed</div>
        </div>
      </div>

      {/* Warnings */}
      {diff.warnings.length > 0 && (
        <div style={{
          padding: 8,
          background: "rgba(232, 167, 68, 0.08)",
          border: "1px solid rgba(232, 167, 68, 0.2)",
          borderRadius: 4,
          marginBottom: 12,
        }}>
          <div style={{ fontWeight: 600, color: "#e8a744", fontSize: 11, marginBottom: 4 }}>
            Export Warnings
          </div>
          {diff.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 11, color: "#c9d1d9", padding: "2px 0" }}>
              • {w}
            </div>
          ))}
        </div>
      )}

      {/* Diff entries */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {filteredEntries.map((entry, i) => {
          const config = KIND_COLORS[entry.kind];
          return (
            <div
              key={i}
              onClick={() => setSelectedEntry(entry.kind !== "unchanged" ? entry : null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 8px",
                background: config.bg,
                borderRadius: 4,
                cursor: entry.kind !== "unchanged" ? "pointer" : "default",
              }}
            >
              <span style={{
                fontSize: 9,
                fontWeight: 600,
                color: config.text,
                width: 52,
                textTransform: "uppercase",
              }}>
                {config.label}
              </span>
              <span style={{ color: "#c9d1d9", flex: 1 }}>{entry.path}</span>
            </div>
          );
        })}
      </div>

      {/* Selected entry detail */}
      {selectedEntry && (
        <div style={{
          marginTop: 12,
          padding: 10,
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 4,
        }}>
          <div style={{ fontWeight: 600, color: "#c9d1d9", marginBottom: 6 }}>
            {selectedEntry.path}
          </div>
          {selectedEntry.editorValue && (
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#e85454" }}>Editor:</span>
              <pre style={{
                margin: "2px 0",
                fontSize: 10,
                color: "#8b949e",
                background: "#0d1117",
                padding: 6,
                borderRadius: 3,
                overflow: "auto",
              }}>
                {selectedEntry.editorValue}
              </pre>
            </div>
          )}
          {selectedEntry.engineValue && (
            <div>
              <span style={{ fontSize: 10, color: "#3ac97a" }}>Engine:</span>
              <pre style={{
                margin: "2px 0",
                fontSize: 10,
                color: "#8b949e",
                background: "#0d1117",
                padding: 6,
                borderRadius: 3,
                overflow: "auto",
              }}>
                {selectedEntry.engineValue}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: "flex",
        gap: 6,
        marginTop: 12,
        borderTop: "1px solid #30363d",
        paddingTop: 10,
      }}>
        <button
          onClick={handleExport}
          style={{
            flex: 1,
            background: "#238636",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Export to Engine
        </button>
        {diff.stats.changed > 0 && (
          <button
            onClick={handleAutoFix}
            disabled={autoFixing}
            style={{
              flex: 1,
              background: "#21262d",
              color: "#e8a744",
              border: "1px solid #30363d",
              borderRadius: 4,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {autoFixing ? "Fixing..." : "Auto-Fix Drift"}
          </button>
        )}
      </div>
    </div>
  );
}
