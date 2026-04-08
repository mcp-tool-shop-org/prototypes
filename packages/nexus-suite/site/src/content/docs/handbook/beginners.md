---
title: Beginners
description: New to Nexus Suite? Start here for a guided introduction.
sidebar:
  order: 99
---

## What is Nexus Suite?

Nexus Suite is a collection of five Python packages that provide governance, attestation, and routing infrastructure for MCP (Model Context Protocol) tool ecosystems. If you run MCP servers and need to control which tools get called, prove that results are authentic, or route requests through different transports, Nexus Suite handles that.

The three core concerns are:

- **Routing** (nexus-router) -- dispatch tool calls through pluggable adapters, with full event logging.
- **Governance** (nexus-control) -- require approvals before execution, enforce policies, track decisions.
- **Attestation** (nexus-attest) -- cryptographically sign and verify tool outputs using Ed25519 keys.

You can use all three together or pick just the parts you need. Each package installs independently.

## Who should use this?

Nexus Suite is designed for:

- **Platform teams** managing multiple MCP tools that need centralized routing and policy enforcement.
- **Security teams** that require cryptographic proof of tool output authenticity and tamper-evident audit trails.
- **DevOps engineers** building automated pipelines where tool executions must be approved, logged, and reproducible.
- **Developers** experimenting with MCP tool orchestration who want event-sourced routing with provenance tracking out of the box.

You do not need Nexus Suite if you only have a single tool with no governance requirements. It is built for multi-tool environments where trust, auditability, and controlled execution matter.

## Installation

### Requirements

- Python 3.11 or later (nexus-router alone supports 3.9+, but attest and control require 3.11+)
- pip
- Git

### Clone and install your first package

```bash
git clone https://github.com/mcp-tool-shop-org/nexus-suite.git
cd nexus-suite

# Start with the router
cd src/nexus-router
pip install -e ".[dev]"
```

The `[dev]` extra installs pytest, ruff, and mypy so you can run the test suite immediately.

### Verify the installation

```bash
pytest
```

All tests should pass. If they do, the router is installed correctly.

### Add more packages as needed

```bash
# Attestation layer
cd ../nexus-attest
pip install -e ".[dev]"

# Control plane
cd ../nexus-control
pip install -e ".[dev]"

# Adapters
cd ../nexus-router-adapter-stdout
pip install -e ".[dev]"

cd ../nexus-router-adapter-http
pip install -e ".[dev]"
```

## Core concepts

### Runs and events

Every operation in nexus-router is a **run**. A run consists of a goal, a plan (list of steps), and a mode (`dry_run` or `apply`). As the run executes, the router emits events into a SQLite event store:

1. `RUN_STARTED` -- run begins
2. `PLAN_CREATED` -- plan steps recorded
3. `STEP_STARTED` / `TOOL_CALL_REQUESTED` / `TOOL_CALL_SUCCEEDED` or `TOOL_CALL_FAILED` / `STEP_COMPLETED` -- per-step cycle
4. `PROVENANCE_EMITTED` -- provenance bundle attached
5. `RUN_COMPLETED` or `RUN_FAILED` -- final outcome

This event log is the source of truth. You can replay it to reconstruct exactly what happened.

### Decisions and approvals

nexus-control wraps router runs in a **decision** lifecycle. Before a run can execute, the decision must be approved according to its policy. The lifecycle is:

`draft` -> `pending_approval` -> `approved` -> `executing` -> `completed` (or `failed`)

Policies control how many approvals are needed, which modes are allowed, and what adapter capabilities are required.

### Attestations

nexus-attest creates **attestations** -- cryptographic signatures over audit package digests. An attestation proves that a specific actor vouched for a specific audit package at a specific time. Attestations are overlays: they reference audit packages by digest without modifying them.

### Adapters

Adapters are the transport layer. They implement a simple interface: accept a tool call (`tool`, `method`, `args`), deliver it, and return the response. The stdout adapter prints calls for debugging. The HTTP adapter sends them as POST requests to a remote endpoint.

