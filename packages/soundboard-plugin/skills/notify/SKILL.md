---
name: notify
description: Send a spoken notification about a workflow event. Announce build results, test outcomes, deployments, or other development events aloud.
argument-hint: [event description]
---

# Voice Notification

Speak a short notification about: $ARGUMENTS

## Instructions

1. Analyse the description and select the best event type for the
   `voice.workflow_notify` MCP tool:

   | Pattern | event_type |
   |---------|-----------|
   | Build succeeded | `build_success` |
   | Build failed | `build_fail` |
   | Tests passed | `tests_pass` |
   | Tests failed | `tests_fail` |
   | Commit made | `commit` |
   | PR merged | `pr_merged` |
   | Deploy complete | `deploy` |

2. Write a concise message (under 15 words) summarising the event.
   Examples:
   - "All 47 tests passed"
   - "Build failed with 3 compilation errors in auth module"
   - "Pull request merged into main"
3. Call `voice.workflow_notify` with `event_type` and `message`
4. The tool automatically selects the right emotion and voice
