<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

**Verifica dell'intento finanziario per Windows: un'applicazione desktop WinUI 3 e un SDK .NET per l'attestazione e la riconciliazione della blockchain.**

---

## Perché Attestia?

La maggior parte degli strumenti per la blockchain esegue l'audit delle transazioni **dopo** che si sono verificate. Attestia inverte questo modello: verifica l'intento **prima** che venga registrato sulla blockchain.

- **Intenti finanziari tipizzati** -- dichiara, approva, esegui e verifica le transazioni con record strutturati invece di payload grezzi.
- **Prove crittografiche** -- le prove di inclusione nell'albero di Merkle e i pacchetti di attestazione forniscono tracce di audit a prova di manomissione.
- **Riconciliazione deterministica** -- la corrispondenza a tre vie (intento vs. registro vs. blockchain) rileva le discrepanze prima che si aggravino.
- **Mappatura della conformità** -- associa i controlli di attestazione ai quadri normativi e genera report di conformità con punteggio.
- **Event sourcing** -- ogni modifica di stato è un evento di dominio immutabile e concatenato tramite hash, con un tracciamento completo della causalità.
- **Esperienza utente incentrata sul desktop** -- un'applicazione nativa WinUI 3 offre una dashboard in tempo reale, gestione degli intenti, esplorazione delle prove e viste di riconciliazione, senza dover uscire da Windows.

---

## Pacchetti NuGet

| Pacchetto | Target | Descrizione |
|---------|--------|-------------|
| **Attestia.Core** | `net9.0` | Modelli di dominio, enumerazioni e tipi condivisi -- `Intent`, `MerkleProof`, `ReconciliationReport`, `Money`, `ComplianceFramework`, `DomainEvent` e altro. |
| **Attestia.Client** | `net9.0` | SDK client HTTP con sottoclient tipizzati per Intents, Proofs, Reconciliation, Compliance, Events, Verification e Export. Include logica di retry, disimballaggio dell'inviluppo e supporto per `CancellationToken`. |
| **Attestia.Sidecar** | `net9.0` | Gestore di processi Node.js -- avvia il backend di Attestia, rileva le porte disponibili, interroga `/health`, si riavvia automaticamente in caso di crash e termina l'albero dei processi al termine. |

Tutti e tre i pacchetti sono destinati a `net9.0` e funzionano indipendentemente dall'applicazione desktop. Utilizzali in applicazioni console, servizi ASP.NET o ovunque .NET 9+ sia supportato.

---

## Guida rapida

### Dichiara e verifica un intento

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

### Riconcilia intento vs. registro vs. blockchain

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

### Gestisci il componente sidecar Node.js

```csharp
using Attestia.Sidecar;

// SidecarConfig is bound from appsettings.json via IOptions<SidecarConfig>
await using var sidecar = new NodeSidecar(options, locator, logger);
await sidecar.StartAsync();

// Sidecar auto-discovers a free port, polls /health every 5 s,
// auto-restarts on crash, and kills the process tree on dispose.
Console.WriteLine($"Backend ready at {sidecar.BaseUrl}");
```

### Verifica una prova di inclusione Merkle

```csharp
var package = await client.Proofs.GetAttestationAsync(attestationId);
var result  = await client.Proofs.VerifyProofAsync(package);

Console.WriteLine(result.Valid
    ? $"Proof valid -- root {result.MerkleRoot}"
    : "Proof verification failed");
```

---

## Architettura

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

L'applicazione desktop compone tutti i livelli, ma ogni libreria è autonoma. `Attestia.Client` funziona in qualsiasi progetto .NET 9+ -- applicazioni console, API ASP.NET, servizi in background o test.

Il **Sidecar** gestisce il backend Node.js come processo figlio. Trova una porta libera, imposta `PORT` e `NODE_ENV=production`, interroga `/health` e si riavvia automaticamente se il processo termina. Su `DisposeAsync` termina l'intero albero dei processi in modo pulito.

---

## Prerequisiti

