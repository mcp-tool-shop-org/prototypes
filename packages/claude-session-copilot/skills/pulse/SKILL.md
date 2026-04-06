---
name: pulse
description: Check the project health dashboard. Shows sessions, activity, patterns, and blockers.
argument-hint:
---

# Project Pulse

Show current project health metrics.

## Instructions

1. Call the `copilot.pulse` tool
2. Present the results as a dashboard:
   - **Sessions**: Total count and current session info
   - **Activity**: Event count and most-touched files (top 5)
   - **Decisions**: Count of recent decisions
   - **Blockers**: Any open blockers from the last snapshot
   - **Patterns**: Unacknowledged pattern alerts with details
3. If there are pattern alerts, list them with actionable suggestions:
   - Repeated failure → "Consider a different approach or debug deeper"
   - File churn → "This file is getting heavy edits — consider refactoring"
   - Long session → "Save a snapshot before you lose context"
4. Suggest next actions based on the health data

## Tips

- Pulse is lightweight — safe to check frequently
- Hot files (most-touched) often indicate where the action is
- Open blockers carry over from previous sessions until resolved
