import { useState, useEffect, useCallback, useRef } from "react";

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
// Validation
// ---------------------------------------------------------------------------

type ValidationErrors = {
  historyLimit?: string;
  shellPath?: string;
};

function validateSettings(settings: QuickSettings): ValidationErrors {
  const errors: ValidationErrors = {};
  if (settings.historyLimit < 1 || settings.historyLimit > 100000) {
    errors.historyLimit = "Must be between 1 and 100,000";
  }
  if (!settings.shellPath.trim()) {
    errors.shellPath = "Shell path is required";
  }
  return errors;
}

// ---------------------------------------------------------------------------
// SessionHistory — history panel with clear-all, notes, and quick-settings
//
// Interaction law compliance:
//   LAW-001: Clear-all and delete require confirmation
//   LAW-002: Settings submit disabled until validation passes
//   LAW-003: Draft settings preserved across tab switches
//   LAW-004: Empty history shows primary action (start session CTA)
// ---------------------------------------------------------------------------

export function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<"history" | "settings">("history");

  // --- Draft settings survive tab switches (LAW-003) ---
  const [settings, setSettings] = useState<QuickSettings>({
    historyLimit: 1000,
    autoSave: true,
    shellPath: "/bin/bash",
    theme: "dark",
  });
  const [savedSettings, setSavedSettings] = useState<QuickSettings | null>(null);
  const settingsDirty = useRef(false);

  // --- Confirmation state (LAW-001) ---
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // --- Validation (LAW-002) ---
  const validationErrors = validateSettings(settings);
  const isValid = Object.keys(validationErrors).length === 0;

  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("commandui-sessions");
    if (stored) {
      setSessions(JSON.parse(stored));
    }
    const storedSettings = localStorage.getItem("commandui-settings");
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      setSettings(parsed);
      setSavedSettings(parsed);
    }
  }, []);

  // --- LAW-001: Destructive actions require confirmation ---
  const handleClearAll = useCallback(() => {
    if (!confirmClearAll) {
      setConfirmClearAll(true);
      return;
    }
    setSessions([]);
    localStorage.removeItem("commandui-sessions");
    setConfirmClearAll(false);
  }, [confirmClearAll]);

  const handleDeleteSession = useCallback(
    (id: string) => {
      if (confirmDeleteId !== id) {
        setConfirmDeleteId(id);
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setConfirmDeleteId(null);
    },
    [confirmDeleteId]
  );

  const handleCancelClearAll = () => setConfirmClearAll(false);
  const handleCancelDelete = () => setConfirmDeleteId(null);

  // --- LAW-002: Submit gated by validation ---
  const handleSaveSettings = useCallback(() => {
    if (!isValid) return;
    localStorage.setItem("commandui-settings", JSON.stringify(settings));
    setSavedSettings(settings);
    settingsDirty.current = false;
  }, [isValid, settings]);

  // --- LAW-003: Tab switch preserves draft settings ---
  const handleTabSwitch = (tab: "history" | "settings") => {
    // Settings state persists in component — no reset on tab switch
    setActiveTab(tab);
    // Dismiss any open confirmations when switching context
    setConfirmClearAll(false);
    setConfirmDeleteId(null);
  };

  const handleSettingsChange = (patch: Partial<QuickSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
    settingsDirty.current = true;
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
    <div className="session-history">
      {/* Tab bar */}
      <div className="session-tabs">
        <button
          className={`tab-btn ${activeTab === "history" ? "tab-btn--active" : ""}`}
          onClick={() => handleTabSwitch("history")}
        >
          History
        </button>
        <button
          className={`tab-btn ${activeTab === "settings" ? "tab-btn--active" : ""}`}
          onClick={() => handleTabSwitch("settings")}
        >
          Quick Settings
          {settingsDirty.current && <span className="unsaved-dot" />}
        </button>
      </div>

      {/* History tab */}
      {activeTab === "history" && (
        <div className="session-history-content">
          {/* Action bar */}
          <div className="session-header">
            <h3>Session History</h3>
            {sessions.length > 0 && (
              confirmClearAll ? (
                <div className="confirm-group">
                  <span className="confirm-label">Clear all {sessions.length} sessions?</span>
                  <button className="btn btn--danger-confirm" onClick={handleClearAll}>
                    Confirm Clear All
                  </button>
                  <button className="btn btn--cancel" onClick={handleCancelClearAll}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="btn btn--danger" onClick={handleClearAll}>
                  Clear All
                </button>
              )
            )}
          </div>

          {/* LAW-004: Empty state has primary action */}
          {sessions.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-message">No sessions recorded yet.</p>
              <p className="empty-state-hint">
                Sessions are recorded automatically when you run commands in the terminal.
              </p>
              <button className="btn btn--primary" onClick={() => {/* focus terminal input */}}>
                Open Terminal
              </button>
            </div>
          ) : (
            <div className="session-list">
              {sessions.map((session) => (
                <div key={session.id} className="session-card">
                  <div className="session-card-header">
                    <div>
                      <span className="session-name">{session.name}</span>
                      <span className="session-meta">
                        {session.startedAt} &middot; {session.commands} commands
                      </span>
                    </div>
                    {/* LAW-001: Delete requires confirmation */}
                    {confirmDeleteId === session.id ? (
                      <div className="confirm-group">
                        <button
                          className="btn btn--danger-confirm btn--sm"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          Confirm
                        </button>
                        <button
                          className="btn btn--cancel btn--sm"
                          onClick={handleCancelDelete}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn--outline-danger btn--sm"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="session-notes">
                    {editingNotes === session.id ? (
                      <div className="note-edit">
                        <input
                          className="note-input"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add a note..."
                        />
                        <button
                          className="btn btn--primary btn--sm"
                          onClick={() => handleSaveNote(session.id)}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        className="note-trigger"
                        onClick={() => handleStartNoteEdit(session)}
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
        <div className="session-settings">
          <h3>Quick Settings</h3>

          <div className="settings-form">
            <label className="field">
              History Limit
              <input
                className={`field-input ${validationErrors.historyLimit ? "field-input--error" : ""}`}
                type="number"
                value={settings.historyLimit}
                onChange={(e) =>
                  handleSettingsChange({ historyLimit: Number(e.target.value) })
                }
              />
              {validationErrors.historyLimit && (
                <span className="field-error">{validationErrors.historyLimit}</span>
              )}
            </label>

            <label className="field">
              Shell Path
              <input
                className={`field-input ${validationErrors.shellPath ? "field-input--error" : ""}`}
                type="text"
                value={settings.shellPath}
                onChange={(e) =>
                  handleSettingsChange({ shellPath: e.target.value })
                }
              />
              {validationErrors.shellPath && (
                <span className="field-error">{validationErrors.shellPath}</span>
              )}
            </label>

            <label className="field field--checkbox">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) =>
                  handleSettingsChange({ autoSave: e.target.checked })
                }
              />
              Auto-save session on close
            </label>

            <label className="field">
              Theme
              <select
                className="field-input"
                value={settings.theme}
                onChange={(e) =>
                  handleSettingsChange({ theme: e.target.value })
                }
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>

            {/* LAW-002: Submit disabled until validation passes */}
            <button
              className="btn btn--primary"
              onClick={handleSaveSettings}
              disabled={!isValid}
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
