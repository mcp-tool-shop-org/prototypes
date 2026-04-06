<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/runforge-desktop/readme.png" alt="RunForge Desktop" width="400"></p>

<h1 align="center">RunForge Desktop</h1>

<p align="center">
  <a href="https://www.nuget.org/packages/RunForgeDesktop.Core"><img src="https://img.shields.io/nuget/v/RunForgeDesktop.Core?label=RunForgeDesktop.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/mcp-tool-shop-org/runforge-desktop/releases"><img src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?logo=windows" alt="Platform"></a>
  <a href="https://mcp-tool-shop-org.github.io/runforge-desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**RunForge Desktop** 是一款 Windows 平台的桌面应用程序，用于创建、监控和检查机器学习 (ML) 训练过程。

它提供了一个可视化的控制面板，用于管理 ML 实验：创建训练任务、实时监控训练进度（通过实时图表），以及浏览已完成的训练任务，并进行全面的数据检查。

> **官方上游项目（数据、模式、保证）：**
> https://github.com/mcp-tool-shop-org/runforge-vscode

---

## 为什么？

大多数机器学习实验跟踪工具都是基于云的 SaaS 平台，需要注册账号，会收集遥测数据，并且增加了复杂性。 RunForge Desktop 采取了相反的方法：**所有操作都在您的本地机器上运行**。

使用 RunForge Desktop，您可以：

- **创建** 具有预设配置的训练任务
- **监控** 实时训练，并查看实时图表和日志
- **浏览** 已完成的训练任务及其输出
- **检查** 指标、日志和数据
- **管理** 训练任务（取消、查看输出、复制命令）

所有训练任务都在您的本地机器上使用 Python 运行。无需云服务。无需遥测数据。无需注册账号。

---

## NuGet 包

