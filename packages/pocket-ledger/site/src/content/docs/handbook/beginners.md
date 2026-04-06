---
title: Beginner's Guide
description: Get started with Pocket Ledger — prerequisites, first steps, key concepts, and common workflows.
sidebar:
  order: 99
---

New to Pocket Ledger? This guide walks you through what it does, how to set it up, and how to start tracking your finances.

## What is Pocket Ledger?

Pocket Ledger is a local-first personal finance application for Windows. It tracks your income, expenses, and transfers across multiple accounts using an envelope budgeting approach. All data stays on your machine in a local SQLite database -- there is no cloud sync, no account creation, and no telemetry.

The application is built with .NET 8 and Clean Architecture. The domain logic, service layer, and database persistence are implemented and tested. The desktop UI (WinUI 3) is in development.

## Prerequisites

You need the following to build and run Pocket Ledger from source:

- **Windows 10 or Windows 11**
- **.NET 8 SDK** — download from [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Visual Studio 2022 (17.8+)** or **VS Code with the C# Dev Kit extension**
- **Git** — to clone the repository

Verify your .NET installation:

```bash
dotnet --version
```

You should see a version starting with `8.`.

## Installation and first run

Clone the repository and build:

```bash
git clone https://github.com/mcp-tool-shop-org/pocket-ledger.git
cd pocket-ledger
dotnet build
```

Run the test suite to confirm everything works:

```bash
dotnet test
```

All tests should pass. The project creates its data directory at `%LocalAppData%\PocketLedger\` on first run, storing the SQLite database (`pocketledger.db`) and a `settings.json` configuration file.

## Key concepts

### Accounts

An account represents a real-world financial account. Pocket Ledger supports six types: **Checking**, **Savings**, **CreditCard**, **Cash**, **Investment**, and **Other**. Each account tracks its own balance and currency. You can activate, deactivate, and reorder accounts.

### Transactions

Every financial event is a transaction. There are three types:

- **Income** — money coming in (stored as a positive amount)
- **Expense** — money going out (stored as a negative amount)
- **Transfer** — money moving between two of your accounts

Each transaction has a date, amount, description, and optional category. Transactions can be marked as cleared (reconciled with your bank) or uncleared.

### Categories

Categories organize your transactions. Each category belongs to a type (income or expense), can have a parent category for hierarchy, and supports an icon and color for display. System categories are built-in and cannot be renamed or deactivated.

### Envelopes

Envelopes implement the budgeting model. Each month, you create envelopes tied to categories and allocate a dollar amount to each one. As you spend, the envelope tracks how much is used. When an envelope hits 100%, that category is at its budget limit. Envelopes can be copied forward to the next month.

### Goals

A goal represents something you are saving toward — an emergency fund, a vacation, a new computer. You set a target amount and an optional deadline. Pocket Ledger computes your progress percentage, days remaining, and the monthly contribution needed to stay on track. Goals auto-complete when the target is reached and can be archived afterward.

### Recurring transactions

For predictable income and expenses (rent, subscriptions, paychecks), you create a recurring transaction template. Pocket Ledger supports six patterns: **Daily**, **Weekly**, **BiWeekly**, **Monthly**, **Quarterly**, and **Yearly**. Each template tracks the next due date and auto-deactivates after its optional end date.

## Common workflows

### Adding a transaction

1. Create an account (checking, savings, etc.) with a starting balance
2. Create categories for your spending (Groceries, Rent, Entertainment)
3. Record a transaction by specifying the date, amount, type (income/expense/transfer), account, and category

### Setting up a monthly budget

1. Create categories for your budget areas
2. Create envelopes for the current month, each tied to a category
3. Allocate your income across envelopes
4. As you record expenses, envelope spending updates automatically
5. At month end, copy envelopes to the next month to carry forward your budget structure

### Tracking a savings goal

1. Create a goal with a name, target amount, and optional deadline
2. Add contributions as you save
3. Monitor progress — Pocket Ledger shows percent complete and the monthly amount needed to reach your target on time
4. When the goal is reached, it auto-completes. Archive it when you are done.

## Where data is stored

Pocket Ledger keeps everything local:

| File | Location | Purpose |
|------|----------|---------|
| Database | `%LocalAppData%\PocketLedger\pocketledger.db` | All accounts, transactions, envelopes, goals |
| Settings | `%LocalAppData%\PocketLedger\settings.json` | User preferences (currency, theme, budget options) |
| Backups | `%LocalAppData%\PocketLedger\backups\` | Automatic database backups (configurable) |

To back up your data manually, copy the `pocketledger.db` file. To move to a new machine, transfer the entire `PocketLedger` folder.

## Next steps

- Read the [Philosophy](/pocket-ledger/handbook/philosophy/) page to understand the design principles
- Explore the [Architecture](/pocket-ledger/handbook/architecture/) page for a deeper look at how the layers fit together
- Check [Planned Features](/pocket-ledger/handbook/planned-features/) to see what is coming next
- Browse the [Reference](/pocket-ledger/handbook/reference/) for the full tech stack and entity catalog
