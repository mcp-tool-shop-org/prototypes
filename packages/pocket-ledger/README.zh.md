<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/pocket-ledger/readme.png" width="400" alt="Pocket Ledger">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/pocket-ledger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

一款为 Windows 平台设计的、以本地优先的个人财务和预算管理应用程序。界面简洁、易用，注重隐私保护。

## 设计理念

- **本地优先**: 您的财务数据存储在您的设备上。无需云同步。
- **隐私优先**: 零数据收集，除非您选择启用，否则不与其他外部服务连接。
- **信封式预算**: 一种经过验证的方法，为每一笔支出分配明确的目的。
- **目标导向**: 关注您正在为之储蓄的目标，而不仅仅是您的支出。

## 功能（计划中）

- [ ] 交易记录，并可进行分类
- [ ] 基于“信封”的预算系统
- [ ] 带有可视化进度条的储蓄目标
- [ ] 定期交易管理
- [ ] 可视化的支出分析和报告
- [ ] 多账户支持
- [ ] CSV 导入/导出功能
- [ ] 深色/浅色主题支持

## 技术栈

- **.NET 8**: 现代、高性能的运行时环境
- **WinUI 3 / Windows App SDK**: 原生的 Windows 11 体验
- **SQLite**: 本地、可移植的数据库
- **Clean Architecture**: 易于维护、易于测试的架构

## 项目结构

```
src/
├── PocketLedger.Domain/        # Core entities and business rules
├── PocketLedger.Application/   # Use cases and application logic
├── PocketLedger.Infrastructure/# Data persistence, external services
└── PocketLedger.Desktop/       # WinUI 3 presentation layer
tests/
├── PocketLedger.Domain.Tests/
├── PocketLedger.Application.Tests/
└── PocketLedger.Infrastructure.Tests/
```

## 开发

### 先决条件

- Windows 10/11
- Visual Studio 2022 (17.8+) 或 VS Code 配合 C# Dev Kit
- .NET 8 SDK
- Windows App SDK

### 构建

```bash
dotnet build
```

### 运行测试

```bash
dotnet test
```

## 许可证

MIT 许可证 - 详情请参见 [LICENSE](LICENSE)。

## 贡献

欢迎贡献！在提交拉取请求之前，请阅读我们的贡献指南。

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
