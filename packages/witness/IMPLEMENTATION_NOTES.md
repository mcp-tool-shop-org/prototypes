# Witness Phase 1 — Implementation Notes

**Project:** Witness
**Scope:** Phase 1 (v0.1)
**Status:** Contract locked

This document defines non-negotiable implementation rules for Witness Phase 1.
If behavior is not specified here, do not invent it. If a change is required, it must be accompanied by:
- A schema version bump, or
- Regeneration of golden fixtures + updated tests

---

## 1. Canonical JSON (HARD REQUIREMENT)

All cryptographic operations depend on byte-for-byte canonical JSON.

### Canonicalization rules

| Rule | Value |
|------|-------|
| Encoding | UTF-8 |
| Object keys | Sorted lexicographically |
| Arrays | Preserve order |
| Whitespace | None |
| `sort_keys` | `true` |
| `separators` | `(",", ":")` |
| `ensure_ascii` | `false` |

### Numbers

- No scientific notation
- No `NaN` / `Infinity` (reject input if encountered)

### Where canonicalization is used

- `event_digest` computation
- Ed25519 signing
- Ed25519 verification
- Golden fixture comparison

**If canonical bytes differ, the implementation is incorrect**, even if signatures "verify" internally.

---

## 2. Digest + Signature Rules (LOCKED)

### Digest algorithm

- SHA-256 over canonical JSON bytes
- Stored as: `sha256:<lowercase hex>`

### What is signed / digested

To compute `event_digest` and `signature`:

1. Start from the full event object
2. **Remove** `integrity` entirely
3. **Set** `signing.signature = ""` (empty string)
4. Canonicalize the resulting object
5. Compute SHA-256 digest
6. Sign the canonical bytes with Ed25519

### Verification must

1. Reconstruct the same canonical bytes
2. Recompute digest and compare to `integrity.event_digest`
3. Verify signature against canonical bytes using `signing.public_key`

### Important

- `signing.public_key` **is included** in the signed content
- Signature verification failure is always fatal

---

## 3. Cryptographic Validity vs Timeline Validity

This distinction is fundamental.

### Cryptographic validity

Per-event, self-contained:
- Digest matches
- Signature verifies using embedded public key

If crypto fails → `FAILED_CRYPTO` (exit code 3)

### Timeline validity (audit layer)

Derived by analyzing multiple events together:
- Key rotations
- Temporal ordering
- Continuity

**Timeline issues never invalidate crypto.**
They produce flags, not failures.

---

## 4. Key Management (No Key Registry Table)

- There is no separate key table in Phase 1
- Key state is inferred only from events
- `witness.rotate_key` events are the registry

Verification must:
1. Verify each event cryptographically
2. Walk rotation events to build a key graph
3. Analyze continuity and timing

---

## 5. Key Rotation Semantics

### Rotation is a normal event

- `action = "witness.rotate_key"`
- `actor.type = "system"` (LOCKED)
- Signed like any other event

### Two rotation modes

#### Continuity rotation

- `mode = "continuity"`
- Event is signed by **old** key
- Continuity is provable

#### Recovery rotation

- `mode = "recovery"`
- Event is signed by **new** key
- Continuity is not provable
- Must be flagged

### Required context fields

```json
"context": {
  "rotation": {
    "old_key_id": "...",
    "new_key_id": "...",
    "reason": "scheduled | suspected_compromise | device_migration | policy | other",
    "mode": "continuity | recovery"
  }
}
```

---

## 6. Timeline Analysis Rules (Flags)

Flags are informational. They do not block verification.

### `CONTINUITY_BROKEN`

Raised when:
- A rotation is `mode=recovery`, or
- A continuity rotation is not signed by the old key

### `TEMPORAL_ANOMALY_AFTER_ROTATION`

Raised when:
- An event is signed by key K
- `occurred_at` is after the first rotation event where `old_key_id == K`

This is allowed (e.g., historical import), but must be visible.

### `KEY_REACTIVATION`

