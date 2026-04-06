/**
 * Governor Plugin
 *
 * Top-level orchestrator for the token-based governor layer.
 * Manages execution tokens, resource throttling, build queues,
 * policy enforcement, and audit logging as a first-class plugin.
 *
 * Capabilities: governor
 * Events emitted: governor.ready, governor.token.issued,
 *   governor.token.revoked, governor.task.completed, governor.task.failed
 * Invariants: governor.resource-limits, governor.queue-depth
 */

import type {
  Plugin,
  PluginManifest,
  PluginContext,
  PluginConfig,
  LifecycleResult,
  Logger,
} from "../../plugins/api.js";
import type { EventBus } from "../../core/event-bus.js";
import type {
  ResourceLimits,
  TokenRequest,
  TaskSubmission,
  TaskExecutor,
  ExecutionToken,
  QueuedTask,
  ResourceUsage,
} from "./types.js";
import { TokenIssuer } from "./token-issuer.js";
import { PolicyEngine, type PolicyEvaluation, requestValidationRule } from "./policy-engine.js";
import { BuildQueue } from "./build-queue.js";
import { AuditLog } from "./audit-log.js";

// ─── Config ─────────────────────────────────────────────────────────

export interface GovernorPluginConfig {
  /** Total CPU millicores (default: 4000 = 4 cores) */
  totalCpuMillis?: number;
  /** Total memory bytes (default: 1 GB) */
  totalMemoryBytes?: number;
  /** Max concurrent executions (default: 10) */
  maxConcurrent?: number;
  /** Max queue depth (default: 100) */
  maxQueueDepth?: number;
}

// ─── Plugin ─────────────────────────────────────────────────────────

export class GovernorPlugin implements Plugin {
  readonly manifest: PluginManifest = {
    id: "governor",
    name: "Token-Based Governor",
    version: "1.0.0",
    capabilities: ["governor"],
    description: "Resource control governor — token issuance, throttling, build queue, policy engine",
  };

  private events!: EventBus;
  private log!: Logger;
  private limits!: ResourceLimits;

  // Sub-engines (public for direct access in tests / CLI)
  readonly audit = new AuditLog();
  tokens!: TokenIssuer;
  policies!: PolicyEngine;
  queue!: BuildQueue;

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    this.events = ctx.events;
    this.log = ctx.log;

    const raw = ctx.config as PluginConfig & GovernorPluginConfig;
    this.limits = {
      totalCpuMillis: raw.totalCpuMillis ?? 4000,
      totalMemoryBytes: raw.totalMemoryBytes ?? 1024 * 1024 * 1024,
      maxConcurrent: raw.maxConcurrent ?? 10,
      maxQueueDepth: raw.maxQueueDepth ?? 100,
    };

    this.tokens = new TokenIssuer(this.limits, this.audit);
    this.policies = new PolicyEngine(this.audit);
    this.queue = new BuildQueue(this.tokens, this.audit, this.limits);

    // Register invariants
    ctx.invariants.register({
      name: "governor.resource-limits",
      owner: this.manifest.id,
      description: "Token resource allocation within limits",
      check: () => {
        const usage = this.tokens.getUsage();
        return (
          usage.cpuMillisUsed <= this.limits.totalCpuMillis &&
          usage.memoryBytesUsed <= this.limits.totalMemoryBytes
        );
      },
    });

    ctx.invariants.register({
      name: "governor.queue-depth",
      owner: this.manifest.id,
      description: `Build queue depth <= ${this.limits.maxQueueDepth}`,
      check: () => this.queue.depth <= this.limits.maxQueueDepth,
    });

    ctx.invariants.register({
      name: "governor.token-state-consistency",
      owner: this.manifest.id,
      description: "No token may be both consumed and revoked simultaneously",
      check: () => {
        const allTokens = this.tokens.list();
        return allTokens.every(t => !(t.consumed && t.revoked));
      },
    });

