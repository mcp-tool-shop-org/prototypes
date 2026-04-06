---
title: Proofs & Reconciliation
description: Merkle proofs and three-way matching.
sidebar:
  order: 3
---

## Merkle proofs

Attestia generates Merkle-tree inclusion proofs for attestation packages. Each proof provides a tamper-evident path from a leaf (your attestation) to the tree root.

```csharp
// Get the current Merkle root and leaf count
var rootInfo = await client.Proofs.MerkleRootAsync();
Console.WriteLine($"Root: {rootInfo.Root}, Leaves: {rootInfo.LeafCount}");

// Fetch an attestation proof package and verify it
var package = await client.Proofs.GetAttestationAsync(attestationId);
var result = await client.Proofs.VerifyProofAsync(package);

Console.WriteLine(result.Valid
    ? $"Proof valid — root {result.MerkleRoot}"
    : "Proof verification failed");
```

An `AttestationProofPackage` contains the attestation data, its hash, the Merkle root, the inclusion proof (leaf hash, leaf index, sibling steps), and a package hash for integrity.

## Three-way reconciliation

The reconciliation engine performs deterministic three-way matching across three pairs:

1. **Intent vs. Ledger** — does the ledger entry match what was declared?
2. **Ledger vs. Chain** — does the on-chain result match the ledger?
3. **Intent vs. Chain** — does the on-chain result match the original intent?

```csharp
var report = await client.Reconciliation.ReconcileAsync(new ReconcileRequest
{
    Intents = intents,
    LedgerEntries = ledgerEntries,
    ChainEvents = chainEvents,
});

// Check the summary
Console.WriteLine(report.Summary.AllReconciled
    ? "All matched"
    : $"{report.Summary.MismatchCount} mismatches, {report.Summary.MissingCount} missing");
```

Each match is classified with a `MatchStatus`: `Matched`, `AmountMismatch`, `MissingLedger`, `MissingIntent`, `MissingChain`, or `Unmatched`. The report includes separate lists for `IntentLedgerMatches`, `LedgerChainMatches`, and `IntentChainMatches`.

You can scope reconciliation by time range, intent ID, chain ID, or correlation ID using `ReconciliationScope`.

## Attestation records

After reconciliation, create a signed attestation record:

```csharp
var attestation = await client.Reconciliation.AttestAsync(reconcileRequest);
// attestation.ReportHash links back to the reconciliation report
```

Attestation records are paginated and queryable via `ListAttestationsAsync`.

## Compliance mapping

Map attestation controls to regulatory frameworks and generate scored compliance reports. Each control mapping tracks its status (`Implemented`, `Partial`, `Planned`, `NotApplicable`) along with evidence types and notes.

```csharp
// List available frameworks
var frameworks = await client.Compliance.ListFrameworksAsync();

// Generate a scored report for a framework
var report = await client.Compliance.GetReportAsync(frameworkId);
Console.WriteLine($"Score: {report.Score:P0} ({report.PassedControls}/{report.TotalControls})");
```

The desktop app provides a dedicated Compliance view for framework management and report generation.
