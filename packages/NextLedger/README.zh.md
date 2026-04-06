<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# NextLedger

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/NextLedger/readme.png" alt="NextLedger" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/NextLedger/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/NextLedger/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/NextLedger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**适用于 Windows 的“信封式”预算工具——让每一笔钱都发挥作用。**

一款基于“信封式”预算方法的 Windows 个人理财应用程序。您的数据存储在本地，无需连接云端。它被设计成一个**未来账本**，一个具有明确的人工干预机制的权威财务系统。

## 下载

📦 **[最新版本](https://github.com/mcp-tool-shop-org/NextLedger/releases/latest)**

下载 ZIP 文件，解压缩，然后运行 `NextLedger.App.exe`。无需安装。

## 什么是“信封式”预算？

“信封式”预算是一种简单而有效的理财方法，您将收入分配到不同的虚拟“信封”中，用于不同的支出类别。您只能花费每个信封中的金额，从而避免过度消费。

## 功能

- **离线优先**: 您的数据存储在您的计算机上。无需连接云端。
- **“信封式”预算**: 将每一笔钱分配到特定的用途。
- **多账户管理**: 跟踪银行存款、储蓄、信用卡和现金。
- **交易记录**: 记录和搜索您的支出。
- **CSV 导入**: 轻松导入银行对账单。
- **对账**: 将您的记录与银行对账单进行核对。
- **原生 Windows 应用**: 使用 WinUI 3 构建，提供现代化的 Windows 体验。

## 截图

*即将推出*

## 文档

- [版本更新日志](CHANGELOG.md)
- [引擎错误代码](ENGINE_ERROR_CODES.md)
- [发布流程](docs/RELEASE_PROCESS.md)
- [未来账本愿景](docs/FUTURE_LEDGER_VISION.md)
- [账本执行检查清单](docs/LEDGER_EXECUTION_CHECKLIST.md)

## 技术

- **UI**: WinUI 3 / Windows App SDK
- **编程语言**: C# / .NET 9
- **数据库**: SQLite (本地)
- **架构**: 清洁架构，采用 MVVM 模式

## 项目状态

✅ **v1.0.0** - 准备发布

核心功能已完成：
- 具有每月分配的预算管理
- 具有拆分功能的交易记录
- 从银行对账单导入 CSV 文件
- 账户对账
- 按“信封”进行支出分析
- 内置帮助和指导

有关详细架构，请参阅 [DESIGN.md](DESIGN.md)。

## 路线图

NextLedger 正在朝着一个**未来账本**发展——请参阅 [未来账本愿景](docs/FUTURE_LEDGER_VISION.md) 以了解完整的架构。

| Layer | 状态 | 描述 |
| ------- | -------- | ------------- |
| 观察 | ✅ 完成 | 本地余额、交易、账户 |
| 解释 | ✅ 完成 | “信封式”预算、支出分析 |
| 意图声明 | 🔜 计划中 | 预算目标、分配规则 |
| 约束执行 | 🔜 计划中 | 预算限制、过度消费保护 |
| 用户批准的执行 | 🔮 未来 | Web3 集成（非托管） |

## 开发

### 先决条件

- Windows 10 (1809+) 或 Windows 11
- Visual Studio (2022 17.8+ 或更高版本)，包含：
- .NET Desktop Development 工作负载
- Windows App SDK C# 模板
- Windows SDK / MSIX (Appx/PRI 构建工具)
- .NET 9 SDK

**关于命令行构建 (WinUI) 的说明：** WinUI 项目 (`NextLedger.App`) 需要执行 Windows App SDK 的构建步骤，这些步骤需要 Appx/MSIX + PRI MSBuild 任务组件。 如果您遇到类似于 `MSB4062` 的错误，提示缺少 `Microsoft.Build.AppxPackage.dll` 或 `Microsoft.Build.Packaging.Pri.Tasks.dll`，请通过 Visual Studio 安装程序安装 Windows SDK / MSIX 组件（或者在 Visual Studio 中构建应用程序）。

### 构建

```bash
dotnet restore
dotnet build
```

### 如何运行应用程序

**Visual Studio（推荐）**

1. 在 Visual Studio 2022 中打开 `NextLedger.sln` 文件。
2. 将 `NextLedger.App` 设置为启动项目。
3. 使用 **F5** 键运行程序。

**CLI (构建 + 启动)**

```bash
dotnet build .\src\NextLedger.App\NextLedger.App.csproj -c Debug
```

如果出现 `MSB4062` 错误，请参考“先决条件”部分中的说明。

然后，从构建输出文件夹中运行生成的 .exe 文件，具体路径为：

- `.\src\NextLedger.App\bin\Debug\net9.0-windows10.0.19041.0\`

**本地数据存储位置**

该应用程序会在以下位置创建一个本地 SQLite 数据库：

- `%LOCALAPPDATA%\NextLedger\NextLedger.db` (该文件位于用户的本地应用程序数据文件夹下的 NextLedger 文件夹中，是一个数据库文件。)

### 运行测试

```bash
dotnet test
```

## 许可

MIT 许可证 - 详情请参阅 LICENSE 文件。

## 作者

由 [mcp-tool-shop](https://github.com/mcp-tool-shop-org) 构建。