    // Register request validation as a default policy
    this.policies.addRule(requestValidationRule());

    this.log.info("Governor initialized", { limits: this.limits });
    return { ok: true };
  }

  async start(): Promise<LifecycleResult> {
    this.events.publish("governor.ready", this.manifest.id, {
      limits: this.limits,
    });
    this.log.info("Governor started");
    return { ok: true };
  }

  async stop(): Promise<LifecycleResult> {
    this.queue.clear();
    this.log.info("Governor stopped");
    return { ok: true };
  }

  async destroy(): Promise<void> {
    this.tokens.clear();
    this.policies.clear();
    this.queue.clear();
    this.audit.clear();
  }

  // ── Token Expiration ────────────────────────────────────────────

  /** Auto-expire all tokens that have passed their TTL */
  expireTokens(): number {
    let expired = 0;
    for (const token of this.tokens.list()) {
      if (this.tokens.autoExpire(token.id)) expired++;
    }
    return expired;
  }

  // ── Token Management ────────────────────────────────────────────

  /** Request an execution token (subject to policy evaluation) */
  requestToken(request: TokenRequest): { token?: ExecutionToken; policy: PolicyEvaluation } {
    const usage = this.getUsage();
    const policyResult = this.policies.evaluate(request, usage);

    if (policyResult.verdict === "deny") {
      this.events.publish("governor.token.denied", this.manifest.id, {
        owner: request.owner,
        reason: policyResult.decidingRule,
      });
      return { policy: policyResult };
    }

    if (policyResult.verdict === "throttle") {
      // Throttle: reduce allocated resources by 50%
      request = {
        ...request,
        cpuMillis: Math.floor((request.cpuMillis ?? 1000) / 2),
        memoryBytes: Math.floor((request.memoryBytes ?? 256 * 1024 * 1024) / 2),
      };
      this.audit.record("throttle.applied", request.owner, "policy", {
        rule: policyResult.decidingRule,
      });
    }

    const token = this.tokens.issue(request);

    this.events.publish("governor.token.issued", this.manifest.id, {
      tokenId: token.id,
      owner: token.owner,
      priority: token.priority,
    });

    return { token, policy: policyResult };
  }

  /** Revoke a token */
  revokeToken(tokenId: string): void {
    this.tokens.revoke(tokenId);
    this.events.publish("governor.token.revoked", this.manifest.id, { tokenId });
  }

  // ── Build Queue ─────────────────────────────────────────────────

  /** Set the task executor */
  setExecutor(executor: TaskExecutor): void {
    this.queue.setExecutor(executor);
  }

  /** Submit a task to the build queue */
  submitTask(submission: TaskSubmission): QueuedTask {
    const task = this.queue.submit(submission);

    this.events.publish("governor.task.queued", this.manifest.id, {
      taskId: task.id,
      label: task.label,
      priority: task.priority,
    });

    return task;
  }

  /** Process all queued tasks */
  async processTasks(): Promise<QueuedTask[]> {
    const results = await this.queue.drain();

    for (const task of results) {
      if (task.status === "completed") {
        this.events.publish("governor.task.completed", this.manifest.id, {
          taskId: task.id,
        });
      } else if (task.status === "failed") {
        this.events.publish("governor.task.failed", this.manifest.id, {
          taskId: task.id,
          error: task.error,
        });
      }
    }

    return results;
  }

  // ── Resource Monitoring ─────────────────────────────────────────

  /** Get current resource usage */
  getUsage(): ResourceUsage {
    const usage = this.tokens.getUsage();
    usage.queuedTasks = this.queue.depth;
    usage.utilization.queue =
      this.limits.maxQueueDepth > 0 ? this.queue.depth / this.limits.maxQueueDepth : 0;
    return usage;
  }

  /** Get resource limits */
  getLimits(): ResourceLimits {
    return { ...this.limits };
  }
}

/** Factory export */
export function createGovernorPlugin(): Plugin {
  return new GovernorPlugin();
}
