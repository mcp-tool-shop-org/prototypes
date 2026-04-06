---
name: decisions
description: Review the decision log. Shows what was decided, why, and what alternatives were rejected.
argument-hint: [optional search keyword]
---

# Decision Log

Show recent decisions made across sessions.

## Instructions

1. If $ARGUMENTS is provided, call `copilot.query` with keyword=$ARGUMENTS and type="decisions"
2. If no arguments, call `copilot.query` with type="decisions" and limit=15
3. Present each decision clearly:
   - **What**: The decision made
   - **Why**: The rationale
   - **Rejected**: Alternatives that were not chosen
   - **Confidence**: How confident we were
   - **Tags**: Category labels
4. Group by session if spanning multiple sessions
5. If the user wants to log a new decision, use `copilot.decision`

## Tips

- Search by file path to find decisions about specific code
- Search by tag to find all "architecture" or "perf" decisions
- Decisions persist across sessions — useful for onboarding or audits
