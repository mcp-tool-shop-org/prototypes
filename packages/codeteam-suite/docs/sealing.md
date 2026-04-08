# CodeTeam Sealing — Design Document v0.1

## Status

**Informative — Not Normative for v0.1.0**

Sealing is an optional feature that MAY be implemented in future versions.

---

## 1. Overview

Sealing provides an additional layer of integrity verification by creating a tamper-evident seal over the entire package state. Unlike signatures (which attest to approval), seals attest to a specific point-in-time snapshot.

---

## 2. Seal Purpose

Seals serve different purposes than signatures:

| Concern | Signature | Seal |
|---------|-----------|------|
| Attests to | Approval decision | Package state |
| Covers | Package digest | All package contents |
| Timing | After approval threshold | After signing |
| Revocable | No | No |
| Required for OK_VERIFIED | Yes | No |

---

## 3. Seal Record Schema

```json
{
  "type": "seal",
  "package_digest": "sha256:...",
  "manifest_digest": "sha256:...",
  "approvals_digest": "sha256:...",
  "signatures_digest": "sha256:...",
  "sealed_at": "2025-01-30T14:00:00Z",
  "sealer_id": "0000000000000003",
  "signature": "base64..."
}
```

---

## 4. Seal Verification Rules

### 4.1 Seal Verification is OPTIONAL

- Seal verification MUST NOT affect package validity
- A package without a seal is still valid if it passes normal verification
- Seal failures MUST NOT downgrade `OK_VERIFIED`

### 4.2 Seal Verification Process

If seal verification is performed:

1. Verify seal record schema
2. Verify seal signature cryptographically
3. Verify sealer is authorized
4. Verify each digest component matches current state

### 4.3 Seal Verification Outcomes

| Outcome | Meaning |
|---------|---------|
| SEAL_VALID | All seal digests match current state |
| SEAL_STALE | Package modified since sealing |
| SEAL_INVALID | Seal signature verification failed |
| SEAL_MISSING | No seal present (not an error) |

---

## 5. Sealing Workflow

```
1. Package created
2. Approvals collected
3. Final signature applied
4. (Optional) Seal created
5. Package distributed
```

---

## 6. Use Cases

### 6.1 Audit Trail

Seals provide an additional timestamp for auditing:
- "This package was in this exact state at this time"

### 6.2 Distribution Verification

Recipients can verify the package hasn't been modified during distribution:
- Download package
- Verify seal matches
- Confirms bit-for-bit integrity

### 6.3 Archival

Long-term storage systems can use seals to detect bit-rot:
- Store package with seal
- Periodically verify seal
- Detect any corruption

---

## 7. Non-Goals

Sealing does NOT provide:

- Replacement for signatures
- Additional approval requirements
- Revocation capability
- Time-stamping authority integration (v0.1)

---

## 8. Future Considerations

### 8.1 Timestamping Authority (TSA)

Future versions MAY integrate with RFC 3161 TSAs:
- Provides third-party timestamp attestation
- Enables non-repudiation of sealing time

### 8.2 Multiple Seals

Future versions MAY support multiple seals:
- Different sealers for different purposes
- Re-sealing after distribution

---

## 9. Implementation Notes

### 9.1 CLI Command

```bash
codeteam seal <package-path> --key <key-id> --json
```

### 9.2 Verification Interaction

When `codeteam verify` encounters a seal:
- Report seal status in output
- Do not fail verification based on seal
- Include seal information in summary

```json
{
  "status": "OK_VERIFIED",
  "seal": {
    "present": true,
    "valid": true,
    "sealed_at": "2025-01-30T14:00:00Z",
    "sealer_id": "0000000000000003"
  }
}
```

---

**End of Sealing Design Document v0.1**
