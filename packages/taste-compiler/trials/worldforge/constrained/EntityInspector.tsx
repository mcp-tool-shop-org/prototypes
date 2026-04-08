import { useMemo, useState } from "react";
import { useProjectStore } from "../store/project-store.js";
import { useEditorStore } from "../store/editor-store.js";
import type {
  EntityPlacement,
  Zone,
  ZoneConnection,
} from "@world-forge/schema";
import {
  inspectorShell,
  sectionHeader,
  badgePill,
  cardItem,
  hintText,
} from "../ui/styles.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getZoneForEntity(
  entity: EntityPlacement,
  zones: Zone[],
): Zone | undefined {
  return zones.find((z) => z.id === entity.zoneId);
}

function getConnectionsForZone(
  zoneId: string,
  connections: ZoneConnection[],
): ZoneConnection[] {
  return connections.filter(
    (c) => c.fromZoneId === zoneId || c.toZoneId === zoneId,
  );
}

// ---------------------------------------------------------------------------
// Validation (read-only diagnostics)
// ---------------------------------------------------------------------------

type InspectorIssue = {
  severity: "error" | "warning" | "info";
  message: string;
};

function diagnoseEntity(
  entity: EntityPlacement,
  zone: Zone | undefined,
  allEntities: EntityPlacement[],
): InspectorIssue[] {
  const issues: InspectorIssue[] = [];

  if (!zone) {
    issues.push({ severity: "error", message: "Not placed in any zone" });
  }

  if (!entity.name || entity.name.trim() === "") {
    issues.push({
      severity: "warning",
      message: "No display name — export will use raw ID",
    });
  }

  if (entity.role === "boss" && zone) {
    const siblingBosses = allEntities.filter(
      (e) =>
        e.zoneId === zone.id &&
        e.role === "boss" &&
        e.entityId !== entity.entityId,
    );
    if (siblingBosses.length > 0) {
      issues.push({
        severity: "warning",
        message: `${siblingBosses.length + 1} bosses in "${zone.name}" — typically one per zone`,
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Property row
// ---------------------------------------------------------------------------

function PropRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "3px 0",
        fontSize: "var(--wf-font-md)",
      }}
    >
      <span style={{ color: "var(--wf-text-muted)" }}>{label}</span>
      <span style={{ color: "var(--wf-text-primary)", fontWeight: 500 }}>
        {children}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component — read-only inspector for selected entity
// ---------------------------------------------------------------------------

type Props = {
  entityId: string;
};

export function EntityInspector({ entityId }: Props) {
  const { project } = useProjectStore();
  const { setSelection } = useEditorStore();

  const entity = useMemo(
    () => project.entityPlacements.find((e) => e.entityId === entityId),
    [project.entityPlacements, entityId],
  );

  const zone = useMemo(
    () => (entity ? getZoneForEntity(entity, project.zones) : undefined),
    [entity, project.zones],
  );

  const connections = useMemo(
    () => (zone ? getConnectionsForZone(zone.id, project.connections) : []),
    [zone, project.connections],
  );

  const issues = useMemo(
    () =>
      entity ? diagnoseEntity(entity, zone, project.entityPlacements) : [],
    [entity, zone, project.entityPlacements],
  );

  const [expanded, setExpanded] = useState(true);

  if (!entity) {
    return (
      <div style={{ ...inspectorShell, padding: "var(--wf-space-3)" }}>
        <p style={hintText}>Select an entity on the canvas to inspect it.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--wf-space-2)",
        fontSize: "var(--wf-font-md)",
      }}
    >
      {/* ── Identity ── */}
      <div style={sectionHeader}>
        {entity.name ?? entity.entityId}
      </div>

      <PropRow label="Role">
        <span style={badgePill}>{entity.role}</span>
      </PropRow>
      <PropRow label="ID">
        <span style={{ fontSize: "var(--wf-font-xs)", color: "var(--wf-text-faint)" }}>
          {entity.entityId}
        </span>
      </PropRow>
      <PropRow label="Position">
        {entity.x}, {entity.y}
      </PropRow>

      {/* ── Zone context ── */}
      {zone && (
        <>
          <div style={sectionHeader}>Zone</div>
          <div style={cardItem}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--wf-text-primary)" }}>
                {zone.name}
              </span>
              <span
                style={{
                  fontSize: "var(--wf-font-xs)",
                  color: "var(--wf-text-faint)",
                }}
              >
                {zone.width}×{zone.height}
              </span>
            </div>
            {zone.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  flexWrap: "wrap",
                  marginTop: "var(--wf-space-1)",
                }}
              >
                {zone.tags.map((tag) => (
                  <span key={tag} style={badgePill}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div
              style={{
                fontSize: "var(--wf-font-xs)",
                color: "var(--wf-text-muted)",
                marginTop: "var(--wf-space-1)",
              }}
            >
              Light: {zone.light}/10
            </div>
          </div>
        </>
      )}

      {/* ── Connections from this zone ── */}
      {connections.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              ...sectionHeader,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              textAlign: "left",
            }}
          >
            <span>Connections ({connections.length})</span>
            <span
              style={{
                fontSize: "var(--wf-font-xs)",
                color: "var(--wf-text-faint)",
              }}
            >
              {expanded ? "▼" : "▶"}
            </span>
          </button>

          {expanded &&
            connections.map((conn, i) => {
              const targetId =
                conn.fromZoneId === zone?.id
                  ? conn.toZoneId
                  : conn.fromZoneId;
              const target = project.zones.find((z) => z.id === targetId);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--wf-space-2)",
                    padding: "3px 0",
                    fontSize: "var(--wf-font-sm)",
                  }}
                >
                  <span style={{ color: "var(--wf-accent)" }}>
                    {conn.bidirectional
                      ? "↔"
                      : conn.fromZoneId === zone?.id
                      ? "→"
                      : "←"}
                  </span>
                  <span style={{ color: "var(--wf-text-primary)" }}>
                    {target?.name ?? targetId}
                  </span>
                  <span style={badgePill}>{conn.kind}</span>
                  {conn.condition && (
                    <span style={hintText}>if: {conn.condition}</span>
                  )}
                </div>
              );
            })}
        </>
      )}

      {/* ── Validation issues ── */}
      {issues.length > 0 && (
        <>
          <div style={sectionHeader}>Issues ({issues.length})</div>
          {issues.map((issue, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--wf-space-2)",
                padding: "var(--wf-space-1) var(--wf-space-2)",
                marginBottom: "var(--wf-space-1)",
                background:
                  issue.severity === "error"
                    ? "color-mix(in srgb, var(--wf-danger) 8%, transparent)"
                    : issue.severity === "warning"
                    ? "color-mix(in srgb, var(--wf-warning) 8%, transparent)"
                    : "color-mix(in srgb, var(--wf-accent) 8%, transparent)",
                borderRadius: "var(--wf-radius-sm)",
                borderLeft:
                  issue.severity === "error"
                    ? "2px solid var(--wf-danger-text)"
                    : issue.severity === "warning"
                    ? "2px solid var(--wf-warning)"
                    : "2px solid var(--wf-accent)",
              }}
            >
              <span
                style={{
                  ...badgePill,
                  background:
                    issue.severity === "error"
                      ? "color-mix(in srgb, var(--wf-danger) 15%, transparent)"
                      : issue.severity === "warning"
                      ? "color-mix(in srgb, var(--wf-warning) 15%, transparent)"
                      : "color-mix(in srgb, var(--wf-accent) 15%, transparent)",
                  color:
                    issue.severity === "error"
                      ? "var(--wf-danger-text)"
                      : issue.severity === "warning"
                      ? "var(--wf-warning)"
                      : "var(--wf-accent)",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {issue.severity}
              </span>
              <span
                style={{
                  fontSize: "var(--wf-font-sm)",
                  color: "var(--wf-text-primary)",
                  lineHeight: 1.4,
                }}
              >
                {issue.message}
              </span>
            </div>
          ))}
        </>
      )}

      {/* ── Navigate to zone (the only action — selection, not mutation) ── */}
      {zone && (
        <button
          onClick={() =>
            setSelection({
              zones: [zone.id],
              entities: [],
              landmarks: [],
              spawns: [],
              encounters: [],
            })
          }
          style={{
            background: "var(--wf-bg-control)",
            border: "1px solid var(--wf-border-default)",
            borderRadius: "var(--wf-radius-md)",
            color: "var(--wf-accent)",
            padding: "5px 10px",
            fontSize: "var(--wf-font-sm)",
            cursor: "pointer",
            marginTop: "var(--wf-space-2)",
            width: "100%",
            textAlign: "center",
          }}
        >
          Select parent zone on canvas
        </button>
      )}
    </div>
  );
}
