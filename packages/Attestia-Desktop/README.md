<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Attestia-Desktop/readme.png" alt="Attestia Desktop" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/Attestia-Desktop/actions/workflows/publish.yml"><img src="https://github.com/mcp-tool-shop-org/Attestia-Desktop/actions/workflows/publish.yml/badge.svg" alt="CI"></a>
  <a href="https://www.nuget.org/packages/Attestia.Core"><img src="https://img.shields.io/nuget/v/Attestia.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/Attestia-Desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Financial intent verification for Windows -- a WinUI 3 desktop app and .NET SDK for blockchain attestation and reconciliation.**

---

## Why Attestia?

Most blockchain tooling audits transactions **after** they happen. Attestia flips the model: verify intent **before** it hits the chain.

- **Typed financial intents** -- declare, approve, execute, and verify transactions with structured records instead of raw payloads
- **Cryptographic proofs** -- Merkle-tree inclusion proofs and attestation packages provide tamper-evident audit trails
- **Deterministic reconciliation** -- three-way matching (intent vs. ledger vs. chain) catches discrepancies before they compound
- **Compliance mapping** -- map attestation controls to regulatory frameworks and generate scored compliance reports
- **Event sourcing** -- every state change is an immutable, hash-chained domain event with full causation tracking
- **Desktop-first UX** -- a native WinUI 3 app gives you a real-time dashboard, intent management, proof explorer, and reconciliation views without leaving Windows

---

## NuGet Packages

| Package | Target | Description |
|---------|--------|-------------|
| **Attestia.Core** | `net9.0` | Domain models, enums, and shared types -- `Intent`, `MerkleProof`, `ReconciliationReport`, `Money`, `ComplianceFramework`, `DomainEvent`, and more |
| **Attestia.Client** | `net9.0` | HTTP client SDK with typed sub-clients for Intents, Proofs, Reconciliation, Compliance, Events, Verify, Export, and Public. Retry logic, envelope unwrapping, and `CancellationToken` support built in |
| **Attestia.Sidecar** | `net9.0` | Node.js process manager -- spawns the Attestia backend, discovers available ports, polls `/health`, auto-restarts on crash, and tears down the process tree on dispose |

All three packages target `net9.0` and work independently of the desktop app. Use them in console apps, ASP.NET services, or anywhere .NET 9+ runs.

---

## Quick Start

### Declare and verify an intent

```csharp
using Attestia.Client;

var config = new AttestiaClientConfig { BaseUrl = "http://localhost:3100" };
var http   = new AttestiaHttpClient(httpClient, config, logger);
var client = new AttestiaClient(http);

// Declare a financial intent
var intent = await client.Intents.DeclareAsync(new DeclareIntentRequest
{
    Id          = Guid.NewGuid().ToString(),
    Kind        = "transfer",
    Description = "Send 1,000 USDC to treasury",
    Params      = new() { ["amount"] = "1000", ["currency"] = "USDC" },
});

// Approve, execute on-chain, then verify
await client.Intents.ApproveAsync(intent.Id);
await client.Intents.ExecuteAsync(intent.Id, chainId: "eip155:1", txHash: "0xabc...");
await client.Intents.VerifyAsync(intent.Id, matched: true);
```

### Reconcile intent vs. ledger vs. chain

```csharp
var report = await client.Reconciliation.ReconcileAsync(new ReconcileRequest
{
    Intents       = intents,
    LedgerEntries = ledgerEntries,
    ChainEvents   = chainEvents,
});

Console.WriteLine(report.Summary.AllReconciled
    ? "All matched"
    : $"{report.Summary.MismatchCount} mismatches found");
```

### Manage the Node.js sidecar

```csharp
using Attestia.Sidecar;

// SidecarConfig is bound from appsettings.json via IOptions<SidecarConfig>
await using var sidecar = new NodeSidecar(options, locator, logger);
await sidecar.StartAsync();

// Sidecar auto-discovers a free port, polls /health every 5 s,
// auto-restarts on crash, and kills the process tree on dispose.
Console.WriteLine($"Backend ready at {sidecar.BaseUrl}");
```

### Verify a Merkle inclusion proof

