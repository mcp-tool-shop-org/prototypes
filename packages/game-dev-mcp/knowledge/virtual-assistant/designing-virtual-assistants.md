---
title: "Designing a Virtual Assistant in UE5"
category: virtual-assistant
tags: [virtual-assistant, metahuman, character, llm, voice, avatar]
difficulty: advanced
summary: "Architecture and approach for building an LLM-powered virtual assistant in Unreal Engine 5."
ueVersion: "5.4+"
---

## Architecture Overview

A virtual assistant in UE5 combines:
1. **Character model** — MetaHuman, custom mesh, or stylized avatar
2. **Voice I/O** — speech-to-text input, text-to-speech output
3. **LLM backend** — conversation and reasoning (OpenAI, Claude, local models)
4. **Animation** — lipsync, gestures, facial expressions, idle movement
5. **UI** — chat interface, transcript, controls

## Character Options

### MetaHuman
Epic's photorealistic digital humans. Full face rig with 200+ blend shapes.
- Best for: realistic assistants, corporate, healthcare
- Requires: MetaHuman plugin, significant GPU resources

### Custom Skeletal Mesh
Any humanoid or creature model with a skeleton.
- Best for: game-style assistants, mascots
- Requires: rigging, Animation Blueprint

### VRM Avatars
Standardized avatar format popular in VTuber/social spaces.
- Best for: anime-style, user-customizable avatars
- Requires: VRM4U plugin (runtime loading support)

## Voice Pipeline

```
User speaks → Speech-to-Text → LLM → Text-to-Speech → Audio playback + Lipsync
```

### Speech-to-Text
- Azure Cognitive Services Speech
- Google Cloud Speech-to-Text
- Whisper (local, via ONNX or API)

### Text-to-Speech
- Azure TTS (neural voices)
- ElevenLabs
- KokoroSharp (local, ONNX-based)
- Bark / XTTS (local, GPU)

## LLM Integration

HTTP requests from UE5 to LLM API:
- Use `FHttpModule` in C++ or HTTP Blueprint nodes
- Stream responses for real-time text display
- Maintain conversation context (message history array)

## Lipsync Approaches

1. **Viseme-driven** — TTS engine outputs viseme timing, mapped to blend shapes
2. **Audio-driven (FFT)** — analyze audio frequency bands, estimate mouth shapes
3. **OVR Lip Sync** — Meta's real-time lipsync library
4. **Phoneme-based** — use phoneme data from TTS, map to blend shapes

## Expression System

Map emotions to blend shape sets:
- Happy → smile blend shapes + eye squint
- Sad → frown + brow down
- Surprised → wide eyes + raised brows + open mouth
- Angry → furrowed brow + compressed lips

Drive expressions from LLM emotion tags or sentiment analysis.

## Key Components (C++ or Blueprint)

| Component | Purpose |
|-----------|---------|
| `BridgeClient` | WebSocket/HTTP to LLM/TTS service |
| `TtsAudioPlayer` | Audio playback from TTS output |
| `VisemeDriver` | Audio → mouth shape mapping |
| `ExpressionMapper` | Emotion → blend shape mapping |
| `AvatarLoader` | Runtime character model loading |