Raised when:
- A key that previously appeared as `old_key_id`
- Later appears again as `new_key_id`

Legitimate but audit-relevant.

### `ROTATION_ACTOR_TYPE_UNEXPECTED`

Raised when:
- `action == witness.rotate_key`
- `actor.type != system`

---

## 7. Backdating Policy

Phase 1 is permissive.

- Events may be recorded with `occurred_at` in the past
- CLI should warn, not reject
- Verification flags anomalies; it never blocks recording

---

## 8. File Verification (`--check-files`)

When `witness verify --check-files` is used:

For every artifact with `locator`:
1. Attempt to read file
2. Recompute SHA-256

### Flags

| Flag | Condition |
|------|-----------|
| `MISSING_FILES` | locator exists but file not found |
| `DIGEST_MISMATCH_FILE` | file exists but hash differs |

Artifacts without `locator` are skipped silently.

### Exit codes

| Code | Meaning |
|------|---------|
| 0 | All verified, no flags |
| 2 | Verified with flags |
| 3 | Crypto failure |

---

## 9. Golden Fixtures (Authoritative)

Golden fixtures under `tests/fixtures/golden/` are ground truth.

### Rules

- Do not hand-edit golden files
- Regenerate only via `tools/gen_golden.py`
- CI must run `verify_golden.py`
- `expected_flags.json` is not used by `verify_golden.py`. It is consumed by timeline/unit tests only.

Any schema or signing change requires:
- Regeneration of fixtures
- Updated expected flags in tests

### Expected outcomes

| Fixture | Expected Result | Flags |
|---------|-----------------|-------|
| `event.normal` | VERIFIED | (none) |
| `event.rotate.continuity` | VERIFIED | (none) |
| `event.backdated.temporal_anomaly` | VERIFIED_WITH_FLAGS | `TEMPORAL_ANOMALY_AFTER_ROTATION` |
| `event.rotate.recovery` | VERIFIED_WITH_FLAGS | `CONTINUITY_BROKEN` |
| `event.rotate.reactivation` | VERIFIED_WITH_FLAGS | `KEY_REACTIVATION` |
| `event.rotate.wrong_actor_type` | VERIFIED_WITH_FLAGS | `ROTATION_ACTOR_TYPE_UNEXPECTED` |

---

## 10. Nexus Integration Example (Phase 1)

- Must live in `examples/nexus_wrapper/`
- Must be a standalone Python script
- Must call `witness record` via CLI subprocess
- Witness must not depend on Nexus libraries

Purpose: demonstrate the wrap-a-tool pattern, not provide a framework.

---

## 11. Things Explicitly Out of Scope (Do Not Add)

- Cloud sync
- Network verification
- Third-party timestamp authorities
- Policy enforcement
- UI
- Ontologies or intent truth modeling
- Key revocation enforcement

**If it smells like governance, it's Phase 2.**

---

## 12. Definition of Done (Phase 1)

Implementation is complete when:

- [ ] All golden fixtures verify
- [ ] Timeline flags behave exactly as specified
- [ ] No mutable state exists (append-only enforced)
- [ ] Verification works offline
- [ ] Tests assert flags explicitly (not just pass/fail)

---

## 13. Key Material for Fixtures

Keys are deterministically derived from seeds:

| Key | Seed | Key ID |
|-----|------|--------|
| old | `witness-fixture-key-old` | `7659064ef95fe42607378e6dde16d8d04392cd584420d22e82ed542a51cc1dda` |
| new | `witness-fixture-key-new` | `22db7342b648ab9c079f8795cfb02e25ac26dd8fae1a2bd3aa45bb6461bda361` |
| recovery | `witness-fixture-key-recovery` | `66464aa111c5df2fc0cddb73f447a04cc6412de2b57b3315a3aa98da20cc36e4` |

Key ID = `sha256(public_key_bytes)` as lowercase hex.

---

**Witness Phase 1 is about truthfulness, not judgment.**
Record what happened. Verify it later. Let humans decide what it means.