```csharp
var package = await client.Proofs.GetAttestationAsync(attestationId);
var result  = await client.Proofs.VerifyProofAsync(package);

Console.WriteLine(result.Valid
    ? $"Proof valid -- root {result.MerkleRoot}"
    : "Proof verification failed");
```

---

## Architecture

```text
+---------------------------------------------------------+
|  Attestia.App  (WinUI 3)                               |
|  Dashboard - Intents - Proofs - Reconciliation          |
|  Compliance - Events - Settings                         |
+---------------------------------------------------------+
|  Attestia.ViewModels  (CommunityToolkit.Mvvm)           |
+----------------------------+----------------------------+
|  Attestia.Client           |  Attestia.Sidecar          |
|  HTTP SDK                  |  Node.js process manager   |
|  Typed sub-clients         |  Health checks, auto-restart|
|  Retry + envelope          |  Port discovery, teardown  |
+----------------------------+----------------------------+
|  Attestia.Core                                          |
|  Domain models - Enums - Shared types                   |
+---------------------------------------------------------+
         |                          |
         v                          v
   Attestia Node.js            Blockchain
   backend (sidecar)           (EVM, etc.)
```

The desktop app composes all layers, but each library stands on its own. `Attestia.Client` works in any .NET 9+ project -- console apps, ASP.NET APIs, background services, or test harnesses.

The **Sidecar** manages the Node.js backend as a child process. It finds a free port, sets `PORT` and `NODE_ENV=production`, polls `/health`, and auto-restarts if the process dies. On `DisposeAsync` it kills the entire process tree cleanly.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| .NET SDK | 9.0+ | `global.json` pins to 9.0 with `latestFeature` roll-forward |
| Node.js | 20+ | Required for the Attestia backend sidecar |
| Windows | 10 1809+ | WinUI 3 minimum; Windows 11 recommended |
| Visual Studio | 2022 17.10+ | With the **Windows App SDK** workload (for the desktop app) |

> **Note:** The three NuGet packages (`Attestia.Core`, `Attestia.Client`, `Attestia.Sidecar`) target plain `net9.0` and do not require Windows. Only `Attestia.App` targets `net9.0-windows10.0.22621.0`.

---

## Installation from Source

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/Attestia-Desktop.git
cd Attestia-Desktop

# Restore and build (libraries)
dotnet restore
dotnet build

# Run tests
dotnet test

# Run the desktop app (requires x64 + Windows App SDK workload)
dotnet run --project src/Attestia.App -c Debug
```

### Building the MSIX package (Release)

```bash
dotnet build src/Attestia.App/Attestia.App.csproj -c Release -p:Platform=x64
```

Output lands in `AppPackages/`.

### Bundling Node.js

Place the Attestia Node.js server in `assets/node/`:

```text
assets/
  node/
    node.exe            <-- Node.js runtime
    server/
      dist/
        main.js         <-- Attestia backend entry point
