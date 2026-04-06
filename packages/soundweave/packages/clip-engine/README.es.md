<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/soundweave/readme.png" width="200" alt="SoundWeave">
</p>

# @soundweave/clip-engine

Motor de secuenciación, composición y transformación de clips de audio para Soundweave.

## Funcionalidades

- Reproducción de clips y asignación de clips a escenas.
- Programación de notas y sincronización precisa del inicio de la reproducción.
- Transformaciones de composición (transposición, inversión, inversión, cambio de octava, escala rítmica).
- Herramientas de variación (rítmica, melódica, afinación, densificación, acentos, notas fantasma).
- Derivación de intensidad (baja/media/alta, tensión, brillo, timbre, línea de bajo, arpegio).
- Herramientas de acordes (acordes diatónicos, paleta de acordes, progresiones).
- Programación de indicaciones y resolución de secciones.

## Exportaciones principales

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

### Reproducción
- `ClipPlayer`: reproduce clips individuales con programación de notas.
- `SceneClipPlayer`: asigna y reproduce clips dentro de escenas.

### Transformaciones
- `clipTranspose`, `clipInvert`, `clipReverse`, `clipOctaveShift`, `clipRhythmScale`.
- `clipDuplicateWithVariation`, `clipSnapToScale`, `clipFindOutOfScale`.

### Variaciones
- `clipRhythmicVariation`, `clipMelodicVariation`, `clipThinNotes`, `clipDensifyNotes`.
- `clipAccentEveryN`, `clipAddGhostHits`, `clipRemoveGhostHits`.

### Intensidad
- `clipDeriveIntensity`, `clipAddTension`, `clipBrighten`.
- `clipPadVoicing`, `clipBassLine`, `clipArpeggiate`.

### Programación de indicaciones
- `resolveCuePlan`, `sectionAtTick`, `sectionAtBar`.
- `cueSecondsToTick`, utilidades de conversión de segundos a "ticks", barras y tiempos.

## Dependencias

- `@soundweave/schema`: tipos para clips, notas e indicaciones.
- `@soundweave/instrument-rack`: gestión de voces para la reproducción.
- `@soundweave/music-theory`: primitivas de escala, acorde y motivo.
