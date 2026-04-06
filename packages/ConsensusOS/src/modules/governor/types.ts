/**
 * Governor Types
 *
 * Type definitions for the token-based governor layer.
 * The governor controls resource allocation through execution tokens,
 * enforces CPU/RAM limits, manages build queues with priority weighting,
 * and maintains an immutable execution audit log.
 */

// ─── Tokens ─────────────────────────────────────────────────────────

/**
 * An execution token granting rights to consume resources.
 *
 * Invariant: consumed and revoked must never both be true simultaneously.
 * consume() enforces this by rejecting revoked tokens.
 */
export interface ExecutionToken {
  /** Unique token identifier */
  readonly id: string;
  /** Plugin or actor that owns this token */
  readonly owner: string;
  /** Maximum CPU millicores this token authorizes */
  readonly cpuMillis: number;
  /** Maximum memory bytes this token authorizes */
  readonly memoryBytes: number;
  /** Maximum wall-clock milliseconds this token authorizes */
  readonly timeoutMs: number;
  /** Priority level (higher = more priority) */
  readonly priority: number;
  /** ISO-8601 timestamp of issuance */
  readonly issuedAt: string;
  /** ISO-8601 timestamp of expiration (undefined = no expiry) */
  readonly expiresAt?: string;
  /** Whether this token has been revoked */
  revoked: boolean;
  /** Whether this token has been consumed */
  consumed: boolean;
}

/** Token issuance request */
export interface TokenRequest {
  /** Plugin or actor requesting the token */
  owner: string;
  /** Requested CPU millicores (default: 1000 = 1 core) */
  cpuMillis?: number;
  /** Requested memory bytes (default: 256 MB) */
  memoryBytes?: number;
  /** Execution timeout in ms (default: 30000) */
  timeoutMs?: number;
  /** Priority (default: 5, range 1-10) */
  priority?: number;
  /** Token TTL in ms (undefined = no expiry) */
  ttlMs?: number;
}

// ─── Resource Limits ────────────────────────────────────────────────

/** Resource limits enforced by the throttling layer */
export interface ResourceLimits {
  /** Total CPU millicores available across all tokens */
  totalCpuMillis: number;
  /** Total memory bytes available across all tokens */
  totalMemoryBytes: number;
  /** Maximum concurrent executions */
  maxConcurrent: number;
  /** Maximum queue depth */
  maxQueueDepth: number;
}

/** Current resource utilization snapshot */
export interface ResourceUsage {
  /** CPU millicores currently allocated */
  cpuMillisUsed: number;
  /** Memory bytes currently allocated */
  memoryBytesUsed: number;
  /** Number of active executions */
  activeExecutions: number;
  /** Number of queued tasks */
  queuedTasks: number;
  /** Utilization percentages */
  utilization: {
    cpu: number;
    memory: number;
    concurrency: number;
    queue: number;
  };
}

// ─── Build Queue ────────────────────────────────────────────────────

export type TaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

/** A task in the build queue */
export interface QueuedTask {
  /** Unique task identifier */
  readonly id: string;
  /** Human-readable label */
  readonly label: string;
  /** Owner who submitted this task */
  readonly owner: string;
  /** Execution token authorizing this task */
  readonly tokenId: string;
  /** Priority (inherited from token) */
  readonly priority: number;
  /** Task payload — opaque data passed to the executor */
  readonly payload: Record<string, unknown>;
  /** Current status */
  status: TaskStatus;
  /** ISO-8601 enqueue time */
  readonly enqueuedAt: string;
  /** ISO-8601 start time (set when running) */
  startedAt?: string;
  /** ISO-8601 completion time */
  completedAt?: string;
  /** Result or error message */
  result?: unknown;
  /** Error message if failed */
  error?: string;
}

/** Task submission request */
export interface TaskSubmission {
  label: string;
  owner: string;
  tokenId: string;
  payload: Record<string, unknown>;
}

/** Task executor function */
export type TaskExecutor = (
  task: QueuedTask,
  token: ExecutionToken,
) => Promise<unknown>;

// ─── Policy ─────────────────────────────────────────────────────────

export type PolicyVerdict = "allow" | "deny" | "throttle";

/** A policy rule evaluated by the policy engine */
export interface PolicyRule {
  /** Unique rule identifier */
  readonly id: string;
  /** Human-readable description */
  readonly description: string;
  /** Rule priority (higher = evaluated first) */
  readonly priority: number;
  /** Evaluate the rule against a token request */
  evaluate(request: TokenRequest, usage: ResourceUsage): PolicyVerdict;
}

// ─── Audit Log ──────────────────────────────────────────────────────

export type AuditAction =
  | "token.issued"
  | "token.revoked"
  | "token.expired"
  | "token.consumed"
  | "task.queued"
  | "task.started"
  | "task.completed"
  | "task.failed"
  | "task.cancelled"
  | "policy.evaluated"
  | "throttle.applied"
  | "resource.exceeded"
  | "token.state_mismatch";

/** An immutable audit log entry */
export interface AuditEntry {
  /** Unique entry ID */
  readonly id: string;
  /** Action performed */
  readonly action: AuditAction;
  /** Actor who triggered the action */
  readonly actor: string;
  /** Relevant entity ID (token, task, etc.) */
  readonly entityId: string;
  /** Additional context */
  readonly details: Record<string, unknown>;
  /** ISO-8601 timestamp */
  readonly timestamp: string;
}
