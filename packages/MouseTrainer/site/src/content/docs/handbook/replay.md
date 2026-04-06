---
title: Replay System
description: Recording, verification, and the binary .mtr format.
sidebar:
  order: 4
---

Every MouseTrainer session can be recorded and verified for anti-cheat and leaderboard integrity.

## Components

| Component | Role |
|-----------|------|
| ReplayRecorder | Captures per-tick quantized input samples during live play |
| InputTrace | Run-length encoded input stream for compact storage |
| ReplaySerializer | Binary `.mtr` format: magic header, LEB128 varints, FNV-1a checksum |
| ReplayVerifier | Re-simulates tick-by-tick; verifies event hash + score + combo match |
| EventStreamHasher | Rolling FNV-1a hash over the simulation event stream |

## Wire format

```
[MTRP magic (4 bytes)][FormatVersion (uint16)][Flags (uint16)]
[RunDescriptor section (length-prefixed)]
[InputTrace section (length-prefixed)]
[Verification (score int32 + maxCombo int32 + eventHash uint64)]
[FNV-1a checksum (uint64)]
```

The binary format uses:
- **Magic bytes**: `MTRP` header for file identification
- **Little-endian** byte order throughout
- **LEB128 varints**: compact variable-length integer encoding for counts and string lengths
- **Length-prefixed sections**: each major section stores a uint32 byte length before its payload
- **FNV-1a checksum**: integrity verification over everything before the final 8 bytes

### RunDescriptor section contents

The run section encodes mode (UTF-8 string), seed (uint32), difficulty (uint8), generator version (uint16), ruleset version (uint16), fixed Hz (uint16), and a LEB128-counted list of mutator specs. Each mutator spec contains its ID string, version, and sorted key-value parameters.

### InputTrace section contents

The input trace stores total tick count (uint32) followed by a LEB128-counted list of run-length-encoded spans. Each span contains a duration (LEB128), quantized X/Y (int16 each), and a button-state byte. The deserializer validates that span durations sum to the declared total.

## Verification process

The `ReplayVerifier` takes a recorded `.mtr` file and:

1. Deserializes the replay data
2. Recreates the exact game state from the `RunDescriptor`
3. Feeds the recorded input trace tick-by-tick
4. Compares the resulting event stream hash, final score, and combo count
5. Reports pass/fail with specific divergence details if mismatched

This guarantees that any claimed score was actually achieved through legitimate play.
