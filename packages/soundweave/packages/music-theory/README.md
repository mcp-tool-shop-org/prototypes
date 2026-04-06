<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/soundweave/readme.png" width="400" alt="SoundWeave">
</p>

# @soundweave/music-theory

Music theory primitives and utilities for Soundweave — scales, chords, motifs, and intensity transforms.

## What It Owns

- Pitch class and note name operations
- Scale definitions and pitch class generation
- Chord quality, voicing, and progression helpers
- Motif transforms (transpose, invert, reverse, rhythm scale)
- Variation generation (rhythmic, melodic, thin, densify, accents)
- Intensity tier derivation (low, mid, high, tension, brighten)

## Key Exports

### Scales and Pitch

```ts
import {
  SCALES, pitchClass, octave, midiNote, noteName,
  scalePitchClasses, isInScale, snapToScale,
  transposeDiatonic,
} from "@soundweave/music-theory";
```

### Chords

```ts
import {
  chordPitches, diatonicChord, diatonicChords,
  chordPalette, generatePadVoicing, generateBassLine,
  arpeggiateChord, progressionFromDegrees,
} from "@soundweave/music-theory";
```

### Motif Transforms

```ts
import {
  transpose, invert, reverse, octaveShift,
  rhythmScale, duplicateWithVariation, transposeAndSnap,
} from "@soundweave/music-theory";
```

### Intensity

```ts
import {
  lowIntensity, midIntensity, highIntensity,
  deriveIntensity, addTension, brighten,
} from "@soundweave/music-theory";
```

## Dependencies

None — zero-dependency foundation package.
