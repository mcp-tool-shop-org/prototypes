---
name: voices
description: List available voices and presets from the voice soundboard engine.
---

# List Voices

List all available voices and presets from the voice soundboard engine.

## Instructions

1. Call the `voice.list_voices` MCP tool
2. Organise the output as:

   ### Presets
   Show each preset with its voice and speed setting.

   ### Voices by Accent
   Group voices by accent (American, British), then by gender.
   Show voice ID and name for each.

3. If the engine is not available, explain that voice-soundboard needs to be
   running and show how to check status with `/soundboard:voice-status`