| 包名 | 描述 |
| --------- | ------------- |
| [RunForgeDesktop.Core](https://www.nuget.org/packages/RunForgeDesktop.Core) | 包含机器学习训练任务管理的核心模型和服务，包括任务生命周期管理、超参数调整、实时监控和数据检查。 |

```bash
dotnet add package RunForgeDesktop.Core
```

---

## 快速开始

### 安装

**选项 1：MSIX 安装包（推荐）**
1. 从 [Releases](https://github.com/mcp-tool-shop-org/runforge-desktop/releases) 下载 `.msix` 文件。
2. 双击安装。
3. 从开始菜单启动。

**选项 2：从源代码构建**
```powershell
git clone https://github.com/mcp-tool-shop-org/runforge-desktop
cd runforge-desktop
dotnet run --project src/RunForgeDesktop/RunForgeDesktop.csproj
```

请参阅 [docs/INSTALL.md](docs/INSTALL.md) 获取详细的安装选项。

### 使用方法

1. **启动** RunForge Desktop。
2. **选择工作区** - 点击“选择工作区”，选择一个文件夹用于存放您的机器学习实验。
3. **开始训练** - 点击“训练”按钮，配置并启动一个训练任务。
4. **实时监控** - 观看训练进度，查看实时损失图表和日志。
5. **浏览任务** - 查看所有训练任务，并按状态进行过滤。
6. **检查详情** - 点击任何一个任务，查看指标、数据和输出。

---

## 功能

### 训练任务创建
- 使用预设的训练轮次配置训练任务（快速、标准、扩展、自定义）。
- 选择 GPU/CPU 设备，并自动检测可用设备。
- 高级设置：批次大小、学习率、优化器、调度器。
- 可选的自定义数据集路径。

### 超参数调整（MultiRun）
- 运行多个实验，使用不同的超参数组合。
- 将学习率、批次大小和优化器配置为逗号分隔的列表。
- 自动进行所有组合的网格搜索。
- 根据最终损失跟踪最佳配置。

### 实时监控
- 实时损失图表，自动更新。
- 实时从训练过程中获取日志。
- 进度跟踪（轮次、步数、已用时间）。
- 随时取消正在运行的训练任务。

### 任务浏览
- 按最新时间排序浏览任务。
- 按状态过滤：待处理、运行中、已完成、失败、已取消。
- 查看任务详情和输出。

### 任务检查
- **指标** - 损失曲线、准确率、训练统计信息。
- **日志** - 来自训练过程的完整标准输出/标准错误输出。
- **数据** - 打开输出文件夹，复制训练命令。

### 诊断
- 查看应用程序版本、框架和内存使用情况。
- 查看工作区路径和 Python 配置。
- 将诊断信息复制到剪贴板，以便提供支持。

---

## 核心原则

### 本地优先
所有训练都在您的机器上进行。无需云服务。

### 透明
清晰地了解正在发生的事情：实时日志、实时指标、完整的流程控制。

### 简单
一个工作空间，清晰的预设选项，无需管理任何配置文件。

### 可审计
所有运行产生的记录都保存到磁盘，以便检查和重现。

---

## 工作原理

```
RunForge Desktop
  │
  ├── Select Workspace (any folder)
  │
  ├── Create Run (preset + device + optional dataset)
  │
  ├── Spawn Python training process
  │
  ▼
.ml/
  └── runs/
      └── 20240101-123456-myrun-abc1/
          ├── run.json       (manifest)
          ├── metrics.jsonl  (live metrics)
          ├── stdout.log     (live logs)
          └── stderr.log     (errors)
```

RunForge Desktop 管理完整的生命周期：创建、执行、监控和检查。

---

## 系统要求

| 要求 | Value |
| ------------- | ------- |
| OS | Windows 10 (1809+) 或 Windows 11 |
| 架构 | x64 |
| 运行时 | .NET 10 (包含在 MSIX 中) |
| Python | 3.10+ (用于训练) |
| GPU | 可选 (用于 GPU 训练的 CUDA) |
| 磁盘空间 | ~100 MB |

---

## 平台和打包

| 属性 | Value |
| ----------- | ------- |
| 平台 | Windows 10/11 |
| UI 框架 | .NET MAUI |
| 打包 | MSIX (自包含) |
| 安装/卸载 | 干净、隔离、可逆 |

该应用程序遵循 Windows 标准的权限模型，用于文件访问。

---

## 项目状态

| 属性 | Value |
| ----------- | ------- |
| 当前版本 | v1.0.0 |
| Scope | 机器学习训练、监控和检查 |

请参阅 [RELEASE_NOTES_v0.4.0.md](RELEASE_NOTES_v0.4.0.md)，了解最近的更改。

---

## 开发

### 先决条件

- .NET 10 SDK
- Windows 10/11
- Visual Studio 2022 (17.12+) 带有 MAUI 工作负载，或 VS Code 带有 .NET MAUI 扩展

### 构建

```powershell
# Debug build
dotnet build

# Run tests
dotnet test

# Release build
.\scripts\build-release.cmd
```

### 项目结构

```
runforge-desktop/
├── src/
│   ├── RunForgeDesktop/          # MAUI app (UI, ViewModels)
│   └── RunForgeDesktop.Core/     # Core services, models
├── tests/
│   └── RunForgeDesktop.Core.Tests/
├── docs/
│   ├── PHASE-DESKTOP-0.1-ACCEPTANCE.md
│   └── INSTALL.md
└── scripts/
    ├── build-msix.ps1
    └── build-release.cmd
```

---

## 与 RunForge Core 的关系

所有模式、保证和记录格式都定义并固定在：

> https://github.com/mcp-tool-shop-org/runforge-vscode

此仓库包含：
- 无训练逻辑
- 无模式定义
- 无合约所有权

RunForge Desktop **忠实地**使用这些记录。

---

## 目标用户

- 在 Windows 上本地训练模型的开发人员
- 需要简单、可检查的实验跟踪的研究人员
- 任何想要使用原生 Windows 机器学习训练界面的用户
- 想要使用本地优先、无云的机器学习工作流的团队

---

## 许可证

MIT 许可证 - 详情请参阅 [LICENSE](LICENSE)。

---

## 可靠性测试

RunForge 包含一套可重复的可靠性测试，您可以在本地运行以验证队列、暂停/恢复、取消、崩溃恢复、公平性、磁盘漂移弹性以及桌面重新连接行为。

| 测试项 | Focus |
| ---------- | ------- |
| G1 | 最大并行度限制 |
| G2 | 暂停/恢复 |
| G3 | 取消确定性 |
| G4 | 崩溃恢复 |
| G5 | 公平调度 |
| G6 | 磁盘漂移弹性 |
| G7 | 桌面重新连接 |
| G8-G10 | GPU 支持 (v0.4.0+) |

请参阅：[`docs/GAUNTLETS.md`](docs/GAUNTLETS.md)

---

## 贡献

欢迎贡献。请遵守以下核心原则：

- 保持简单和本地优先
- 无云依赖项或遥测
- 清晰、可操作的错误消息

---

## 支持

- **问题反馈**: [GitHub 问题列表](https://github.com/mcp-tool-shop-org/runforge-desktop/issues)
- **诊断**: 使用“诊断”页面复制系统信息，以便在提交错误报告时提供。
