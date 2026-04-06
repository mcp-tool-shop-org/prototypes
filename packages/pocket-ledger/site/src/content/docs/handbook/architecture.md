---
title: Architecture
description: Clean Architecture layers in Pocket Ledger — domain, application, infrastructure, and UI.
sidebar:
  order: 3
---

Pocket Ledger follows Clean Architecture with four distinct layers. Dependencies point inward: outer layers depend on inner layers, never the reverse.

## Domain layer

Core entities and business rules with zero external dependencies.

**Entities:**

- **Account** — checking, savings, credit card, cash, investment, or other. Tracks balance, currency, and active state.
- **Transaction** — income, expense, or transfer. Links to an account and optionally a category. Supports cleared/uncleared status.
- **Category** — hierarchical grouping with parent/child support. Has a transaction type (income or expense), icon, color, and system-protected flag.
- **Envelope** — monthly budget allocation tied to a category. Tracks allocated vs. spent amounts, computes remaining balance and percent used.
- **Goal** — savings target with optional deadline. Tracks current vs. target amount, percent complete, days remaining, and required monthly contribution.
- **RecurringTransaction** — template for auto-generated transactions. Supports daily, weekly, bi-weekly, monthly, quarterly, and yearly patterns with configurable day-of-month and day-of-week.

**Value objects:**

- **Money** — immutable currency-aware amount with 2-decimal rounding. Enforces same-currency arithmetic and provides comparison operators.
- **DateRange** — immutable date interval with helpers for month/year ranges, containment, and overlap checks.

**Domain events** propagate state changes (transaction created, budget exceeded, goal reached) without coupling layers.

## Application layer

Use cases that orchestrate domain logic:

- Service interfaces define boundaries: `ITransactionService`, `IAccountService`, `IBudgetService`, `IGoalService`, `ICategoryService`
- DTOs carry data between layers without leaking domain types
- Validators enforce input constraints before reaching the domain
- A `Result<T>` type provides explicit success/failure without exceptions for expected cases
- Application-level exceptions (`ValidationException`, `ConflictException`, `ServiceUnavailableException`) carry structured error codes

## Infrastructure layer

Persistence and external concerns:

- **Entity Framework Core** with SQLite — repository pattern, unit of work, fluent entity configurations
- **JsonSettingsService** — reads/writes user preferences to `%LocalAppData%\PocketLedger\settings.json` with thread-safe caching
- **InMemoryEventDispatcher** — routes domain events to handlers
- **EventStore** — persists domain events for audit
- **FileLoggerProvider** — local file logging

## Desktop layer (planned)

WinUI 3 presentation with MVVM:

- **CommunityToolkit.Mvvm** for observable properties, commands, and messaging
- **Microsoft.Extensions.DependencyInjection** for service registration
- Views bind to ViewModels, ViewModels call Application services

## Testing strategy

| Layer | Test type | Dependencies |
|-------|-----------|-------------|
| Domain | Pure unit tests | None |
| Application | Unit tests | Mocked repositories |
| Infrastructure | Integration tests | In-memory SQLite |
