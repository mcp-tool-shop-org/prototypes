import { describe, it, expect, beforeEach } from "vitest";
import {
  PolicyEngine,
  cpuThresholdRule,
  memoryThresholdRule,
  priorityThrottleRule,
  queueDepthRule,
  requestValidationRule,
} from "../src/modules/governor/policy-engine.js";
import { AuditLog } from "../src/modules/governor/audit-log.js";
import type { ResourceUsage, TokenRequest } from "../src/modules/governor/types.js";

function makeUsage(overrides: Partial<ResourceUsage> = {}): ResourceUsage {
  return {
    cpuMillisUsed: 0,
    memoryBytesUsed: 0,
    activeExecutions: 0,
    queuedTasks: 0,
    utilization: { cpu: 0, memory: 0, concurrency: 0, queue: 0 },
    ...overrides,
  };
}

function makeRequest(overrides: Partial<TokenRequest> = {}): TokenRequest {
  return { owner: "test", ...overrides };
}

describe("PolicyEngine", () => {
  let engine: PolicyEngine;
  let audit: AuditLog;

  beforeEach(() => {
    audit = new AuditLog();
    engine = new PolicyEngine(audit);
  });

  it("allows when no rules are registered", () => {
    const result = engine.evaluate(makeRequest(), makeUsage());
    expect(result.verdict).toBe("allow");
    expect(result.decidingRule).toBeUndefined();
  });

  it("prevents duplicate rule IDs", () => {
    engine.addRule(cpuThresholdRule(0.9));
    expect(() => engine.addRule(cpuThresholdRule(0.8))).toThrow("already exists");
  });

  it("removes rules", () => {
    engine.addRule(cpuThresholdRule(0.9));
    expect(engine.removeRule("cpu-threshold")).toBe(true);
    expect(engine.removeRule("nonexistent")).toBe(false);
    expect(engine.listRules()).toHaveLength(0);
  });

  it("evaluates rules by priority (highest first)", () => {
    engine.addRule(cpuThresholdRule(0.5, 10));      // Low priority
    engine.addRule(memoryThresholdRule(0.5, 100));   // High priority

    const rules = engine.listRules();
    expect(rules[0].id).toBe("memory-threshold"); // Higher priority first
  });

  it("audit-logs policy evaluations", () => {
    engine.addRule(cpuThresholdRule(0.9));
    engine.evaluate(makeRequest(), makeUsage());

    const entries = audit.byAction("policy.evaluated");
    expect(entries).toHaveLength(1);
  });
});

