# Phase 1 — Foundation (Weeks 1–4)

## Objectives
- Define architectural doctrine
- Establish modular boundaries
- Implement core skeleton

## Deliverables
- ARCHITECTURE.md
- MANIFESTO.md
- Plugin API v1 Spec
- Core loader system
- Event bus abstraction
- Registrum integration (invariant engine)

## Core Rules
- Core remains thin
- All functionality is plugin-based
- No direct module-to-module calls
- Fail-closed invariant enforcement

## Success Criteria
- Core loads mock plugins
- Event bus dispatch verified
- Invariants can register and execute