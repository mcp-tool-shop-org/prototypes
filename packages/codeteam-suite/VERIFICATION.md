# CodeTeam Suite — Verification Rules v0.1

## Status

**Normative for v0.1.0**

---

## 1. Verification Overview

Verification determines whether a package is:
- intact
- policy-compliant
- correctly approved
- correctly signed

**Verification MUST be deterministic and reproducible.**

---

## 2. Verification Phases (in order)

### Phase 1 — Schema Validation

- `codeteam.manifest.json` MUST validate against schema v0.1
- Approval and signature records MUST validate against their schemas
- Failure → `FAIL_SCHEMA`

### Phase 2 — Integrity Verification

For each referenced artifact and evidence file:
- file MUST exist
- file size MUST match `size_bytes`
- SHA-256 digest MUST match

**Failure cases:**
- missing file → `FAIL_INTEGRITY` (`MISSING_FILE`)
- size mismatch → `FAIL_INTEGRITY` (`SIZE_MISMATCH`)
- digest mismatch → `FAIL_INTEGRITY` (`DIGEST_MISMATCH`)

### Phase 3 — Approval Verification

- Each approval signature MUST verify cryptographically
- Approver key MUST be authorized by the manifest
- Duplicate approvals MUST be ignored
- Valid approvals MUST be counted

**Outcomes:**
- If `approvals < required_approvals`: return `OK_UNSIGNED` (not a failure)
- If any approval signature is invalid: return `FAIL_SIGNATURE`
- If approver is unauthorized: return `FAIL_UNAUTHORIZED`

### Phase 4 — Signature Verification

If a final signature exists:
- signature MUST verify cryptographically
- signer MUST be authorized

Failure → `FAIL_SIGNATURE` or `FAIL_UNAUTHORIZED`

---

## 3. Verification Outcomes

### 3.1 OK_UNSIGNED

Returned when:
- schema valid
- integrity valid
- approvals incomplete or complete
- no final signature present

### 3.2 OK_VERIFIED

Returned when:
- schema valid
- integrity valid
- approval threshold met
- final signature valid

### 3.3 Failure States

Failures MUST short-circuit verification and return the first applicable failure code.

| Status | Exit Code | Cause |
|--------|-----------|-------|
| `FAIL_SCHEMA` | 3 | Manifest or record fails schema validation |
| `FAIL_INTEGRITY` | 2 | Missing file, size mismatch, or digest mismatch |
| `FAIL_SIGNATURE` | 4 | Cryptographic signature invalid |
| `FAIL_THRESHOLD` | 5 | Final signature present but approvals < required |
| `FAIL_UNAUTHORIZED` | 6 | Actor not in authorized approver set |

---

## 4. Error Reporting (structured)

Implementations SHOULD return structured errors containing:
- `error_code`
- affected path (if applicable)
- expected vs actual values (if applicable)

**Canonical error codes:**

| Code | Meaning |
|------|---------|
| `MISSING_FILE` | Referenced file does not exist |
| `SIZE_MISMATCH` | File size differs from manifest |
| `DIGEST_MISMATCH` | SHA-256 hash differs from manifest |
| `SCHEMA_INVALID` | JSON does not match schema |
| `SIGNATURE_INVALID` | Ed25519 signature verification failed |
| `ACTOR_NOT_AUTHORIZED` | Approver/signer not in policy |
| `THRESHOLD_NOT_MET` | Approval count below required |

---

## 5. No-lies UX Guarantee

Implementations MUST NOT:
- report `OK_VERIFIED` if any check fails
- downgrade integrity or signature failures to warnings
- auto-repair or ignore discrepancies

---

## 6. Seal Verification (optional)

If a seal record exists:
- seal verification MAY be performed
- seal verification MUST NOT affect package validity
- seal failures MUST NOT downgrade `OK_VERIFIED`

---

## 7. Determinism Requirement

Given identical package contents:
- verification MUST always produce the same result
- ordering of JSONL records MUST NOT affect outcome

---

## 8. Test Fixtures Requirement

Every implementation SHOULD be validated against:

| Fixture | Expected Status |
|---------|-----------------|
| `minimal_unsigned/` | `OK_UNSIGNED` |
| `approved_threshold_met/` | `OK_UNSIGNED` |
| `signed_verified/` | `OK_VERIFIED` |
| `tampered_artifact/` | `FAIL_INTEGRITY` |
| `invalid_manifest/` | `FAIL_SCHEMA` |

These fixtures define the **golden truth**.

---

## 9. Verification Algorithm (pseudocode)

