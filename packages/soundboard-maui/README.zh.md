<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/soundboard-maui/readme.png" alt="Soundboard MAUI logo" width="400">
</p>

# soundboard-maui

> [MCP Tool Shop](https://mcptoolshop.com) 的一部分

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml/badge.svg" alt="Publish"></a>
  <img src="https://img.shields.io/badge/.NET-8%20%7C%209%20%7C%2010-512BD4" alt=".NET 8 | 9 | 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-maui/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**用于 Sound Board 语音引擎的跨平台 .NET MAUI 桌面客户端。**

---

## 为什么选择 Soundboard MAUI？

- **SDK优先设计** — `Soundboard.Client` 是一个独立的 .NET 8+ 库，不依赖任何 UI 组件。 可以在控制台应用程序、WPF、ASP.NET、MAUI 或任何针对 .NET 的应用程序中使用它。
- **实时流式传输** — 音频以块的形式通过 WebSocket 传输，使用 `IProgress<AudioChunk>` 接口。无需等待完整的语音合成完成。
- **引擎无关性** — SDK 使用文档化的 [API 接口](docs/api-contract.md)。无需更改代码即可切换不同的语音引擎。
- **多目标平台** — 支持 `net8.0`、`net9.0` 和 `net10.0`，可以将其引用到任何现代 .NET 项目中。
- **结构化日志记录** — 内置 `ILogger` 支持，用于诊断，无需引入额外的日志记录框架。
- **包含参考客户端** — 一个 MAUI 桌面应用程序和一个 CLI 工具展示了实际的集成模式，您可以参考。

---

## NuGet 包

| 包名 | 描述 | 版本 |
|---|---|---|
| **[Soundboard.Client](https://www.nuget.org/packages/Soundboard.Client)** | 核心 SDK — 用于任何兼容 Soundboard 的语音引擎的流式 TTS 客户端。纯 C#，无 UI 依赖。 | 1.2.0 |
| **[Soundboard.Maui.Audio](https://www.nuget.org/packages/Soundboard.Maui.Audio)** | 基于 NAudio 的 PCM16 流式播放适配器，适用于 Windows。提供 `IAudioPlayer`，具有缓冲、线程安全启动/停止/刷新功能，以及播放状态跟踪。 | 1.0.0 |

---

## 快速开始

### 安装 SDK

```bash
dotnet add package Soundboard.Client
```

### 用五行代码实现语音合成

```csharp
using Soundboard.Client;
using Soundboard.Client.Models;

await using var client = new SoundboardClient();

// Discover what the engine offers
var presets = await client.GetPresetsAsync();
var voices  = await client.GetVoicesAsync();

// Stream speech — chunks arrive as they are synthesized
var progress = new Progress<AudioChunk>(chunk =>
{
    // Feed chunk.PcmData (PCM16, mono) to your audio output
});

await client.SpeakAsync(
    new SpeakRequest("Hello from the SDK.", presets[0], voices[0]),
    progress);
```

不依赖 MAUI。适用于控制台应用程序、WPF、ASP.NET 或任何针对 .NET 8+ 的应用程序。

### 配置

客户端从环境变量中读取 `SOUNDBOARD_BASE_URL`，默认为 `http://localhost:8765`。 可以在代码中覆盖它：

```csharp
var client = new SoundboardClient(new SoundboardClientOptions
{
    BaseUrl = "http://my-engine:9000",
    HttpTimeout = TimeSpan.FromSeconds(15),
    WebSocketConnectTimeout = TimeSpan.FromSeconds(10),
    WebSocketReceiveTimeout = TimeSpan.FromSeconds(60)
});
```

### SDK 接口

| 方法 | 描述 |
|---|---|
| `GetHealthAsync()` | 引擎健康检查 — 返回版本信息和运行状态 |
| `GetPresetsAsync()` | 列出可用的预设标识符（例如：`narrator`、`conversational`） |
| `GetVoicesAsync()` | 列出可用的语音标识符 |
| `SpeakAsync(request, progress)` | 流式合成语音；通过 `IProgress<T>` 接口报告 `AudioChunk` |
| `StopAsync()` | 向引擎发送停止命令 |

所有方法都接受 `CancellationToken`。客户端实现了 `IAsyncDisposable` 接口。

---

## 架构

```
This repository
+-------------------------------------------+
|                                           |
|  Soundboard.Client (SDK)     net8.0+      |  <-- The product
|  Soundboard.Maui.Audio       net8.0       |  <-- NAudio adapter (Windows)
|  Soundboard.Maui             net10.0      |  <-- Reference client (MAUI)
|  soundboard-cli              net8.0       |  <-- Reference client (console)
|                                           |
+-------------------------------------------+
            |  HTTP (control) + WebSocket (audio)
            v
+-------------------------------------------+
|  voice-soundboard (engine repo)           |
|  Any engine implementing the API contract |
+-------------------------------------------+
```

**控制平面** (HTTP) — 健康检查、预设、语音、停止。
**数据平面** (WebSocket) — 双向：发送语音命令，接收 PCM16 音频块。

SDK 自动处理连接生命周期、JSON 格式化、Base64 解码、WebSocket 连接的优雅关闭以及 API 版本兼容性检查。

---

## 从源代码安装

### 先决条件

- [.NET 10.0 SDK](https://dotnet.microsoft.com/)，包含 MAUI 工作负载（用于桌面应用程序）
- .NET 8.0 SDK（仅用于 SDK 和 CLI）
- Windows 10/11（用于 MAUI 应用程序和 NAudio 播放）
- 正在运行的 [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) 引擎

### 克隆并运行

```bash
git clone https://github.com/mcp-tool-shop-org/soundboard-maui.git
cd soundboard-maui

# Run unit + integration tests (no engine required)
dotnet test

# Run the MAUI desktop app
set SOUNDBOARD_BASE_URL=http://localhost:8765
dotnet run --project src/Soundboard.Maui

# Run the CLI client
dotnet run --project src/soundboard-cli -- health
dotnet run --project src/soundboard-cli -- presets
dotnet run --project src/soundboard-cli -- speak "Hello world" --preset narrator
```

---

## 项目结构

```
src/
  Soundboard.Client/         SDK — pure C#, net8.0/9.0/10.0, zero UI deps
  Soundboard.Maui.Audio/     NAudio PCM16 playback adapter (Windows, net8.0)
  Soundboard.Maui/           Reference desktop client (MAUI, net10.0)
  soundboard-cli/            Reference console client (net8.0)

examples/
  Quickstart/                Connect → speak → save WAV in 30 seconds
  AgentTool/                 SDK as a callable tool in an AI agent pipeline

tests/
  Soundboard.Client.Tests/         27 unit tests (no engine required)
  Soundboard.IntegrationTests/     17 integration + contract tests

docs/
  api.md                     SDK API reference (v1.0 stability guarantees)
  api-contract.md            Engine <-> SDK wire protocol
  compatibility.md           SDK-engine compatibility matrix & trust contract
  getting-started-sdk.md     SDK integration guide
  streaming-model.md         How audio streaming works
  error-model.md             Failure modes and handling
  feature-map.md             Feature-to-layer mapping
  known-limitations.md       Current boundaries
  evaluation-guide.md        How to evaluate Soundboard
  publishing.md              NuGet publish runbook
```

---

## 示例

| 示例 | 演示内容 |
|---|---|
| [Quickstart](examples/Quickstart/) | 连接、语音合成、保存 WAV 文件 — 无需配置 |
| [Agent Tool](examples/AgentTool/) | SDK 作为 AI 代理流水线中的可调用工具 |

---

## 文档

- [开始使用SDK](docs/getting-started-sdk.md)
- [流式传输模型](docs/streaming-model.md)
- [错误模型](docs/error-model.md)
- [API参考](docs/api.md)
- [API接口规范](docs/api-contract.md)
- [兼容性和信任](docs/compatibility.md)
- [引擎配置](docs/engine-setup.md)
- [升级和回滚指南](docs/upgrade-playbook.md)
- [发布SDK](docs/publishing.md)
- [全新安装验证](docs/fresh-install.md)
- [评估指南](docs/evaluation-guide.md)
- [更新日志](CHANGELOG.md)
- [贡献指南](CONTRIBUTING.md)

---

## 常见问题解答

**什么是SDK？**
`Soundboard.Client` 是一个独立的 .NET 8+ 库，它负责所有引擎的通信，包括健康检查、服务发现以及通过 WebSocket 进行语音流传输。 您可以将其引用到任何 .NET 项目中。

**什么是 MAUI 应用？**
这是一个参考客户端，它通过桌面 UI 展示了 SDK 的使用方法。 它不是最终产品，而是展示了一种使用 SDK 的方式。

**这个产品已经可以用于生产环境了吗？**
SDK 的 API（版本 1.0）是稳定的。 MAUI 应用是演示级别的。 请参阅 [已知限制](docs/known-limitations.md)。

**我可以自己构建 UI 吗？**
是的，这是设计的初衷。 SDK 没有任何 UI 依赖。 为您的平台实现 `IAudioPlayer` 接口，然后开始使用。

**引擎在哪里？**
它位于一个单独的仓库中：[voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard)。 这个仓库不包含任何引擎代码。

---

## 许可证

本项目采用 [MIT 许可证](LICENSE) 授权。

---

## 链接

- [引擎仓库](https://github.com/mcp-tool-shop-org/voice-soundboard)
- [MCP Tool Shop](https://mcptoolshop.com)
- [Soundboard.Client 在 NuGet 上的链接](https://www.nuget.org/packages/Soundboard.Client)
- [Soundboard.Maui.Audio 在 NuGet 上的链接](https://www.nuget.org/packages/Soundboard.Maui.Audio)
- [已知限制](docs/known-limitations.md)
