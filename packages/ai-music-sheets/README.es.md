<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ai-music-sheets/readme.png" width="400" />
</p>

<p align="center">
  Piano sheet music in hybrid JSON + musical-language format — built for LLMs to read, reason about, and teach from.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-music-sheets/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-music-sheets/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/ai-music-sheets"><img src="https://codecov.io/gh/mcp-tool-shop-org/ai-music-sheets/branch/main/graph/badge.svg" alt="codecov" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-music-sheets"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-music-sheets" alt="npm" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/ai-music-sheets/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

## ¿Qué es esto?

Una biblioteca de canciones para piano en TypeScript, con un formato híbrido de tres capas:

1. **Metadatos:** Estructura JSON (género, tonalidad, tempo, dificultad, compositor).
2. **Lenguaje musical:** Descripciones comprensibles para humanos, diseñadas para el razonamiento de modelos de lenguaje (estructura, momentos clave, objetivos de enseñanza, consejos de estilo).
3. **Listo para su uso en código:** Datos de notas detallados, medida por medida, para la reproducción MIDI o el análisis.

Un modelo de lenguaje grande (LLM) puede leer el bloque `musicalLanguage` para explicar una canción a un estudiante, y luego utilizar el array `measures` para controlar la reproducción de MIDI o generar ejercicios.

### Canal de entrada MIDI

Ampliar la biblioteca es ahora algo muy sencillo:

1. Coloque un archivo `.mid` en la carpeta `songs/raw/`.
2. Cree un archivo de configuración JSON breve en la carpeta `songs/config/` (metadatos + lenguaje musical).
3. Ejecute el comando `pnpm build:songs`.
4. El convertidor extrae las notas, divide las compases, separa las melodías, detecta los acordes y genera una entrada de canción completa (`SongEntry`).

El archivo MIDI es la fuente de información definitiva para las notas y el tempo. Los humanos solo se encargan de crear la capa de alto valor del modelo de lenguaje grande (LLM).

## Instalar

```bash
npm install @mcptoolshop/ai-music-sheets
```

## Inicio rápido

```typescript
import {
  getAllSongs,
  searchSongs,
  getSong,
  getStats,
} from "@mcptoolshop/ai-music-sheets";

// Get stats
const stats = getStats();
// → { totalSongs: 10, byGenre: { classical: 1, jazz: 1, ... }, totalMeasures: 82 }

// Find a song
const moonlight = getSong("moonlight-sonata-mvt1");
console.log(moonlight.musicalLanguage.description);
// → "The famous opening of Beethoven's 'Moonlight' Sonata..."

// Search
const beginnerSongs = searchSongs({ difficulty: "beginner" });
const jazzSongs = searchSongs({ genre: "jazz" });
const arpeggioSongs = searchSongs({ query: "arpeggios" });

// Combine filters
const easyBlues = searchSongs({ genre: "blues", difficulty: "beginner" });
```

### Conversión de MIDI a entrada de canción

```typescript
import { readFileSync } from "node:fs";
import { midiToSongEntry, SongConfigSchema } from "@mcptoolshop/ai-music-sheets";

// Read MIDI file
const midi = new Uint8Array(readFileSync("songs/raw/autumn-leaves.mid"));

// Read + validate config
const rawConfig = JSON.parse(readFileSync("songs/config/autumn-leaves.json", "utf8"));
const config = SongConfigSchema.parse(rawConfig);

// Convert
const entry = midiToSongEntry(midi, config);
console.log(`${entry.title}: ${entry.measures.length} measures`);
```

## Biblioteca de canciones (10 canciones integradas, 10 géneros)

| Género. | Canción. | Compositor. | Dificultad. | Medidas. |
|-------|------|----------|------------|----------|
| Clásico. | Sonata para piano número 14 en do sostenido menor, Op. 27, No. 2, Primer movimiento. | Beethoven. | Intermedio. | 8 |
| Jazz. | Hojas de otoño. | Kosma. | Intermedio. | 8 |
| Música pop. | Déjala estar. | Lennon/McCartney. | Principiante. | 8 |
| Blues. | Blues de 12 compases en Do. | Tradicional. | Principiante. | 12 |
| Roca. | Sueña en grande (Introducción). | Tyler. | Intermedio. | 8 |
| R&B (género musical) | No hay sol. | Escápulas. | Principiante. | 8 |
| Latín. | Bossa Nova: Lo esencial. | Tradicional. | Intermedio. | 8 |
| Película. | El artista. | Joplin. | Intermedio. | 8 |
| Ragtime. | Maple Leaf Rag (A) | Joplin. | Avanzado. | 8 |
| Nueva Era. | El río fluye dentro de ti. | Yiruma. | Intermedio. | 8 |

## Formato híbrido

Cada entrada de canción contiene tres secciones:

```typescript
interface SongEntry {
  // Layer 1: Metadata
  id: string;           // "moonlight-sonata-mvt1"
  title: string;        // "Moonlight Sonata, Mvt. 1"
  genre: Genre;         // "classical"
  difficulty: Difficulty; // "intermediate"
  key: string;          // "C# minor"
  tempo: number;        // 56
  timeSignature: string; // "4/4"

  // Layer 2: Musical Language (for LLMs)
  musicalLanguage: {
    description: string;     // What this piece is about
    structure: string;       // "ABA", "12-bar blues", etc.
    keyMoments: string[];    // Notable moments to reference when teaching
    teachingGoals: string[]; // What the student will learn
    styleTips: string[];     // Performance hints
  };

  // Layer 3: Code-ready (for playback)
  measures: Array<{
    number: number;
    rightHand: string;     // "C4:q E4:q G4:q" (scientific pitch + duration)
    leftHand: string;      // "C3:h"
    fingering?: string;    // "RH: 1-3-5, LH: 5-3-1"
    teachingNote?: string; // Per-measure teaching note
    dynamics?: string;     // "pp", "mf", "crescendo"
  }>;
}
```

