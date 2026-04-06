/**
 * A single package's sync status.
 */
export interface PackageSyncEntry {
  /** Package name (e.g., "@receipt-factory/core"). */
  name: string;
  /** Version in the local package.json. */
  localVersion: string;
  /** Version published on the registry (null if not published). */
  publishedVersion: string | null;
  /** Whether local and published versions match. */
  inSync: boolean;
  /** Registry queried (e.g., "npm"). */
  registry: string;
}

/**
 * Drift classification for a registry sync check.
 */
export type DriftStatus = "in_sync" | "ahead" | "behind" | "unpublished";

/**
 * Evidence collected for a registry-sync receipt.
 */
export interface RegistrySyncEvidence {
  /** Repository name (e.g., "mcp-tool-shop-org/receipt-factory"). */
  repository: string;
  /** Registry queried (e.g., "npm"). */
  registry: string;
  /** ISO timestamp of when the sync check was performed. */
  collected_at: string;
  /** Individual package sync results. */
  packages: PackageSyncEntry[];
  /** Summary counts. */
  summary: {
    total: number;
    in_sync: number;
    ahead: number;
    behind: number;
    unpublished: number;
  };
}
