<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

**Verificación de la intención financiera para Windows: una aplicación de escritorio WinUI 3 y un SDK .NET para la certificación y conciliación de blockchain.**

---

## ¿Por qué Attestia?

La mayoría de las herramientas de blockchain auditan las transacciones **después** de que ocurren. Attestia invierte este modelo: verifica la intención **antes** de que llegue a la cadena de bloques.

- **Intenciones financieras tipadas:** declare, apruebe, ejecute y verifique transacciones con registros estructurados en lugar de cargas útiles sin formato.
- **Pruebas criptográficas:** las pruebas de inclusión de árboles de Merkle y los paquetes de certificación proporcionan registros de auditoría a prueba de manipulaciones.
- **Conciliación determinista:** la conciliación de tres vías (intención vs. libro mayor vs. cadena de bloques) detecta discrepancias antes de que se acumulen.
- **Mapeo de cumplimiento:** mapee los controles de certificación a los marcos regulatorios y genere informes de cumplimiento con puntuación.
- **Origen de eventos:** cada cambio de estado es un evento de dominio inmutable y encadenado mediante hash, con un seguimiento completo de la causalidad.
- **Experiencia de usuario centrada en el escritorio:** una aplicación nativa de WinUI 3 le brinda un panel en tiempo real, administración de intenciones, explorador de pruebas y vistas de conciliación sin salir de Windows.

---

## Paquetes NuGet

| Paquete | Objetivo | Descripción |
|---------|--------|-------------|
| **Attestia.Core** | `net9.0` | Modelos de dominio, enumeraciones y tipos compartidos: `Intent`, `MerkleProof`, `ReconciliationReport`, `Money`, `ComplianceFramework`, `DomainEvent`, y más. |
| **Attestia.Client** | `net9.0` | SDK de cliente HTTP con subclientes tipados para Intenciones, Pruebas, Conciliación, Cumplimiento, Eventos, Verificación y Exportación. Incluye lógica de reintento, descifrado de envolventes y soporte para `CancellationToken`. |
| **Attestia.Sidecar** | `net9.0` | Administrador de procesos Node.js: inicia el backend de Attestia, descubre los puertos disponibles, realiza sondeos a `/health`, se reinicia automáticamente en caso de fallo y finaliza el árbol de procesos al finalizar. |

Los tres paquetes están dirigidos a `net9.0` y funcionan de forma independiente de la aplicación de escritorio. Utilícelos en aplicaciones de consola, servicios ASP.NET o en cualquier lugar donde se ejecute .NET 9+.

---

## Comienzo rápido

### Declare y verifique una intención

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

### Concilie la intención con el libro mayor y la cadena de bloques

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

### Administre el componente Node.js

```csharp
using Attestia.Sidecar;

// SidecarConfig is bound from appsettings.json via IOptions<SidecarConfig>
await using var sidecar = new NodeSidecar(options, locator, logger);
await sidecar.StartAsync();

// Sidecar auto-discovers a free port, polls /health every 5 s,
// auto-restarts on crash, and kills the process tree on dispose.
Console.WriteLine($"Backend ready at {sidecar.BaseUrl}");
```

### Verifique una prueba de inclusión de Merkle

```csharp
var package = await client.Proofs.GetAttestationAsync(attestationId);
var result  = await client.Proofs.VerifyProofAsync(package);

Console.WriteLine(result.Valid
    ? $"Proof valid -- root {result.MerkleRoot}"
    : "Proof verification failed");
```

---

## Arquitectura

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

La aplicación de escritorio compone todas las capas, pero cada biblioteca es independiente. `Attestia.Client` funciona en cualquier proyecto .NET 9+: aplicaciones de consola, API de ASP.NET, servicios en segundo plano o marcos de pruebas.

El **Sidecar** administra el backend de Node.js como un proceso secundario. Encuentra un puerto libre, establece `PORT` y `NODE_ENV=production`, realiza sondeos a `/health` y se reinicia automáticamente si el proceso falla. Al usar `DisposeAsync`, finaliza todo el árbol de procesos de forma limpia.

---

## Requisitos previos

