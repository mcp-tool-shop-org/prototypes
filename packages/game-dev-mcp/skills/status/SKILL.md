---
name: status
description: Check the connection to Unreal Engine and report system status.
argument-hint:
---

# Status Check

Check the connection to Unreal Engine and report status.

## Instructions

1. Call `ue_ping` to test the connection
2. If connected, call `ue_get_engine_info` to get version and route details
3. Call `ue_get_current_level` to show what level is loaded
4. Call `ue_get_all_actors` to get a count of actors in the level

5. Report:
   - Connection status (connected / disconnected)
   - Engine version (if connected)
   - Current level name
   - Actor count in the level
   - Any errors encountered

6. If disconnected, suggest:
   - Open UE5 editor
   - Enable Remote Control API plugin (Edit > Plugins)
   - Restart the editor
   - Check that port 30010 is not blocked
