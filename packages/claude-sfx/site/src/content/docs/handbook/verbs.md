---
title: The 7 Verbs
description: How Claude Code actions map to sounds.
sidebar:
  order: 2
---

Every Claude Code action maps to one of 7 core verbs. Modifiers (status, scope, direction) alter the sound without breaking coherence.

## Verb table

| Verb | Triggers | Sound |
|------|----------|-------|
| **intake** | Read, WebFetch, WebSearch | Soft rising sine — something coming in |
| **transform** | Edit | FM-textured pulse — reshaping |
| **commit** | Write, NotebookEdit, git commit | Sharp stamp tone — sealed |
| **navigate** | Grep, Glob | Sonar ping — scanning |
| **execute** | Bash, npm test, tsc | Noise burst + tone — mechanical action |
| **move** | mv, cp, subagent spawn | Wind whoosh — air displacement |
| **sync** | git push, git pull | Dramatic whoosh + tonal anchor |

## Modifiers

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
```

## Smart Bash detection

The hook handler inspects Bash commands to pick the right sound:

| Bash Command | Verb | Status |
|---|---|---|
| `git push` | sync (up) | from exit code |
| `git pull` | sync (down) | from exit code |
| `npm test`, `pytest` | execute | from exit code |
| `tsc`, `npm run build` | execute | from exit code |
| `mv`, `cp` | move | — |
| `rm` | move | warn |
| everything else | execute | from exit code |