```
function verify(package):
    manifest = load_manifest(package)
    if not validate_schema(manifest):
        return FAIL_SCHEMA

    for blob in manifest.artifacts + manifest.evidence:
        if not file_exists(blob.path):
            return FAIL_INTEGRITY (MISSING_FILE)
        if file_size(blob.path) != blob.size_bytes:
            return FAIL_INTEGRITY (SIZE_MISMATCH)
        if sha256(blob.path) != blob.sha256:
            return FAIL_INTEGRITY (DIGEST_MISMATCH)

    package_digest = compute_package_digest(manifest)

    valid_approvals = []
    for approval in load_approvals(package):
        if not validate_schema(approval):
            continue  // skip invalid records
        if approval.package_digest != package_digest:
            continue  // wrong package
        if approval.approver_id not in manifest.policy.approver_keys:
            return FAIL_UNAUTHORIZED
        if not verify_signature(approval):
            return FAIL_SIGNATURE
        if approval.approver_id not in valid_approvals:
            valid_approvals.append(approval.approver_id)

    signatures = load_signatures(package)
    if signatures.length == 0:
        return OK_UNSIGNED

    if valid_approvals.length < manifest.policy.required_approvals:
        return FAIL_THRESHOLD

    for sig in signatures:
        if not validate_schema(sig):
            continue
        if sig.package_digest != package_digest:
            continue
        if sig.signer_id not in manifest.policy.approver_keys:
            return FAIL_UNAUTHORIZED
        if not verify_signature(sig):
            return FAIL_SIGNATURE
        return OK_VERIFIED

    return OK_UNSIGNED
```

---

## 10. Quorum Semantics (v0.1.1)

Multi-signer quorum allows policies to require multiple distinct signers.

### 10.1 What Counts as a Distinct Signer

**Identity key: `key_id`**

- Each signer is identified by their `key_id` (first 16 hex chars of SHA256(public_key))
- Duplicate signatures with the same `key_id` count only once
- The same key signing multiple times does NOT increase quorum count

### 10.2 Purpose Filtering

Signatures and approvals are purpose-tagged:
- `codeteam.approval` — approval attestations
- `codeteam.package_attestation` — final signatures

**Purpose separation prevents cross-protocol replay:**
- Approval signatures cannot satisfy attestation requirements
- Attestation signatures cannot satisfy approval requirements

### 10.3 Policy Evaluation Algorithm

```
function evaluate_policy(policy, package_digest, signatures, approvals):
    for each requirement in policy.requirements:
        candidates = filter_by_purpose(requirement.purpose, signatures, approvals)
        candidates = filter_by_allowlist(candidates, requirement.allow)
        candidates = filter_by_role(candidates, requirement.roles)
        candidates = filter_by_digest(candidates, package_digest)
        candidates = verify_cryptographically(candidates)
        distinct = deduplicate_by(candidates, requirement.distinct_by)

        if distinct.count < requirement.threshold:
            return FAIL (requirement not satisfied)

    return PASS (all requirements satisfied)
```

### 10.4 Allowlist Behavior

- If `allow.key_ids` is specified, only listed keys count
- If `allow.key_ids` is empty/null, all authorized keys count
- Keys not in manifest `policy.approver_keys` are always rejected

### 10.5 Duplicate Handling

- Duplicate `key_id` values are deduplicated before counting
- Only distinct signers count toward threshold
- Tie-breaker: not specified (any valid signature from that key counts)

### 10.6 What Happens When Policy Isn't Met

| Condition | Status | Error Code |
|-----------|--------|------------|
| Signature quorum not met | `OK_UNSIGNED` | `SIGNATURE_QUORUM_NOT_MET` |
| Approval quorum not met | `OK_UNSIGNED` | `APPROVAL_QUORUM_NOT_MET` |
| Key not in allowlist | signature ignored | `SIGNATURE_NOT_ALLOWED` |
| Purpose mismatch | signature ignored | `PURPOSE_MISMATCH` |

**Important:** Policy not met results in `OK_UNSIGNED`, not a failure status.
This preserves the principle that integrity issues are failures, but missing trust is informational.

### 10.7 Backward Compatibility

For packages without explicit verification policy:
- Legacy `required_approvals` + `approver_keys` is converted to equivalent policy
- Zero approvals required → only attestation requirement (threshold 1)
- N approvals required → approval requirement (threshold N) + attestation requirement (threshold 1)

### 10.8 Signature Format Requirements

Two signature formats are supported:

**Legacy Format (v0.1.0)**
- Signable: `"codeteam:signature:v0.1:{package_digest}:{signer_id}"` (UTF-8 bytes)
- Used by: Legacy verification path (non-quorum)
- Storage: `signatures.jsonl` records without `signable` field

**Envelope Format (v0.1.1+)**
- Signable: Canonical JSON of `signable_payload` per `codeteam.signable.schema.v0.1.json`
- Used by: Quorum verification path
- Storage: Signature envelope with `signable` object

**Format Detection Rule (deterministic, no guessing):**
- If artifact contains `signable` object → Envelope format
- If artifact is JSONL record with `type`, `signer_id`, `package_digest` but no `signable` → Legacy format

**Compatibility Contract:**
- Quorum verification counts only envelope signatures toward quorum
- Legacy signatures in quorum mode are ignored with code `LEGACY_SIGNATURE_IGNORED`
- Legacy verification validates only legacy format signatures
- Envelope signatures in legacy mode fail with `SIGNATURE_INVALID`

### 10.9 Quorum Test Fixtures

| Fixture | Expected Status |
|---------|-----------------|
| `two_signatures_threshold_2_pass/` | `OK_VERIFIED` |
| `two_signatures_same_keyid_threshold_2_fail/` | `OK_UNSIGNED` |
| `one_signature_threshold_2_fail/` | `OK_UNSIGNED` |
| `signature_wrong_purpose_ignored/` | `OK_UNSIGNED` |
| `signature_not_in_allowlist/` | `OK_UNSIGNED` |

---

**End of v0.1 verification rules**
