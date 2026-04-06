import { describe, it, expect, beforeEach, vi } from "vitest";
import { BuildQueue } from "../src/modules/governor/build-queue.js";
import { TokenIssuer } from "../src/modules/governor/token-issuer.js";
import { AuditLog } from "../src/modules/governor/audit-log.js";
import type { ResourceLimits } from "../src/modules/governor/types.js";

const MB = 1024 * 1024;

function makeLimits(overrides: Partial<ResourceLimits> = {}): ResourceLimits {
  return {
    totalCpuMillis: 4000,
    totalMemoryBytes: 1024 * MB,
    maxConcurrent: 2,
    maxQueueDepth: 5,
    ...overrides,
  };
}

describe("BuildQueue", () => {
  let queue: BuildQueue;
  let tokens: TokenIssuer;
  let audit: AuditLog;
  let limits: ResourceLimits;

  beforeEach(() => {
    audit = new AuditLog();
    limits = makeLimits();
    tokens = new TokenIssuer(limits, audit);
    queue = new BuildQueue(tokens, audit, limits);
    queue.setExecutor(async (task) => ({ built: task.label }));
  });

  it("submits a task with valid token", () => {
    const token = tokens.issue({ owner: "dev" });
    const task = queue.submit({ label: "build-app", owner: "dev", tokenId: token.id, payload: {} });

    expect(task.id).toContain("task-");
    expect(task.status).toBe("queued");
    expect(task.priority).toBe(token.priority);
    expect(queue.depth).toBe(1);
  });

  it("rejects tasks with invalid tokens", () => {
    expect(() =>
      queue.submit({ label: "x", owner: "dev", tokenId: "fake", payload: {} }),
    ).toThrow("Invalid token");
  });

  it("rejects tasks when queue is full", () => {
    const taskTokens = Array.from({ length: 6 }, (_, i) =>
      tokens.issue({ owner: `dev-${i}`, cpuMillis: 100, memoryBytes: 10 * MB }),
    );

    for (let i = 0; i < 5; i++) {
      queue.submit({ label: `t-${i}`, owner: `dev-${i}`, tokenId: taskTokens[i].id, payload: {} });
    }

    expect(() =>
      queue.submit({ label: "overflow", owner: "dev-5", tokenId: taskTokens[5].id, payload: {} }),
    ).toThrow("Queue full");
  });

  it("processes tasks by priority (highest first)", async () => {
    const lowToken = tokens.issue({ owner: "low", priority: 2, cpuMillis: 100, memoryBytes: 10 * MB });
    const highToken = tokens.issue({ owner: "high", priority: 9, cpuMillis: 100, memoryBytes: 10 * MB });
    const midToken = tokens.issue({ owner: "mid", priority: 5, cpuMillis: 100, memoryBytes: 10 * MB });

    queue.submit({ label: "low-task", owner: "low", tokenId: lowToken.id, payload: {} });
    queue.submit({ label: "high-task", owner: "high", tokenId: highToken.id, payload: {} });
    queue.submit({ label: "mid-task", owner: "mid", tokenId: midToken.id, payload: {} });

    const results = await queue.drain();
    expect(results.map((t) => t.label)).toEqual(["high-task", "mid-task", "low-task"]);
  });

  it("processes next task and marks completed", async () => {
    const token = tokens.issue({ owner: "dev" });
    queue.submit({ label: "build", owner: "dev", tokenId: token.id, payload: {} });

    const task = await queue.processNext();
    expect(task).toBeDefined();
    expect(task!.status).toBe("completed");
    expect(task!.result).toEqual({ built: "build" });
    expect(task!.startedAt).toBeDefined();
    expect(task!.completedAt).toBeDefined();
  });

  it("marks task failed on executor error", async () => {
    queue.setExecutor(async () => { throw new Error("build failed"); });

    const token = tokens.issue({ owner: "dev" });
    queue.submit({ label: "fail-task", owner: "dev", tokenId: token.id, payload: {} });

    const task = await queue.processNext();
    expect(task!.status).toBe("failed");
    expect(task!.error).toContain("build failed");
  });

  it("cancels a queued task", () => {
    const token = tokens.issue({ owner: "dev" });
    const task = queue.submit({ label: "cancel-me", owner: "dev", tokenId: token.id, payload: {} });

    expect(queue.cancel(task.id)).toBe(true);
    expect(queue.depth).toBe(0);
    expect(queue.cancel("nonexistent")).toBe(false);
  });

  it("respects concurrency limit", async () => {
    queue.setExecutor(async (task) => {
      await new Promise((r) => setTimeout(r, 50));
      return task.label;
    });

    const taskTokens = Array.from({ length: 3 }, (_, i) =>
      tokens.issue({ owner: `dev-${i}`, cpuMillis: 100, memoryBytes: 10 * MB }),
    );

    for (let i = 0; i < 3; i++) {
      queue.submit({ label: `t-${i}`, owner: `dev-${i}`, tokenId: taskTokens[i].id, payload: {} });
    }

    // First processNext should work
    const t1 = queue.processNext();
    expect(queue.activeCount).toBe(1); // Not yet resolved

    await t1;
    // After first completes, activeCount should be back to 0
    expect(queue.activeCount).toBe(0);
  });

  it("cancels tasks with revoked tokens", async () => {
    const token = tokens.issue({ owner: "dev" });
    queue.submit({ label: "doomed", owner: "dev", tokenId: token.id, payload: {} });

    tokens.revoke(token.id);

    const task = await queue.processNext();
    expect(task!.status).toBe("cancelled");
    expect(task!.error).toContain("no longer valid");
  });

  it("throws if no executor is set", async () => {
    const freshQueue = new BuildQueue(tokens, audit, limits);
    const token = tokens.issue({ owner: "dev" });
    freshQueue.submit({ label: "t", owner: "dev", tokenId: token.id, payload: {} });
    await expect(freshQueue.processNext()).rejects.toThrow("No executor set");
  });

  it("consumes token after successful execution", async () => {
    const token = tokens.issue({ owner: "dev" });
    queue.submit({ label: "build", owner: "dev", tokenId: token.id, payload: {} });

    await queue.processNext();
    expect(token.consumed).toBe(true);
  });

  it("audit-logs all task operations", async () => {
    const token = tokens.issue({ owner: "dev" });
    queue.submit({ label: "build", owner: "dev", tokenId: token.id, payload: {} });
    await queue.processNext();

    const taskEntries = audit.all().filter((e) => e.action.startsWith("task."));
    expect(taskEntries.map((e) => e.action)).toEqual(["task.queued", "task.started", "task.completed"]);
  });

  it("handles token expiration during execution gracefully", async () => {
    // Issue a token with a very short TTL
    const token = tokens.issue({ owner: "dev", ttlMs: 1 });
    queue.submit({ label: "slow-build", owner: "dev", tokenId: token.id, payload: {} });

    // Executor takes long enough for the token to expire
    queue.setExecutor(async (task) => {
      await new Promise((r) => setTimeout(r, 50));
      return { built: task.label };
    });

    // Token will expire during execution; after our fix #1, consume() would throw
    // but processNext should handle it gracefully
    // First, auto-expire the token so it's revoked
    await new Promise((r) => setTimeout(r, 10));
    tokens.autoExpire(token.id);

    const task = await queue.processNext();
    // Task with a revoked token should be cancelled at dequeue
    // But if the token was valid at dequeue and expired during execution,
    // the task should still complete
    expect(task).toBeDefined();
    // Since token was revoked before processNext dequeued, it will be cancelled
    expect(task!.status).toBe("cancelled");
  });

  it("completes task even when token becomes revoked during execution", async () => {
    const token = tokens.issue({ owner: "dev" });
    queue.submit({ label: "build", owner: "dev", tokenId: token.id, payload: {} });

    // Executor revokes the token mid-execution
    queue.setExecutor(async (task) => {
      tokens.revoke(task.tokenId);
      return { built: task.label };
    });

    const task = await queue.processNext();
    // Task should still be completed — the work was done
    expect(task!.status).toBe("completed");
    expect(task!.result).toEqual({ built: "build" });

    // A token.state_mismatch audit entry should exist
    const mismatchEntries = audit.all().filter((e) => e.action === "token.state_mismatch");
    expect(mismatchEntries).toHaveLength(1);
    expect(mismatchEntries[0].details).toHaveProperty("tokenId", token.id);
  });

  it("clears queue", () => {
    const token = tokens.issue({ owner: "dev" });
    queue.submit({ label: "t1", owner: "dev", tokenId: token.id, payload: {} });
    expect(queue.depth).toBe(1);

    queue.clear();
    expect(queue.depth).toBe(0);
  });
});
