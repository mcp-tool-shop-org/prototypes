import { describe, it, expect, beforeEach } from "vitest";
import { TokenIssuer } from "../src/modules/governor/token-issuer.js";
import { AuditLog } from "../src/modules/governor/audit-log.js";
import type { ResourceLimits } from "../src/modules/governor/types.js";

const MB = 1024 * 1024;

function makeLimits(overrides: Partial<ResourceLimits> = {}): ResourceLimits {
  return {
    totalCpuMillis: 4000,
    totalMemoryBytes: 1024 * MB,
    maxConcurrent: 10,
    maxQueueDepth: 100,
    ...overrides,
  };
}

describe("TokenIssuer", () => {
  let issuer: TokenIssuer;
  let audit: AuditLog;

  beforeEach(() => {
    audit = new AuditLog();
    issuer = new TokenIssuer(makeLimits(), audit);
  });

  it("issues a token with defaults", () => {
    const token = issuer.issue({ owner: "builder" });
    expect(token.id).toContain("token-");
    expect(token.owner).toBe("builder");
    expect(token.cpuMillis).toBe(1000);
    expect(token.memoryBytes).toBe(256 * MB);
    expect(token.timeoutMs).toBe(30_000);
    expect(token.priority).toBe(5);
    expect(token.revoked).toBe(false);
    expect(token.consumed).toBe(false);
  });

  it("issues a token with custom values", () => {
    const token = issuer.issue({
      owner: "ci",
      cpuMillis: 2000,
      memoryBytes: 512 * MB,
      timeoutMs: 60_000,
      priority: 8,
      ttlMs: 5000,
    });

    expect(token.cpuMillis).toBe(2000);
    expect(token.memoryBytes).toBe(512 * MB);
    expect(token.priority).toBe(8);
    expect(token.expiresAt).toBeDefined();
  });

  it("clamps priority to 1-10", () => {
    const low = issuer.issue({ owner: "a", priority: -5 });
    const high = issuer.issue({ owner: "b", priority: 99 });
    expect(low.priority).toBe(1);
    expect(high.priority).toBe(10);
  });

  it("rejects tokens when CPU limit exceeded", () => {
    issuer.issue({ owner: "a", cpuMillis: 3000 });
    expect(() => issuer.issue({ owner: "b", cpuMillis: 2000 })).toThrow("CPU limit exceeded");
  });

  it("rejects tokens when memory limit exceeded", () => {
    issuer.issue({ owner: "a", memoryBytes: 900 * MB });
    expect(() => issuer.issue({ owner: "b", memoryBytes: 200 * MB })).toThrow("Memory limit exceeded");
  });

  it("revokes a token", () => {
    const token = issuer.issue({ owner: "a" });
    issuer.revoke(token.id);
    expect(token.revoked).toBe(true);
  });

  it("throws on double revoke", () => {
    const token = issuer.issue({ owner: "a" });
    issuer.revoke(token.id);
    expect(() => issuer.revoke(token.id)).toThrow("already revoked");
  });

  it("consumes a token", () => {
    const token = issuer.issue({ owner: "a" });
    issuer.consume(token.id);
    expect(token.consumed).toBe(true);
  });

  it("validates active tokens", () => {
    const token = issuer.issue({ owner: "a" });
    expect(issuer.validate(token.id)).toEqual({ valid: true });

    issuer.revoke(token.id);
    expect(issuer.validate(token.id).valid).toBe(false);
    expect(issuer.validate(token.id).reason).toBe("Token revoked");
  });

  it("validates consumed tokens", () => {
    const token = issuer.issue({ owner: "a" });
    issuer.consume(token.id);
    expect(issuer.validate(token.id).valid).toBe(false);
    expect(issuer.validate(token.id).reason).toBe("Token already consumed");
  });

  it("auto-expires tokens with TTL", () => {
    const token = issuer.issue({ owner: "a", ttlMs: -1 }); // Already expired
    const result = issuer.validate(token.id);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Token expired");
  });

  it("returns undefined for unknown tokens", () => {
    expect(issuer.validate("nope")).toEqual({ valid: false, reason: "Token not found" });
    expect(issuer.get("nope")).toBeUndefined();
  });

  it("lists tokens by owner", () => {
    issuer.issue({ owner: "alice" });
    issuer.issue({ owner: "bob" });
    issuer.issue({ owner: "alice" });

    expect(issuer.list("alice")).toHaveLength(2);
    expect(issuer.list("bob")).toHaveLength(1);
    expect(issuer.list()).toHaveLength(3);
  });

  it("tracks active tokens (excludes revoked/consumed)", () => {
    const t1 = issuer.issue({ owner: "a" });
    issuer.issue({ owner: "b" });
    issuer.issue({ owner: "c" });
    issuer.revoke(t1.id);

    expect(issuer.active()).toHaveLength(2);
  });

  it("computes resource usage", () => {
    issuer.issue({ owner: "a", cpuMillis: 1000, memoryBytes: 200 * MB });
    issuer.issue({ owner: "b", cpuMillis: 500, memoryBytes: 100 * MB });

    const usage = issuer.getUsage();
    expect(usage.cpuMillisUsed).toBe(1500);
    expect(usage.memoryBytesUsed).toBe(300 * MB);
    expect(usage.utilization.cpu).toBeCloseTo(0.375);
  });

  it("consume() rejects revoked tokens", () => {
    const token = issuer.issue({ owner: "a" });
    issuer.revoke(token.id);
    expect(() => issuer.consume(token.id)).toThrow("is revoked and cannot be consumed");
  });

  it("consume() rejects already-consumed tokens", () => {
    const token = issuer.issue({ owner: "a" });
    issuer.consume(token.id);
    expect(() => issuer.consume(token.id)).toThrow("already consumed");
  });

  it("validate() does not mutate state (pure read)", () => {
    const token = issuer.issue({ owner: "a", ttlMs: -1 }); // Already expired
    const result = issuer.validate(token.id);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Token expired");
    // Token should NOT be revoked — validate is pure
    expect(token.revoked).toBe(false);
  });

  it("autoExpire() revokes expired tokens with audit", () => {
    const token = issuer.issue({ owner: "a", ttlMs: -1 }); // Already expired
    const expired = issuer.autoExpire(token.id);
    expect(expired).toBe(true);
    expect(token.revoked).toBe(true);

    const expiredEntries = audit.all().filter((e) => e.action === "token.expired");
    expect(expiredEntries).toHaveLength(1);
  });

  it("autoExpire() returns false for non-expired tokens", () => {
    const token = issuer.issue({ owner: "a", ttlMs: 60_000 });
    expect(issuer.autoExpire(token.id)).toBe(false);
    expect(token.revoked).toBe(false);
  });

  it("autoExpire() returns false for already-revoked tokens", () => {
    const token = issuer.issue({ owner: "a", ttlMs: -1 });
    issuer.revoke(token.id);
    expect(issuer.autoExpire(token.id)).toBe(false);
  });

  it("autoExpire() returns false for unknown tokens", () => {
    expect(issuer.autoExpire("nonexistent")).toBe(false);
  });

  it("active() audits expired tokens it discovers", () => {
    issuer.issue({ owner: "a", ttlMs: -1 }); // Expired
    issuer.issue({ owner: "b" }); // Active

    const active = issuer.active();
    expect(active).toHaveLength(1);

    const expiredEntries = audit.all().filter((e) => e.action === "token.expired");
    expect(expiredEntries.length).toBeGreaterThanOrEqual(1);
  });

  it("audit-logs all token operations", () => {
    const token = issuer.issue({ owner: "dev" });
    issuer.revoke(token.id);

    const entries = audit.all();
    expect(entries).toHaveLength(2);
    expect(entries[0].action).toBe("token.issued");
    expect(entries[1].action).toBe("token.revoked");
  });
});
