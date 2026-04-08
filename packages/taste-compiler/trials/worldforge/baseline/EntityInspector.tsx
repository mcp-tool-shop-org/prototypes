import { useMemo, useState, useCallback } from "react";
import { useProjectStore } from "../store/project-store.js";
import { useEditorStore } from "../store/editor-store.js";
import type {
  EntityPlacement,
  Zone,
  ZoneConnection,
  EntityRole,
} from "@world-forge/schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_COLORS: Record<EntityRole, string> = {
  npc: "#58a6ff",
  enemy: "#f85149",
  merchant: "#d29922",
  "quest-giver": "#3fb950",
  companion: "#bc8cff",
  boss: "#ff7b72",
};

const ROLE_ICONS: Record<EntityRole, string> = {
  npc: "\uD83D\uDDE3",       // 🗣
  enemy: "\u2694",            // ⚔
  merchant: "\uD83D\uDCB0",  // 💰
  "quest-giver": "\u2753",   // ❓
  companion: "\uD83E\uDD1D", // 🤝
  boss: "\uD83D\uDC80",      // 💀
};

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

function getEntitiesInZone(
  zoneId: string,
  entities: EntityPlacement[],
): EntityPlacement[] {
  return entities.filter((e) => e.zoneId === zoneId);
}

// ---------------------------------------------------------------------------
// Validation checks
// ---------------------------------------------------------------------------

type ValidationIssue = {
  severity: "error" | "warning" | "info";
  message: string;
};

