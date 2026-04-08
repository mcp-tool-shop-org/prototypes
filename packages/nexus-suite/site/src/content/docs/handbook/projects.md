---
title: Projects
description: Overview of all five packages in the Nexus Suite monorepo.
sidebar:
  order: 3
---

Nexus Suite is a monorepo containing five independent Python packages. Each lives under `src/` and can be installed and used on its own.

## Core packages

### nexus-router

Event-sourced MCP router with provenance and integrity. The central coordinator that receives incoming requests and dispatches them to the right tool through a transport adapter.

- **Version:** 0.1.1
- **Python:** 3.9+
- **Build backend:** setuptools
- **Dependencies:** jsonschema

```bash
cd src/nexus-router
pip install -e .
```

Key modules:

| Module | Purpose |
|--------|---------|
| `router.py` | `Router` class -- runs plans, emits events, builds provenance |
| `event_store.py` | `EventStore` -- SQLite-backed event log with monotonic sequencing |
| `events.py` | Event type constants (RUN_STARTED, TOOL_CALL_SUCCEEDED, etc.) |
| `policy.py` | `gate_apply()` -- policy gate for apply-mode execution |
| `provenance.py` | Provenance bundle construction |
| `schema.py` | JSON schema validation |
| `tool.py` | Tool call abstraction |

### nexus-attest

Orchestration, attestation signing, and verification layer. Provides cryptographic proof that tool outputs came from the claimed source, using Ed25519 signatures.

- **Version:** 0.6.1
- **Python:** 3.11+
- **Build backend:** hatchling
- **Dependencies:** nexus-router, cryptography

```bash
cd src/nexus-attest
pip install -e .
```

Key modules:

| Module | Purpose |
|--------|---------|
| `attestation/_signing.py` | `create_attestation()`, `verify_attestation_signature()`, key helpers |
| `attestation/queue.py` | Attestation queue for batch processing |
| `attestation/narrative.py` | Narrative attestation format |
| `attestation/xrpl/` | XRPL ledger integration (adapter, signer, transport, memo) |
| `audit_package.py` | `AuditPackage`, `verify_audit_package()` |
| `audit_export.py` | `export_audit_package()` |
| `decision.py` | Decision model |
| `policy.py` | Policy enforcement |
| `lifecycle.py` | Lifecycle state machine |

### nexus-control

Orchestration and approval layer for nexus-router executions. Manages the decision lifecycle with event-sourced state, policy enforcement, and approval workflows.

- **Version:** 0.6.0
- **Python:** 3.11+
- **Build backend:** hatchling
- **Dependencies:** nexus-router

```bash
cd src/nexus-control
pip install -e .
```

Key modules:

| Module | Purpose |
|--------|---------|
| `decision.py` | `Decision` state machine (`draft` -> `pending_approval` -> `approved` -> `executing` -> `completed`) |
| `policy.py` | `Policy` dataclass (min_approvals, allowed_modes, max_steps), `validate_execution_request()` |
| `store.py` | `DecisionStore` -- event store for decisions |
| `template.py` | `Template`, `TemplateStore` -- reusable policy templates |
| `tool.py` | `NexusControlTools` -- MCP tool interface |
| `lifecycle.py` | `compute_lifecycle()` -- progress and blocking reason analysis |
| `audit_package.py` | Audit package creation and verification |

## Router adapters

Adapters implement the `DispatchAdapter` protocol expected by nexus-router. Each adapter must expose: `call(tool, method, args)`, `adapter_id`, `adapter_kind`, and `capabilities`.

### nexus-router-adapter-stdout

Debug adapter that prints tool calls to stdout for inspection.

- **Version:** 0.1.0
- **Python:** 3.9+

```bash
cd src/nexus-router-adapter-stdout
pip install -e .
```

Provides `StdoutAdapter` and `create_adapter()` factory function. Configuration options include `prefix` (default `[nexus]`), `include_timestamp`, `include_args`, `json_output`, and `return_echo`.

Best for: local development, CLI debugging, piped workflows.

### nexus-router-adapter-http

Production adapter that dispatches tool calls via HTTP POST to `{base_url}/{tool}/{method}`.

- **Version:** 0.1.0
- **Python:** 3.10+
- **Dependencies:** httpx

```bash
cd src/nexus-router-adapter-http
pip install -e .
```

Provides `HttpAdapter` and `create_adapter()` factory function. Configuration: `base_url` (required), `timeout_s` (default 30), `headers`. Raises `NexusOperationalError` with structured error codes (`TIMEOUT`, `CONNECTION_FAILED`, `HTTP_ERROR`, `INVALID_JSON`).

Best for: production deployments, remote tool invocation.

## Package independence

Every package has its own `pyproject.toml`, its own test suite, and minimal cross-dependencies. You can install `nexus-attest` without ever touching `nexus-control`, or use `nexus-router` alone with just the stdout adapter.

[Back to landing page](/nexus-suite/)
