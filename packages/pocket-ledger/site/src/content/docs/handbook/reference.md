---
title: Reference
description: Technical reference for Pocket Ledger — tech stack, building, and project structure.
sidebar:
  order: 4
---

## Tech stack

| Component | Technology |
|-----------|-----------|
| Runtime | .NET 8 |
| UI Framework | WinUI 3 / Windows App SDK (planned) |
| ORM | Entity Framework Core |
| Database | SQLite |
| MVVM | CommunityToolkit.Mvvm (planned) |
| DI | Microsoft.Extensions.DependencyInjection |

## Project structure

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

## Domain entities

| Entity | Key fields |
|--------|-----------|
| Account | Name, AccountType, CurrencyCode, Balance, IsActive |
| Transaction | Date, Amount (Money), Type (Income/Expense/Transfer), Description, AccountId, CategoryId |
| Category | Name, Type, Icon, ColorHex, ParentCategoryId, IsSystem |
| Envelope | Name, CategoryId, Year, Month, Allocated (Money), Spent (Money) |
| Goal | Name, TargetAmount, CurrentAmount, TargetDate, Icon, ColorHex, IsCompleted |
| RecurringTransaction | Description, Amount, Pattern (Daily through Yearly), DayOfMonth, NextDueDate |

## Enums

| Enum | Values |
|------|--------|
| AccountType | Checking, Savings, CreditCard, Cash, Investment, Other |
| TransactionType | Income, Expense, Transfer |
| RecurrencePattern | None, Daily, Weekly, BiWeekly, Monthly, Quarterly, Yearly |

## Configuration

Settings are stored at `%LocalAppData%\PocketLedger\settings.json` and include three sections:

- **Database** — database path, backup path, auto-backup toggle, retention days
- **Preferences** — default currency, date format, theme (System/Light/Dark), week start day, month start day
- **Budget** — over-budget warning toggle, warning threshold percent, auto-copy envelopes, show remaining vs. spent

## Prerequisites

- Windows 10 or Windows 11
- Visual Studio 2022 (17.8+) or VS Code with C# Dev Kit
- .NET 8 SDK

## Building

```bash
dotnet build
dotnet test
```

## Security

- All data stored locally in SQLite
- No telemetry, no analytics, no network connections
- No credential storage
- See [SECURITY.md](https://github.com/mcp-tool-shop-org/pocket-ledger/blob/main/SECURITY.md) for vulnerability reporting
