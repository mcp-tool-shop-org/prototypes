/**
 * A single vulnerability finding.
 */
export interface AuditFinding {
  /** Severity level. */
  severity: "critical" | "high" | "moderate" | "low" | "info";
  /** Package name affected. */
  package: string;
  /** Version range affected. */
  range?: string;
  /** Advisory title or description. */
  title: string;
  /** Advisory URL (if available). */
  url?: string;
}

/**
 * Evidence collected for a security-audit receipt.
 */
export interface SecurityAuditEvidence {
  /** What was scanned (e.g., repository name or path). */
  scan_target: string;
  /** ISO timestamp of when the audit was performed. */
  collected_at: string;
  /** Commit SHA at time of scan. */
  commit_sha?: string;
  /** Tool used for scanning. */
  tool: {
    name: string;
    version: string;
  };
  /** Dependency graph snapshot — e.g., lockfile hash. */
  lockfile_digest?: string;
  /** Summary of findings by severity. */
  summary: {
    total: number;
    critical: number;
    high: number;
    moderate: number;
    low: number;
    info: number;
  };
  /** Individual findings. */
  findings: AuditFinding[];
}