### Formato de nota

Las notas utilizan la notación científica de afinación, con la duración indicada directamente en la notación.

| Símbolo. | Duración. | Ejemplo. |
|--------|----------|---------|
| `:w` | Redonda. | `C4:w` |
| `:h.` | Media línea de puntos. | `E4:h.` |
| `:h` | Negra. | `E4:h` |
| `:q.` | Negra con punto. | `G4:q.` |
| `:q` | Negra. | `G4:q` |
| `:e.` | Corchea con punto. | `A4:e.` |
| `:e` | Octava nota. | `A4:e` |
| `:s` | Dieciseisava nota. | `B4:s` |
| `R` | Descanso. | `R:h` |

Las notas de los acordes están separadas por espacios: `"C4 E4 G4:q"`

## API de registro

```typescript
// Lookup
getSong(id: string): SongEntry | undefined
getAllSongs(): SongEntry[]
getSongsByGenre(genre: Genre): SongEntry[]
getSongsByDifficulty(difficulty: Difficulty): SongEntry[]

// Search
searchSongs(options: SearchOptions): SongEntry[]
// SearchOptions: { genre?, difficulty?, query?, tags?, maxDuration?, minDuration? }

// Stats
getStats(): RegistryStats
// → { totalSongs, byGenre, byDifficulty, totalMeasures }

// Validation
validateSong(song: SongEntry): string[]  // returns error messages
validateRegistry(): void                  // throws on invalid data

// Registration (for adding custom songs)
registerSong(song: SongEntry): void
registerSongs(songs: SongEntry[]): void
```

## API para la recepción de datos MIDI

```typescript
// Convert MIDI buffer + config → SongEntry
midiToSongEntry(midiBuffer: Uint8Array, config: SongConfig): SongEntry

// Convert MIDI note number → scientific pitch
midiNoteToScientific(noteNumber: number): string
// 60 → "C4", 69 → "A4", 108 → "C8"

// Validate a song config
validateConfig(config: unknown): ConfigError[]

// Zod schemas for runtime validation
SongConfigSchema    // full song config
MusicalLanguageSchema
MeasureOverrideSchema
```

## Añadir canciones

### Desde MIDI (recomendado)

1. Coloque el archivo `.mid` en la carpeta `songs/raw/` con el nombre `<slug>.mid`.
2. Cree un archivo de configuración en `songs/config/` con el nombre `<slug>.json`:

```json
{
  "id": "autumn-leaves",
  "title": "Autumn Leaves",
  "genre": "jazz",
  "composer": "Joseph Kosma",
  "difficulty": "intermediate",
  "key": "G major",
  "tags": ["jazz-standard", "chord-changes"],
  "musicalLanguage": {
    "description": "The quintessential jazz standard...",
    "structure": "AABA",
    "keyMoments": ["m1: Opening ii-V-I progression"],
    "teachingGoals": ["Learn ii-V-I voice leading"],
    "styleTips": ["Swing eighths, gentle touch"]
  }
}
```

3. Ejecute el comando `pnpm build:songs` — esto genera archivos TypeScript en el directorio `songs/generated/`.
4. Ejecute el comando `pnpm test` — las pruebas de validación detectan automáticamente datos incorrectos.

### Manual (versión anterior)

1. Crea el archivo `src/songs/<género>/<slug>.ts`.
2. Exporta un objeto de tipo `SongEntry`.
3. Importa el archivo y añádelo a `src/songs/index.ts`.
4. Ejecuta el comando `pnpm test`.

## Arquitectura

```
songs/
├── raw/              .mid files (source of truth for notes)
├── config/           .json configs (human-authored metadata)
└── generated/        .ts files (auto-generated SongEntry objects)

src/
├── config/
│   └── schema.ts     Zod schemas + validation
├── midi/
│   └── ingest.ts     MIDI → SongEntry converter
├── registry/
│   └── index.ts      Song lookup, search, validation
├── songs/
│   └── *.ts          10 built-in demo songs
├── types.ts          Core types (SongEntry, Measure, etc.)
└── index.ts          Barrel exports
```

## Relacionado

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)**: Un programa para tocar el piano que incluye un motor de audio integrado. Es un servidor MCP y una interfaz de línea de comandos que carga esta biblioteca y reproduce canciones a través de altavoces, con funciones de canto y retroalimentación para la enseñanza en tiempo real.

## Desarrollo

```bash
pnpm install
pnpm test          # 113 tests
pnpm typecheck     # tsc --noEmit
pnpm build         # compile to dist/
pnpm build:songs   # MIDI → SongEntry generator
```

## Alcance de la seguridad y los datos

- **Datos accedidos:** Lee archivos MIDI y archivos de configuración JSON del sistema de archivos local durante la carga de la canción. Incluye los datos de la canción como módulos TypeScript estáticos.
- **Datos NO accedidos:** No se realizan solicitudes de red. No hay telemetría. No se almacena ningún dato del usuario. No hay credenciales ni tokens.
- **Permisos requeridos:** Acceso de lectura a los archivos fuente MIDI/JSON durante la compilación. No se necesitan permisos en tiempo de ejecución.

## Puntuación

| Puerta | Estado |
|------|--------|
| A. Línea base de seguridad | PASADO |
| B. Manejo de errores | PASADO |
| C. Documentación para operadores | PASADO |
| D. Higiene en la entrega | PASADO |
| E. Identidad | PASADO |

## Licencia

[MIT](LICENSE)

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
