---
name: resume
description: Pick up where the last session left off. Loads the latest snapshot, recent decisions, and timeline summary.
argument-hint:
---

# Resume Session

Resume working from where the last session ended.

## Instructions

1. Call the `copilot.resume` tool to load the last session's state
2. Read the returned snapshot, decisions, and timeline summary
3. If there are pattern alerts, mention them to the user
4. Summarize:
   - What was being worked on
   - What is done
   - What the next steps are
   - Any open blockers
5. Ask the user if they want to continue where things left off or pivot to something else

## Tips

- Call this at the very start of a new session
- If no snapshot exists, this is a fresh project — just start working
- Pattern alerts may indicate recurring issues from previous sessions
