---
name: snapshot
description: Save a comprehensive state snapshot for session continuity. Use before /compact or at natural breakpoints.
argument-hint: [description of current work]
---

# Save Snapshot

Save a structured snapshot of the current session state.

## Instructions

1. Analyze the current session context:
   - What are we currently working on?
   - What has been completed?
   - What are the next steps?
   - Are there any blockers?
   - Which files are most relevant?
2. Call the `copilot.snapshot` tool with:
   - **workingOn**: $ARGUMENTS (or infer from context)
   - **done**: list of completed items from this session
   - **nextSteps**: list of next actions in priority order
   - **blockers**: any unresolved issues
   - **keyFiles**: files central to current work
   - **notes**: anything the next session needs to know
3. Confirm the snapshot was saved
4. Tell the user they can now safely `/compact` or end the session

## Tips

- Be specific in nextSteps — "fix the auth bug in login.ts" not "fix bugs"
- Include file paths so the next session knows where to look
- Capture blockers even if they seem minor — they help prioritize
