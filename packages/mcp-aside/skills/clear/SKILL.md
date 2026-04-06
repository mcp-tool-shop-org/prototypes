---
name: clear
description: Clear the interjection inbox. Fresh start.
argument-hint:
---

# Clear Inbox

Clear all pending interjections.

## Instructions

1. Call `aside.status` to check how many items are in the inbox
2. If empty, tell the user the inbox is already clear
3. If items exist, call `aside.clear` to empty the inbox
4. Confirm the inbox was cleared and the count of items removed
