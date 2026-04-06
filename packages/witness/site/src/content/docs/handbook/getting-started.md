---
title: Getting Started
description: Install Witness and record your first event.
sidebar:
  order: 1
---

Witness is a local-first, append-only event journal with cryptographic verification. This guide gets you from zero to a verified proof trail in under two minutes.

## Prerequisites

- Python 3.11+
- `pip` (or your preferred Python package manager)

## Install

```bash
pip install xrpl-witness
```

Witness ships as a single Python package with one dependency (`cryptography` for Ed25519 + SHA-256 operations).

## Initialize a store

```bash
witness init
```

This creates a local SQLite database and generates an Ed25519 keypair. Everything stays on your machine -- no accounts, no cloud, no telemetry.

## Record an event

```bash
witness record --action "example.action" --intent "Demonstrate recording"
```

Each event is immediately signed with your Ed25519 key and appended to the journal. Events are never modified or deleted once recorded.

## Generate testimony

```bash
# Human-readable Markdown
witness testify --format md

# Machine-readable JSON (validated against schema)
witness testify --format json

# Emit standalone artifacts with integrity manifest
witness testify --format json --emit-artifact ./output
```

Testimony is a portable proof trail. You can email it, attach it to tickets, or check it into a repo. Third parties can validate testimony without Witness installed.

## Verify all events

```bash
witness verify
```

Verification recomputes every digest and checks every signature. Exit codes tell you the result:

| Code | Meaning |
|------|---------|
| 0 | All events verified, no flags |
| 2 | All events crypto-valid, but at least one has flags |
| 3 | At least one event failed cryptographic verification |

## Next steps

- Read the [Trust Model](/witness/handbook/trust-model/) to understand the cryptographic guarantees
- Explore [Usage patterns](/witness/handbook/usage/) for real-world workflows
- Check the [Reference](/witness/handbook/reference/) for every CLI command and flag
