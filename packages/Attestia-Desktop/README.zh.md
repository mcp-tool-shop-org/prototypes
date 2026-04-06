<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

**适用于 Windows 的金融意图验证 -- 一个 WinUI 3 桌面应用程序和 .NET SDK，用于区块链的认证和对账。**

---

## 为什么选择 Attestia？

大多数区块链工具在交易**发生后**进行审计。Attestia 改变了这种模式：在交易进入区块链**之前**验证意图。

- **带类型的金融意图** -- 使用结构化记录而不是原始数据来声明、批准、执行和验证交易。
- **密码学证明** -- Merkle 树包含证明和认证包提供防篡改的审计跟踪。
- **确定性对账** -- 三方匹配（意图与账本与链）可以及时发现差异，防止其累积。
- **合规性映射** -- 将认证控制映射到监管框架，并生成带评分的合规性报告。
- **事件溯源** -- 每次状态更改都是一个不可变的、以哈希链接的领域事件，并提供完整的因果关系跟踪。
- **以桌面为先的用户体验** -- 一个原生的 WinUI 3 应用程序，为您提供实时仪表板、意图管理、证明浏览器和对账视图，无需离开 Windows。

---

## NuGet 包

| 包 | 目标 | 描述 |
|---------|--------|-------------|
| **Attestia.Core** | `net9.0` | 领域模型、枚举和共享类型 -- `Intent`（意图）、`MerkleProof`（Merkle 证明）、`ReconciliationReport`（对账报告）、`Money`（货币）、`ComplianceFramework`（合规框架）、`DomainEvent`（领域事件）等。 |
| **Attestia.Client** | `net9.0` | 带有类型化子客户端的 HTTP 客户端 SDK，用于意图、证明、对账、合规性、事件、验证和导出。内置重试逻辑、信封解包和 `CancellationToken` 支持。 |
| **Attestia.Sidecar** | `net9.0` | Node.js 进程管理器 -- 启动 Attestia 后端，发现可用端口，轮询 `/health`，在崩溃时自动重启，并在销毁时清理整个进程树。 |

所有三个包的目标是 `net9.0`，并且可以独立于桌面应用程序运行。 可以在控制台应用程序、ASP.NET 服务或任何运行 .NET 9+ 的地方使用它们。

---

## 快速入门

### 声明和验证意图

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

### 对意图与账本与链进行对账

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

### 管理 Node.js 辅助程序

```csharp
using Attestia.Sidecar;

// SidecarConfig is bound from appsettings.json via IOptions<SidecarConfig>
await using var sidecar = new NodeSidecar(options, locator, logger);
await sidecar.StartAsync();

// Sidecar auto-discovers a free port, polls /health every 5 s,
// auto-restarts on crash, and kills the process tree on dispose.
Console.WriteLine($"Backend ready at {sidecar.BaseUrl}");
```

### 验证 Merkle 包含证明

```csharp
var package = await client.Proofs.GetAttestationAsync(attestationId);
var result  = await client.Proofs.VerifyProofAsync(package);

Console.WriteLine(result.Valid
    ? $"Proof valid -- root {result.MerkleRoot}"
    : "Proof verification failed");
```

---

## 架构

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

桌面应用程序组合了所有层，但每个库都可以独立运行。 `Attestia.Client` 可以在任何 .NET 9+ 项目中使用 -- 控制台应用程序、ASP.NET API、后台服务或测试框架。

**Sidecar**（辅助程序）将 Node.js 后端作为子进程进行管理。 它会找到一个空闲端口，设置 `PORT` 和 `NODE_ENV=production`，轮询 `/health`，并在进程死亡时自动重启。 在 `DisposeAsync` 时，它会干净地终止整个进程树。

---

## 先决条件

| 要求 | 版本 | 说明 |
|-------------|---------|-------|
| .NET SDK | 9.0+ | `global.json` 使用 `latestFeature` 策略锁定到 9.0 版本。 |
| Node.js | 20+ | Attestia 后端辅助程序需要此组件。 |
| Windows | 10 1809+ | WinUI 3 最小版本；建议使用 Windows 11。 |
| Visual Studio | 2022 17.10+ | 需要安装 **Windows App SDK** 工作负载（用于桌面应用程序）。 |

> **注意：** 三个 NuGet 包 (`Attestia.Core`、`Attestia.Client`、`Attestia.Sidecar`) 目标是纯 `net9.0`，不需要 Windows。 只有 `Attestia.App` 目标是 `net9.0-windows10.0.22621.0`。

---

## 从源代码安装

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

### 构建 MSIX 包（发布）

```bash
dotnet build src/Attestia.App/Attestia.App.csproj -c Release -p:Platform=x64
```

输出文件位于 `AppPackages/` 目录中。

### 捆绑 Node.js

将 Attestia Node.js 服务器放在 `assets/node/` 目录中：

```text
assets/
  node/
    node.exe            <-- Node.js runtime
    server/
      dist/
        main.js         <-- Attestia backend entry point
```

构建过程会自动将这些文件复制到输出目录。 如果 `assets/node/node.exe` 不存在，辅助程序将回退到 `PATH` 路径下的 `node` 可执行文件。

---

## 项目结构

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

## 配置

桌面应用程序会读取 `appsettings.json` 文件以获取侧边组件和客户端的配置信息：

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

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `Port` | `0` (自动) | 侧边组件的固定端口，或者使用 `0` 自动发现一个空闲端口。 |
| `NodePath` | `null` | `node.exe` 的明确路径；如果未指定，则会使用内置版本，然后是 `PATH` 环境变量。 |
| `ServerEntryPoint` | `null` | `main.js` 的明确路径；如果未指定，则会使用内置位置。 |
| `ApiKey` | `null` | 可选的 API 密钥，以 `X-Api-Key` 头部形式发送。 |

---

## 安全与数据范围

Attestia Desktop 作为一个**本地桌面应用程序**，具有本地 Node.js 侧边组件后端。

- **访问的数据：** 通过本地 Node.js 侧边组件读取和写入意图声明、Merkle 证明、对账报告和合规性数据。配置信息存储在 `appsettings.json` 文件中。NuGet SDK 包仅对配置的后端 URL 进行 HTTP 调用。
- **未访问的数据：** 不收集任何遥测数据。不进行任何云端分析。不收集任何用户数据。不存储任何凭据。不直接写入区块链。
- **所需权限：** 访问本地侧边组件的网络权限（localhost）。访问用于内置 Node.js 运行时和配置的文件系统。用于桌面界面的 Windows App SDK 运行时。

请参阅 [SECURITY.md](SECURITY.md) 文件以报告漏洞。

---

## 评估标准

| 类别 | 评分 |
|----------|-------|
| 安全性 | 10/10 |
| 错误处理 | 10/10 |
| 操作员文档 | 10/10 |
| 发布流程 | 10/10 |
| 身份验证 | 10/10 |
| **Overall** | **50/50** |

---

## 贡献

1. 复制（Fork）该仓库。
2. 创建一个功能分支（`git checkout -b feat/my-feature`）。
3. 提交您的更改。
4. 对 `main` 分支发起一个拉取请求。

请确保解决方案能够成功构建，并且所有测试都通过后，再提交。

---

## 支持

- **问题/帮助：** [讨论](https://github.com/mcp-tool-shop-org/Attestia-Desktop/discussions)
- **Bug 报告：** [问题](https://github.com/mcp-tool-shop-org/Attestia-Desktop/issues)

---

## 许可证

[MIT](LICENSE) -- 版权所有 (c) 2026 Mikey Frilot

---

构建者：<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

