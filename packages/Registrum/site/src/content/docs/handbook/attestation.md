---
title: External Attestation
description: Optional cryptographic attestation via XRPL — how Registrum witnesses decisions on an immutable ledger without affecting internal authority.
sidebar:
  order: 5
---

Registrum can optionally emit cryptographic attestations to an external immutable ledger for public witnessing. This page explains what attestation does, how it works, and the sharp boundary between internal authority and external witnessing.

## What attestation is

Attestation is an optional feature that records Registrum's structural decisions on an external immutable ledger — specifically, the XRP Ledger (XRPL). When enabled, each accepted state transition can produce a cryptographic receipt that is written to the ledger.

These receipts serve as independent, tamper-proof evidence that a specific structural decision was made at a specific point in time.

## What attestation is not

Attestation is **non-authoritative.** It does not influence Registrum's behavior in any way:

| Property | Value |
|----------|-------|
| **Default state** | Disabled |
| **Authority** | Non-authoritative (witness only) |
| **Effect on registration behavior** | None |

This distinction is fundamental to Registrum's architecture:

- **Attestation records *that* Registrum decided.** The ledger receipt says "a transition was accepted at this time with this hash."
- **Registrum decides *what* is valid.** The 11 invariants, the dual-witness engines, and the fail-closed behavior are entirely internal. The ledger has no say in whether a transition passes or fails.

## Authority flows inward, witness flows outward

This is the key architectural principle for attestation:

**Inward flow (authority):** The `StructuralRegistrar` is the sole authority on structural validity. Its decisions are based on the 11 invariants evaluated by two independent witness engines. No external system — including the ledger — can override, modify, or influence a registration verdict.

**Outward flow (witness):** After a verdict is reached internally, the result may optionally be emitted to an external ledger. This is a one-way, append-only operation. The ledger receives evidence; it does not provide instructions.

If the ledger is unavailable, Registrum continues to function normally. Attestation is additive witnessing, not a dependency.

## Why XRPL?

The choice of XRPL as the attestation target is documented in detail in the repository (`docs/WHY_XRPL.md`). The key properties that make it suitable:

- **Immutability** — Once a transaction is validated, it cannot be altered or removed
- **Public verifiability** — Any party with the transaction hash can independently verify the receipt
- **Low cost** — XRPL transactions cost fractions of a cent, making per-transition attestation economically viable
- **Settlement finality** — Transactions are final in 3-5 seconds with no possibility of reversal
- **No smart contract complexity** — Attestation uses simple memo fields on payment transactions, avoiding the attack surface of smart contract platforms

## How attestation works

When attestation is enabled:

1. A state transition is registered through the normal path (both witness engines evaluate it)
2. If the transition is **accepted**, a cryptographic hash of the registration result is computed
3. The hash is emitted as a memo on an XRPL transaction
4. The transaction hash serves as the attestation receipt

The receipt proves:
- That a specific structural decision was made
- The exact content of that decision (via the hash)
- The time at which it was recorded (via the ledger timestamp)
- That the receipt has not been tampered with (via ledger immutability)

## Verification

Any party with a Registrum snapshot and an attestation receipt can independently verify the chain:

1. Replay the snapshot to reproduce the structural decision
2. Compute the hash of the registration result
3. Compare it to the hash recorded on the ledger
4. Verify the ledger transaction is valid and finalized

If all four steps succeed, the party has independently confirmed that the structural decision was made as claimed, at the time claimed, with the content claimed.

## When to use attestation

Attestation is most valuable when:

- **Third-party auditability** is required — external parties need to verify structural decisions without trusting the operator
- **Temporal proof** matters — you need to prove that a decision was made before or after a specific point in time
- **Tamper evidence** is desired — you want an independent record that cannot be altered by any party, including the system operator

For systems where internal replay and snapshot verification are sufficient, attestation adds cost and complexity without proportional benefit. It is disabled by default for this reason.

## Further reading

- **Rationale** (`docs/WHY_XRPL.md`) — Full explanation of why XRPL was chosen
- **Specification** (`docs/ATTESTATION_SPEC.md`) — Technical specification for the attestation protocol
