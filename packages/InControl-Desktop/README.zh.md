<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/InControl-Desktop/readme.png" alt="InControl Desktop" width="400"></p>

<h1 align="center">InControl Desktop</h1>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/InControl-Desktop/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/InControl-Desktop/ci.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="https://www.nuget.org/packages/InControl.Core"><img src="https://img.shields.io/nuget/v/InControl.Core?style=flat-square&label=InControl.Core" alt="InControl.Core NuGet"></a>
  <a href="https://www.nuget.org/packages/InControl.Inference"><img src="https://img.shields.io/nuget/v/InControl.Inference?style=flat-square&label=InControl.Inference" alt="InControl.Inference NuGet"></a>
  <img src="https://img.shields.io/badge/.NET-9-purple?style=flat-square&logo=dotnet" alt=".NET 9">
  <img src="https://img.shields.io/badge/WinUI-3-blue?style=flat-square" alt="WinUI 3">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/InControl-Desktop?style=flat-square" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/InControl-Desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

**Windows 平台的本地 AI 聊天助手**

一个注重隐私、利用 GPU 加速的聊天应用程序，它可以在您的本地机器上完全运行大型语言模型。无需连接云端。

## 为什么选择 InControl？

- **默认保护隐私** - 您的对话永远不会离开您的计算机。
- **针对 RTX 优化** - 专为配备 NVIDIA GPU 并使用 CUDA 加速的设备设计。
- **原生 Windows 体验** - 使用 WinUI 3 和 Fluent Design。
- **多种后端支持** - 支持 Ollama、llama.cpp，或自定义后端。
- **Markdown 渲染** - 支持富文本、代码块和语法高亮。

## NuGet 包

核心库以独立的 NuGet 包的形式提供，可用于构建您自己的本地 AI 集成：

| 包名 | 版本 | 描述 |
| --------- | --------- | ------------- |
| [InControl.Core](https://www.nuget.org/packages/InControl.Core) | [![NuGet](https://img.shields.io/nuget/v/InControl.Core?style=flat-square)](https://www.nuget.org/packages/InControl.Core) | 本地 AI 聊天应用程序的领域模型、对话类型和共享抽象。 |
| [InControl.Inference](https://www.nuget.org/packages/InControl.Inference) | [![NuGet](https://img.shields.io/nuget/v/InControl.Inference?style=flat-square)](https://www.nuget.org/packages/InControl.Inference) | 具有流式聊天、模型管理和健康检查的 LLM 后端抽象层。包含 Ollama 的实现。 |

```bash
dotnet add package InControl.Core
dotnet add package InControl.Inference
```

```csharp
// Example: use InControl.Inference in your own app
var client = inferenceClientFactory.Create("ollama");
await foreach (var token in client.StreamChatAsync(messages))
{
    Console.Write(token);
}
```

## 目标硬件

| 组件 | 最低配置 | 推荐配置 |
| ----------- | --------- | ------------- |
| GPU | RTX 3060 (8GB) | RTX 4080/5080 (16GB) |
| RAM | 16GB | 32GB |
| OS | Windows 10 1809+ | Windows 11 |
| .NET | 9.0 | 9.0 |

## 安装

### 从发布版本安装（推荐）

1. 从 [Releases](https://github.com/mcp-tool-shop-org/InControl-Desktop/releases) 下载最新的 MSIX 包。
2. 双击安装。
3. 从开始菜单启动。

### 从源代码安装

```bash
# Clone and build
git clone https://github.com/mcp-tool-shop-org/InControl-Desktop.git
cd InControl-Desktop
dotnet restore
dotnet build

# Run (requires Ollama running locally)
dotnet run --project src/InControl.App
```

## 先决条件

InControl 需要一个本地 LLM 后端。我们推荐 [Ollama](https://ollama.ai/):

```bash
# Install Ollama from https://ollama.ai/download

# Pull a model
ollama pull llama3.2

# Start the server (runs on http://localhost:11434)
ollama serve
```

## 构建

### 验证构建环境

```powershell
# Run verification script
./scripts/verify.ps1
```

### 开发构建

```bash
dotnet build
```

### 发布构建

```powershell
# Creates release artifacts in artifacts/
./scripts/release.ps1
```

### 运行测试

```bash
dotnet test
```

## 架构

InControl 采用清晰的分层架构：

```
+-------------------------------------------+
|         InControl.App (WinUI 3)           |  UI Layer
+-------------------------------------------+
|         InControl.ViewModels              |  Presentation
+-------------------------------------------+
|         InControl.Services                |  Business Logic
+-------------------------------------------+
|         InControl.Inference               |  LLM Backends
+-------------------------------------------+
|         InControl.Core                    |  Shared Types
+-------------------------------------------+
```

请参阅 [ARCHITECTURE.md](./docs/ARCHITECTURE.md) 以获取详细的设计文档。

## 数据存储

所有数据都存储在本地：

| Data | 位置 |
| ------ | ---------- |
| 会话 | `%LOCALAPPDATA%\InControl\sessions\` |
| Logs | `%LOCALAPPDATA%\InControl\logs\` |
| Cache | `%LOCALAPPDATA%\InControl\cache\` |
| 导出 | `%USERPROFILE%\Documents\InControl\exports\` |

请参阅 [PRIVACY.md](./docs/PRIVACY.md) 以获取完整的关于数据处理的文档。

## 故障排除

常见问题和解决方案已记录在 [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) 中。

### 快速修复

**应用程序无法启动：**
- 检查是否已安装 .NET 9.0 运行时。
- 运行 `dotnet --list-runtimes` 以进行验证。

**没有可用的模型：**
- 确保 Ollama 正在运行：`ollama serve`
- 下载一个模型：`ollama pull llama3.2`

**未检测到 GPU：**
- 更新 NVIDIA 显卡驱动程序到最新版本。
- 检查 CUDA 工具包的安装情况。

## 贡献

欢迎贡献！请：

1. 复制仓库。
2. 创建一个功能分支。
3. 为新功能编写测试。
4. 提交拉取请求。

## 报告问题

1. 首先检查 [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)。
2. 使用应用程序中的“复制诊断”功能。
3. 打开一个问题，并附上诊断信息。

## 技术栈

| Layer | 技术 |
| ------- | ------------ |
| UI 框架 | WinUI 3 (Windows App SDK 1.6) |
| 架构 | MVVM，使用 CommunityToolkit.Mvvm |
| LLM 集成 | OllamaSharp, Microsoft.Extensions.AI |
| 依赖注入容器 | Microsoft.Extensions.DependencyInjection |
| 配置 | Microsoft.Extensions.Configuration |
| 日志记录 | Microsoft.Extensions.Logging + Serilog |

## 版本

当前版本：**0.4.0-alpha**

请查看 [CHANGELOG.md](./CHANGELOG.md) 以获取发布历史。

## 支持

- **问题/帮助：** [讨论](https://github.com/mcp-tool-shop-org/InControl-Desktop/discussions)
- **错误报告：** [问题](https://github.com/mcp-tool-shop-org/InControl-Desktop/issues)
- **安全：** [SECURITY.md](SECURITY.md)

## 许可证

[MIT](LICENSE) -- 详情请参见 [LICENSE](LICENSE)。

---

*专为 Windows 设计。由本地 AI 提供支持。*