function validateEntity(
  entity: EntityPlacement,
  zone: Zone | undefined,
  allEntities: EntityPlacement[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!zone) {
    issues.push({
      severity: "error",
      message: "Entity is not placed in any zone",
    });
  }

  if (!entity.name || entity.name.trim() === "") {
    issues.push({
      severity: "warning",
      message: "Entity has no display name — will use ID in export",
    });
  }

  if (entity.role === "boss" && zone) {
    const otherBosses = allEntities.filter(
      (e) => e.zoneId === zone.id && e.role === "boss" && e.entityId !== entity.entityId,
    );
    if (otherBosses.length > 0) {
      issues.push({
        severity: "warning",
        message: `Zone "${zone.name}" has ${otherBosses.length + 1} boss entities — typically only one per zone`,
      });
    }
  }

  if (entity.role === "merchant" && zone) {
    const otherMerchants = allEntities.filter(
      (e) => e.zoneId === zone.id && e.role === "merchant" && e.entityId !== entity.entityId,
    );
    if (otherMerchants.length > 2) {
      issues.push({
        severity: "info",
        message: `Zone has ${otherMerchants.length + 1} merchants — may dilute commerce`,
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 0",
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 6,
        padding: "8px 10px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "#8b949e", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "error" | "warning" | "info" }) {
  const colors = {
    error: { bg: "rgba(248, 81, 73, 0.15)", text: "#f85149", border: "#f85149" },
    warning: { bg: "rgba(210, 153, 34, 0.15)", text: "#d29922", border: "#d29922" },
    info: { bg: "rgba(88, 166, 255, 0.15)", text: "#58a6ff", border: "#58a6ff" },
  };
  const c = colors[severity];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "1px 6px",
        borderRadius: 10,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        textTransform: "uppercase",
      }}
    >
      {severity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props = {
  entityId: string;
};

export function EntityInspector({ entityId }: Props) {
  const { project, updateEntity, removeEntity } = useProjectStore();
  const { setSelection, setRightTab } = useEditorStore();

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

  const zoneEntities = useMemo(
    () => (zone ? getEntitiesInZone(zone.id, project.entityPlacements) : []),
    [zone, project.entityPlacements],
  );

  const issues = useMemo(
    () => (entity ? validateEntity(entity, zone, project.entityPlacements) : []),
    [entity, zone, project.entityPlacements],
  );

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedRole, setSelectedRole] = useState<EntityRole | null>(null);

  const handleStartEditName = useCallback(() => {
    setEditingName(true);
    setNameValue(entity?.name ?? "");
  }, [entity?.name]);

  const handleSaveName = useCallback(() => {
    if (entity) {
      updateEntity(entity.entityId, { name: nameValue.trim() || undefined });
    }
    setEditingName(false);
  }, [entity, nameValue, updateEntity]);

  const handleChangeRole = useCallback(
    (role: EntityRole) => {
      if (entity) {
        updateEntity(entity.entityId, { role });
      }
      setSelectedRole(null);
    },
    [entity, updateEntity],
  );

  const handleDelete = useCallback(() => {
    if (entity) {
      removeEntity(entity.entityId);
      setSelection({ zones: [], entities: [], landmarks: [], spawns: [], encounters: [] });
    }
  }, [entity, removeEntity, setSelection]);

  const handleDuplicate = useCallback(() => {
    if (!entity || !zone) return;
    // Create a duplicate with offset position
    const newId = `${entity.entityId}-copy-${Date.now()}`;
    useProjectStore.getState().addEntity({
      entityId: newId,
      name: entity.name ? `${entity.name} (copy)` : undefined,
      role: entity.role,
      x: entity.x + 20,
      y: entity.y + 20,
      zoneId: entity.zoneId,
    });
    setSelection({ zones: [], entities: [newId], landmarks: [], spawns: [], encounters: [] });
  }, [entity, zone, setSelection]);

  if (!entity) {
    return (
      <div style={{ padding: 12, color: "#8b949e", fontStyle: "italic", fontSize: 12 }}>
        No entity selected
      </div>
    );
  }

  const roleColor = ROLE_COLORS[entity.role] ?? "#8b949e";

  return (
    <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ── Header with role icon and name ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: "#1c2128",
          borderRadius: 6,
          borderLeft: `3px solid ${roleColor}`,
        }}
      >
        <span style={{ fontSize: 20 }}>{ROLE_ICONS[entity.role]}</span>
        <div style={{ flex: 1 }}>
          {editingName ? (
            <div style={{ display: "flex", gap: 4 }}>
              <input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                autoFocus
                style={{
                  flex: 1,
                  background: "#0d1117",
                  border: "1px solid #58a6ff",
                  borderRadius: 3,
                  color: "#c9d1d9",
                  padding: "2px 6px",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={handleSaveName}
                style={{
                  background: "#238636",
                  border: "none",
                  color: "#fff",
                  borderRadius: 3,
                  padding: "2px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <div
              onClick={handleStartEditName}
              style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#c9d1d9" }}
              title="Click to edit name"
            >
              {entity.name ?? entity.entityId}
            </div>
          )}
          <div style={{ fontSize: 10, color: "#8b949e", marginTop: 2 }}>
            <span
              style={{
                background: `${roleColor}22`,
                color: roleColor,
                padding: "1px 6px",
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {entity.role}
            </span>
            <span style={{ marginLeft: 8, color: "#6e7681" }}>{entity.entityId}</span>
          </div>
        </div>
      </div>

      {/* ── Stats dashboard ── */}
      <div style={{ display: "flex", gap: 6 }}>
        <StatCard
          label="Zone Entities"
          value={zoneEntities.length}
          color="#58a6ff"
        />
        <StatCard
          label="Connections"
          value={connections.length}
          color="#3fb950"
        />
        <StatCard
          label="Issues"
          value={issues.length}
          color={issues.some((i) => i.severity === "error") ? "#f85149" : "#d29922"}
        />
      </div>

      {/* ── Position ── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#8b949e",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          Position
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <label style={{ flex: 1, fontSize: 11, color: "#8b949e" }}>
            X
            <input
              type="number"
              value={entity.x}
              onChange={(e) =>
                updateEntity(entity.entityId, { x: Number(e.target.value) })
              }
              style={{
                display: "block",
                width: "100%",
                background: "#0d1117",
                border: "1px solid #30363d",
                borderRadius: 3,
                color: "#c9d1d9",
                padding: "3px 6px",
                fontSize: 12,
                marginTop: 2,
                outline: "none",
              }}
            />
          </label>
          <label style={{ flex: 1, fontSize: 11, color: "#8b949e" }}>
            Y
            <input
              type="number"
              value={entity.y}
              onChange={(e) =>
                updateEntity(entity.entityId, { y: Number(e.target.value) })
              }
              style={{
                display: "block",
                width: "100%",
                background: "#0d1117",
                border: "1px solid #30363d",
                borderRadius: 3,
                color: "#c9d1d9",
                padding: "3px 6px",
                fontSize: 12,
                marginTop: 2,
                outline: "none",
              }}
            />
          </label>
        </div>
      </div>

      {/* ── Role reassignment ── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#8b949e",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          Change Role
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {(["npc", "enemy", "merchant", "quest-giver", "companion", "boss"] as EntityRole[]).map(
            (role) => (
              <button
                key={role}
                onClick={() => handleChangeRole(role)}
                style={{
                  padding: "3px 8px",
                  fontSize: 10,
                  borderRadius: 10,
                  cursor: "pointer",
                  border:
                    entity.role === role
                      ? `1px solid ${ROLE_COLORS[role]}`
                      : "1px solid #30363d",
                  background:
                    entity.role === role
                      ? `${ROLE_COLORS[role]}22`
                      : "#21262d",
                  color: entity.role === role ? ROLE_COLORS[role] : "#8b949e",
                  fontWeight: entity.role === role ? 600 : 400,
                }}
              >
                {ROLE_ICONS[role]} {role}
              </button>
            ),
          )}
        </div>
      </div>

      {/* ── Zone context ── */}
      {zone && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#8b949e",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Zone Context
          </div>
          <div
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 4,
              padding: 8,
              fontSize: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: "#c9d1d9" }}>{zone.name}</span>
              <span style={{ fontSize: 10, color: "#6e7681" }}>
                {zone.width}×{zone.height}
              </span>
            </div>
            {zone.tags.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
                {zone.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 9,
                      background: "#21262d",
                      color: "#8b949e",
                      padding: "1px 5px",
                      borderRadius: 6,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: "#8b949e" }}>
              Light: {zone.light}/10 · Entities: {zoneEntities.length}
            </div>
          </div>
        </div>
      )}

      {/* ── Nearby connections ── */}
      {connections.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#8b949e",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Zone Connections ({connections.length})
          </div>
          {connections.map((conn, i) => {
            const targetZoneId =
              conn.fromZoneId === zone?.id ? conn.toZoneId : conn.fromZoneId;
            const targetZone = project.zones.find((z) => z.id === targetZoneId);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 0",
                  fontSize: 11,
                }}
              >
                <span style={{ color: "#58a6ff" }}>
                  {conn.bidirectional ? "↔" : conn.fromZoneId === zone?.id ? "→" : "←"}
                </span>
                <span style={{ color: "#c9d1d9" }}>{targetZone?.name ?? targetZoneId}</span>
                <span
                  style={{
                    fontSize: 9,
                    color: "#6e7681",
                    background: "#21262d",
                    padding: "0 4px",
                    borderRadius: 4,
                  }}
                >
                  {conn.kind}
                </span>
                {conn.condition && (
                  <span style={{ fontSize: 9, color: "#d29922", fontStyle: "italic" }}>
                    if: {conn.condition}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Validation issues ── */}
      {issues.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#8b949e",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Issues ({issues.length})
          </div>
          {issues.map((issue, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
                padding: "4px 8px",
                marginBottom: 4,
                background:
                  issue.severity === "error"
                    ? "rgba(248, 81, 73, 0.08)"
                    : issue.severity === "warning"
                    ? "rgba(210, 153, 34, 0.08)"
                    : "rgba(88, 166, 255, 0.08)",
                borderRadius: 4,
                borderLeft: `2px solid ${
                  issue.severity === "error"
                    ? "#f85149"
                    : issue.severity === "warning"
                    ? "#d29922"
                    : "#58a6ff"
                }`,
              }}
            >
              <SeverityBadge severity={issue.severity} />
              <span style={{ fontSize: 11, color: "#c9d1d9", lineHeight: 1.4 }}>
                {issue.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Actions ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          borderTop: "1px solid #30363d",
          paddingTop: 8,
          marginTop: 4,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleDuplicate}
            style={{
              flex: 1,
              background: "#21262d",
              border: "1px solid #30363d",
              color: "#c9d1d9",
              borderRadius: 4,
              padding: "5px 10px",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Duplicate
          </button>
          <button
            onClick={() =>
              setSelection({
                zones: zone ? [zone.id] : [],
                entities: [],
                landmarks: [],
                spawns: [],
                encounters: [],
              })
            }
            style={{
              flex: 1,
              background: "#21262d",
              border: "1px solid #30363d",
              color: "#58a6ff",
              borderRadius: 4,
              padding: "5px 10px",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Select Zone
          </button>
        </div>
        {showConfirmDelete ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleDelete}
              style={{
                flex: 1,
                background: "#da3633",
                border: "none",
                color: "#fff",
                borderRadius: 4,
                padding: "5px 10px",
                fontSize: 11,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Confirm Delete
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              style={{
                flex: 1,
                background: "#21262d",
                border: "1px solid #30363d",
                color: "#8b949e",
                borderRadius: 4,
                padding: "5px 10px",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmDelete(true)}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid #da3633",
              color: "#f85149",
              borderRadius: 4,
              padding: "5px 10px",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Delete Entity
          </button>
        )}
      </div>
    </div>
  );
}
