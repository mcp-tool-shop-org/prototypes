# Multi-Claude — Open Questions

No blocking questions. 6 known precision gaps documented in LOCK-PACKET.md:

1. **Worktree creation outside transaction.** Orphaned claim on crash. 2-hour lease expiry.
2. **In-memory session registry.** Lost on crash. DB has attempt records for recovery.
3. **Reconciliation filter patterns.** 8 hardcoded paths invisible. Documented, intentional.
4. **Session-level role conflicts.** Architectural assumptions, not DB constraints.
5. **Stop reason ≠ verification verdict.** `completed` = valid JSON, not verified. Documented.
6. **No automatic lease expiration.** Manual release required. Operational procedure.

All are documented operational trade-offs, not contract breaches.