```

The build copies these into the output directory automatically. If `assets/node/node.exe` is not present, the sidecar falls back to `node` on `PATH`.

---

## Project Structure

```text
Attestia-Desktop/
|-- src/
|   |-- Attestia.Core/           # Domain models and shared types (NuGet)
|   |   +-- Models/
|   |       |-- Intent.cs        # IntentStatus, Intent, IntentDeclaration, IntentApproval
|   |       |-- Proof.cs         # MerkleProof, MerkleProofStep, AttestationProofPackage
|   |       |-- Reconciliation.cs# ReconciliationReport, MatchStatus, AttestationRecord
|   |       |-- Financial.cs     # Money, AccountRef, LedgerEntry
|   |       |-- Compliance.cs    # ComplianceFramework, ControlMapping, ComplianceReport
|   |       |-- Chain.cs         # ChainRef, BlockRef, TokenRef, OnChainEvent
|   |       |-- Event.cs         # DomainEvent, StoredEvent, EventMetadata
|   |       |-- Verification.cs  # VerificationResult, ReplayResult, ConsensusResult
|   |       +-- Api.cs           # AttestiaResponse<T>, PaginatedList<T>, AttestiaException
|   |
|   |-- Attestia.Client/         # HTTP client SDK (NuGet)
|   |   |-- AttestiaClient.cs    # Facade composing all sub-clients
|   |   |-- AttestiaHttpClient.cs# HTTP transport with retry, envelope unwrapping
|   |   |-- IntentsClient.cs     # Declare, approve, reject, execute, verify
|   |   |-- ProofsClient.cs      # Merkle root, attestation packages, proof verification
|   |   |-- ReconciliationClient.cs # Reconcile, attest, list attestations
|   |   |-- ComplianceClient.cs  # Frameworks, compliance reports
|   |   |-- EventsClient.cs     # Event streams, pagination
|   |   |-- VerifyClient.cs     # State hash, replay verification
|   |   |-- ExportClient.cs     # NDJSON events export, state export
|   |   +-- PublicClient.cs     # Public verification endpoints, consensus
|   |
|   |-- Attestia.Sidecar/        # Node.js process manager (NuGet)
|   |   |-- NodeSidecar.cs       # Lifecycle: start, health check, auto-restart, stop
|   |   |-- SidecarConfig.cs     # Port, timeouts, auto-restart toggle
|   |   +-- NodeBundleLocator.cs # Finds node.exe and server entry point
|   |
|   |-- Attestia.ViewModels/     # MVVM presentation layer
|   |   |-- DashboardViewModel.cs
|   |   |-- IntentsViewModel.cs
|   |   |-- ReconciliationViewModel.cs
|   |   +-- ...
|   |
|   +-- Attestia.App/            # WinUI 3 desktop application
|       |-- Pages/               # Dashboard, Intents, Proofs, Reconciliation, ...
|       |-- Themes/              # AttestiaTheme.xaml
|       +-- Startup.cs           # DI composition root
|
|-- assets/node/                  # Bundled Node.js runtime (gitkeep)
|-- scripts/
|   |-- build-governed.ps1        # Governed build script
|   +-- bundle-node.ps1           # Node.js bundling script
|-- .github/workflows/
|   +-- publish.yml               # NuGet publish on release
|-- Attestia.Desktop.sln
|-- Directory.Build.props         # Shared MSBuild properties
|-- Directory.Packages.props      # Central package management
|-- global.json                   # .NET SDK version pin
|-- CHANGELOG.md
|-- llms.txt                      # AI agent context
+-- LICENSE                       # MIT
```

---

## Configuration

The desktop app reads `appsettings.json` for sidecar and client settings:

```json
{
  "Attestia": {
    "Port": 0,
    "NodePath": null,
    "ServerEntryPoint": null,
    "ApiKey": null
  }
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `Port` | `0` (auto) | Fixed port for the sidecar, or `0` to auto-discover a free port |
| `NodePath` | `null` | Explicit path to `node.exe`; falls back to bundled, then `PATH` |
| `ServerEntryPoint` | `null` | Explicit path to `main.js`; falls back to bundled location |
| `ApiKey` | `null` | Optional API key sent as `X-Api-Key` header |

---

## Security & Data Scope

Attestia Desktop operates as a **local desktop application** with a local Node.js sidecar backend.

- **Data accessed:** Reads and writes intent declarations, Merkle proofs, reconciliation reports, and compliance data via a local Node.js sidecar. Stores configuration in `appsettings.json`. NuGet SDK packages make HTTP calls to the configured backend URL only.
- **Data NOT accessed:** No telemetry. No cloud analytics. No user data collection. No credential storage. No direct blockchain writes.
- **Permissions required:** Network access to local sidecar (localhost). File system access for bundled Node.js runtime and configuration. Windows App SDK runtime for the desktop UI.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## Scorecard

| Category | Score |
|----------|-------|
| Security | 10/10 |
| Error Handling | 10/10 |
| Operator Docs | 10/10 |
| Shipping Hygiene | 10/10 |
| Identity | 10/10 |
| **Overall** | **50/50** |

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Open a pull request against `main`

Please ensure the solution builds and all tests pass before submitting.

---

## Support

- **Questions / help:** [Discussions](https://github.com/mcp-tool-shop-org/Attestia-Desktop/discussions)
- **Bug reports:** [Issues](https://github.com/mcp-tool-shop-org/Attestia-Desktop/issues)

---

## License

[MIT](LICENSE) -- Copyright (c) 2026 Mikey Frilot

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

