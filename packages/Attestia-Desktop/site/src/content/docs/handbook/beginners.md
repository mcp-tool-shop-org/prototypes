---
title: Beginners Guide
description: Step-by-step walkthrough for new users of Attestia Desktop.
sidebar:
  order: 99
---

New to Attestia? This guide walks you through everything from installation to your first verified attestation.

## What is Attestia?

Attestia Desktop is a financial intent verification system. Instead of auditing blockchain transactions after the fact, Attestia lets you declare what you intend to do, approve it, execute it, and then verify the result -- all with cryptographic proofs and a tamper-evident audit trail.

The system has two main parts:

- **Desktop app** -- a native Windows application (WinUI 3) with views for managing intents, proofs, reconciliation, compliance, and events
- **NuGet SDK** -- three .NET 9 packages (`Attestia.Core`, `Attestia.Client`, `Attestia.Sidecar`) that work independently in any .NET project

## Prerequisites

Before you begin, make sure you have:

| Requirement | Version | Why |
|-------------|---------|-----|
| .NET SDK | 9.0 or later | Builds the solution; version pinned in `global.json` |
| Node.js | 20 or later | Runs the Attestia backend sidecar |
| Windows | 10 1809+ (Windows 11 recommended) | Required for the WinUI 3 desktop app |
| Visual Studio | 2022 17.10+ | With the **Windows App SDK** workload installed |

The three NuGet packages target plain `net9.0` and do not require Windows or Visual Studio. They work in console apps, ASP.NET services, or any .NET 9+ environment.

## Installation

### Option A: Build the desktop app from source

```bash
git clone https://github.com/mcp-tool-shop-org/Attestia-Desktop.git
cd Attestia-Desktop
dotnet restore
dotnet build
dotnet test
```

Run the desktop app:

```bash
dotnet run --project src/Attestia.App -c Debug
```

### Option B: Use the NuGet SDK only

If you do not need the desktop UI, add the packages directly:

```bash
dotnet add package Attestia.Core      # Domain models and shared types
dotnet add package Attestia.Client    # HTTP client SDK
dotnet add package Attestia.Sidecar   # Node.js process manager (optional)
```

## Your first intent

