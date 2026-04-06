---
name: speak
description: Speak text aloud using the voice soundboard engine. Use when the user asks to hear something, read text aloud, or wants audio output.
argument-hint: [text to speak]
---

# Speak

Speak the following text using the voice soundboard engine.

**Text to speak:** $ARGUMENTS

## Instructions

1. Use the `voice.speak` MCP tool to synthesise the text
2. Select emotion based on the tone of the text:
   - Positive / celebratory content → `emotion: "joy"`
   - Warnings or errors → `emotion: "anger"` or `"sadness"`
   - Explanations or tutorials → `emotion: "neutral"`
   - Neutral content → omit the emotion parameter
3. For long text (over 200 words), use `voice.stream` instead for lower latency
4. If no voice is specified, omit the voice parameter (engine uses its default)
5. After speaking, report the voice used and latency
6. If the engine is unavailable, inform the user and suggest checking `/soundboard:voice-status`
