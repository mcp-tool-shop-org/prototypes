---
name: voice-status
description: Check the status of the voice soundboard engine including health, backend, and capabilities.
---

# Voice Engine Status

Check the health and capabilities of the voice soundboard engine.

## Instructions

1. Call the `voice.status` MCP tool with `include_metrics: true`
2. Display the results as:

   | Field | Value |
   |-------|-------|
   | Health | healthy / unhealthy |
   | Backend | kokoro / piper / etc. |
   | Streaming | supported / not supported |
   | Emotion | supported / not supported |
   | Voice Cloning | supported / not supported |

3. If the engine is not reachable, provide troubleshooting steps:
   - Check that voice-soundboard is installed: `pip install voice-soundboard[kokoro]`
   - Ensure the PYTHONPATH includes `F:/AI/voice-soundboard`
   - Try restarting Claude Code to re-initialise the MCP connection
