---
title: Reference
description: Full CLI reference, schemas, exit codes, and stable guarantees.
sidebar:
  order: 5
---

Complete reference for the Witness CLI, schemas, and contracts.

## CLI commands

### witness init

Initialize a new event store with a fresh Ed25519 keypair.

```bash
witness init [--force]
```

| Flag | Description |
|------|-------------|
| `--store` | Path to witness store (default: `.witness/events.db`) |
| `--key` | Path to signing key (default: `.witness/signing_key.pem`) |
| `--force` | Force reinitialization if store already exists |

Creates a local SQLite database and generates signing keys. Safe to run in any directory.

### witness record

Record a new event to the journal.

```bash
witness record --action <ACTION> --intent <INTENT> [OPTIONS]
```

| Flag | Description |
|------|-------------|
| `--action` | Dot-separated action identifier (required) |
| `--intent` | Human-readable reason for the event (required) |
| `--event-id` | Custom event ID (default: auto-generated UUID) |
| `--occurred-at` | Timestamp in ISO 8601 (default: current time) |
| `--actor-type` | Actor type: `human`, `system`, or `agent` (default: `human`) |
| `--actor-id` | Actor ID (default: signing key ID) |
| `--context` | Context as a JSON string or path to a JSON file |
| `--parent` | Parent event ID (repeatable for multiple parents) |
| `--related` | Related event ID (repeatable for multiple relations) |
| `--allow-backdate` | Suppress warning when `--occurred-at` is in the past |
| `-v`, `--verbose` | Print full event JSON after recording |

Events are immediately signed and appended. They cannot be modified or deleted after recording.

### witness inspect

View details of a specific event.

```bash
witness inspect <EVENT_ID> [--json]
```

| Flag | Description |
|------|-------------|
| `<EVENT_ID>` | The event ID to inspect (positional, required) |
| `--json` | Output the full event as canonical JSON |

Without `--json`, displays a human-readable summary including event ID, timestamp, action, intent, actor, signing key, digest, and cryptographic validity.

### witness verify

Verify all events in the journal cryptographically.

```bash
witness verify [-v]
```

| Flag | Description |
|------|-------------|
| `-v`, `--verbose` | Show details including individual failure reasons and flag counts |

Recomputes every digest and checks every signature. Also runs timeline analysis for flag detection.

### witness export

Export events to JSONL (one canonical JSON event per line).

```bash
witness export [-o <FILE>]
```

| Flag | Description |
|------|-------------|
| `-o`, `--output` | Output file path (default: stdout) |

### witness rotate-key

Create a key rotation event and generate a new signing key.

```bash
witness rotate-key [--mode <MODE>] [--reason <TEXT>] [--reason-code <CODE>]
```

| Flag | Description |
|------|-------------|
| `--mode` | Rotation mode: `continuity` or `recovery` (default: `continuity`) |
| `--reason` | Human-readable reason for the rotation |
| `--reason-code` | Reason code: `scheduled`, `suspected_compromise`, `device_migration`, `policy`, or `other` (default: `policy`) |
| `--note` | Additional note |

In **continuity** mode, the rotation event is signed by the old key, proving the holder authorized the transition. In **recovery** mode, the rotation is signed by the new key because the old key is unavailable (raises `CONTINUITY_BROKEN` flag).

After rotation, the new key is saved alongside the old one. You must manually replace the old key file to complete the rotation.

### witness testify

Generate a testimony report from the event journal.

```bash
witness testify --format <FORMAT> [OPTIONS]
```

| Flag | Description |
|------|-------------|
| `--format` | Output format: `md`, `json`, or `text` (default: `md`) |
| `--since` | Filter events since this timestamp |
| `--until` | Filter events until this timestamp |
| `--event` | Filter to a specific event ID |
| `--actor` | Filter to a specific actor key ID |
| `--generated-at` | ISO 8601 timestamp for deterministic output |
| `--emit-artifact` | Directory to write standalone artifact files |
| `--include-events` | Embed exact stored JSON (byte-for-byte) |
| `--include-artifacts` | Include artifact details (default: true) |
| `--check-files` | Verify referenced file artifacts exist and match their digests |
| `--fail-on` | When to fail: `crypto` (default) or `never` |
| `-o`, `--output` | Output file path (default: stdout) |

