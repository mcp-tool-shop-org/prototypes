/**
 * IndexedDB implementation of AuditStorage.
 * Browser-first persistence layer.
 */

import {
  AuditStorage,
  PersistedAudit,
  PersistedAuditId,
  ArtifactSet,
  ArtifactSetId,
  AuditListItem,
  generateStorageId,
} from "./types";

const DB_NAME = "feature-reacher";
const DB_VERSION = 1;

// Store names
const AUDITS_STORE = "audits";
const ARTIFACT_SETS_STORE = "artifactSets";
const SETTINGS_STORE = "settings";

/**
 * Open the IndexedDB database, creating stores if needed.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Audits store with indexes
      if (!db.objectStoreNames.contains(AUDITS_STORE)) {
        const auditsStore = db.createObjectStore(AUDITS_STORE, { keyPath: "id" });
        auditsStore.createIndex("auditId", "auditId", { unique: false });
        auditsStore.createIndex("createdAt", "createdAt", { unique: false });
        auditsStore.createIndex("name", "name", { unique: false });
      }

      // Artifact sets store
      if (!db.objectStoreNames.contains(ARTIFACT_SETS_STORE)) {
        const setsStore = db.createObjectStore(ARTIFACT_SETS_STORE, { keyPath: "id" });
        setsStore.createIndex("name", "name", { unique: false });
        setsStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Settings store (key-value)
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
    };
  });
}

/**
 * Wrap an IDB request in a Promise.
 */
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB implementation of the AuditStorage interface.
 */
export class IndexedDBStorage implements AuditStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDatabase();
    }
    return this.dbPromise;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Audits
  // ─────────────────────────────────────────────────────────────────────────────

  async saveAudit(audit: PersistedAudit): Promise<PersistedAuditId> {
    const db = await this.getDB();
    const tx = db.transaction(AUDITS_STORE, "readwrite");
    const store = tx.objectStore(AUDITS_STORE);

    // Generate ID if not present
    const auditToSave: PersistedAudit = {
      ...audit,
      id: audit.id || generateStorageId(),
      updatedAt: new Date().toISOString(),
    };

    await promisifyRequest(store.put(auditToSave));
    return auditToSave.id;
  }

  async getAudit(id: PersistedAuditId): Promise<PersistedAudit | null> {
    const db = await this.getDB();
    const tx = db.transaction(AUDITS_STORE, "readonly");
    const store = tx.objectStore(AUDITS_STORE);
    const result = await promisifyRequest(store.get(id));
    return result || null;
  }

  async listAudits(): Promise<AuditListItem[]> {
    const db = await this.getDB();
    const tx = db.transaction(AUDITS_STORE, "readonly");
    const store = tx.objectStore(AUDITS_STORE);
    const index = store.index("createdAt");

    const audits: PersistedAudit[] = await promisifyRequest(index.getAll());

    // Sort descending by createdAt and map to list items
    return audits
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((audit) => ({
        id: audit.id,
        auditId: audit.auditId,
        name: audit.name,
        createdAt: audit.createdAt,
        artifactCount: audit.artifactRefs.length,
        featureCount: audit.features.length,
        highRiskCount: audit.rankedFeatures.filter((f) => f.riskLevel === "high").length,
        criticalRiskCount: audit.rankedFeatures.filter((f) => f.riskLevel === "critical").length,
      }));
  }

  async deleteAudit(id: PersistedAuditId): Promise<boolean> {
    const db = await this.getDB();
    const tx = db.transaction(AUDITS_STORE, "readwrite");
    const store = tx.objectStore(AUDITS_STORE);

    // Check if exists
    const existing = await promisifyRequest(store.get(id));
    if (!existing) return false;

    await promisifyRequest(store.delete(id));
    return true;
  }

  async updateAuditName(id: PersistedAuditId, name: string): Promise<boolean> {
    const db = await this.getDB();
    const tx = db.transaction(AUDITS_STORE, "readwrite");
    const store = tx.objectStore(AUDITS_STORE);

    const existing = await promisifyRequest(store.get(id));
    if (!existing) return false;

    const updated: PersistedAudit = {
      ...existing,
      name,
      updatedAt: new Date().toISOString(),
    };

    await promisifyRequest(store.put(updated));
    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Artifact Sets
  // ─────────────────────────────────────────────────────────────────────────────

  async saveArtifactSet(set: ArtifactSet): Promise<ArtifactSetId> {
    const db = await this.getDB();
    const tx = db.transaction(ARTIFACT_SETS_STORE, "readwrite");
    const store = tx.objectStore(ARTIFACT_SETS_STORE);

    const setToSave: ArtifactSet = {
      ...set,
      id: set.id || generateStorageId(),
      updatedAt: new Date().toISOString(),
    };

    // Convert Map to plain object for storage
    const storableSet = {
      ...setToSave,
      artifactContents: setToSave.artifactContents
        ? Object.fromEntries(setToSave.artifactContents)
        : undefined,
    };

    await promisifyRequest(store.put(storableSet));
    return setToSave.id;
  }

  async getArtifactSet(id: ArtifactSetId): Promise<ArtifactSet | null> {
    const db = await this.getDB();
    const tx = db.transaction(ARTIFACT_SETS_STORE, "readonly");
    const store = tx.objectStore(ARTIFACT_SETS_STORE);
    const result = await promisifyRequest(store.get(id));

    if (!result) return null;

    // Convert plain object back to Map
    return {
      ...result,
      artifactContents: result.artifactContents
        ? new Map(Object.entries(result.artifactContents))
        : undefined,
    };
  }

  async listArtifactSets(): Promise<ArtifactSet[]> {
    const db = await this.getDB();
    const tx = db.transaction(ARTIFACT_SETS_STORE, "readonly");
    const store = tx.objectStore(ARTIFACT_SETS_STORE);
    const index = store.index("createdAt");

    const sets = await promisifyRequest(index.getAll());

    // Sort descending and convert Maps
    return sets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((set) => ({
        ...set,
        artifactContents: set.artifactContents
          ? new Map(Object.entries(set.artifactContents))
          : undefined,
      }));
  }

  async deleteArtifactSet(id: ArtifactSetId): Promise<boolean> {
    const db = await this.getDB();
    const tx = db.transaction(ARTIFACT_SETS_STORE, "readwrite");
    const store = tx.objectStore(ARTIFACT_SETS_STORE);

    const existing = await promisifyRequest(store.get(id));
    if (!existing) return false;

    await promisifyRequest(store.delete(id));
    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Settings
  // ─────────────────────────────────────────────────────────────────────────────

  async getSetting<T>(key: string): Promise<T | null> {
    const db = await this.getDB();
    const tx = db.transaction(SETTINGS_STORE, "readonly");
    const store = tx.objectStore(SETTINGS_STORE);
    const result = await promisifyRequest(store.get(key));
    return result?.value ?? null;
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(SETTINGS_STORE, "readwrite");
    const store = tx.objectStore(SETTINGS_STORE);
    await promisifyRequest(store.put({ key, value }));
  }
}

/**
 * Singleton instance of the IndexedDB storage.
 */
let storageInstance: IndexedDBStorage | null = null;

export function getStorage(): AuditStorage {
  if (!storageInstance) {
    storageInstance = new IndexedDBStorage();
  }
  return storageInstance;
}
