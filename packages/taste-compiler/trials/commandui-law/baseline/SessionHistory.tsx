import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Session data model
// ---------------------------------------------------------------------------

type Session = {
  id: string;
  name: string;
  startedAt: string;
  commands: number;
  notes: string;
};

type QuickSettings = {
  historyLimit: number;
  autoSave: boolean;
  shellPath: string;
  theme: string;
};

// ---------------------------------------------------------------------------
// SessionHistory — history panel with clear-all, notes, and quick-settings
// ---------------------------------------------------------------------------

export function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<"history" | "settings">("history");
  const [settings, setSettings] = useState<QuickSettings>({
    historyLimit: 1000,
    autoSave: true,
    shellPath: "/bin/bash",
    theme: "dark",
  });
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    // Load sessions from storage
    const stored = localStorage.getItem("commandui-sessions");
    if (stored) {
      setSessions(JSON.parse(stored));
    }
  }, []);

  // --- Destructive: clears all history with no confirmation ---
  const handleClearAll = () => {
    setSessions([]);
    localStorage.removeItem("commandui-sessions");
  };

  // --- Destructive: deletes single session without confirmation ---
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  // --- Settings submit: always enabled, no validation ---
  const handleSaveSettings = () => {
    localStorage.setItem("commandui-settings", JSON.stringify(settings));
  };

  // --- Tab switch: loses any unsaved settings edits ---
  const handleTabSwitch = (tab: "history" | "settings") => {
    setActiveTab(tab);
    // Note: any in-progress settings changes are lost on tab switch
  };

  const handleStartNoteEdit = (session: Session) => {
    setEditingNotes(session.id);
    setNoteText(session.notes);
  };

  const handleSaveNote = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, notes: noteText } : s))
    );
    setEditingNotes(null);
  };

  return (
    <div className="session-history" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tab bar */}
      <div className="session-tabs" style={{ display: "flex", gap: "8px", padding: "12px 16px", borderBottom: "1px solid #333" }}>
        <button
          onClick={() => handleTabSwitch("history")}
          style={{
            padding: "6px 16px",
            background: activeTab === "history" ? "#4a9eff" : "transparent",
            color: activeTab === "history" ? "#fff" : "#888",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          History
        </button>
        <button
          onClick={() => handleTabSwitch("settings")}
          style={{
            padding: "6px 16px",
            background: activeTab === "settings" ? "#4a9eff" : "transparent",
            color: activeTab === "settings" ? "#fff" : "#888",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Quick Settings
        </button>
      </div>

      {/* History tab */}
      {activeTab === "history" && (
        <div className="session-history-content" style={{ flex: 1, overflow: "auto", padding: "16px" }}>
          {/* Action bar */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "#e0e0e0" }}>Session History</h3>
            <button
              onClick={handleClearAll}
              style={{
                padding: "6px 12px",
                background: "#ff4444",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Clear All History
            </button>
          </div>

          {/* Session list or empty state */}
          {sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px", color: "#666" }}>
              <p>No sessions recorded yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    padding: "12px 16px",
                    background: "#1a1a2e",
                    borderRadius: "6px",
                    border: "1px solid #333",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ color: "#e0e0e0", fontWeight: 600 }}>{session.name}</span>
                      <span style={{ color: "#666", marginLeft: "12px", fontSize: "0.85em" }}>
                        {session.startedAt} &middot; {session.commands} commands
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      style={{
                        padding: "4px 8px",
                        background: "transparent",
                        color: "#ff6666",
                        border: "1px solid #ff6666",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.8em",
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Notes */}
                  <div style={{ marginTop: "8px" }}>
                    {editingNotes === session.id ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add a note..."
                          style={{
                            flex: 1,
                            padding: "4px 8px",
                            background: "#0d0d1a",
                            color: "#e0e0e0",
                            border: "1px solid #444",
                            borderRadius: "4px",
                          }}
                        />
                        <button
                          onClick={() => handleSaveNote(session.id)}
                          style={{
                            padding: "4px 12px",
                            background: "#4a9eff",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartNoteEdit(session)}
                        style={{
                          background: "transparent",
                          color: "#4a9eff",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          fontSize: "0.85em",
                        }}
                      >
                        {session.notes || "Add note..."}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === "settings" && (
        <div className="session-settings" style={{ flex: 1, overflow: "auto", padding: "16px" }}>
          <h3 style={{ margin: "0 0 16px", color: "#e0e0e0" }}>Quick Settings</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <label style={{ color: "#ccc" }}>
              History Limit
              <input
                type="number"
                value={settings.historyLimit}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, historyLimit: Number(e.target.value) }))
                }
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "4px",
                  padding: "8px",
                  background: "#0d0d1a",
                  color: "#e0e0e0",
                  border: "1px solid #444",
                  borderRadius: "4px",
                }}
              />
            </label>

            <label style={{ color: "#ccc" }}>
              Shell Path
              <input
                type="text"
                value={settings.shellPath}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, shellPath: e.target.value }))
                }
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "4px",
                  padding: "8px",
                  background: "#0d0d1a",
                  color: "#e0e0e0",
                  border: "1px solid #444",
                  borderRadius: "4px",
                }}
              />
            </label>

            <label style={{ color: "#ccc", display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, autoSave: e.target.checked }))
                }
              />
              Auto-save session on close
            </label>

            <label style={{ color: "#ccc" }}>
              Theme
              <select
                value={settings.theme}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, theme: e.target.value }))
                }
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "4px",
                  padding: "8px",
                  background: "#0d0d1a",
                  color: "#e0e0e0",
                  border: "1px solid #444",
                  borderRadius: "4px",
                }}
              />
            </label>

            {/* Submit always enabled — no validation gate */}
            <button
              onClick={handleSaveSettings}
              style={{
                padding: "10px 20px",
                background: "#4a9eff",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
