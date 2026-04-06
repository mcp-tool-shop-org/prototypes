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

**Envelope budgeting for Windows — give every dollar a job.**

A Windows-first personal finance app using envelope budgeting methodology. Your data stays local, no cloud required. Built as a **future ledger** — an authoritative system of financial truth with explicit human agency at every boundary.

## Download

📦 **[Latest Release](https://github.com/mcp-tool-shop-org/NextLedger/releases/latest)**

Download the ZIP, extract, and run `NextLedger.App.exe`. No installation required.

## What is Envelope Budgeting?

Envelope budgeting is a simple, proven method where you allocate your income into virtual "envelopes" for different spending categories. You can only spend what's in each envelope, making overspending impossible.

## Features

- **Offline-First**: Your data stays on your machine. No cloud required.
- **Envelope Budgeting**: Allocate every dollar to a purpose with grouped envelopes, custom colors, and savings goals
- **Multiple Accounts**: Track checking, savings, credit cards, cash, lines of credit, and investment accounts
- **Transaction Tracking**: Log inflows, outflows, and account-to-account transfers with split transaction support
- **CSV Import**: Import bank statements with automatic column detection and duplicate fingerprinting
- **Reconciliation**: Match your records with bank statements using cleared/uncleared tracking
- **XRPL Observation**: Track XRP Ledger addresses as read-only external accounts (non-custodial, view-only)
- **Spending Analysis**: Review spending by envelope with monthly budget snapshots
- **Windows Native**: Built with WinUI 3 for a modern Windows experience

## Screenshots

*Coming soon*

## Documentation

- [Changelog](CHANGELOG.md)
- [Engine Error Codes](ENGINE_ERROR_CODES.md)
- [Release Process](docs/RELEASE_PROCESS.md)
- [Future Ledger Vision](docs/FUTURE_LEDGER_VISION.md)
- [Ledger Execution Checklist](docs/LEDGER_EXECUTION_CHECKLIST.md)

## Technology

- **UI**: WinUI 3 / Windows App SDK
- **Language**: C# / .NET 9
- **Database**: SQLite (local)
- **Architecture**: Clean Architecture with MVVM

## Project Status

✅ **v1.0.0** - Ready for release

Core functionality complete:
- Budget management with monthly allocations, carry-forward, and auto-assign to goals
- Transaction tracking with split support, transfers, and clear/reconcile workflow
- CSV import with automatic column detection and SHA256 duplicate fingerprinting
- Account reconciliation with cleared/uncleared balance tracking
- Spending analysis by envelope with monthly snapshots
- XRPL external ledger observation (read-only, non-custodial)
- In-app help, diagnostics, and settings

See [DESIGN.md](DESIGN.md) for detailed architecture.

## Roadmap

NextLedger is evolving toward a **future ledger** — see [Future Ledger Vision](docs/FUTURE_LEDGER_VISION.md) for the full architecture.

| Layer | Status | Description |
|-------|--------|-------------|
| Observation | Complete | Local balances, transactions, accounts, XRPL address tracking |
| Interpretation | Complete | Envelope budgeting, spending analysis, XRPL balance change explanation |
| Intent Declaration | Planned | Budget goals, allocation rules |
| Constraint Enforcement | Planned | Budget limits, overspend protection |
| User-Approved Execution | Future | Web3 execution with explicit human approval |

## Development

### Prerequisites

- Windows 10 (1809+) or Windows 11
- Visual Studio (2022 17.8+ or newer) with:
  - .NET Desktop Development workload
  - Windows App SDK C# Templates
  - Windows SDK / MSIX (Appx/PRI build tools)
- .NET 9 SDK

**Note on CLI builds (WinUI):** The WinUI project (`NextLedger.App`) runs Windows App SDK build steps that require the Appx/MSIX + PRI MSBuild task assemblies. If you see an error like `MSB4062` referencing missing `Microsoft.Build.AppxPackage.dll` or `Microsoft.Build.Packaging.Pri.Tasks.dll`, install the Windows SDK / MSIX components via the Visual Studio Installer (or build the app from within Visual Studio).

### Building

```bash
dotnet restore
dotnet build
```

### How to Run the App

**Visual Studio (recommended)**

1. Open `NextLedger.sln` in Visual Studio 2022.
2. Set `NextLedger.App` as the startup project.
3. Run with **F5**.

**CLI (build + launch)**

```bash
dotnet build .\src\NextLedger.App\NextLedger.App.csproj -c Debug
```

If this fails with `MSB4062`, see the note in **Prerequisites**.

Then run the generated exe from the build output folder under:

- `.\src\NextLedger.App\bin\Debug\net9.0-windows10.0.19041.0\`

**Local data location**

The app creates a local SQLite database at:

- `%LOCALAPPDATA%\NextLedger\NextLedger.db`

### Running Tests

```bash
dotnet test
```

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | Local SQLite database (`%LOCALAPPDATA%\NextLedger\NextLedger.db`), CSV files (import only) |
| **Data NOT touched** | No cloud services, no network requests, no telemetry, no analytics |
| **Permissions** | Read/write: local database file. Read: CSV files for import |
| **Network** | None — fully offline desktop application |
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

MIT License - see LICENSE file for details.

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
