---
title: Voices
description: Voice library, emotion routing, and configuration for Soundboard Plugin.
sidebar:
  order: 3
---

Soundboard Plugin ships with 12 curated voices covering male, female, American, and British accents. Each voice has a distinct personality suited to different use cases.

## Voice library

| Voice | ID | Gender | Style |
|-------|-----|--------|-------|
| Fenrir | `am_fenrir` | M | Powerful, authoritative (default) |
| Eric | `am_eric` | M | Energetic, urgent |
| Liam | `am_liam` | M | Warm, conversational |
| Onyx | `am_onyx` | M | Deep, steady |
| Aoede | `af_aoede` | F | Clear, expressive |
| Jessica | `af_jessica` | F | Professional, neutral |
| Sky | `af_sky` | F | Bright, friendly |
| Alice | `bf_alice` | F | British, composed |
| Emma | `bf_emma` | F | British, warm |
| Isabella | `bf_isabella` | F | British, refined |
| George | `bm_george` | M | British, formal |
| Lewis | `bm_lewis` | M | British, measured |

Voice ID prefixes: `am_` = American male, `af_` = American female, `bm_` = British male, `bf_` = British female.

## Presets

Presets map common use cases to a voice and speed combination:

| Preset | Voice | Speed | Use for |
|--------|-------|-------|---------|
| default | am_fenrir | 1.0x | Powerful, commanding (Fenrir) |
| narrator | am_fenrir | 0.95x | Calm, powerful pace (Fenrir) |
| announcer | am_eric | 1.1x | Confident, bold (Eric) |
| storyteller | bf_emma | 0.9x | Refined, expressive (Emma) |
| friendly | am_liam | 1.0x | Warm, approachable (Liam) |
| professional | af_jessica | 1.0x | Clear, business-ready (Jessica) |

## Emotion routing

The plugin detects 8 emotions from context and adjusts voice delivery:

| Emotion | Default voice | Speed | When it triggers |
|---------|--------------|-------|-----------------|
| neutral | bm_george | 1.0x | Default, no strong signal |
| serious | bm_george | 1.0x | Error reports, warnings |
| friendly | am_liam | 1.0x | Positive interaction, greetings |
| professional | af_jessica | 1.0x | Business context, formal tone |
| calm | bm_george | 0.95x | Explanations, walkthroughs |
| joy | am_liam | 1.06x | Celebrating success, positive results |
| urgent | am_eric | 1.12x | Time-sensitive notifications, alerts |
| whisper | am_onyx | 0.92x | Quiet, subtle, ambient speech |

Emotion detection is automatic based on the text content and context. You can also pass an explicit `emotion` parameter to `voice.speak` to override the detection. Unknown emotion names are downgraded to `neutral` with a warning.

## Configuration

All configuration is via environment variables. No config files.

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_OUTPUT_ROOT` | `{tempdir}/voice-soundboard/` | WAV output directory |
| `VOICE_SOUNDBOARD_RATE_COOLDOWN_MS` | `0` (disabled) | Per-tool rate limit cooldown in milliseconds |
| `VOICE_SOUNDBOARD_RETENTION_MINUTES` | `240` | Auto-delete WAVs older than this (minutes) |
| `VOICE_SOUNDBOARD_AMBIENT_ENABLED` | `0` | Enable inner monologue system (set to `1` to enable) |

### Voice allowlist

Only the 12 voices listed above are permitted. Passing an unknown voice ID to any tool results in a structured error with a hint listing valid options. This is a security measure to prevent arbitrary voice model loading.
