<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
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

**Verificação de intenções financeiras para Windows: um aplicativo de área de trabalho WinUI 3 e um SDK .NET para atestação e reconciliação em blockchain.**

---

## Por que Attestia?

A maioria das ferramentas de blockchain audita as transações **depois** que elas ocorrem. A Attestia inverte esse modelo: verifique a intenção **antes** que ela seja registrada na cadeia de blocos.

- **Intenções financeiras tipadas** -- declare, aprove, execute e verifique transações com registros estruturados em vez de payloads brutos.
- **Provas criptográficas** -- as provas de inclusão em árvores de Merkle e os pacotes de atestação fornecem trilhas de auditoria à prova de adulteração.
- **Reconciliação determinística** -- a comparação tripla (intenção vs. livro-razão vs. cadeia de blocos) detecta discrepâncias antes que elas se acumulem.
- **Mapeamento de conformidade** -- mapeie os controles de atestação para estruturas regulatórias e gere relatórios de conformidade com pontuação.
- **Event sourcing** -- cada alteração de estado é um evento de domínio imutável e encadeado por hash, com rastreamento completo da causalidade.
- **Experiência de usuário focada em desktop** -- um aplicativo nativo WinUI 3 oferece um painel em tempo real, gerenciamento de intenções, explorador de provas e visualizações de reconciliação, sem sair do Windows.

---

## Pacotes NuGet

| Pacote | Destino | Descrição |
|---------|--------|-------------|
| **Attestia.Core** | `net9.0` | Modelos de domínio, enumerações e tipos compartilhados -- `Intent`, `MerkleProof`, `ReconciliationReport`, `Money`, `ComplianceFramework`, `DomainEvent` e muito mais. |
| **Attestia.Client** | `net9.0` | SDK de cliente HTTP com subclientes tipados para Intenções, Provas, Reconciliação, Conformidade, Eventos, Verificação e Exportação. Lógica de repetição, descompactação de envelopes e suporte a `CancellationToken` integrados. |
| **Attestia.Sidecar** | `net9.0` | Gerenciador de processos Node.js -- inicia o backend da Attestia, descobre portas disponíveis, verifica `/health`, reinicia automaticamente em caso de falha e encerra a árvore de processos ao ser descartado. |

Todos os três pacotes são destinados a `net9.0` e funcionam independentemente do aplicativo de área de trabalho. Use-os em aplicativos de console, serviços ASP.NET ou em qualquer lugar onde o .NET 9+ seja executado.

---

## Primeiros Passos

### Declare e verifique uma intenção

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

### Reconcilie a intenção em relação ao livro-razão e à cadeia de blocos

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

### Gerencie o componente Node.js

```csharp
using Attestia.Sidecar;

// SidecarConfig is bound from appsettings.json via IOptions<SidecarConfig>
await using var sidecar = new NodeSidecar(options, locator, logger);
await sidecar.StartAsync();

// Sidecar auto-discovers a free port, polls /health every 5 s,
// auto-restarts on crash, and kills the process tree on dispose.
Console.WriteLine($"Backend ready at {sidecar.BaseUrl}");
```

### Verifique uma prova de inclusão de Merkle

```csharp
var package = await client.Proofs.GetAttestationAsync(attestationId);
var result  = await client.Proofs.VerifyProofAsync(package);

Console.WriteLine(result.Valid
    ? $"Proof valid -- root {result.MerkleRoot}"
    : "Proof verification failed");
```

---

## Arquitetura

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

O aplicativo de área de trabalho compõe todas as camadas, mas cada biblioteca é independente. `Attestia.Client` funciona em qualquer projeto .NET 9+ -- aplicativos de console, APIs ASP.NET, serviços em segundo plano ou estruturas de teste.

O **Sidecar** gerencia o backend Node.js como um processo filho. Ele encontra uma porta livre, define `PORT` e `NODE_ENV=production`, verifica `/health` e reinicia automaticamente se o processo falhar. Ao usar `DisposeAsync`, ele encerra toda a árvore de processos de forma limpa.

---

## Pré-requisitos

