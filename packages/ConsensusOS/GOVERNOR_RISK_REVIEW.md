# Governor Risk Review

## Resource Enforcement

### Token-Based Model

Every execution in ConsensusOS requires a **token** with:
- CPU allocation (millicores)
- Memory allocation (bytes)
- Execution timeout
- Priority (1-10, clamped)
- Optional TTL (auto-expiry)

### Enforcement Points

| Check | When | Enforcement |
|-------|------|-------------|
| CPU limit | Token issuance | `TokenIssuer.issue()` throws if total exceeds `totalCpuMillis` |
| Memory limit | Token issuance | `TokenIssuer.issue()` throws if total exceeds `totalMemoryBytes` |
| Concurrency | Task execution | `BuildQueue.processNext()` returns `undefined` if `running >= maxConcurrent` |
| Queue depth | Task submission | `BuildQueue.submit()` throws if `queue.length >= maxQueueDepth` |
| Token validity | Task execution | `BuildQueue.processNext()` cancels task if token is revoked/consumed/expired |
| Timeout | Task execution | `Promise.race()` with `token.timeoutMs` |

## Starvation Analysis

### Risk: Low-priority tasks never execute

**Scenario**: High-priority tasks continuously consume all slots.

**Current mitigation**:
- Priority is clamped to 1-10 — no unbounded priority escalation
- Tasks are dequeued by priority then FIFO — same-priority tasks are fair
- Queue depth limit prevents unbounded accumulation

**Recommended policy rule**:
```typescript
// Ensure low-priority tasks get at least 20% of slots
policy.addRule({
  id: "fairness-floor",
  description: "Reserve 20% capacity for low-priority tasks",
  priority: 150,
  evaluate: (req, usage) => {
    const lowPriSlots = Math.ceil(limits.maxConcurrent * 0.2);
    if ((req.priority ?? 5) <= 3 && usage.activeExecutions < lowPriSlots) {
      return "allow";
    }
    return "allow"; // Don't block, just ensure floor
  },
});
```

### Risk: Token exhaustion blocks all execution

**Scenario**: All CPU/memory allocated to long-running tasks.

**Current mitigation**:
- Token TTL causes auto-expiry
- Revoked/consumed tokens free resources immediately
- `active()` filters expired tokens from resource calculations

**Recommendation**: Set TTL on all production tokens. Monitor `issuer.getUsage()` utilization metrics.

## Queue Fairness

| Property | Guarantee |
|----------|-----------|
| Priority ordering | ✅ Higher priority dequeued first |
| FIFO within priority | ✅ Same-priority tasks are FIFO |
| Starvation prevention | ⚠️ Requires policy rules |
| Concurrency cap | ✅ Hard limit via `maxConcurrent` |
| Queue depth cap | ✅ Hard limit via `maxQueueDepth` |

## Emergency Bypass

### When the governor blocks critical operations

**Option 1: High-priority token**
```typescript
const emergencyToken = issuer.issue({
  owner: "operator",
  priority: 10,     // Maximum priority
  cpuMillis: 4000,  // Generous allocation
  timeoutMs: 300_000,
});
```

**Option 2: Policy rule override**
```typescript
policy.addRule({
  id: "emergency-override",
  description: "Allow all requests from operator during emergency",
  priority: 999, // Highest priority rule
  evaluate: (req) => req.owner === "operator" ? "allow" : "allow",
});
```

**Option 3: Direct token issuance** (bypasses policy engine)
- `TokenIssuer.issue()` does not consult the policy engine
- Policy is only evaluated when explicitly called via `PolicyEngine.evaluate()`
- This is intentional: the operator always has an escape hatch

## Policy Simulation

Test policies without real impact:

```typescript
// Create a shadow policy engine
const shadowPolicy = new PolicyEngine(new AuditLog());
shadowPolicy.addRule(cpuThresholdRule(0.7));
shadowPolicy.addRule(queueDepthRule(25));

// Simulate against projected usage
const projected: ResourceUsage = {
  cpuMillisUsed: 6500,
  memoryBytesUsed: 3 * 1024**3,
  activeExecutions: 7,
  queuedTasks: 20,
  utilization: { cpu: 0.81, memory: 0.75, concurrency: 0.7, queue: 0.4 },
};

const result = shadowPolicy.evaluate({ owner: "ci", cpuMillis: 500 }, projected);
console.log(`Would ${result.verdict}: ${result.decidingRule ?? "all rules passed"}`);
```

## Risk Summary

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| Token exhaustion | Medium | TTL + auto-expiry | ✅ Implemented |
| Priority starvation | Medium | Policy rules | ⚠️ Requires operator config |
| Queue flooding | Low | Queue depth cap | ✅ Implemented |
| Timeout bypass | Low | Promise.race enforcement | ✅ Implemented |
| Token forgery | Low | In-memory only; no API injection | ✅ Mitigated |
| Audit log overflow | Medium | In-memory; bounded by process | ⚠️ v2: persistence |
