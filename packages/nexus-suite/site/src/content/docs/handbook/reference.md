---
title: Reference
description: Configuration, adapter API, and key class reference.
sidebar:
  order: 4
---

## Router API

### Router class

The `Router` class in `nexus_router.router` accepts an `EventStore` and runs plans:

```python
from nexus_router.event_store import EventStore
from nexus_router.router import Router

store = EventStore(":memory:")  # or a file path
router = Router(store)

result = router.run({
    "goal": "Deploy widget",
    "mode": "dry_run",           # or "apply"
    "policy": {"max_steps": 10}, # optional
    "plan_override": [           # steps to execute
        {"step_id": "s1", "call": {"method": "build", "args": {}}},
    ],
})
```

The returned dict contains `summary`, `run` (with `run_id` and `events_committed`), `plan`, `results`, and `provenance`.

### EventStore

SQLite-backed event store with monotonic sequencing. Supports context manager protocol:

```python
with EventStore("runs.db") as store:
    router = Router(store)
    result = router.run(request)
```

Key methods: `create_run()`, `append()`, `read_events()`, `set_run_status()`.

### Event types

| Event | Meaning |
|-------|---------|
| `RUN_STARTED` | Run begins with mode and goal |
| `PLAN_CREATED` | Plan steps recorded |
| `STEP_STARTED` | Individual step begins |
| `TOOL_CALL_REQUESTED` | Tool call dispatched |
| `TOOL_CALL_SUCCEEDED` | Tool call returned successfully |
| `TOOL_CALL_FAILED` | Tool call raised an error |
| `STEP_COMPLETED` | Step finished (ok or error) |
| `PROVENANCE_EMITTED` | Provenance bundle attached to run |
| `RUN_COMPLETED` | Run finished successfully |
| `RUN_FAILED` | Run failed (policy violation, step error, or exception) |

### Running tests

Each package uses pytest:

```bash
cd src/<package-name>
pytest
```

## Control plane API

### Policy

```python
from nexus_control.policy import Policy, validate_execution_request

policy = Policy(
    min_approvals=2,
    allowed_modes=("dry_run", "apply"),
    max_steps=5,
    require_adapter_capabilities=("apply",),
    labels=("prod", "finance"),
)

# Validate before execution
result = validate_execution_request(
    policy, mode="apply", approval_count=2, adapter_capabilities={"apply"}
)
assert result.valid
```

### Decision lifecycle

Decisions move through: `draft` -> `pending_approval` -> `approved` -> `executing` -> `completed` (or `failed`). State is derived by replaying events:

```python
from nexus_control.decision import Decision
from nexus_control.store import DecisionStore

store = DecisionStore("decisions.db")
decision = Decision.load(store, decision_id="dec_abc123")
print(decision.state)              # e.g. "approved"
print(decision.active_approval_count)
print(decision.is_approved)
```

### Templates

Reusable policy configurations. Create a template, then attach it to decisions with optional overrides:

```python
from nexus_control.template import Template, TemplateStore

template_store = TemplateStore("templates.db")
```

### NexusControlTools

The `NexusControlTools` class provides the MCP tool interface for programmatic interaction with the control plane.

## Attestation API

### Signing

nexus-attest uses Ed25519 keys (via the `cryptography` library) to sign canonical JSON payloads:

```python
from nexus_attest.attestation._signing import (
    create_attestation,
    generate_signing_key,
    Attestor,
)

key = generate_signing_key()
attestor = Attestor(id="ci-bot", key_id="key-001", role="reviewer")

attestation = create_attestation(
    binding_digest="sha256:abc123...",
    claims=["controls-reviewed", "tests-passed"],
    attestor=attestor,
    private_key=key,
)
```

The signed payload includes: `attestation_version`, `binding_digest`, sorted `claims`, attestor `id` + `key_id`, and `signed_at` timestamp.

### Verification

```python
from nexus_attest.attestation._signing import (
    verify_attestation_signature,
    get_public_key_hex,
    public_key_from_hex,
)

pub_hex = get_public_key_hex(key)
pub_key = public_key_from_hex(pub_hex)

result = verify_attestation_signature(attestation, pub_key)
assert result.ok
```

Verification checks: signature validity, attestation version, non-empty claims, and `sha256:` digest format prefix.

### Audit packages

`AuditPackage` bundles decision data with integrity digests. Use `export_audit_package()` to serialize and `verify_audit_package()` to validate.

## Adapter API surface

Custom adapters must implement the `DispatchAdapter` protocol:

1. **`call(tool, method, args)`** -- receive tool name, method name, and arguments dict. Return a response dict.
2. **`adapter_id`** (property) -- stable identifier string for this adapter instance.
3. **`adapter_kind`** (property) -- type identifier (e.g., `"stdout"`, `"http"`).
4. **`capabilities`** (property) -- `FrozenSet[str]` of declared capabilities (e.g., `"apply"`, `"dry_run"`, `"external"`, `"timeout"`).

Both built-in adapters also expose an `ADAPTER_MANIFEST` dict and a `create_adapter()` factory function per the adapter specification.

## Adapter configuration

### stdout adapter

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `adapter_id` | str | `"stdout"` | Custom adapter ID |
| `prefix` | str | `"[nexus]"` | Prefix for output lines |
| `include_timestamp` | bool | `True` | Include ISO timestamp |
| `include_args` | bool | `True` | Include args dict |
| `json_output` | bool | `False` | Output JSON instead of human-readable |
| `return_echo` | bool | `True` | Return call info in result |

### HTTP adapter

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `base_url` | str | (required) | Base URL for the HTTP endpoint |
| `adapter_id` | str | `"http:{host}"` | Custom adapter ID |
| `timeout_s` | float | `30.0` | Request timeout in seconds |
| `headers` | dict | `{}` | Additional HTTP headers |
| `capabilities` | frozenset | apply, external, timeout | Override capabilities |

### HTTP adapter error codes

| Code | Meaning |
|------|---------|
| `TIMEOUT` | Request exceeded `timeout_s` |
| `CONNECTION_FAILED` | Could not connect to endpoint |
| `HTTP_ERROR` | HTTP status 4xx/5xx or transport error |
| `INVALID_JSON` | Response was not valid JSON or not an object |

## Links

- [GitHub repository](https://github.com/mcp-tool-shop-org/nexus-suite)
- [MCP Tool Shop org](https://github.com/mcp-tool-shop-org)

[Back to landing page](/nexus-suite/)
