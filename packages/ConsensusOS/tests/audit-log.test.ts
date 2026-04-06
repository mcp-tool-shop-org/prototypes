import { describe, it, expect, beforeEach } from "vitest";
import { AuditLog } from "../src/modules/governor/audit-log.js";

describe("AuditLog", () => {
  let log: AuditLog;

  beforeEach(() => {
    log = new AuditLog();
  });

  it("records and retrieves entries", () => {
    log.record("token.issued", "alice", "token-1", { cpu: 1000 });
    log.record("task.queued", "bob", "task-1");

    expect(log.size).toBe(2);
    const all = log.all();
    expect(all[0].action).toBe("token.issued");
    expect(all[0].actor).toBe("alice");
    expect(all[0].entityId).toBe("token-1");
    expect(all[0].details).toEqual({ cpu: 1000 });
    expect(all[1].action).toBe("task.queued");
  });

  it("filters by action", () => {
    log.record("token.issued", "a", "t1");
    log.record("task.queued", "b", "t2");
    log.record("token.issued", "c", "t3");

    const issued = log.byAction("token.issued");
    expect(issued).toHaveLength(2);
    expect(issued.every((e) => e.action === "token.issued")).toBe(true);
  });

  it("filters by actor", () => {
    log.record("token.issued", "alice", "t1");
    log.record("token.issued", "bob", "t2");
    log.record("task.queued", "alice", "t3");

    const alice = log.byActor("alice");
    expect(alice).toHaveLength(2);
  });

  it("filters by entity", () => {
    log.record("token.issued", "a", "token-42");
    log.record("token.revoked", "a", "token-42");
    log.record("token.issued", "b", "token-99");

    const entries = log.byEntity("token-42");
    expect(entries).toHaveLength(2);
  });

  it("returns recent entries", () => {
    for (let i = 0; i < 10; i++) {
      log.record("token.issued", "a", `t-${i}`);
    }

    const recent = log.recent(3);
    expect(recent).toHaveLength(3);
    expect(recent[0].entityId).toBe("t-7");
    expect(recent[2].entityId).toBe("t-9");
  });

  it("clears all entries", () => {
    log.record("token.issued", "a", "t1");
    log.record("token.issued", "b", "t2");
    expect(log.size).toBe(2);

    log.clear();
    expect(log.size).toBe(0);
  });

  it("entries have timestamps and unique IDs", () => {
    const e1 = log.record("token.issued", "a", "t1");
    const e2 = log.record("token.revoked", "a", "t1");

    expect(e1.id).not.toBe(e2.id);
    expect(e1.timestamp).toBeDefined();
    expect(e2.timestamp).toBeDefined();
  });

  describe("immutability", () => {
    it("mutating returned entries does not affect internal state", () => {
      log.record("token.issued", "alice", "token-1", { cpu: 1000 });

      const first = log.all();
      // Mutate the returned entry
      (first[0] as Record<string, unknown>).actor = "HACKED";
      (first[0].details as Record<string, unknown>).cpu = 9999;

      const second = log.all();
      expect(second[0].actor).toBe("alice");
      expect(second[0].details).toEqual({ cpu: 1000 });
    });
  });

  describe("verifyCompleteness", () => {
    it("token with full lifecycle (issued + consumed) → complete", () => {
      log.record("token.issued", "a", "token-1");
      log.record("token.consumed", "a", "token-1");

      const result = log.verifyCompleteness("token-1");
      expect(result.complete).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it("token with only issued → incomplete, missing terminal", () => {
      log.record("token.issued", "a", "token-2");

      const result = log.verifyCompleteness("token-2");
      expect(result.complete).toBe(false);
      expect(result.missing).toHaveLength(1);
      expect(result.missing[0]).toContain("terminal");
    });

    it("task with full lifecycle (queued + started + completed) → complete", () => {
      log.record("task.queued", "a", "task-1");
      log.record("task.started", "a", "task-1");
      log.record("task.completed", "a", "task-1");

      const result = log.verifyCompleteness("task-1");
      expect(result.complete).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it("task with only queued → incomplete, missing started + terminal", () => {
      log.record("task.queued", "a", "task-2");

      const result = log.verifyCompleteness("task-2");
      expect(result.complete).toBe(false);
      expect(result.missing).toHaveLength(2);
      expect(result.missing).toContain("task.started");
      expect(result.missing[1]).toContain("terminal");
    });

    it("unknown entity prefix → complete (no expectations)", () => {
      log.record("policy.evaluated", "a", "policy-1");

      const result = log.verifyCompleteness("policy-1");
      expect(result.complete).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });
});
