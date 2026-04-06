# Governor Guide

The governor layer provides resource-bounded execution, policy enforcement, and audit logging.

## Components

| Component | File | Purpose |
|-----------|------|---------|
| TokenIssuer | `governor/token-issuer.ts` | Issue, revoke, validate execution tokens |
| PolicyEngine | `governor/policy-engine.ts` | Evaluate rules against resource requests |
| BuildQueue | `governor/build-queue.ts` | Priority-weighted task queue with concurrency control |
| AuditLog | `governor/audit-log.ts` | Immutable, append-only action log |
| GovernorPlugin | `governor/governor-plugin.ts` | Plugin interface for the governor |

## 1. Token-Based Execution

Every execution requires a token with resource limits:

```typescript
import { TokenIssuer } from "./src/modules/governor/token-issuer.js";
import { AuditLog } from "./src/modules/governor/audit-log.js";

const audit = new AuditLog();
const issuer = new TokenIssuer(
  {
    totalCpuMillis: 8000,          // 8 cores
    totalMemoryBytes: 4 * 1024**3, // 4 GB
    maxConcurrent: 10,
    maxQueueDepth: 50,
  },
  audit,
);

// Issue a token
const token = issuer.issue({
  owner: "ci-pipeline",
  cpuMillis: 2000,       // 2 cores
  memoryBytes: 512 * 1024**2, // 512 MB
  timeoutMs: 60_000,     // 1 minute
  priority: 8,           // 1-10 scale
  ttlMs: 300_000,        // 5-minute expiry
});

// Validate before use
const { valid, reason } = issuer.validate(token.id);

// Check resource usage
const usage = issuer.getUsage();
console.log(`CPU: ${(usage.utilization.cpu * 100).toFixed(0)}%`);
console.log(`Memory: ${(usage.utilization.memory * 100).toFixed(0)}%`);

// Revoke when done
issuer.revoke(token.id);
```

## 2. Policy Engine

Rules evaluated highest-priority-first; first non-allow verdict wins:

```typescript
import { PolicyEngine, cpuThresholdRule, memoryThresholdRule, priorityThrottleRule, queueDepthRule } from "./src/modules/governor/policy-engine.js";

const policy = new PolicyEngine(audit);

// Built-in rules
policy.addRule(cpuThresholdRule(0.9));         // Deny at 90% CPU
policy.addRule(memoryThresholdRule(0.85));     // Deny at 85% memory
policy.addRule(priorityThrottleRule(5, 0.7));  // Throttle low-priority at 70%
policy.addRule(queueDepthRule(50));            // Deny when queue > 50

// Custom rule
policy.addRule({
  id: "no-weekend-deploys",
  description: "Block deployments on weekends",
  priority: 200,
  evaluate: (req, usage) => {
    const day = new Date().getDay();
    return (day === 0 || day === 6) ? "deny" : "allow";
  },
});

// Evaluate
const result = policy.evaluate(
  { owner: "ci", cpuMillis: 1000 },
  issuer.getUsage(),
);

console.log(result.verdict);     // "allow" | "deny" | "throttle"
console.log(result.decidingRule); // ID of rule that blocked (or undefined)
```

## 3. Build Queue

Priority-weighted task execution with concurrency limits:

```typescript
import { BuildQueue } from "./src/modules/governor/build-queue.js";

const queue = new BuildQueue(issuer, audit, limits);

// Set executor
queue.setExecutor(async (task, token) => {
  console.log(`Executing ${task.label} with token ${token.id}`);
  // ... do work ...
  return { success: true };
});

// Submit a task (requires a valid token)
const token = issuer.issue({ owner: "ci", cpuMillis: 500, priority: 7 });
const task = queue.submit({
  label: "build-frontend",
  owner: "ci",
  tokenId: token.id,
  payload: { branch: "main" },
});

// Process queue
await queue.drain(); // Runs all pending tasks up to concurrency limit

// Monitor
console.log(`Queued: ${queue.depth}`);
console.log(`Running: ${queue.activeCount}`);
```

## 4. Audit Log

Every governor action is logged:

```typescript
// View all entries
const all = audit.all();

// Filter by action
const issuances = audit.byAction("token.issued");
const revocations = audit.byAction("token.revoked");

// Filter by actor
const ciActions = audit.byActor("ci-pipeline");

// Time range
const today = audit.byTimeRange("2025-01-01T00:00:00Z", "2025-01-02T00:00:00Z");

// Recent entries
const last10 = audit.recent(10);
```

### Audit Actions

| Action | When |
|--------|------|
| `token.issued` | New execution token created |
| `token.revoked` | Token manually revoked |
| `token.consumed` | Token used for execution |
| `token.expired` | Token auto-revoked on expiry |
| `policy.evaluated` | Policy engine evaluated a request |
| `task.queued` | Task added to build queue |
| `task.started` | Task began execution |
| `task.completed` | Task finished successfully |
| `task.failed` | Task failed |
| `task.cancelled` | Task cancelled (invalid token or manual) |

## Resource Limits

```typescript
interface ResourceLimits {
  totalCpuMillis: number;      // Total CPU budget (millicores)
  totalMemoryBytes: number;    // Total memory budget
  maxConcurrent: number;       // Max simultaneous executions
  maxQueueDepth: number;       // Max pending tasks
}
```

## Security Considerations

- Tokens are **resource-bounded** — cannot exceed system limits
- Tokens **auto-expire** — TTL prevents stale authorizations
- Priority is **clamped to 1-10** — cannot game the queue
- All actions are **audit-logged** — full forensic trail
- Policy engine is **first-deny-wins** — conservative by default
- See [THREAT_MODEL.md](THREAT_MODEL.md) for full threat analysis