describe("Built-in Policy Rules", () => {
  it("cpuThresholdRule denies when CPU utilization exceeds threshold", () => {
    const rule = cpuThresholdRule(0.8);
    expect(rule.evaluate(makeRequest(), makeUsage({ utilization: { cpu: 0.7, memory: 0, concurrency: 0, queue: 0 } }))).toBe("allow");
    expect(rule.evaluate(makeRequest(), makeUsage({ utilization: { cpu: 0.9, memory: 0, concurrency: 0, queue: 0 } }))).toBe("deny");
  });

  it("memoryThresholdRule denies when memory utilization exceeds threshold", () => {
    const rule = memoryThresholdRule(0.8);
    expect(rule.evaluate(makeRequest(), makeUsage({ utilization: { cpu: 0, memory: 0.5, concurrency: 0, queue: 0 } }))).toBe("allow");
    expect(rule.evaluate(makeRequest(), makeUsage({ utilization: { cpu: 0, memory: 0.85, concurrency: 0, queue: 0 } }))).toBe("deny");
  });

  it("priorityThrottleRule throttles low-priority requests under load", () => {
    const rule = priorityThrottleRule(7, 0.6);

    // High-priority request → always allowed
    expect(rule.evaluate(makeRequest({ priority: 9 }), makeUsage({ utilization: { cpu: 0.9, memory: 0.9, concurrency: 0, queue: 0 } }))).toBe("allow");

    // Low-priority + high load → throttle
    expect(rule.evaluate(makeRequest({ priority: 3 }), makeUsage({ utilization: { cpu: 0.8, memory: 0.8, concurrency: 0, queue: 0 } }))).toBe("throttle");

    // Low-priority + low load → allow
    expect(rule.evaluate(makeRequest({ priority: 3 }), makeUsage({ utilization: { cpu: 0.2, memory: 0.2, concurrency: 0, queue: 0 } }))).toBe("allow");
  });

  it("queueDepthRule denies when queue is full", () => {
    const rule = queueDepthRule(50);
    expect(rule.evaluate(makeRequest(), makeUsage({ queuedTasks: 30 }))).toBe("allow");
    expect(rule.evaluate(makeRequest(), makeUsage({ queuedTasks: 50 }))).toBe("deny");
  });

  it("requestValidationRule denies cpuMillis <= 0", () => {
    const rule = requestValidationRule();
    expect(rule.evaluate(makeRequest({ cpuMillis: 0 }), makeUsage())).toBe("deny");
    expect(rule.evaluate(makeRequest({ cpuMillis: -1 }), makeUsage())).toBe("deny");
    expect(rule.evaluate(makeRequest({ cpuMillis: 100 }), makeUsage())).toBe("allow");
  });

  it("requestValidationRule denies memoryBytes <= 0", () => {
    const rule = requestValidationRule();
    expect(rule.evaluate(makeRequest({ memoryBytes: 0 }), makeUsage())).toBe("deny");
    expect(rule.evaluate(makeRequest({ memoryBytes: -512 }), makeUsage())).toBe("deny");
  });

  it("requestValidationRule denies timeoutMs <= 0", () => {
    const rule = requestValidationRule();
    expect(rule.evaluate(makeRequest({ timeoutMs: 0 }), makeUsage())).toBe("deny");
    expect(rule.evaluate(makeRequest({ timeoutMs: -1 }), makeUsage())).toBe("deny");
  });

  it("requestValidationRule denies non-finite priority", () => {
    const rule = requestValidationRule();
    expect(rule.evaluate(makeRequest({ priority: NaN }), makeUsage())).toBe("deny");
    expect(rule.evaluate(makeRequest({ priority: Infinity }), makeUsage())).toBe("deny");
    expect(rule.evaluate(makeRequest({ priority: -Infinity }), makeUsage())).toBe("deny");
  });

  it("requestValidationRule denies empty owner", () => {
    const rule = requestValidationRule();
    expect(rule.evaluate(makeRequest({ owner: "" }), makeUsage())).toBe("deny");
  });
});

describe("Policy Edge Cases", () => {
  let engine: PolicyEngine;
  let audit: AuditLog;

  beforeEach(() => {
    audit = new AuditLog();
    engine = new PolicyEngine(audit);
  });

  it("all rules return throttle → final verdict is throttle", () => {
    engine.addRule({
      id: "throttle-1",
      description: "Always throttle",
      priority: 100,
      evaluate: () => "throttle",
    });
    engine.addRule({
      id: "throttle-2",
      description: "Always throttle",
      priority: 50,
      evaluate: () => "throttle",
    });

    const result = engine.evaluate(makeRequest(), makeUsage());
    expect(result.verdict).toBe("throttle");
  });

  it("mixed scenario: first rule allows, second denies → verdict is deny", () => {
    engine.addRule({
      id: "allow-rule",
      description: "Always allow",
      priority: 100,
      evaluate: () => "allow",
    });
    engine.addRule({
      id: "deny-rule",
      description: "Always deny",
      priority: 50,
      evaluate: () => "deny",
    });

    const result = engine.evaluate(makeRequest(), makeUsage());
    expect(result.verdict).toBe("deny");
    expect(result.decidingRule).toBe("deny-rule");
  });

  it("request with all undefined optional fields passes validation rule", () => {
    engine.addRule(requestValidationRule());
    const result = engine.evaluate(makeRequest(), makeUsage());
    expect(result.verdict).toBe("allow");
  });
});