This walkthrough uses the `Attestia.Client` SDK. It assumes the Attestia backend is running (either via the desktop app's sidecar or started manually).

### Step 1: Create the client

```csharp
using Attestia.Client;
using Microsoft.Extensions.Logging.Abstractions;

var httpClient = new HttpClient();
var config = new AttestiaClientConfig { BaseUrl = "http://localhost:3100" };
var logger = NullLogger<AttestiaHttpClient>.Instance;
var http = new AttestiaHttpClient(httpClient, config, logger);
var client = new AttestiaClient(http);
```

The `AttestiaClientConfig` requires a `BaseUrl`. Optional settings include `ApiKey`, `Timeout` (default 30 seconds), and `MaxRetries` (default 3, with exponential backoff).

### Step 2: Declare an intent

```csharp
var intent = await client.Intents.DeclareAsync(new DeclareIntentRequest
{
    Id          = Guid.NewGuid().ToString(),
    Kind        = "transfer",
    Description = "Send 500 USDC to operations wallet",
    Params      = new() { ["amount"] = "500", ["currency"] = "USDC" },
});

Console.WriteLine($"Intent declared: {intent.Id} (status: {intent.Status})");
// Status is now: Declared
```

All four fields (`Id`, `Kind`, `Description`, `Params`) are required. The `Kind` field is a free-form string describing the transaction type (e.g., "transfer", "swap", "stake").

### Step 3: Approve and execute

```csharp
// Approve the intent
await client.Intents.ApproveAsync(intent.Id);
// Status is now: Approved

// Record the on-chain execution
await client.Intents.ExecuteAsync(
    intent.Id,
    chainId: "eip155:1",           // CAIP-2 chain identifier
    txHash: "0xabc123...");        // The transaction hash from the chain
// Status is now: Executed
```

If the intent should not proceed, reject it instead:

```csharp
await client.Intents.RejectAsync(intent.Id, reason: "Budget not approved");
// Status is now: Rejected
```

### Step 4: Verify the result

```csharp
await client.Intents.VerifyAsync(intent.Id, matched: true);
// Status is now: Verified

// If discrepancies are found:
// await client.Intents.VerifyAsync(intent.Id, matched: false,
//     discrepancies: ["Amount differs: expected 500, got 499"]);
// Status would be: Failed
```

## Understanding the architecture

Attestia Desktop is organized into five .NET projects:

| Project | Role |
|---------|------|
| `Attestia.Core` | Domain models shared by all layers -- `Intent`, `Money`, `MerkleProof`, `ReconciliationReport`, `DomainEvent`, and more |
| `Attestia.Client` | HTTP client SDK with sub-clients for each API domain (Intents, Proofs, Reconciliation, Compliance, Events, Verify, Export, Public) |
| `Attestia.Sidecar` | Manages the Node.js backend as a child process -- port discovery, health monitoring, auto-restart |
| `Attestia.ViewModels` | MVVM presentation layer using CommunityToolkit.Mvvm |
| `Attestia.App` | WinUI 3 desktop application with pages for each feature |

The desktop app composes all layers via dependency injection configured in `Startup.cs`. When the app starts, the sidecar launches the Node.js backend, the client connects to it, and the view models bind to the UI.

## Key concepts

### Intent statuses

An intent progresses through a defined lifecycle:

```
Declared → Approved → Executing → Executed → Verified
              ↓                                  ↓
          Rejected                            Failed
```

### Merkle proofs

Every attestation is hashed and included in a Merkle tree. You can fetch the current root, retrieve an attestation proof package, and verify that a specific attestation is included in the tree. This provides cryptographic evidence that records have not been tampered with.

### Three-way reconciliation

Reconciliation compares three data sources: your declared intents, your internal ledger entries, and on-chain events. Each pair is matched independently, producing match statuses like `Matched`, `AmountMismatch`, `MissingLedger`, `MissingIntent`, `MissingChain`, or `Unmatched`.

### Event sourcing

Every state change in the system generates an immutable, hash-chained domain event. Events carry metadata including actor identity, causation and correlation IDs, timestamps, and the source subsystem (Vault, Treasury, Registrum, or Observer).

## Common tasks

### List intents with filtering

```csharp
// All intents, paginated
var page = await client.Intents.ListAsync(limit: 20);

// Filter by status
var verified = await client.Intents.ListAsync(status: "verified");

// Use cursor for next page
var next = await client.Intents.ListAsync(cursor: page.Pagination.Cursor);
```

### Verify a Merkle proof

```csharp
var package = await client.Proofs.GetAttestationAsync(attestationId);
var result = await client.Proofs.VerifyProofAsync(package);

Console.WriteLine(result.Valid
    ? $"Valid -- root: {result.MerkleRoot}"
    : "Verification failed");
```

### Run a reconciliation

```csharp
var report = await client.Reconciliation.ReconcileAsync(new ReconcileRequest
{
    Intents       = intents,
    LedgerEntries = ledgerEntries,
    ChainEvents   = chainEvents,
});

if (report.Summary.AllReconciled)
    Console.WriteLine("All records match");
else
    Console.WriteLine($"{report.Summary.MismatchCount} mismatches found");
```

### Export data

```csharp
// Export all events as NDJSON (newline-delimited JSON)
var ndjson = await client.Export.ExportEventsNdjsonAsync();

// Export full system state
var state = await client.Export.ExportStateAsync();
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Unable to reach the attestation engine" | The Node.js sidecar is not running. If using the desktop app, check the Dashboard for sidecar status. If using the SDK directly, start the sidecar or ensure the backend is reachable at the configured `BaseUrl`. |
| "Sidecar process exited during startup" | Node.js may not be installed or the server bundle is missing. Ensure Node.js 20+ is on your PATH or bundled in `assets/node/`. |
| "Sidecar did not become ready within 30s" | The backend is taking too long to start. Check for port conflicts or increase `StartupTimeout` in `appsettings.json`. |
| Build fails with Windows App SDK errors | Install the Windows App SDK workload in Visual Studio: Tools > Get Tools and Features > Windows App SDK. The NuGet packages themselves do not require this. |
| API returns `AttestiaException` | The error includes a `Code`, `Message`, and `StatusCode`. Common codes: `INTENT_NOT_FOUND`, `INVALID_STATE_TRANSITION`, `VALIDATION_ERROR`. |

## Next steps

- **[Intent Lifecycle](/Attestia-Desktop/handbook/intents/)** -- deep dive into all seven intent statuses and validation rules
- **[Proofs & Reconciliation](/Attestia-Desktop/handbook/proofs/)** -- Merkle trees, three-way matching, attestation records, and compliance
- **[Architecture](/Attestia-Desktop/handbook/architecture/)** -- layer diagram, sub-client reference, sidecar internals
- **[Reference](/Attestia-Desktop/handbook/reference/)** -- full configuration tables, desktop views, security scope
