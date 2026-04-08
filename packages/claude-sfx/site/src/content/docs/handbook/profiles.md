---
title: Profiles & Configuration
description: Sound palettes, anti-annoyance features, and configuration options.
sidebar:
  order: 3
---

## Profiles

Sound palettes that change the entire character with one flag.

| Profile | Character |
|---------|-----------|
| **minimal** (default) | Sine-wave tones — subtle, professional, daily-driver |
| **retro** | Square-wave 8-bit chirps — fun but controlled |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### Custom profiles

Copy `profiles/minimal.json`, edit the synthesis parameters, load it:

```bash
claude-sfx play navigate --profile ./my-profile.json
```

Every number in the JSON maps directly to the synth engine — waveform, frequency, duration, envelope (ADSR), FM depth, bandwidth, gain.

## Anti-annoyance

| Feature | Behavior |
|---------|----------|
| **Debounce** | Same verb within 200ms → one sound |
| **Rate limit** | Max 8 sounds per 10-second window |
| **Quiet hours** | All sounds suppressed during configured hours |
| **Mute** | Instant toggle, survives session restart |
| **Volume** | 0–100 gain control |
| **Per-verb disable** | Turn off specific verbs you don't want |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```
