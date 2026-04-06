# Witness Verification Specification

This document specifies exact verification rules for Witness v0.1 events.
Third-party implementations MUST follow these rules to correctly verify events.

---

## 1. Canonical JSON Rules

All digest and signature operations use **canonical JSON**.

### Serialization settings

```python
json.dumps(
    obj,
    sort_keys=True,
    separators=(",", ":"),
    ensure_ascii=False
).encode("utf-8")
```

### Invariants

- Object keys: sorted lexicographically (byte order)
- Arrays: preserve order
- Whitespace: none (no spaces after `:` or `,`)
- Encoding: UTF-8
- Numbers: no scientific notation, no NaN/Infinity

---

## 2. Digest Computation

### Algorithm

SHA-256

### Input

Canonical JSON bytes of the event with:
1. `integrity` object **removed entirely**
2. `signing.signature` set to `""` (empty string)

### Output format

```
sha256:<64 lowercase hex characters>
```

### Example

Given this event core (after removing integrity and clearing signature):

```json
{"action":"nexus.export_audit_package","actor":{"id":"7659...","type":"human"},...,"signing":{"algorithm":"ed25519","public_key":"...","signature":""}}
```

Canonical bytes (minified, sorted keys) → SHA-256 → `sha256:26677bb87460a7e9cce79c93184ee2983bd23b155701383a20e41af6060a0467`

---

## 3. Signature Computation

### Algorithm

Ed25519 (RFC 8032)

### Signed content

The **same canonical bytes** used for digest computation.

### Signature format

Base64-encoded Ed25519 signature (64 bytes → 88 characters base64)

### Public key format

Base64-encoded Ed25519 public key (32 bytes → 44 characters base64)

---

## 4. Verification Procedure

To verify a Witness event:

### Step 1: Reconstruct signable content

```python
core = deep_copy(event)
del core["integrity"]  # Remove entirely
core["signing"]["signature"] = ""  # Clear signature
canonical_bytes = canonicalize(core)
```

### Step 2: Verify digest

```python
computed = "sha256:" + sha256(canonical_bytes).hex()
assert computed == event["integrity"]["event_digest"]
```

### Step 3: Verify signature

```python
public_key = base64_decode(event["signing"]["public_key"])
signature = base64_decode(event["signing"]["signature"])
ed25519_verify(public_key, signature, canonical_bytes)
```

If any step fails, the event is `FAILED_CRYPTO`.

---

## 5. Worked Examples

### Example 1: Valid event

**Input** (pretty-printed for readability):

```json
{
  "action": "nexus.export_audit_package",
  "actor": {"id": "7659064ef95fe42607378e6dde16d8d04392cd584420d22e82ed542a51cc1dda", "type": "human"},
  "claims": [{"asserted_at": "2026-01-15T10:00:00Z", "type": "display_name", "value": "Alice"}],
  "context": {"observation": {"source": "wrapper", "statement": "Executed export_audit_package; produced 1 artifact"}, "tool": "nexus-attest", "tool_version": "0.6.0"},
  "event_id": "11111111-1111-1111-1111-111111111111",
  "inputs": [{"artifact_id": "config", "digest": "sha256:0000000000000000000000000000000000000000000000000000000000000000", "locator": "./config.json", "media_type": "application/json", "size_bytes": 123}],
  "integrity": {"event_digest": "sha256:26677bb87460a7e9cce79c93184ee2983bd23b155701383a20e41af6060a0467"},
  "intent": "Export audit package for run_id 9f3b",
  "links": {"parent_event_ids": [], "related_event_ids": []},
  "occurred_at": "2026-01-30T17:42:11Z",
  "outputs": [{"artifact_id": "audit_package", "digest": "sha256:1111111111111111111111111111111111111111111111111111111111111111", "locator": "./audit_package.json", "media_type": "application/json", "size_bytes": 456}],
  "schema_version": "0.1",
  "signing": {
    "algorithm": "ed25519",
    "public_key": "+RX96RbJtqiDtZE68sI4hf8gbevilks5FzIg0QCWpXI=",
    "signature": "fUZM7LlJm9+oQYCa2kwOgm2guPm5KFx0GG4RWrHGxu89Ga2Asxrvet/l1PSqIjviPmhztKBk6OhJZHTPJRVyCw=="
  }
}
```

**Verification result**: `VERIFIED` (no flags)

---

### Example 2: Tampered event (1 byte changed)

If we change `"Alice"` to `"Alicf"` in the claims:

```json
"claims": [{"asserted_at": "2026-01-15T10:00:00Z", "type": "display_name", "value": "Alicf"}]
```

**Verification result**: `FAILED_CRYPTO`

**Reason**: Recomputed digest will not match stored `event_digest`.

---

### Example 3: Wrong key signature

If we replace `signing.signature` with a valid Ed25519 signature from a **different** key:

**Verification result**: `FAILED_CRYPTO`

**Reason**: Ed25519 verify will fail because the signature was not produced by the key in `signing.public_key`.

---

### Example 4: Continuity rotation (no flags)

```json
{
  "action": "witness.rotate_key",
  "actor": {"id": "7659064ef95fe42607378e6dde16d8d04392cd584420d22e82ed542a51cc1dda", "type": "system"},
  "context": {
    "rotation": {
      "mode": "continuity",
      "new_key_id": "22db7342b648ab9c079f8795cfb02e25ac26dd8fae1a2bd3aa45bb6461bda361",
      "old_key_id": "7659064ef95fe42607378e6dde16d8d04392cd584420d22e82ed542a51cc1dda",
      "reason": "device_migration"
    },
    "tool": "witness-cli",
    "tool_version": "0.1.0"
  },
  "signing": {
    "algorithm": "ed25519",
    "public_key": "+RX96RbJtqiDtZE68sI4hf8gbevilks5FzIg0QCWpXI=",
    "signature": "CKmkVYFd4Fzquxq0XktlRuZ7FflYPsZggPWWspHZunyIZ9Jtd093CcB9PzdcrU9MJ7CUk6t7trwZtTQ5MrA6DQ=="
  }
}
```

