---
name: push
description: Capture a side-thought, blocker, or observation without losing your current focus.
argument-hint: [observation or note]
---

# Push Aside

Capture this observation: **$ARGUMENTS**

## Instructions

1. Parse the user's input to determine:
   - **Text**: The core observation or note
   - **Priority**: Is this urgent (`high`), notable (`med`), or minor (`low`)?
   - **Reason**: Why is this worth capturing?
   - **Tags**: What category? (`bug`, `idea`, `blocker`, `perf`, `debt`, etc.)

2. Assign priority based on urgency:
   - `high` — blocks progress, needs immediate attention later
   - `med` — worth remembering, should be addressed this session (default)
   - `low` — minor observation, OK if it expires

3. Call `aside.push` with the parsed fields

4. Confirm what was captured, briefly — don't break the user's flow

## Tips

- Keep interjections concise — they're notes, not essays
- Tag generously — makes them easier to filter later
- High priority triggers a notification; use sparingly