When `--emit-artifact` is used, three files are produced:

- `testimony.json` -- full JSON testimony
- `testimony.md` -- Markdown testimony
- `testimony.manifest.json` -- SHA-256 digests and sizes

## Global flags

These flags apply to all commands:

| Flag | Description |
|------|-------------|
| `--store` | Path to witness store (default: `.witness/events.db`) |
| `--key` | Path to signing key (default: `.witness/signing_key.pem`) |
| `--version` | Print version and exit |

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | All events verified, no flags |
| 1 | Operational error (store not found, key missing, etc.) |
| 2 | All events crypto-valid, at least one flag raised |
| 3 | At least one event failed cryptographic verification |

## Schemas

### Event schema

Events follow the structure defined by the golden fixtures in `tests/fixtures/golden/*.json`. Key fields:

| Field | Type | Description |
|-------|------|-------------|
| `schema_version` | string | Currently `"0.1"` |
| `event_id` | UUID | Unique event identifier |
| `occurred_at` | ISO 8601 | When the event happened |
| `actor` | object | `{type, id}` -- who performed the action |
| `intent` | string | Human-readable reason |
| `action` | string | Dot-separated action identifier |
| `inputs` | array | Input artifacts (each with `artifact_id`, `media_type`, `digest`, `size_bytes`) |
| `outputs` | array | Output artifacts (same structure as inputs) |
| `context` | object | Free-form metadata (tool name, version, observation, etc.) |
| `links` | object | `{parent_event_ids, related_event_ids}` |
| `signing` | object | `{algorithm, public_key, signature}` |
| `integrity` | object | `{event_digest}` |

### Testimony schema

JSON testimony output is validated against `schemas/testimony.schema.v0.1.json`. This schema is a stable contract.

## Stable guarantees

These contracts will not break without a schema version bump:

| Artifact | Location | Contract |
|----------|----------|----------|
| Event schema | `tests/fixtures/golden/*.json` | Golden fixtures are the spec |
| Testimony schema | `schemas/testimony.schema.v0.1.json` | JSON output structure |
| Exit codes | 0 / 1 / 2 / 3 | Verification and operational result semantics |
| Flags | 4 timeline types | Informational only, never block verification |
| Canonical JSON | `canon.py` | Byte-identical serialization rules |
| Digest format | `sha256:<hex>` | SHA-256 over canonical bytes |
| Signature format | base64 Ed25519 | 64-byte signature, 32-byte public key |

## Timeline flags

| Flag | Trigger |
|------|---------|
| `CONTINUITY_BROKEN` | Recovery rotation, or continuity rotation not signed by old key |
| `TEMPORAL_ANOMALY_AFTER_ROTATION` | Event signed by a rotated-away key after the rotation timestamp |
| `KEY_REACTIVATION` | A previously rotated-away key appears as `new_key_id` |
| `ROTATION_ACTOR_TYPE_UNEXPECTED` | Rotation event with `actor.type` other than `system` |

## File verification flags

These flags appear when `--check-files` is used with `testify`:

| Flag | Trigger |
|------|---------|
| `MISSING_FILE` | Referenced file not found at its locator |
| `DIGEST_MISMATCH_FILE` | File exists but SHA-256 digest differs |

## Key derivation

Key IDs are computed as `sha256(public_key_bytes)` in lowercase hex (64 characters). Public keys are base64-encoded Ed25519 keys (44 characters). Signatures are base64-encoded Ed25519 signatures (88 characters).

## Contract documents

| Document | Purpose |
|----------|---------|
| `CONTRACT.md` | Defines what is normative vs. example |
| `IMPLEMENTATION_NOTES.md` | Locked invariants -- do not change without schema bump |
| `VERIFICATION.md` | Crypto rules and worked examples for third-party implementors |
| `SECURITY.md` | Vulnerability reporting and security scope |
