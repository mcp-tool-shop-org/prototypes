---
title: Architecture
description: Three-layer architecture for governance, routing, and attestation.
sidebar:
  order: 2
---

Nexus Suite is structured as three independent layers that can be composed together or used separately.

## Layer overview

```
nexus-control        <-- orchestration, approval, decision lifecycle
    |
nexus-router         <-- event-sourced request dispatch + routing
    |-- stdout-adapter
    |-- http-adapter
    |
nexus-attest         <-- Ed25519 signing + verification
```

## Control layer: nexus-control

The control plane manages the decision lifecycle for tool executions. It is an orchestration and approval layer built on event sourcing. Key capabilities:

- **Decisions** -- every execution starts as a Decision that moves through a state machine: `draft` -> `pending_approval` -> `approved` -> `executing` -> `completed` (or `failed`).
- **Policies** -- define `min_approvals`, `allowed_modes` (`dry_run` / `apply`), `max_steps`, and required adapter capabilities.
- **Approval workflow** -- approvals are granted by named Actors, can expire, and can be revoked. The decision only advances to `approved` when the policy threshold is met.
- **Templates** -- reusable policy configurations that can be attached to decisions with per-decision overrides.
- **Audit export** -- decisions and their full event history can be exported as verifiable audit packages.

nexus-control depends on nexus-router (for run execution) and nexus-attest (for attestation signing on audit packages).

## Routing layer: nexus-router

The router dispatches incoming requests to the correct tool via pluggable transport adapters. It is event-sourced with a SQLite-backed event store. Key design decisions:

- **Event sourcing** -- every run is recorded as a sequence of events (`RUN_STARTED`, `PLAN_CREATED`, `STEP_STARTED`, `TOOL_CALL_REQUESTED`, `TOOL_CALL_SUCCEEDED/FAILED`, `STEP_COMPLETED`, `PROVENANCE_EMITTED`, `RUN_COMPLETED/FAILED`). Events are stored in SQLite with monotonic sequencing.
- **Adapter pattern** -- swap transports without changing application code. Use stdout for local development, HTTP for production, or build your own by implementing the `DispatchAdapter` protocol (must expose `call(tool, method, args)`, `adapter_id`, `adapter_kind`, and `capabilities`).
- **Dispatch logic** -- route by tool name, method, or custom matching rules. Each step in a plan produces a tool call that flows through the chosen adapter.
- **Modes** -- `dry_run` simulates execution without side effects; `apply` executes for real (gated by policy).
- **Provenance** -- every run emits a provenance bundle linking the request, plan, and results.

The router works with or without the control layer. Without nexus-control, it routes unconditionally.

## Attestation layer: nexus-attest

Provides cryptographic signing and verification for audit packages using Ed25519 keys:

- **Signing** -- `create_attestation()` signs a canonical JSON payload containing the audit package `binding_digest`, claims, attestor identity, and timestamp. Signatures use Ed25519 via the `cryptography` library.
- **Verification** -- `verify_attestation_signature()` checks four aspects: signature validity, attestation version, non-empty claims, and correct digest format (`sha256:` prefix).
- **Overlay principle** -- attestations are independent artifacts that reference audit packages by `binding_digest`. Multiple attestations can exist for the same package without modifying it.
- **XRPL integration** -- optional subsystem for anchoring attestations to the XRP Ledger (adapter, signer, transport, memo encoding).
- **Independence** -- nexus-attest can operate standalone, without the router or control plane.

## Design principles

1. **Use what you need.** Each package is independently installable. You can use attestation without routing, routing without governance, or the full stack.
2. **Adapters are swappable.** The adapter pattern means transport is a pluggable concern, not a hardcoded dependency.
3. **Event-sourced by default.** Both the router and control plane record every action as an event, enabling replay, audit, and provenance.
4. **Python native.** Standard `pip install -e .` workflow. Hatchling or setuptools build backends. No exotic build tools.

[Back to landing page](/nexus-suite/)
