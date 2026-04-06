---
title: Trust Model
description: How Witness establishes cryptographic trust and what that means in practice.
sidebar:
  order: 2
---

Witness builds trust through three layers: deterministic serialization, cryptographic integrity, and timeline analysis.

## Philosophy

Witness is about truthfulness, not judgment. It records what happened and lets you verify it later. Humans decide what it means.

There is no policy enforcement, no trust scoring, no AI judgment of intent. Witness is deliberately neutral.

## Cryptographic layers

All operations follow the same chain: **canonical JSON** then **SHA-256 digest** then **Ed25519 signature**.

### Canonical JSON

Every event is serialized to a deterministic byte sequence before any cryptographic operation. The rules are strict:

- Object keys sorted lexicographically (byte order)
- Arrays preserve order
- No whitespace (no spaces after `:` or `,`)
- UTF-8 encoding
- No scientific notation, no NaN/Infinity

If canonical bytes differ between implementations, verification will fail. This is by design.

### SHA-256 digest

The digest is computed over the canonical bytes of the event with:

1. The `integrity` object removed entirely
2. `signing.signature` set to an empty string

The result is stored as `sha256:<64 lowercase hex characters>`.

### Ed25519 signature

The same canonical bytes used for the digest are signed with the event author's Ed25519 private key. The signature is base64-encoded (64 bytes producing 88 characters).

The public key is embedded in the event itself, making each event independently verifiable.

## Verification procedure

To verify any Witness event:

1. Reconstruct the signable content (remove `integrity`, clear `signature`)
2. Canonicalize to bytes
3. Recompute SHA-256 and compare to the stored `event_digest`
4. Verify the Ed25519 signature against the canonical bytes using the embedded public key

If any step fails, the event is `FAILED_CRYPTO`.

## Timeline analysis

Beyond per-event cryptographic validity, Witness analyzes the full event timeline for anomalies. Timeline issues produce informational flags -- they never invalidate cryptographic proof.

### Flag types

| Flag | Meaning |
|------|---------|
| `CONTINUITY_BROKEN` | A key rotation used recovery mode, or a continuity rotation was not signed by the old key |
| `TEMPORAL_ANOMALY_AFTER_ROTATION` | An event was signed by a key that had already been rotated away at the time of the event |
| `KEY_REACTIVATION` | A previously rotated-away key has been reactivated |
| `ROTATION_ACTOR_TYPE_UNEXPECTED` | A key rotation event has an actor type other than `system` |

Flags are audit signals, not errors. A flagged event is still cryptographically valid.

## Key management

There is no separate key registry. Key state is inferred entirely from events in the journal.

### Rotation modes

**Continuity rotation** -- the event is signed by the old key, proving the holder authorized the transition. No flags.

**Recovery rotation** -- the event is signed by the new key because the old key is unavailable. Raises `CONTINUITY_BROKEN` because continuity cannot be cryptographically proven.

Both modes are legitimate. The difference is auditability.

## What Witness does not do

- No identity proof (Witness does not know who you are)
- No trust scoring (events are not ranked)
- No policy enforcement (flags inform, they do not block)
- No cloud sync (everything is local)
- No network verification (fully offline)