| Requisito | Versione | Note |
|-------------|---------|-------|
| SDK .NET | 9.0+ | `global.json` imposta la versione 9.0 con aggiornamento delle funzionalità più recenti. |
| Node.js | 20+ | Richiesto per il componente sidecar del backend di Attestia. |
| Windows | 10 1809+ | Versione minima WinUI 3; Windows 11 consigliato. |
| Visual Studio | 2022 17.10+ | Con il workload **Windows App SDK** (per l'applicazione desktop). |

> **Nota:** I tre pacchetti NuGet (`Attestia.Core`, `Attestia.Client`, `Attestia.Sidecar`) sono destinati a `net9.0` standard e non richiedono Windows. Solo `Attestia.App` è destinato a `net9.0-windows10.0.22621.0`.

---

## Installazione dal codice sorgente

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

### Compilazione del pacchetto MSIX (Release)

```bash
dotnet build src/Attestia.App/Attestia.App.csproj -c Release -p:Platform=x64
```

L'output viene salvato in `AppPackages/`.

### Bundling di Node.js

Posiziona il server Node.js di Attestia in `assets/node/`:

```text
assets/
  node/
    node.exe            <-- Node.js runtime
    server/
      dist/
        main.js         <-- Attestia backend entry point
```

La compilazione copia automaticamente questi file nella directory di output. Se `assets/node/node.exe` non è presente, il sidecar utilizza `node` presente nel `PATH`.

---

## Struttura del progetto

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

## Configurazione

L'applicazione desktop legge il file `appsettings.json` per le impostazioni del componente aggiuntivo (sidecar) e del client:

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

| Chiave | Valore predefinito | Descrizione |
|-----|---------|-------------|
| `Port` | `0` (automatico) | Porta fissa per il componente aggiuntivo, oppure `0` per rilevare automaticamente una porta libera. |
| `NodePath` | `null` | Percorso esplicito di `node.exe`; in caso contrario, utilizza la versione inclusa, quindi la variabile `PATH`. |
| `ServerEntryPoint` | `null` | Percorso esplicito di `main.js`; in caso contrario, utilizza la posizione inclusa. |
| `ApiKey` | `null` | Chiave API facoltativa, inviata come header `X-Api-Key`. |

---

## Sicurezza e ambito dei dati

Attestia Desktop funziona come un'**applicazione desktop locale** con un backend locale basato su Node.js.

- **Dati accessibili:** Legge e scrive dichiarazioni di intent, prove Merkle, report di riconciliazione e dati di conformità tramite un componente aggiuntivo (sidecar) locale basato su Node.js. Salva la configurazione nel file `appsettings.json`. I pacchetti SDK NuGet effettuano chiamate HTTP solo all'URL del backend configurato.
- **Dati NON accessibili:** Nessuna telemetria. Nessuna analisi nel cloud. Nessuna raccolta di dati utente. Nessun archivio di credenziali. Nessuna scrittura diretta sulla blockchain.
- **Autorizzazioni richieste:** Accesso alla rete per il componente aggiuntivo (sidecar) locale (localhost). Accesso al file system per l'ambiente di runtime Node.js incluso e per la configurazione. Ambiente di runtime di Windows App SDK per l'interfaccia utente desktop.

Consultare il file [SECURITY.md](SECURITY.md) per la segnalazione di vulnerabilità.

---

## Valutazione

| Categoria | Punteggio |
|----------|-------|
| Sicurezza | 10/10 |
| Gestione degli errori | 10/10 |
| Documentazione per gli operatori | 10/10 |
| Pratiche di sviluppo | 10/10 |
| Identità | 10/10 |
| **Overall** | **50/50** |

---

## Contributi

1. Effettuare il fork del repository.
2. Creare un branch per la nuova funzionalità (`git checkout -b feat/my-feature`).
3. Effettuare il commit delle modifiche.
4. Aprire una pull request verso il branch `main`.

Si prega di assicurarsi che la soluzione venga compilata correttamente e che tutti i test superino prima di inviare.

---

## Supporto

- **Domande / assistenza:** [Discussioni](https://github.com/mcp-tool-shop-org/Attestia-Desktop/discussions)
- **Segnalazione di bug:** [Problemi](https://github.com/mcp-tool-shop-org/Attestia-Desktop/issues)

---

## Licenza

[MIT](LICENSE) -- Copyright (c) 2026 Mikey Frilot

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

