/**
 * React hooks for storage operations.
 * Provides convenient access to audit persistence in components.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getStorage,
  PersistedAudit,
  PersistedAuditId,
  ArtifactSet,
  ArtifactSetId,
  AuditListItem,
} from "./index";

/**
 * Hook for accessing saved audits.
 */
export function useSavedAudits() {
  const [audits, setAudits] = useState<AuditListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storage = getStorage();
      const list = await storage.listAudits();
      setAudits(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteAudit = useCallback(async (id: PersistedAuditId) => {
    try {
      const storage = getStorage();
      await storage.deleteAudit(id);
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete audit");
      return false;
    }
  }, [refresh]);

  const renameAudit = useCallback(async (id: PersistedAuditId, name: string) => {
    try {
      const storage = getStorage();
      await storage.updateAuditName(id, name);
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to rename audit");
      return false;
    }
  }, [refresh]);

  return { audits, loading, error, refresh, deleteAudit, renameAudit };
}

/**
 * Hook for loading a single audit.
 */
export function useAudit(id: PersistedAuditId | null) {
  const [audit, setAudit] = useState<PersistedAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      if (audit !== null) {
        // Defer state update to avoid synchronous set during render phase if called early
        setTimeout(() => setAudit(null), 0);
      }
      return;
    }

    setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    getStorage()
      .getAudit(id)
      .then(setAudit)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load audit"))
      .finally(() => setLoading(false));
  }, [id, audit]);

  return { audit, loading, error };
}

/**
 * Hook for saving audits.
 */
export function useSaveAudit() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveAudit = useCallback(async (audit: PersistedAudit): Promise<PersistedAuditId | null> => {
    setSaving(true);
    setError(null);
    try {
      const storage = getStorage();
      const id = await storage.saveAudit(audit);
      return id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save audit");
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return { saveAudit, saving, error };
}

/**
 * Hook for artifact sets.
 */
export function useArtifactSets() {
  const [sets, setSets] = useState<ArtifactSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storage = getStorage();
      const list = await storage.listArtifactSets();
      setSets(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load artifact sets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveSet = useCallback(async (set: ArtifactSet): Promise<ArtifactSetId | null> => {
    try {
      const storage = getStorage();
      const id = await storage.saveArtifactSet(set);
      await refresh();
      return id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save artifact set");
      return null;
    }
  }, [refresh]);

  const deleteSet = useCallback(async (id: ArtifactSetId) => {
    try {
      const storage = getStorage();
      await storage.deleteArtifactSet(id);
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete artifact set");
      return false;
    }
  }, [refresh]);

  return { sets, loading, error, refresh, saveSet, deleteSet };
}

/**
 * Hook for auto-save setting.
 */
export function useAutoSaveSetting() {
  const [autoSave, setAutoSave] = useState(true); // Default: on
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStorage()
      .getSetting<boolean>("autoSave")
      .then((value) => {
        if (value !== null) setAutoSave(value);
      })
      .finally(() => setLoading(false));
  }, []);

  const setAutoSaveSetting = useCallback(async (value: boolean) => {
    setAutoSave(value);
    await getStorage().setSetting("autoSave", value);
  }, []);

  return { autoSave, setAutoSaveSetting, loading };
}
