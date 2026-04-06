# PocketLedger Architecture

## Overview

PocketLedger follows **Clean Architecture** principles, ensuring separation of concerns and testability at every layer.

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│                   (PocketLedger.Desktop)                     │
│              WinUI 3 / MVVM / Views / ViewModels             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│                 (PocketLedger.Application)                   │
│           Use Cases / Services / DTOs / Interfaces           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│                   (PocketLedger.Domain)                      │
│          Entities / Value Objects / Domain Events            │
│              Business Rules / Specifications                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│               (PocketLedger.Infrastructure)                  │
│       SQLite Persistence / Repositories / File I/O          │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### Domain Layer (Core)
- **Entities**: Account, Transaction, Category, Envelope, Goal
- **Value Objects**: Money, DateRange, TransactionType
- **Domain Events**: TransactionCreated, BudgetExceeded, GoalReached
- **Business Rules**: Validation, invariants, domain logic
- **No external dependencies**

### Application Layer
- **Use Cases**: CreateTransaction, TransferFunds, AllocateBudget
- **Service Interfaces**: ITransactionService, IBudgetService
- **DTOs**: Data transfer objects for layer boundaries
- **Depends only on Domain layer**

### Infrastructure Layer
- **Repositories**: SQLite implementations of domain interfaces
- **Persistence**: Entity configurations, migrations
- **File Services**: CSV import/export, backup/restore
- **External Integrations**: Future bank sync (optional)

### Presentation Layer
- **Views**: XAML UI components
- **ViewModels**: MVVM pattern with CommunityToolkit.Mvvm
- **Navigation**: Page routing and state management
- **Theme**: Light/dark mode, accessibility

## Key Design Decisions

### Local-First Data
- SQLite database stored in user's AppData
- No mandatory cloud sync
- Optional local backup to user-specified location

### Envelope Budgeting Model
```
Budget Period
    └── Envelopes (Categories)
            └── Allocated Amount
            └── Spent Amount
            └── Remaining = Allocated - Spent
```

### Event-Driven Updates
Domain events notify the UI of changes without tight coupling:
- `TransactionCreated` → Update envelope remaining
- `BudgetExceeded` → Show notification
- `GoalReached` → Celebrate with user

### Dependency Injection
All dependencies are registered via Microsoft.Extensions.DependencyInjection:
```csharp
services.AddDomain();
services.AddApplication();
services.AddInfrastructure(configuration);
```

## Data Flow Example

**Creating a Transaction:**

1. User fills form in `TransactionView`
2. `TransactionViewModel` validates input
3. Calls `ITransactionService.CreateAsync(dto)`
4. Service maps DTO → Domain Entity
5. Applies business rules (envelope limits, etc.)
6. Raises `TransactionCreated` event
7. `ITransactionRepository.AddAsync(entity)`
8. SQLite persists the record
9. Event handlers update related aggregates
10. UI refreshes via data binding

## Testing Strategy

- **Domain Tests**: Pure unit tests, no mocking needed
- **Application Tests**: Mock repositories, test use cases
- **Infrastructure Tests**: Integration tests with in-memory SQLite
- **UI Tests**: Future - WinAppDriver or similar

## Phase 1 Focus (Deterministic Layers)

This phase establishes the foundational layers that don't depend on UI frameworks:

1. Domain entities and value objects
2. Repository interfaces
3. SQLite persistence
4. Basic services
5. Event system
6. Configuration management
7. Error handling infrastructure
8. Core unit tests
