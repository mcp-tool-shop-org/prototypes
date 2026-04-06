---
title: For Beginners
description: New to Witness? Start here for a gentle introduction.
sidebar:
  order: 99
---

New to Witness? This guide explains what it does, why it exists, and how to use it -- no cryptography background required.

## What is Witness?

Witness is a local tool that creates tamper-evident records of things that happen on your machine. Think of it as a logbook where every entry is sealed with a digital signature, so anyone can later verify that the entry was not altered after the fact.

Every record (called an "event") captures four things: **who** performed an action, **what** they did, **why** they did it, and **when** it happened. Once written, events cannot be changed or deleted.

## Who is it for?

Witness is useful for anyone who needs to prove that something happened:

- **Developers** who want audit trails for deployments, config changes, or code reviews
- **Teams** running human-AI workflows who need to track which decisions were made by humans vs. machines
- **Compliance-conscious organizations** that need portable, verifiable proof of operational events
- **Security practitioners** who want cryptographic evidence of key rotations and access patterns

You do not need to understand cryptography to use Witness. The tool handles signing and verification automatically.

## Key concepts

**Event** -- A single recorded action. Each event has an action name (like `deploy.production`), an intent (a human-readable explanation), and is signed with your private key.

**Store** -- A local SQLite database where events are kept. It is append-only: you can add events but never modify or remove them.

**Testimony** -- A portable report generated from your events. You can share testimony with others as Markdown, JSON, or plain text. Recipients can verify it without installing Witness.

**Verification** -- The process of checking that no event has been tampered with. Witness recomputes each digital fingerprint (digest) and checks each signature.

**Flag** -- An informational marker on an event that indicates something unusual in the timeline (such as a key rotation using recovery mode). Flags never invalidate cryptographic proof -- they are audit signals for humans to review.

**Key rotation** -- The process of replacing your signing key. Witness supports two modes: continuity (signed by the old key, proving authorized handoff) and recovery (signed by the new key, used when the old key is lost).

## Prerequisites

Before starting, you need:

- **Python 3.11 or later** -- check with `python --version`
- **pip** -- the Python package installer (included with most Python installations)
- **Basic terminal skills** -- you should be comfortable running commands in a terminal or command prompt
- **A directory to work in** -- Witness creates a `.witness/` folder in the current directory

No cryptography knowledge is required. Witness handles all signing and verification automatically.

## Your First 5 Minutes

```bash
# Install from PyPI
pip install xrpl-witness

# Create a new event store and signing key
witness init

# Record your first event
witness record --action "test.hello" --intent "My first Witness event"

# See it in a readable report
witness testify --format md

# Verify that nothing was tampered with
witness verify
```

After `witness init`, two things are created in a `.witness/` directory:
- `events.db` -- the SQLite event journal
- `signing_key.pem` -- your Ed25519 private key (keep this safe)

Everything is local. There are no accounts, no cloud services, and no network calls.

## Common tasks

### Record a deployment

```bash
witness record --action "deploy.production" --intent "Ship v2.1.0 to prod"
```

### Record an event with context

You can attach structured metadata to any event:

```bash
witness record \
  --action "config.update" \
  --intent "Enable feature flag for dark mode" \
  --context '{"feature": "dark_mode", "enabled": true}'
```

### Generate a report for a ticket or PR

```bash
# Markdown for human reading
witness testify --format md -o testimony.md

# JSON for machine processing
witness testify --format json -o testimony.json
```

### Generate standalone artifacts with integrity proof

```bash
witness testify --format json --emit-artifact ./output
```

This produces `testimony.json`, `testimony.md`, and `testimony.manifest.json` (containing SHA-256 digests so anyone can verify the files).

### Inspect a specific event

```bash
witness inspect <event-id>
witness inspect <event-id> --json
```

### Export all events

```bash
witness export -o events.jsonl
```

### Rotate your signing key

```bash
witness rotate-key --reason "Scheduled quarterly rotation"
```

Follow the printed instructions to replace the old key file with the new one.

## Understanding exit codes

When you run `witness verify` or `witness testify`, the exit code tells you the result:

| Exit code | Meaning |
|-----------|---------|
| 0 | Everything is clean -- all events verified, no flags |
| 1 | Operational error (store not found, missing key, etc.) |
| 2 | All events are cryptographically valid, but at least one has a timeline flag worth reviewing |
| 3 | At least one event failed cryptographic verification -- something may have been tampered with |

You can use these exit codes in scripts and CI pipelines to gate deployments or trigger alerts.

## Common Mistakes

**1. Forgetting to run `witness init` first**
Every command except `init` requires an existing store. If you see "Store not found," run `witness init` in your project directory before doing anything else.

**2. Losing your signing key**
The file `.witness/signing_key.pem` is your private key. If you delete it, you cannot sign new events with the same identity. Back it up or know that you can recover with `witness rotate-key --mode recovery`, which creates a new key but raises a `CONTINUITY_BROKEN` flag.

**3. Trying to edit or delete events**
The store is append-only by design. SQLite triggers prevent updates and deletes. If you need to supersede an event, record a new event that references the old one via `--parent`.

**4. Running `witness verify` with exit code 2 and thinking something is wrong**
Exit code 2 means all events are cryptographically valid but at least one has a timeline flag. Flags are informational audit signals, not errors. Read the flag description to understand what happened.

**5. Using `--include-events` without considering privacy**
The `--include-events` flag embeds the exact stored JSON from every event. If your events contain sensitive context data, that data will be included in the testimony output. Only use this flag when appropriate for audit or forensic purposes.

## Next Steps

- [Getting Started](/witness/handbook/getting-started/) for a more detailed setup walkthrough
- [Usage](/witness/handbook/usage/) for real-world workflow patterns
- [Trust Model](/witness/handbook/trust-model/) to understand the cryptographic guarantees
- [Reference](/witness/handbook/reference/) for every CLI command and flag

## Glossary

| Term | Definition |
|------|------------|
| **Action** | A dot-separated identifier describing what happened (e.g., `deploy.production`, `config.update`). Every event requires one. |
| **Actor** | The entity that performed the action. Has a type (`human`, `system`, or `agent`) and an ID (defaults to your signing key ID). |
| **Canonical JSON** | A deterministic serialization format with sorted keys, no whitespace, and UTF-8 encoding. Ensures identical bytes for identical data across implementations. |
| **Continuity rotation** | A key rotation where the old key signs the rotation event, proving authorized handoff. |
| **Digest** | A SHA-256 hash computed over the canonical bytes of an event. Stored as `sha256:<64 hex characters>`. Used to detect tampering. |
| **Ed25519** | The digital signature algorithm used by Witness. Produces 64-byte signatures from 32-byte keys. |
| **Event** | A single recorded action in the journal. Contains who, what, why, and when, plus a cryptographic signature. |
| **Flag** | An informational marker indicating something unusual in the timeline (e.g., key recovery, temporal anomaly). Flags never invalidate cryptographic proof. |
| **Intent** | A human-readable explanation of why an action was taken. Every event requires one. |
| **Recovery rotation** | A key rotation where the new key signs the rotation event because the old key is unavailable. Raises `CONTINUITY_BROKEN`. |
| **Store** | The local SQLite database where events are kept. Append-only: events can be added but never modified or removed. |
| **Testimony** | A portable report generated from events. Available in Markdown, JSON, or plain text. Can be verified by third parties without Witness installed. |
| **Verification** | The process of recomputing digests and checking signatures to confirm no event has been tampered with. |
