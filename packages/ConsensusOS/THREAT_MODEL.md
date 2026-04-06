# ConsensusOS v1.0 — Threat Model

## Scope

This document covers threats to ConsensusOS's core control plane. It does **not** cover threats to the underlying blockchain networks (XRPL, Ethereum, Cosmos) which have their own security models.

## Attack Surface

### 1. Plugin Loading (Core Loader)

| Threat | Impact | Mitigation | Residual Risk |
|--------|--------|------------|---------------|
| Malicious plugin loaded | Full process compromise | `validatePlugin()` checks manifest + interface; only load from trusted sources | Medium — no code sandbox |
| Circular dependency injection | Boot hang or crash | Kahn's algorithm detects cycles; hard error | Low |
| Plugin fails init() deliberately | Denial of service (boot halts) | Fail-fast by design; operator controls plugin list | Low |

### 2. Event Bus

| Threat | Impact | Mitigation | Residual Risk |
|--------|--------|------------|---------------|
| Event flooding | Memory exhaustion from unbounded history | Event history is bounded by process lifetime; no external event injection | Medium — no rate limiting |
| Event data poisoning | Downstream modules receive bad data | Modules must validate event data; typed `ConsensusEvent<T>` helps at compile time | Medium |
| Wildcard subscription abuse | Plugin observes all system events | By design — wildcard is a feature for monitoring plugins | Low (accepted risk) |

### 3. Invariant Engine

| Threat | Impact | Mitigation | Residual Risk |
|--------|--------|------------|---------------|
| Bypassing invariant checks | Invalid state transitions | Core Loader injects invariant engine into plugin context; no other path to state transitions | Low |
| Invariant that always passes | Governance rules not enforced | Code review of invariant logic; test coverage | Low |
| Invariant check denial of service | Blocked state transitions | Async invariants have no timeout (v1 limitation) | Medium |

### 4. Token Issuer (Governor)

| Threat | Impact | Mitigation | Residual Risk |
|--------|--------|------------|---------------|
| Token exhaustion attack | Legitimate tasks cannot get tokens | `ResourceLimits` cap total CPU/memory; policy engine can deny | Low |
| Token forgery | Unauthorized execution | Tokens are only in-memory; no external API to inject tokens | Low |
| Expired token not cleaned up | Stale tokens consume limit calculations | Auto-revoke on validation; `active()` filters expired | Low |
| Module-level counter reset | Duplicate token IDs after restart | Timestamp suffix provides uniqueness within reason; persistence in v2 | Low |

### 5. Audit Log

| Threat | Impact | Mitigation | Residual Risk |
|--------|--------|------------|---------------|
| Log tampering | Forensic integrity lost | Append-only API; `clear()` only in testing | Medium — no cryptographic integrity |
| Log overflow | Memory exhaustion | In-memory only; bounded by process lifetime | Medium |
| Missing log entries | Incomplete audit trail | All governor actions call `audit.record()`; covered by tests | Low |

### 6. Replay Engine (Sandbox)

| Threat | Impact | Mitigation | Residual Risk |
|--------|--------|------------|---------------|
| Non-deterministic replay | Incorrect simulation results | Events sorted by sequence; handlers must be pure | Medium — purity not enforced |
| Replay of malicious events | State corruption in sandbox | Sandbox operates on cloned state (`structuredClone`) | Low |
| Infinite replay loop | CPU/memory exhaustion | `maxEvents` and `stopAtSequence` options | Low |

### 7. Chain Adapters

| Threat | Impact | Mitigation | Residual Risk |
|--------|--------|------------|---------------|
| Malicious RPC endpoint | Bad chain data | Adapters validate response structure | Medium |
| Adapter impersonation | Wrong chain state | Adapter registry tracks by chain ID | Low |
| Connection leak | Resource exhaustion | Adapters implement `disconnect()` lifecycle | Low |

## STRIDE Summary

| Category | Primary Threats | Status |
|----------|----------------|--------|
| **S**poofing | Plugin impersonation, token forgery | Mitigated by in-memory model |
| **T**ampering | Audit log tampering, event data poisoning | Medium risk — no cryptographic integrity |
| **R**epudiation | Unattributed actions | Mitigated by audit log with actor tracking |
| **I**nformation Disclosure | Wildcard subscription reveals all events | Accepted (by design for monitoring) |
| **D**enial of Service | Event flooding, token exhaustion, boot-fail | Partially mitigated by resource limits |
| **E**levation of Privilege | Malicious plugin bypasses isolation | Medium risk — same-process execution |

## v2 Hardening Roadmap

1. Cryptographic audit log signing (hash chain)
2. Plugin code sandboxing (isolated VM or process)
3. Event rate limiting per plugin
4. Persistent state with integrity verification
5. Monotonic clock for token expiration
6. Async invariant timeouts
