/**
 * Token Issuer
 *
 * Issues, tracks, revokes, and validates execution tokens.
 * Tokens grant time-limited rights to consume CPU, memory,
 * and execution slots. Every action is audit-logged.
 */

import type { ExecutionToken, TokenRequest, ResourceLimits, ResourceUsage } from "./types.js";
import { AuditLog } from "./audit-log.js";

let tokenCounter = 0;

const DEFAULT_CPU = 1000;      // 1 core
const DEFAULT_MEMORY = 256 * 1024 * 1024; // 256 MB
const DEFAULT_TIMEOUT = 30_000; // 30 s
const DEFAULT_PRIORITY = 5;

export class TokenIssuer {
  private readonly tokens = new Map<string, ExecutionToken>();

  constructor(
    private readonly limits: ResourceLimits,
    private readonly audit: AuditLog,
  ) {}

  /** Issue a new execution token */
  issue(request: TokenRequest): ExecutionToken {
    const cpuMillis = request.cpuMillis ?? DEFAULT_CPU;
    const memoryBytes = request.memoryBytes ?? DEFAULT_MEMORY;
    const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT;
    const priority = Math.min(10, Math.max(1, request.priority ?? DEFAULT_PRIORITY));

    // Check resource availability
    const usage = this.getUsage();
    if (usage.cpuMillisUsed + cpuMillis > this.limits.totalCpuMillis) {
      throw new Error(
        `CPU limit exceeded: requested ${cpuMillis}m, available ${this.limits.totalCpuMillis - usage.cpuMillisUsed}m`,
      );
    }
    if (usage.memoryBytesUsed + memoryBytes > this.limits.totalMemoryBytes) {
      throw new Error(
        `Memory limit exceeded: requested ${memoryBytes}B, available ${this.limits.totalMemoryBytes - usage.memoryBytesUsed}B`,
      );
    }

    const now = new Date();
    const id = `token-${++tokenCounter}-${now.getTime()}`;

    const token: ExecutionToken = {
      id,
      owner: request.owner,
      cpuMillis,
      memoryBytes,
      timeoutMs,
      priority,
      issuedAt: now.toISOString(),
      expiresAt: request.ttlMs
        ? new Date(now.getTime() + request.ttlMs).toISOString()
        : undefined,
      revoked: false,
      consumed: false,
    };

    this.tokens.set(id, token);

    this.audit.record("token.issued", request.owner, id, {
      cpuMillis,
      memoryBytes,
      timeoutMs,
      priority,
    });

    return token;
  }

  /** Revoke a token */
  revoke(tokenId: string): void {
    const token = this.tokens.get(tokenId);
    if (!token) throw new Error(`Token "${tokenId}" not found`);
    if (token.revoked) throw new Error(`Token "${tokenId}" already revoked`);

    token.revoked = true;

    this.audit.record("token.revoked", token.owner, tokenId, {});
  }

  /** Mark a token as consumed */
  consume(tokenId: string): void {
    const token = this.tokens.get(tokenId);
    if (!token) throw new Error(`Token "${tokenId}" not found`);
    if (token.revoked) throw new Error(`Token "${tokenId}" is revoked and cannot be consumed`);
    if (token.consumed) throw new Error(`Token "${tokenId}" already consumed`);

    token.consumed = true;

    this.audit.record("token.consumed", token.owner, tokenId, {});
  }

  /** Validate a token is active and not expired (pure read — no state mutation) */
  validate(tokenId: string): { valid: boolean; reason?: string } {
    const token = this.tokens.get(tokenId);
    if (!token) return { valid: false, reason: "Token not found" };
    if (token.revoked) return { valid: false, reason: "Token revoked" };
    if (token.consumed) return { valid: false, reason: "Token already consumed" };
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return { valid: false, reason: "Token expired" };
    }
    return { valid: true };
  }

  /** Auto-expire a token: revoke it if expired and audit the expiration. Returns true if the token was expired and revoked. */
  autoExpire(tokenId: string): boolean {
    const token = this.tokens.get(tokenId);
    if (!token) return false;
    if (token.revoked || token.consumed) return false;
    if (!token.expiresAt || new Date(token.expiresAt) >= new Date()) return false;

    token.revoked = true;
    this.audit.record("token.expired", token.owner, tokenId, {});
    return true;
  }

  /** Get a token by ID */
  get(tokenId: string): ExecutionToken | undefined {
    return this.tokens.get(tokenId);
  }

  /** List all tokens, optionally filtered by owner */
  list(owner?: string): ExecutionToken[] {
    const all = [...this.tokens.values()];
    return owner ? all.filter((t) => t.owner === owner) : all;
  }

  /** Get active (non-revoked, non-consumed, non-expired) tokens */
  active(): ExecutionToken[] {
    return this.list().filter((t) => {
      if (t.revoked || t.consumed) return false;
      if (t.expiresAt && new Date(t.expiresAt) < new Date()) {
        this.audit.record("token.expired", t.owner, t.id, {});
        return false;
      }
      return true;
    });
  }

  /** Get current resource usage from active tokens */
  getUsage(): ResourceUsage {
    const activeTokens = this.active();
    const cpuMillisUsed = activeTokens.reduce((sum, t) => sum + t.cpuMillis, 0);
    const memoryBytesUsed = activeTokens.reduce((sum, t) => sum + t.memoryBytes, 0);

    return {
      cpuMillisUsed,
      memoryBytesUsed,
      activeExecutions: activeTokens.length,
      queuedTasks: 0, // Updated by BuildQueue
      utilization: {
        cpu: this.limits.totalCpuMillis > 0 ? cpuMillisUsed / this.limits.totalCpuMillis : 0,
        memory: this.limits.totalMemoryBytes > 0 ? memoryBytesUsed / this.limits.totalMemoryBytes : 0,
        concurrency: this.limits.maxConcurrent > 0 ? activeTokens.length / this.limits.maxConcurrent : 0,
        queue: 0,
      },
    };
  }

  /** Clear all tokens (for testing) */
  clear(): void {
    this.tokens.clear();
  }
}
