---
title: Getting Started
description: Download and start using NextLedger for envelope budgeting on Windows.
sidebar:
  order: 1
---

NextLedger is an offline-first envelope budgeting app for Windows. Your financial data stays local in a SQLite database — no cloud, no account, no subscription.

## Download

1. Go to the [latest release](https://github.com/mcp-tool-shop-org/NextLedger/releases/latest)
2. Download the ZIP archive
3. Extract to any folder
4. Run `NextLedger.App.exe`

No installation required. Windows 10 (1809+) or Windows 11.

## Your first budget

1. **Add accounts** — checking, savings, credit card, cash, line of credit, or investment
2. **Enter starting balances** for each account
3. **Create envelopes** — Rent, Groceries, Gas, Fun Money, Savings, etc. Group them by category for organization
4. **Allocate income** — distribute this month's income across your envelopes until Ready-to-Assign reaches zero
5. **Log transactions** — record each purchase as an outflow assigned to an envelope, or log income as an inflow
6. **Import CSV** — use the Import page to catch anything you missed from your bank export
7. **Reconcile** — compare your records with your bank statement on the Reconciliation page

## App pages

NextLedger has dedicated pages for each workflow:

- **Budget** — view and allocate envelopes for the current month
- **Transactions** — browse, create, and edit inflows, outflows, and transfers
- **Import** — load CSV files from your bank and preview before committing
- **Spending** — analyze spending by envelope
- **Reconciliation** — match your records against bank statements
- **Settings** — configure app preferences
- **Diagnostics** — view engine metrics and health
- **Help / About** — in-app guidance and version info

## Data location

NextLedger stores everything in a local SQLite database:

```
%LOCALAPPDATA%\NextLedger\NextLedger.db
```

Back up this file to preserve your data. No cloud sync is used.