| Requisito | Versão | Observações |
|-------------|---------|-------|
| SDK .NET | 9.0+ | `global.json` define a versão 9.0 com atualização para a versão mais recente com recursos. |
| Node.js | 20+ | Necessário para o componente sidecar do backend da Attestia. |
| Windows | 10 1809+ | Mínimo WinUI 3; Windows 11 recomendado. |
| Visual Studio | 2022 17.10+ | Com a carga de trabalho **Windows App SDK** (para o aplicativo de área de trabalho). |

> **Observação:** Os três pacotes NuGet (`Attestia.Core`, `Attestia.Client`, `Attestia.Sidecar`) são destinados a `net9.0` puro e não requerem o Windows. Apenas `Attestia.App` é destinado a `net9.0-windows10.0.22621.0`.

---

## Instalação a partir do código-fonte

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

### Construção do pacote MSIX (Versão)

```bash
dotnet build src/Attestia.App/Attestia.App.csproj -c Release -p:Platform=x64
```

O resultado é gravado em `AppPackages/`.

### Empacotamento do Node.js

Coloque o servidor Node.js da Attestia em `assets/node/`:

```text
assets/
  node/
    node.exe            <-- Node.js runtime
    server/
      dist/
        main.js         <-- Attestia backend entry point
```

A construção copia automaticamente esses arquivos para o diretório de saída. Se `assets/node/node.exe` não estiver presente, o sidecar usará `node` no `PATH`.

---

## Estrutura do Projeto

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

## Configuração

O aplicativo para desktop lê o arquivo `appsettings.json` para as configurações do "sidecar" e do cliente:

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

| Chave | Valor padrão | Descrição |
|-----|---------|-------------|
| `Port` | `0` (automático) | Porta fixa para o "sidecar", ou `0` para descobrir automaticamente uma porta disponível. |
| `NodePath` | `null` | Caminho explícito para o `node.exe`; caso não seja especificado, utiliza a versão embutida e, em seguida, a variável `PATH`. |
| `ServerEntryPoint` | `null` | Caminho explícito para o `main.js`; caso não seja especificado, utiliza o local embutido. |
| `ApiKey` | `null` | Chave de API opcional, enviada como o cabeçalho `X-Api-Key`. |

---

## Segurança e Escopo de Dados

O Attestia Desktop funciona como um **aplicativo de desktop local** com um backend local do Node.js.

- **Dados acessados:** Lê e grava declarações de intenção, provas de Merkle, relatórios de reconciliação e dados de conformidade através de um "sidecar" local do Node.js. Armazena a configuração no arquivo `appsettings.json`. Os pacotes SDK do NuGet fazem chamadas HTTP para a URL do backend configurada.
- **Dados NÃO acessados:** Sem telemetria. Sem análise de dados na nuvem. Sem coleta de dados do usuário. Sem armazenamento de credenciais. Sem gravações diretas no blockchain.
- **Permissões necessárias:** Acesso à rede para o "sidecar" local (localhost). Acesso ao sistema de arquivos para o ambiente de execução Node.js embutido e para a configuração. Ambiente de execução do Windows App SDK para a interface do usuário do desktop.

Consulte o arquivo [SECURITY.md](SECURITY.md) para relatar vulnerabilidades.

---

## Avaliação

| Categoria | Pontuação |
|----------|-------|
| Segurança | 10/10 |
| Tratamento de Erros | 10/10 |
| Documentação para Operadores | 10/10 |
| Higiene no Desenvolvimento | 10/10 |
| Identidade | 10/10 |
| **Overall** | **50/50** |

---

## Contribuições

1. Faça um "fork" do repositório.
2. Crie um branch de funcionalidade (`git checkout -b feat/my-feature`).
3. Faça o "commit" das suas alterações.
4. Abra um "pull request" para o branch `main`.

Certifique-se de que a solução seja compilada e que todos os testes sejam aprovados antes de enviar.

---

## Suporte

- **Dúvidas / ajuda:** [Discussões](https://github.com/mcp-tool-shop-org/Attestia-Desktop/discussions)
- **Relatórios de bugs:** [Problemas](https://github.com/mcp-tool-shop-org/Attestia-Desktop/issues)

---

## Licença

[MIT](LICENSE) -- Copyright (c) 2026 Mikey Frilot

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a

