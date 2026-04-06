---
title: Reference
description: Technical reference for NextLedger — architecture, tech stack, and engine error codes.
sidebar:
  order: 5
---

## Tech stack

| Component | Technology |
|-----------|-----------|
| UI | WinUI 3 / Windows App SDK |
| Language | C# / .NET 9 |
| Database | SQLite (local) |
| Architecture | Clean Architecture with MVVM |

## Project structure

```
src/
├── NextLedger.Domain/          # Core entities, value objects, enums
│   ├── Entities/               # Account, Envelope, Transaction, BudgetPeriod, etc.
│   ├── ValueObjects/           # Money, DateRange
│   └── Enums/                  # AccountType, TransactionType, XrplIntentType
├── NextLedger.Application/     # Use cases and application logic
│   ├── Services/               # BudgetEngine, CsvImportService, EnvelopeService, etc.
│   ├── Interfaces/             # IBudgetEngine, repository contracts
│   ├── DTOs/                   # Data transfer objects for all operations
│   └── Validation/             # Account, envelope, transaction, and money validators
├── NextLedger.Infrastructure/  # Data persistence and external integrations
│   ├── Repositories/           # SQLite repository implementations
│   ├── Database/               # Schema and connection factory
│   └── Web3/                   # XRPL client (read-only observation)
└── NextLedger.App/             # WinUI 3 presentation layer
    ├── ViewModels/             # Budget, Transactions, Import, Reconciliation, Spending, Settings
    ├── Views/                  # XAML pages for each workflow
    ├── Converters/             # XAML value converters (money formatting, visibility, etc.)
    └── Services/               # AppHost, notifications, engine metrics
```

## Account types

| Type | Description |
|------|-------------|
| Checking | Standard checking/debit account |
| Savings | Savings account |
| CreditCard | Credit card (balance typically negative) |
| Cash | Physical cash on hand |
| LineOfCredit | Line of credit or loan |
| Investment | Investment or brokerage account |
| ExternalXrpl | XRPL ledger address (read-only, off-budget) |
| Other | Miscellaneous account type |

## Transaction types

| Type | Description |
|------|-------------|
| Inflow | Income or deposit (positive amount) |
| Outflow | Expense or payment (stored as negative amount) |
| Transfer | Movement between two accounts (linked transaction pair) |

## Building from source

Prerequisites:
- Windows 10 (1809+) or Windows 11
- Visual Studio 2022 (17.8+) with .NET Desktop Development workload
- .NET 9 SDK
- Windows App SDK C# Templates and MSIX build tools

```bash
dotnet restore
dotnet build
dotnet test
```

If you see `MSB4062` errors referencing missing `Microsoft.Build.AppxPackage.dll`, install the Windows SDK / MSIX components via the Visual Studio Installer.

## Engine error codes

NextLedger uses structured error codes with a stable code, a best-effort message, and an optional target field.

| Code | Meaning | UI handling |
|------|---------|-------------|
| `VALIDATION` | Invalid request payload | Inline field error or banner |
| `INVALID_OPERATION` | Business rule violation | Error banner with recovery hint |
| `NOT_IMPLEMENTED` | Operation wired but not yet built | Informational toast |
| `UNEXPECTED` | Unhandled exception | Generic error with retry |

See [ENGINE_ERROR_CODES.md](https://github.com/mcp-tool-shop-org/NextLedger/blob/main/ENGINE_ERROR_CODES.md) for the full catalog.

## Security

- All data stored locally in SQLite
- No network requests, telemetry, or analytics (XRPL sync is opt-in and read-only)
- No cloud sync or external API calls for core budgeting
- See [SECURITY.md](https://github.com/mcp-tool-shop-org/NextLedger/blob/main/SECURITY.md) for vulnerability reporting