## Your first routing run

Here is a minimal example that creates a router, runs a dry-run plan, and inspects the result:

```python
from nexus_router.event_store import EventStore
from nexus_router.router import Router

# Create an in-memory event store
store = EventStore(":memory:")
router = Router(store)

# Define a request with a two-step plan
request = {
    "goal": "Deploy widget v2",
    "mode": "dry_run",
    "plan_override": [
        {"step_id": "build", "call": {"method": "build", "args": {"target": "prod"}}},
        {"step_id": "deploy", "call": {"method": "deploy", "args": {"env": "staging"}}},
    ],
}

# Run it
result = router.run(request)

# Inspect
print(f"Mode: {result['summary']['mode']}")
print(f"Steps: {result['summary']['steps']}")
print(f"Tools used: {result['summary']['tools_used']}")
print(f"Run ID: {result['run']['run_id']}")
print(f"Events committed: {result['run']['events_committed']}")
```

Since this is a `dry_run`, no real tool execution happens -- the router records the plan and emits simulated results. Change `mode` to `"apply"` and set `policy.allow_apply` to `True` to execute for real (through an adapter).

## Common tasks

### Run tests for a single package

```bash
cd src/nexus-router
pytest
```

### Run tests for all packages

```bash
for pkg in nexus-router nexus-attest nexus-control nexus-router-adapter-stdout nexus-router-adapter-http; do
  echo "--- $pkg ---"
  cd src/$pkg && pytest && cd ../..
done
```

### Use the stdout adapter for debugging

```python
from nexus_router_adapter_stdout import StdoutAdapter

adapter = StdoutAdapter(prefix="[debug]", json_output=True)
result = adapter.call("my_tool", "run", {"x": 1})
# Prints: {"tool": "my_tool", "method": "run", "timestamp": "...", "args": {"x": 1}}
```

### Create and verify an attestation

```python
from nexus_attest.attestation._signing import (
    create_attestation,
    verify_attestation_signature,
    generate_signing_key,
    get_public_key_hex,
    public_key_from_hex,
    Attestor,
)

# Generate a key pair
key = generate_signing_key()

# Create an attestation
attestation = create_attestation(
    binding_digest="sha256:abcdef1234567890",
    claims=["tests-passed"],
    attestor=Attestor(id="ci-bot", key_id="key-001"),
    private_key=key,
)

# Verify it
pub_key = public_key_from_hex(get_public_key_hex(key))
result = verify_attestation_signature(attestation, pub_key)
assert result.ok
```

### Define a governance policy

```python
from nexus_control.policy import Policy, validate_execution_request

policy = Policy(
    min_approvals=1,
    allowed_modes=("dry_run", "apply"),
    max_steps=10,
)

# Check if an execution request is valid
validation = validate_execution_request(
    policy, mode="apply", approval_count=1
)
assert validation.valid
```

## Frequently asked questions

**Can I use nexus-router without nexus-control or nexus-attest?**
Yes. Each package is independent. The router works standalone -- it just routes and logs. Add control for governance or attest for signatures when you need them.

**What database does the event store use?**
SQLite. The `EventStore` accepts a file path or `":memory:"` for in-memory operation. It uses WAL mode and monotonic sequencing.

**How do I build a custom adapter?**
Implement the `DispatchAdapter` protocol: a `call(tool, method, args)` method that returns a dict, plus `adapter_id`, `adapter_kind`, and `capabilities` properties. See the stdout adapter source for a complete example.

**What key algorithm does nexus-attest use?**
Ed25519, via the Python `cryptography` library. Keys are 32-byte raw public keys, hex-encoded for storage.

**Is there a CLI?**
The packages are currently Python libraries, not CLI tools. You use them by importing and calling their APIs in your own code or scripts.

**Where do I report bugs or request features?**
Open an issue at [github.com/mcp-tool-shop-org/nexus-suite](https://github.com/mcp-tool-shop-org/nexus-suite/issues).

[Back to landing page](/nexus-suite/)
