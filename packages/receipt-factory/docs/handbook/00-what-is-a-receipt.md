# What is a Receipt?

A receipt is a signed, timestamped, reproducible record of **what happened**.

Think of it like this: when you buy something at a store, you get a receipt. It proves what you bought, when, and from whom. You can go back and verify it. You can show it to someone else. You can use it for a return.

Software receipts work the same way:

- **What was done** — actions, inputs, outputs
- **Why it was done** — intent, policy, context
- **Who/what did it** — actor, runner, tool versions
- **Proof it happened** — hashes, links, checksums
- **How to verify it** — commands, re-run instructions

## Two layers

Every receipt has two layers:

1. **Front page (human):** A summary you can read in 30 seconds. Intent, results, links, verification steps, and crucially: what this receipt does NOT prove.

2. **Back matter (technical):** Canonical JSON, content-addressed hashes, environment details, and full evidence index. Machine-parseable, deterministic, tamper-evident.

## Content addressing

Every receipt has an `id` that's the SHA-256 hash of its canonical JSON representation. Change one byte of the receipt, and the hash changes. This makes receipts tamper-evident without requiring a central authority.

## References

Receipts can reference other receipts and evidence packs by hash. A release receipt can cite the CI receipt that proved tests passed. A delivery receipt can cite the release receipt that produced the artifacts. This forms a verifiable provenance graph — each link is content-addressed and independently verifiable.

## What receipts are NOT

- **Not a guarantee of quality.** A receipt proves a CI run happened. It doesn't prove the code is correct.
- **Not a security boundary.** A receipt can't prove that the CI runner itself wasn't compromised.
- **Not immutable by default.** Without signing (cosign, sigstore), a receipt is tamper-*evident* but not tamper-*proof*.

## Receipt kinds

| Kind | What it documents |
|------|-------------------|
| `ci_run` | A CI build/test workflow run |
| `release` | A release with changelog, artifacts, provenance |
| `registry_sync` | Package registry drift detection |
| `audit` | Security scans and dependency audits |
| `delivery` | Handoff of deliverables to a recipient |
