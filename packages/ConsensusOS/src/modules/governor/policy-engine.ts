/**
 * Policy Engine
 *
 * Evaluates policy rules against token requests and resource usage
 * to determine whether to allow, deny, or throttle execution.
 * Rules are evaluated by priority (highest first); first non-allow
 * verdict wins.
 */

import type { PolicyRule, PolicyVerdict, TokenRequest, ResourceUsage } from "./types.js";
import { AuditLog } from "./audit-log.js";

export interface PolicyEvaluation {
  /** Final verdict */
  verdict: PolicyVerdict;
  /** Rule that produced the verdict (undefined if all rules passed) */
  decidingRule?: string;
  /** All rule evaluations */
  evaluations: Array<{
    ruleId: string;
    verdict: PolicyVerdict;
  }>;
}

export class PolicyEngine {
  private readonly rules: PolicyRule[] = [];

  constructor(private readonly audit: AuditLog) {}

  /** Add a policy rule */
  addRule(rule: PolicyRule): void {
    if (this.rules.some((r) => r.id === rule.id)) {
      throw new Error(`Policy rule "${rule.id}" already exists`);
    }
    this.rules.push(rule);
    // Keep sorted by priority descending
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /** Remove a policy rule by ID */
  removeRule(ruleId: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === ruleId);
    if (idx === -1) return false;
    this.rules.splice(idx, 1);
    return true;
  }

  /** Evaluate all rules against a token request */
  evaluate(request: TokenRequest, usage: ResourceUsage): PolicyEvaluation {
    const evaluations: Array<{ ruleId: string; verdict: PolicyVerdict }> = [];
    let finalVerdict: PolicyVerdict = "allow";
    let decidingRule: string | undefined;

    for (const rule of this.rules) {
      const verdict = rule.evaluate(request, usage);
      evaluations.push({ ruleId: rule.id, verdict });

      if (verdict !== "allow" && finalVerdict === "allow") {
        finalVerdict = verdict;
        decidingRule = rule.id;
      }
    }

    this.audit.record("policy.evaluated", request.owner, decidingRule ?? "none", {
      verdict: finalVerdict,
      rulesEvaluated: evaluations.length,
      request: { owner: request.owner, cpuMillis: request.cpuMillis, memoryBytes: request.memoryBytes },
    });

    return { verdict: finalVerdict, decidingRule, evaluations };
  }

  /** List all registered rules */
  listRules(): readonly PolicyRule[] {
    return [...this.rules];
  }

  /** Clear all rules */
  clear(): void {
    this.rules.length = 0;
  }
}

// ─── Built-in Policy Rules ──────────────────────────────────────────

/** Deny requests when CPU utilization exceeds a threshold */
export function cpuThresholdRule(threshold: number, priority = 100): PolicyRule {
  return {
    id: "cpu-threshold",
    description: `Deny when CPU utilization exceeds ${(threshold * 100).toFixed(0)}%`,
    priority,
    evaluate: (_req: TokenRequest, usage: ResourceUsage) =>
      usage.utilization.cpu >= threshold ? "deny" : "allow",
  };
}

/** Deny requests when memory utilization exceeds a threshold */
export function memoryThresholdRule(threshold: number, priority = 100): PolicyRule {
  return {
    id: "memory-threshold",
    description: `Deny when memory utilization exceeds ${(threshold * 100).toFixed(0)}%`,
    priority,
    evaluate: (_req: TokenRequest, usage: ResourceUsage) =>
      usage.utilization.memory >= threshold ? "deny" : "allow",
  };
}

/** Throttle low-priority requests when utilization is high */
export function priorityThrottleRule(
  minPriority: number,
  utilizationThreshold: number,
  priority = 50,
): PolicyRule {
  return {
    id: "priority-throttle",
    description: `Throttle requests with priority < ${minPriority} when utilization > ${(utilizationThreshold * 100).toFixed(0)}%`,
    priority,
    evaluate: (req: TokenRequest, usage: ResourceUsage) => {
      const reqPriority = req.priority ?? 5;
      if (reqPriority >= minPriority) return "allow";
      const avgUtil = (usage.utilization.cpu + usage.utilization.memory) / 2;
      return avgUtil >= utilizationThreshold ? "throttle" : "allow";
    },
  };
}

/** Deny requests when the queue is full */
export function queueDepthRule(maxDepth: number, priority = 90): PolicyRule {
  return {
    id: "queue-depth",
    description: `Deny when queue depth exceeds ${maxDepth}`,
    priority,
    evaluate: (_req: TokenRequest, usage: ResourceUsage) =>
      usage.queuedTasks >= maxDepth ? "deny" : "allow",
  };
}

/** Deny requests with invalid or out-of-bounds fields */
export function requestValidationRule(priority = 200): PolicyRule {
  return {
    id: "request-validation",
    description: "Deny requests with invalid resource values",
    priority,
    evaluate: (req: TokenRequest, _usage: ResourceUsage) => {
      if (req.cpuMillis !== undefined && req.cpuMillis <= 0) return "deny";
      if (req.memoryBytes !== undefined && req.memoryBytes <= 0) return "deny";
      if (req.timeoutMs !== undefined && req.timeoutMs <= 0) return "deny";
      if (req.priority !== undefined && !Number.isFinite(req.priority)) return "deny";
      if (req.owner === "") return "deny";
      return "allow";
    },
  };
}
