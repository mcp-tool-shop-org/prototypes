<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/soundweave/readme.png" width="400" alt="SoundWeave">
</p>

# @soundweave/clip-engine

Audio clip sequencing, composition, and transformation engine for Soundweave.

## What It Owns

- Clip playback and scene clip assignment
- Note scheduling and quantized launch timing
- Composition transforms (transpose, invert, reverse, octave shift, rhythm scale)
- Variation tools (rhythmic, melodic, thin, densify, accents, ghost hits)
- Intensity derivation (low/mid/high, tension, brighten, pad voicing, bass line, arpeggiate)
- Chord tools (diatonic chords, chord palette, progressions)
- Cue scheduling and section resolution

## Key Exports

```ts
import {
  ClipPlayer,
  SceneClipPlayer,
  scheduleNotes,
  clipTranspose,
  clipInvert,
  clipReverse,
  resolveCuePlan,
  chordPalette,
  diatonicChords,
} from "@soundweave/clip-engine";
```

### Playback
- `ClipPlayer` — plays individual clips with note scheduling
- `SceneClipPlayer` — assigns and plays clips within scenes

### Transforms
- `clipTranspose`, `clipInvert`, `clipReverse`, `clipOctaveShift`, `clipRhythmScale`
- `clipDuplicateWithVariation`, `clipSnapToScale`, `clipFindOutOfScale`

### Variations
- `clipRhythmicVariation`, `clipMelodicVariation`, `clipThinNotes`, `clipDensifyNotes`
- `clipAccentEveryN`, `clipAddGhostHits`, `clipRemoveGhostHits`

### Intensity
- `clipDeriveIntensity`, `clipAddTension`, `clipBrighten`
- `clipPadVoicing`, `clipBassLine`, `clipArpeggiate`

### Cue Scheduling
- `resolveCuePlan`, `sectionAtTick`, `sectionAtBar`
- `cueSecondsToTick`, tick/bar/beat conversion utilities

## Dependencies

- `@soundweave/schema` — types for clips, notes, cues
- `@soundweave/instrument-rack` — voice management for playback
- `@soundweave/music-theory` — scale/chord/motif primitives
