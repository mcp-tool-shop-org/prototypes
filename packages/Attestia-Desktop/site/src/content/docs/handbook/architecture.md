---
title: Architecture
description: Layers, sidecar, and NuGet packages.
sidebar:
  order: 4
---

## Layer diagram

```
Attestia.App (WinUI 3)
  Dashboard - Intents - Proofs - Reconciliation
  Compliance - Events - Settings
Attestia.ViewModels (CommunityToolkit.Mvvm)
Attestia.Client          |  Attestia.Sidecar
  HTTP SDK               |  Node.js process manager
Attestia.Core
  Domain models - Enums - Shared types
```

## NuGet packages

| Package | Description |
|---------|-------------|
| Attestia.Core | Domain models — Intent, MerkleProof, ReconciliationReport, Money, ComplianceFramework, DomainEvent, and more |
| Attestia.Client | HTTP client SDK with eight typed sub-clients: Intents, Proofs, Reconciliation, Compliance, Events, Verify, Export, and Public |
| Attestia.Sidecar | Node.js process manager — port discovery, health polling, auto-restart, clean teardown |

## Client sub-clients

The `AttestiaClient` facade exposes eight sub-clients:

| Sub-client | Purpose |
|------------|---------|
| `Intents` | Declare, approve, reject, execute, verify intents; list and get by ID |
| `Proofs` | Merkle root info, attestation proof packages, proof verification |
| `Reconciliation` | Three-way reconciliation, attestation records |
| `Compliance` | Framework listing, scored compliance reports |
| `Events` | Global event stream and per-stream event queries (paginated) |
| `Verify` | Global state hash computation and replay verification |
| `Export` | NDJSON event export and full state export |
| `Public` | Public verification endpoints — state bundles, verifier reports, consensus, public proof verification, compliance summaries |

All HTTP calls use envelope-based responses (`AttestiaResponse<T>`), automatic retry with exponential backoff on 5xx errors, and `CancellationToken` support.

## ViewModels

ViewModels inherit from `ViewModelBase`, which provides:

- `IsBusy` / `ErrorMessage` / `IsEngineOffline` observable properties
- `RunBusyAsync` wrapper that catches exceptions and sets human-readable error messages
- Automatic detection of connection failures (sets `IsEngineOffline` for UI indicators)

## Sidecar

The Sidecar manages the Node.js backend as a child process:

- Finds a free port automatically (or uses a configured fixed port)
- Sets `PORT` and `NODE_ENV=production` environment variables
- Polls `/health` at a configurable interval (default 5 seconds)
- Auto-restarts if the process dies (configurable via `AutoRestart`)
- Kills the entire process tree on dispose
- Emits `StatusChanged` events: `Stopped`, `Starting`, `Running`, `Degraded`, `Crashed`, `Stopping`, `Error`

```csharp
await using var sidecar = new NodeSidecar(options, locator, logger);
await sidecar.StartAsync();
Console.WriteLine($"Backend ready at {sidecar.BaseUrl}");
```

The `NodeBundleLocator` searches for `node.exe` in three locations: a configured path, the bundled `assets/node/` directory, then the system `PATH`.
