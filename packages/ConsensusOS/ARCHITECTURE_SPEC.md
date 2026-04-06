# ConsensusOS Architecture Specification

## Core Design Principles
- Thin core
- Plugin-driven functionality
- Deterministic state transitions
- Chain-agnostic adapters
- Fail-closed invariants

## Core Components
- Plugin Loader
- Event Bus
- Invariant Engine (Registrum)
- State Registry
- CLI Entrypoint

## Module Isolation Rules
- No direct module-to-module calls
- All communication through event bus
- Each module declares capabilities + invariants