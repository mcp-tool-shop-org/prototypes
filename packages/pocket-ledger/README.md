<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/pocket-ledger/readme.png" width="400" alt="Pocket Ledger">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/pocket-ledger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

A local-first personal finance and budget tracking app for Windows. Clean, simple, and privacy-focused.

## Philosophy

- **Local-first**: Your financial data stays on your device. No cloud sync required.
- **Privacy by design**: Zero telemetry, zero external connections unless you opt-in.
- **Envelope budgeting**: Proven methodology that assigns every dollar a job.
- **Goal-oriented**: Focus on what you're saving for, not just what you're spending.

## Core Features

- **Transaction tracking** with categorized income, expenses, and account-to-account transfers
- **Multi-account support** for checking, savings, credit card, cash, and investment accounts
- **Envelope budgeting** with monthly allocation, spending tracking, and carry-forward
- **Savings goals** with target amounts, deadlines, progress tracking, and monthly contribution estimates
- **Recurring transactions** with daily, weekly, bi-weekly, monthly, quarterly, and yearly patterns
- **Category system** with parent/child hierarchy, icons, colors, and system-protected defaults
- **Currency-aware Money value object** that enforces same-currency arithmetic and 2-decimal rounding

> The desktop UI (WinUI 3) is planned. The domain, application, and infrastructure layers are implemented and tested.

## Tech Stack

- **.NET 8** - Modern, performant runtime
- **Entity Framework Core** - SQLite persistence with repository pattern
- **WinUI 3 / Windows App SDK** - Native Windows 11 experience (planned UI)
- **SQLite** - Local, portable database
- **Clean Architecture** - Four-layer separation: Domain, Application, Infrastructure, Desktop

## Project Structure

```
src/
├── PocketLedger.Domain/         # Entities, value objects, enums, domain events, specifications
├── PocketLedger.Application/    # Service interfaces, DTOs, validators, mappers, Result type
├── PocketLedger.Infrastructure/ # EF Core DbContext, repositories, settings, logging
tests/
├── PocketLedger.Domain.Tests/
├── PocketLedger.Application.Tests/
└── PocketLedger.Infrastructure.Tests/
```

## Development

### Prerequisites

- Windows 10/11
- Visual Studio 2022 (17.8+) or VS Code with C# Dev Kit
- .NET 8 SDK

### Building

```bash
dotnet build
```

### Running Tests

```bash
dotnet test
```

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | Financial transactions, budgets, and account data in local SQLite database |
| **Data NOT touched** | No telemetry. No analytics. No cloud sync. No external API calls. No credential storage |
| **Permissions** | Read/write: local SQLite database file only. No network access |
| **Network** | None — fully offline application |
| **Telemetry** | None collected or sent |

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10 |
| B. Error Handling | 10 |
| C. Operator Docs | 10 |
| D. Shipping Hygiene | 10 |
| E. Identity (soft) | 10 |
| **Overall** | **50/50** |

> Full audit: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
