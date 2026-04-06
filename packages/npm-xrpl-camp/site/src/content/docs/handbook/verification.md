---
title: Verification
description: Certificate verification and XRPL receipts.
sidebar:
  order: 3
---

XRPL Camp produces verifiable artifacts at every step. This page explains how verification works and what makes your certificate trustworthy.

## SHA256 binary verification

Before the training even starts, security is enforced. The npm launcher:

1. Downloads the platform-specific binary from GitHub Releases
2. Computes the SHA256 hash of the downloaded file
3. Compares it against the expected checksum
4. Refuses to execute if there is any mismatch

This ensures you are running the exact binary that was published -- no tampering, no substitution.

## Transaction receipts

Every operation you perform during training produces a transaction on the XRPL Testnet. These transactions are:

- **Immutable** -- once validated, they cannot be altered or deleted
- **Publicly auditable** -- anyone can look up the transaction hash on a Testnet explorer
- **Timestamped** -- the ledger records when the transaction was validated

Your payment transaction hash is your receipt. You can verify it independently using any XRPL Testnet explorer or by querying the ledger directly.

## Certificate of completion

When you complete all training modules, XRPL Camp generates a certificate that references your transaction history on the Testnet. The certificate proves:

- You created a wallet and funded it
- You sent a real XRP payment
- You verified the transaction on-ledger
- You completed the full training sequence

## Verifying someone else's certificate

If someone shares their XRPL Camp certificate with you, you can verify it by:

1. Checking the transaction hashes against the XRPL Testnet
2. Confirming the transactions match the certificate claims
3. Verifying the ledger timestamps fall within a plausible training window

The XRP Ledger is the source of truth -- not the certificate file itself.

## No telemetry

XRPL Camp does not phone home. The only network access is:

- **First run**: downloading the binary from GitHub Releases
- **During training**: communicating with the XRPL Testnet (faucet, transaction submission, verification)

No analytics, no tracking, no third-party services.
