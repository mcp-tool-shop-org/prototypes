---
title: Planned Features
description: What Pocket Ledger supports today and what is coming next.
sidebar:
  order: 2
---

Pocket Ledger's domain, application, and infrastructure layers are implemented. The desktop UI is the next milestone.

## Implemented (backend)

### Transaction tracking

Categorized transactions with support for income, expenses, and account-to-account transfers. Each transaction carries a date, amount (as a currency-aware Money value), description, optional notes, and optional category. Transactions can be marked cleared or uncleared, and linked to a recurring transaction template.

### Multi-account support

Six account types: checking, savings, credit card, cash, investment, and other. Each account tracks its own currency and balance. Accounts can be activated, deactivated, and reordered.

### Envelope budgeting system

Full envelope lifecycle — create envelopes tied to a category and month, allocate income, track spending against allocation, and check over-budget status. Envelopes compute remaining balance and percent used. The budget service supports copying envelopes to the next month and generating a period summary.

### Savings goals

Set a target amount and optional deadline. Pocket Ledger tracks current progress, percent complete, days remaining, and the required monthly contribution to reach the goal on time. Goals can be archived after completion.

### Recurring transactions

Define repeating income and expenses with six recurrence patterns: daily, weekly, bi-weekly, monthly, quarterly, and yearly. Each template specifies a day-of-month or day-of-week, a start date, and an optional end date. The system tracks the next due date and auto-deactivates past the end date.

### Category system

Hierarchical categories with parent/child support. Each category has a transaction type (income or expense), an optional icon and color, and a display order. System categories are protected from renaming or deactivation.

## Planned (not yet built)

### Desktop UI

WinUI 3 presentation layer with MVVM pattern, CommunityToolkit.Mvvm, and native Windows 11 styling. Pages for dashboard, transactions, budgets, goals, and settings.

### Visual insights and reports

Spending breakdowns by category and time period. Month-over-month trend charts.

### CSV import and export

Import transaction history from bank CSV exports. Export data for portability or external analysis.

### Theme support

Dark and light theme support following Windows system preferences.
