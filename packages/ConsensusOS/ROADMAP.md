# ConsensusOS Roadmap

## v1.0.0 — Current (Stable)

**Status**: Released and frozen.

All 5 phases complete:
- ✅ Foundation (Core, Event Bus, Invariant Engine, Loader)
- ✅ Core Modules (Health Sentinel, Release Verifier, Config Guardian, CLI, XRPL Adapter)
- ✅ Sandbox Engine (Snapshots, Replay, Amendment Simulator, In-Memory Runtime)
- ✅ Governor Layer (Token Issuer, Policy Engine, Build Queue, Audit Log)
- ✅ Platform Expansion (Multi-chain Adapters, Plugin SDK, Attestation Pipeline)

Hardening:
- ✅ Architecture Lock-In (16 regression tests, frozen Plugin API)
- ✅ Security & Determinism Audit (27 tests, SECURITY.md, THREAT_MODEL.md)
- ✅ Stress Testing (22 tests, edge cases, throughput)
- ✅ Release Engineering (git tag v1.0.0, CONTRIBUTING.md, BUILD.md)
- ✅ Documentation (Quickstart, Plugin Guide, Adapter Guide, Sandbox Guide, Governor Guide)
- ✅ Positioning & Scope (POSITIONING.md)
- ✅ Plugin Ecosystem Prep (PLUGIN_ECOSYSTEM.md, example plugin)
- ✅ Governor Risk Review (starvation analysis, emergency bypass, policy simulation)
- ✅ Roadmap Discipline (this document)

**Test count**: 295+

---

## v1.1.0 — Planned (Minor)

**Entry criteria**: All v1.0 hardening complete. No breaking changes.

### Candidates

| Feature | Category | Effort |
|---------|----------|--------|
| Persistent state (file-backed StateRegistry) | Core | Medium |
| Plugin validation CLI command | CLI | Small |
| Event rate limiting per plugin | Core | Medium |
| Adapter health dashboard (terminal) | CLI | Small |
| Additional chain adapter (Solana) | Adapter | Medium |
| CI pipeline config (GitHub Actions) | DevOps | Small |

### Non-goals for v1.1

- No Plugin API v2 changes
- No new core files
- No production dependencies
- No architecture changes

---

## v2.0.0 — Future (Major)

**Entry criteria**: Clear demand for breaking changes. PLUGIN_API_VERSION bumps to "2.0".

### Candidates

| Feature | Category | Rationale |
|---------|----------|-----------|
| Cryptographic audit log (hash chain) | Security | Tamper-proof forensics |
| Plugin sandboxing (isolated VM/process) | Security | Hard security boundary |
| Async invariant timeouts | Core | Prevent stuck transitions |
| Persistent event store | Core | Cross-restart replay |
| gRPC/REST API for external control | Integration | Multi-process deployment |
| Breaking Plugin API changes (if any) | API | Based on ecosystem feedback |

---

## Roadmap Discipline Rules

1. **No version inflation** — v1.0.x is for patches, v1.1.x for features, v2.0 only for breaking changes
2. **No scope creep in v1.0.x** — only bug fixes and documentation
3. **All v1.1 features must pass architecture tests** — no boundary violations
4. **v2.0 requires RFC** — written proposal reviewed before implementation
5. **Features without tests are not features** — every line of code has test coverage
6. **Stability over speed** — don't ship if it's not solid

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-07-24 | Freeze at v1.0.0 | All 5 phases complete; stabilize before expanding |
| 2025-07-24 | Zero dependencies policy | Eliminates supply chain risk for governance software |
| 2025-07-24 | Frozen Plugin API v1 | Enables ecosystem development on a stable contract |
| 2025-07-24 | Architecture regression tests | Prevents structural drift as modules are added |
