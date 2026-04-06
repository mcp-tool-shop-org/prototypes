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

**Local AI Chat Assistant for Windows**

A privacy-first, GPU-accelerated chat application that runs large language models entirely on your machine. No cloud required.

## Why InControl?

- **Private by default** - Your conversations never leave your computer
- **RTX-optimized** - Built for NVIDIA GPUs with CUDA acceleration
- **Native Windows experience** - WinUI 3 with Fluent Design
- **Multiple backends** - Ollama, llama.cpp, or bring your own
- **Markdown rendering** - Rich text, code blocks, and syntax highlighting
- **Assistant profiles** - Configurable personality, verbosity, and risk tolerance
- **Plugin system** - Extend functionality with sandboxed plugins and a manifest-based SDK
- **Policy engine** - Org/team/user policy layers govern tools, plugins, memory, and connectivity
- **Connectivity modes** - Offline-only, assisted, or connected with full audit logging

## NuGet Packages

The core libraries are available as standalone NuGet packages for building your own local AI integrations:

| Package | Version | Description |
|---------|---------|-------------|
| [InControl.Core](https://www.nuget.org/packages/InControl.Core) | [![NuGet](https://img.shields.io/nuget/v/InControl.Core?style=flat-square)](https://www.nuget.org/packages/InControl.Core) | Domain models, conversation types, and shared abstractions for local AI chat applications. |
| [InControl.Inference](https://www.nuget.org/packages/InControl.Inference) | [![NuGet](https://img.shields.io/nuget/v/InControl.Inference?style=flat-square)](https://www.nuget.org/packages/InControl.Inference) | LLM backend abstraction layer with streaming chat, model management, and health checks. Includes Ollama implementation. |

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

## Target Hardware

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| GPU | RTX 3060 (8GB) | RTX 4080/5080 (16GB) |
| RAM | 16GB | 32GB |
| OS | Windows 10 1809+ | Windows 11 |
| .NET | 9.0 | 9.0 |

## Installation

### From Release (Recommended)

1. Download the latest MSIX package from [Releases](https://github.com/mcp-tool-shop-org/InControl-Desktop/releases)
2. Double-click to install
3. Launch from Start Menu

### From Source

```bash
# Clone and build
git clone https://github.com/mcp-tool-shop-org/InControl-Desktop.git
cd InControl-Desktop
dotnet restore
dotnet build

# Run (requires Ollama running locally)
dotnet run --project src/InControl.App
```

## Prerequisites

InControl requires a local LLM backend. We recommend [Ollama](https://ollama.ai/):

```bash
# Install Ollama from https://ollama.ai/download

# Pull a model
ollama pull llama3.2

# Start the server (runs on http://localhost:11434)
ollama serve
```

## Building

### Verify Build Environment

```powershell
# Run verification script
./scripts/verify.ps1
```

### Development Build

```bash
dotnet build
```

### Release Build

```powershell
# Creates release artifacts in artifacts/
./scripts/release.ps1
```

### Run Tests

```bash
dotnet test
```

## Architecture

InControl follows a clean, layered architecture:

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

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed design documentation.

### Key subsystems

| Subsystem | Namespace | Purpose |
|-----------|-----------|---------|
| Assistant | `InControl.Core.Assistant` | Profiles, memory store, personality guard, onboarding |
| Plugins | `InControl.Core.Plugins` | Manifest-validated, sandboxed extensibility with SDK |
| Policy | `InControl.Core.Policy` | JSON policy documents (org/team/user), tool/plugin/memory/connectivity rules |
| Connectivity | `InControl.Core.Connectivity` | Three-mode network governance with audit trail |
| Health | `InControl.Services.Health` | Pluggable health checks (app, inference, storage) |
| Diagnostics | `InControl.Core.Diagnostics` | Support bundle creation with sanitized configs |

## Data Storage

All data is stored locally:

| Data | Location |
|------|----------|
| Sessions | `%LOCALAPPDATA%\InControl\sessions\` |
| Logs | `%LOCALAPPDATA%\InControl\logs\` |
| Cache | `%LOCALAPPDATA%\InControl\cache\` |
| Exports | `%USERPROFILE%\Documents\InControl\exports\` |

See [PRIVACY.md](./docs/PRIVACY.md) for complete data handling documentation.

## Troubleshooting

Common issues and solutions are documented in [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md).

### Quick Fixes

**App won't start:**
- Check that .NET 9.0 Runtime is installed
- Run `dotnet --list-runtimes` to verify

**No models available:**
- Ensure Ollama is running: `ollama serve`
- Pull a model: `ollama pull llama3.2`

**GPU not detected:**
- Update NVIDIA drivers to latest version
- Check CUDA toolkit installation

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Submit a pull request

## Reporting Issues

1. Check [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) first
2. Use the "Copy Diagnostics" feature in the app
3. Open an issue with diagnostics info attached

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI Framework | WinUI 3 (Windows App SDK 1.6) |
| Architecture | MVVM with CommunityToolkit.Mvvm |
| LLM Integration | OllamaSharp, Microsoft.Extensions.AI |
| DI Container | Microsoft.Extensions.DependencyInjection |
| Configuration | Microsoft.Extensions.Configuration |
| Logging | Microsoft.Extensions.Logging + Serilog |

## Version

Current version: **1.3.1**

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## Security & Data Scope

InControl Desktop is a **local-first** WinUI 3 desktop application for private LLM chat.

- **Data accessed:** Local Ollama API (localhost), chat history in local storage, model configuration files
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. All inference runs locally via Ollama
- **Permissions:** Localhost network (Ollama API), file system for chat history. MSIX sandboxed

Full policy: [SECURITY.md](SECURITY.md)

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

---

## Support

- **Questions / help:** [Discussions](https://github.com/mcp-tool-shop-org/InControl-Desktop/discussions)
- **Bug reports:** [Issues](https://github.com/mcp-tool-shop-org/InControl-Desktop/issues)
- **Security:** [SECURITY.md](SECURITY.md)

## License

[MIT](LICENSE) -- see [LICENSE](LICENSE) for full text.

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
