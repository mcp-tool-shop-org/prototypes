# repo-knowledge — Questions

## Answered during lockdown

### Q1: Can the system claim data was stored correctly when it wasn't?

**Answer:** The core catalog (8/10 write paths) is idempotent and safe. The audit evidence layer has gaps: findings can be duplicated on re-import (plain INSERT), and metrics error handling varies by call site. These are conservative failures — they store too much rather than losing data — but they inflate posture queries.

### Q2: Can queries return wrong results?

**Answer:** Audit posture can be inflated by duplicated findings (TC-1). FTS5 search can miss recently imported content (TC-3). Stats queries silently return undefined for missing audit tables (TC-2). Non-audit queries are correct.

### Q3: Is the schema migration system sound?

**Answer:** Functionally yes — migrations are additive and handle duplicate-column errors. But the version jump (1→3), error suppression in migration 003, and try/catch in getStats() mask partial migration state. Schema should fail hard, not degrade silently.
