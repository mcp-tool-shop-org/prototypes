/**
 * Build Queue
 *
 * Priority-weighted task queue with concurrency control.
 * Tasks are dequeued by priority (highest first, FIFO within
 * same priority). Integrates with TokenIssuer for resource
 * authorization and AuditLog for execution tracking.
 */

import type {
  QueuedTask,
  TaskSubmission,
  TaskExecutor,
  ResourceLimits,
} from "./types.js";
import { TokenIssuer } from "./token-issuer.js";
import { AuditLog } from "./audit-log.js";

let taskCounter = 0;

export class BuildQueue {
  private readonly queue: QueuedTask[] = [];
  private readonly running = new Map<string, QueuedTask>();
  private processing = false;
  private executor: TaskExecutor | undefined;

  constructor(
    private readonly tokens: TokenIssuer,
    private readonly audit: AuditLog,
    private readonly limits: ResourceLimits,
  ) {}

  /** Set the task executor */
  setExecutor(executor: TaskExecutor): void {
    this.executor = executor;
  }

  /** Submit a task to the queue */
  submit(submission: TaskSubmission): QueuedTask {
    // Validate token
    const validation = this.tokens.validate(submission.tokenId);
    if (!validation.valid) {
      throw new Error(`Invalid token "${submission.tokenId}": ${validation.reason}`);
    }

    // Check queue depth
    if (this.queue.length >= this.limits.maxQueueDepth) {
      throw new Error(`Queue full (max ${this.limits.maxQueueDepth})`);
    }

    const token = this.tokens.get(submission.tokenId)!;

    const task: QueuedTask = {
      id: `task-${++taskCounter}-${Date.now()}`,
      label: submission.label,
      owner: submission.owner,
      tokenId: submission.tokenId,
      priority: token.priority,
      payload: submission.payload,
      status: "queued",
      enqueuedAt: new Date().toISOString(),
    };

    // Insert in priority order (highest first)
    const insertIdx = this.queue.findIndex((t) => t.priority < task.priority);
    if (insertIdx === -1) {
      this.queue.push(task);
    } else {
      this.queue.splice(insertIdx, 0, task);
    }

    this.audit.record("task.queued", submission.owner, task.id, {
      label: submission.label,
      tokenId: submission.tokenId,
      priority: token.priority,
    });

    return task;
  }

  /** Process the next task in the queue */
  async processNext(): Promise<QueuedTask | undefined> {
    if (!this.executor) throw new Error("No executor set");
    if (this.running.size >= this.limits.maxConcurrent) return undefined;
    if (this.queue.length === 0) return undefined;

    const task = this.queue.shift()!;
    const token = this.tokens.get(task.tokenId);

    if (!token || token.revoked || token.consumed) {
      task.status = "cancelled";
      task.error = "Token no longer valid";
      task.completedAt = new Date().toISOString();
      this.audit.record("task.cancelled", task.owner, task.id, { reason: "invalid token" });
      return task;
    }

    // Mark running
    task.status = "running";
    task.startedAt = new Date().toISOString();
    this.running.set(task.id, task);

    this.audit.record("task.started", task.owner, task.id, {
      tokenId: task.tokenId,
    });

    try {
      // Execute with timeout
      const result = await Promise.race([
        this.executor(task, token),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Execution timed out")), token.timeoutMs),
        ),
      ]);

      task.status = "completed";
      task.result = result;
      task.completedAt = new Date().toISOString();

      // Consume the token — handle gracefully if token expired/revoked during execution
      try {
        this.tokens.consume(task.tokenId);
      } catch (consumeErr) {
        this.audit.record("token.state_mismatch", task.owner, task.id, {
          tokenId: task.tokenId,
          error: consumeErr instanceof Error ? consumeErr.message : String(consumeErr),
        });
      }

      this.audit.record("task.completed", task.owner, task.id, {
        durationMs: new Date(task.completedAt).getTime() - new Date(task.startedAt!).getTime(),
      });
    } catch (err) {
      task.status = "failed";
      task.error = err instanceof Error ? err.message : String(err);
      task.completedAt = new Date().toISOString();

      this.audit.record("task.failed", task.owner, task.id, {
        error: task.error,
      });
    } finally {
      this.running.delete(task.id);
    }

    return task;
  }

  /** Process all queued tasks until the queue is empty or concurrency is full */
  async drain(): Promise<QueuedTask[]> {
    const results: QueuedTask[] = [];
    while (this.queue.length > 0 && this.running.size < this.limits.maxConcurrent) {
      const task = await this.processNext();
      if (task) results.push(task);
    }
    return results;
  }

  /** Cancel a queued (not running) task */
  cancel(taskId: string): boolean {
    const idx = this.queue.findIndex((t) => t.id === taskId);
    if (idx === -1) return false;

    const task = this.queue.splice(idx, 1)[0];
    task.status = "cancelled";
    task.completedAt = new Date().toISOString();

    this.audit.record("task.cancelled", task.owner, task.id, {});
    return true;
  }

  /** Get all queued tasks */
  queued(): readonly QueuedTask[] {
    return [...this.queue];
  }

  /** Get all running tasks */
  active(): readonly QueuedTask[] {
    return [...this.running.values()];
  }

  /** Get queue depth */
  get depth(): number {
    return this.queue.length;
  }

  /** Get number of running tasks */
  get activeCount(): number {
    return this.running.size;
  }

  /** Clear the queue (does not affect running tasks) */
  clear(): void {
    for (const task of this.queue) {
      task.status = "cancelled";
      task.completedAt = new Date().toISOString();
    }
    this.queue.length = 0;
  }
}