**Verification result**: `VERIFIED` (no flags)

**Why no flags**:
- `mode = continuity`
- Signed by old key (`+RX96R...` corresponds to `old_key_id`)
- `actor.type = system` (as expected)

---

### Example 5: Recovery rotation (CONTINUITY_BROKEN)

```json
{
  "action": "witness.rotate_key",
  "actor": {"id": "66464aa111c5df2fc0cddb73f447a04cc6412de2b57b3315a3aa98da20cc36e4", "type": "system"},
  "context": {
    "rotation": {
      "mode": "recovery",
      "new_key_id": "66464aa111c5df2fc0cddb73f447a04cc6412de2b57b3315a3aa98da20cc36e4",
      "old_key_id": "22db7342b648ab9c079f8795cfb02e25ac26dd8fae1a2bd3aa45bb6461bda361",
      "reason": "suspected_compromise"
    }
  },
  "signing": {
    "public_key": "Ho7zP1/Dqt7dk7glmfoOT6OXgBvtsx12k68JgWspNXE="
  }
}
```

**Verification result**: `VERIFIED_WITH_FLAGS`

**Flags**: `CONTINUITY_BROKEN`

**Why**:
- `mode = recovery`
- Signed by **new** key, not old key
- Old key is unavailable/untrusted
- Cryptographically valid, but continuity cannot be proven

---

### Example 6: Key reactivation (KEY_REACTIVATION)

Timeline:
1. Event uses key A
2. Rotation: A → B
3. Rotation: B → C
4. Rotation: C → A ← **A returns!**

When key A appears as `new_key_id` after previously appearing as `old_key_id`:

**Verification result**: `VERIFIED_WITH_FLAGS`

**Flags**: `KEY_REACTIVATION`

**Why**: A previously rotated-away key is being reactivated. This is allowed but notable.

---

### Example 7: Temporal anomaly (TEMPORAL_ANOMALY_AFTER_ROTATION)

Timeline:
1. 2026-02-01: Rotation from key A to key B
2. 2026-02-05: Event signed by key A with `occurred_at: 2026-02-05`

**Verification result**: `VERIFIED_WITH_FLAGS`

**Flags**: `TEMPORAL_ANOMALY_AFTER_ROTATION`

**Why**:
- Key A was rotated away on 2026-02-01
- Event claims to occur on 2026-02-05
- Event is signed by key A
- This might be legitimate (historical import) but is suspicious

---

## 6. Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All events `VERIFIED`, no flags |
| 2 | All events crypto-valid, but at least one has flags |
| 3 | At least one event `FAILED_CRYPTO` |

---

## 7. Timeline Analysis Algorithm

### Building the key graph

```
for each event where action == "witness.rotate_key":
    if crypto_valid(event):
        add_edge(old_key_id → new_key_id)
        record rotation_timestamp
        record mode (continuity/recovery)
        record signing_key_id
```

### Detecting CONTINUITY_BROKEN

```
for each rotation edge:
    if mode == "recovery":
        flag CONTINUITY_BROKEN
    elif mode == "continuity" and signing_key_id != old_key_id:
        flag CONTINUITY_BROKEN
```

### Detecting TEMPORAL_ANOMALY_AFTER_ROTATION

```
rotated_away = {}  # key_id → first rotation timestamp

for each rotation event (chronological):
    rotated_away[old_key_id] = min(existing, rotation_timestamp)

for each non-rotation event:
    signing_key = derive_key_id(event.signing.public_key)
    if signing_key in rotated_away:
        if event.occurred_at > rotated_away[signing_key]:
            flag TEMPORAL_ANOMALY_AFTER_ROTATION
```

### Detecting KEY_REACTIVATION

```
previously_rotated_away = set()

for each rotation event (chronological):
    if new_key_id in previously_rotated_away:
        flag KEY_REACTIVATION
    previously_rotated_away.add(old_key_id)
```

### Detecting ROTATION_ACTOR_TYPE_UNEXPECTED

```
for each event where action == "witness.rotate_key":
    if event.actor.type != "system":
        flag ROTATION_ACTOR_TYPE_UNEXPECTED
```

---

## 8. Reference Implementation

See `tools/gen_golden.py` for the authoritative canonicalization and signing implementation.

See `tools/verify_golden.py` for verification logic.

Both use Python's `cryptography` library for Ed25519 operations.

---

## 9. Testimony Generation

The `witness testify` command generates human-readable reports from event journals.

### Privacy Note

> **Note:** The `--include-events` flag embeds exact stored JSON, which may contain
> sensitive fields if they were recorded. Use only when appropriate for audit or
> forensic purposes.

### Output Formats

| Format | Command | Description |
|--------|---------|-------------|
| Markdown | `witness testify --format md` | Human-readable with CITE lines |
| JSON | `witness testify --format json` | Machine-readable, schema-validated |
| Text | `witness testify --format text` | Plain text summary |

### Determinism

For deterministic output (useful in CI or for snapshotting):

```bash
witness testify --format json --generated-at 2026-01-01T00:00:00Z
```

### Artifacts

To emit testimony as standalone artifacts with integrity manifest:

```bash
witness testify --emit-artifact ./output
```

This creates:
- `testimony.json` — Full testimony in JSON format
- `testimony.md` — Human-readable Markdown
- `testimony.manifest.json` — SHA-256 digests of both files
