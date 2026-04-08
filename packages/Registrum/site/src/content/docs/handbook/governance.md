---
title: Governance
description: Registrum's constitutional governance model — how invariants are protected, how changes are proposed, and the transition to stewardship.
sidebar:
  order: 4
---

Registrum operates under a constitutional governance model. This page explains what that means, why it exists, and how changes flow through the system.

## Why governance?

Most software projects govern themselves through convention: maintainers merge what seems reasonable, and the project evolves based on collective judgment. This works well for tools where flexibility is a feature.

Registrum is different. Its value comes from **structural guarantees** — promises that the 11 invariants hold under all conditions, that determinism is absolute, and that replay produces identical results. These guarantees are only valuable if they cannot be casually changed.

Governance exists to protect these guarantees. It ensures that changes to Registrum's constitutional properties require formal proposals, evidence, and deliberate decision-making.

## Governing principles

Three principles define how governance operates:

| Principle | What it means |
|-----------|---------------|
| **Behavioral guarantees over feature velocity** | Correctness always takes precedence over shipping new capabilities. A feature that weakens a guarantee is not a feature — it is a regression. |
| **Evidence-based changes only** | No change is accepted without proof that it preserves all existing guarantees. "It should work" is not sufficient. Test evidence, parity proofs, or formal analysis is required. |
| **Formal process required** | Changes flow through proposals, produce artifacts, and result in documented decisions. Informal changes to constitutional properties are not permitted. |

## What is governed

Not everything in Registrum requires governance. The governance boundary is drawn around constitutional properties:

**Governed (requires formal process):**
- The 11 structural invariants (any modification, addition, or removal)
- The dual-witness architecture (any change to how witnesses interact)
- The snapshot format (`RegistrarSnapshotV1` schema)
- Determinism guarantees
- Fail-closed behavior

**Not governed (normal development process):**
- Documentation improvements
- Performance optimizations that do not change behavior
- Tooling and developer experience
- Error message wording (as long as structured shape is preserved)

## Current status

Registrum has completed all planned development phases:

| Phase | Status | What it delivered |
|-------|--------|-------------------|
| A-C | Complete | Core registrar, parity harness, invariant engines |
| E | Complete | Persistence, replay, temporal stability |
| G | Complete | Governance framework |
| H | Complete | Registry as default engine, attestation enabled |

**Test coverage:** 282 tests passing across 15 test suites.

Development has transitioned from active building to **stewardship.** This means:

- The registrar works as designed
- All invariants are proven by tests
- Both witnesses agree on all known inputs
- The persistence layer round-trips correctly

Future changes are governance decisions, not engineering tasks.

## The stewardship model

In stewardship mode, the primary activity is maintenance rather than development:

- **Bug fixes** are addressed through the normal governance process (evidence required, parity preserved)
- **New features** require a formal governance proposal demonstrating that all existing guarantees are preserved
- **Invariant changes** require the highest level of scrutiny: formal proposals, comprehensive test evidence, and parity proofs across both witness engines
- **Deprecation or removal** of any constitutional property follows the same formal process

The project maintains a steward's closing note (`docs/STEWARD_CLOSING_NOTE.md`) documenting the rationale for entering stewardship and the conditions under which active development might resume.

## Further reading

The full governance documentation lives in the repository:

- **Philosophy** (`docs/governance/PHILOSOPHY.md`) — Why governance exists and what it protects
- **Scope** (`docs/governance/SCOPE.md`) — The precise boundary between governed and non-governed changes
- **Dual-witness policy** (`docs/governance/DUAL_WITNESS_POLICY.md`) — Rules for the dual-witness architecture
- **Governance handoff** (`docs/GOVERNANCE_HANDOFF.md`) — The transition from development to governance