| Requisito | Versión | Notas |
|-------------|---------|-------|
| SDK de .NET | 9.0+ | `global.json` fija la versión a 9.0 con actualización de características `latestFeature`. |
| Node.js | 20+ | Requerido para el componente sidecar del backend de Attestia. |
| Windows | 10 1809+ | Mínimo WinUI 3; se recomienda Windows 11. |
| Visual Studio | 2022 17.10+ | Con la carga de trabajo **Windows App SDK** (para la aplicación de escritorio). |

> **Nota:** Los tres paquetes NuGet (`Attestia.Core`, `Attestia.Client`, `Attestia.Sidecar`) están dirigidos a `net9.0` y no requieren Windows. Solo `Attestia.App` está dirigido a `net9.0-windows10.0.22621.0`.

---

## Instalación desde el código fuente

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

### Construcción del paquete MSIX (versión)

```bash
dotnet build src/Attestia.App/Attestia.App.csproj -c Release -p:Platform=x64
```

El resultado se encuentra en `AppPackages/`.

### Empaquetado de Node.js

Coloque el servidor Node.js de Attestia en `assets/node/`:

```text
assets/
  node/
    node.exe            <-- Node.js runtime
    server/
      dist/
        main.js         <-- Attestia backend entry point
```

La compilación copia automáticamente estos archivos en el directorio de salida. Si `assets/node/node.exe` no está presente, el sidecar recurre a `node` en `PATH`.

---

## Estructura del proyecto

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

## Configuración

La aplicación de escritorio lee el archivo `appsettings.json` para obtener la configuración del componente auxiliar (sidecar) y del cliente:

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

| Clave | Valor predeterminado | Descripción |
|-----|---------|-------------|
| `Port` | `0` (automático) | Puerto fijo para el componente auxiliar, o `0` para detectar automáticamente un puerto disponible. |
| `NodePath` | `null` | Ruta explícita a `node.exe`; si no se especifica, se utiliza la versión incluida, y luego la variable de entorno `PATH`. |
| `ServerEntryPoint` | `null` | Ruta explícita a `main.js`; si no se especifica, se utiliza la ubicación incluida. |
| `ApiKey` | `null` | Clave de API opcional, enviada como encabezado `X-Api-Key`. |

---

## Seguridad y alcance de los datos

Attestia Desktop funciona como una **aplicación de escritorio local** con un componente auxiliar (backend) local de Node.js.

- **Datos accedidos:** Lee y escribe declaraciones de intenciones, pruebas de Merkle, informes de conciliación y datos de cumplimiento a través de un componente auxiliar (sidecar) local de Node.js. Almacena la configuración en `appsettings.json`. Los paquetes SDK de NuGet realizan llamadas HTTP a la URL del backend configurada.
- **Datos NO accedidos:** No se recopilan datos de telemetría. No se realizan análisis en la nube. No se recopilan datos de usuario. No se almacenan credenciales. No se realizan escrituras directas en la cadena de bloques.
- **Permisos requeridos:** Acceso a la red para el componente auxiliar local (localhost). Acceso al sistema de archivos para el entorno de ejecución de Node.js incluido y la configuración. Entorno de ejecución del Windows App SDK para la interfaz de usuario de escritorio.

Consulte [SECURITY.md](SECURITY.md) para informar sobre vulnerabilidades.

---

## Evaluación

| Categoría | Puntuación |
|----------|-------|
| Seguridad | 10/10 |
| Manejo de errores | 10/10 |
| Documentación para operadores | 10/10 |
| Higiene en el desarrollo | 10/10 |
| Identidad | 10/10 |
| **Overall** | **50/50** |

---

## Contribuciones

1.  Haga un "fork" del repositorio.
2.  Cree una rama de características (`git checkout -b feat/my-feature`).
3.  Confirme sus cambios.
4.  Abra una solicitud de extracción (pull request) contra la rama `main`.

Asegúrese de que la solución se compile y de que todas las pruebas pasen antes de enviarla.

---

## Soporte

- **Preguntas / ayuda:** [Discusiones](https://github.com/mcp-tool-shop-org/Attestia-Desktop/discussions)
- **Informes de errores:** [Problemas](https://github.com/mcp-tool-shop-org/Attestia-Desktop/issues)

---

## Licencia

[MIT](LICENSE) -- Copyright (c) 2026 Mikey Frilot

---

Desarrollado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

