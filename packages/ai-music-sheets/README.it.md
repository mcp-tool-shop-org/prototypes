<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## Cos'è questo?

Una libreria TypeScript di canzoni per pianoforte in un formato ibrido a tre livelli:

1. **Metadati** — JSON strutturato (genere, tonalità, tempo, difficoltà, compositore)
2. **Linguaggio musicale** — descrizioni leggibili dagli esseri umani per il ragionamento degli LLM (struttura, momenti chiave, obiettivi didattici, suggerimenti di stile)
3. **Pronto per il codice** — dati delle note misura per misura per la riproduzione MIDI o l'analisi.

Un LLM può leggere il blocco `musicalLanguage` per spiegare una canzone a uno studente, quindi utilizzare l'array `measures` per controllare la riproduzione MIDI o generare esercizi.

### Pipeline di importazione MIDI

Aggiungere nuove canzoni alla libreria è ora molto semplice:

1. Inserire un file `.mid` nella cartella `songs/raw/`
2. Scrivere un breve file di configurazione JSON nella cartella `songs/config/` (metadati + linguaggio musicale)
3. Eseguire `pnpm build:songs`
4. Il convertitore estrae le note, suddivide le misure, separa le mani, rileva gli accordi e crea una voce `SongEntry` completa.

Il file MIDI è la fonte di verità per le note e il timing. Gli esseri umani scrivono solo lo strato di alto valore per l'LLM.

## Installazione

```bash
npm install @mcptoolshop/ai-music-sheets
```

## Guida rapida

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

### Conversione MIDI → SongEntry

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

## Libreria di canzoni (10 canzoni integrate, 10 generi)

| Genere | Canzone | Compositore | Difficoltà | Misure |
|-------|------|----------|------------|----------|
| Classica | Sonata al chiaro di luna, 1° movimento | Beethoven | Intermedio | 8 |
| Jazz | Autumn Leaves | Kosma | Intermedio | 8 |
| Pop | Let It Be | Lennon/McCartney | Principiante | 8 |
| Blues | 12-Bar Blues in C | Tradizionale | Principiante | 12 |
| Rock | Dream On (Intro) | Tyler | Intermedio | 8 |
| R&B | Ain't No Sunshine | Withers | Principiante | 8 |
| Latina | Bossa Nova Basic | Tradizionale | Intermedio | 8 |
| Colonna sonora | The Entertainer | Joplin | Intermedio | 8 |
| Ragtime | Maple Leaf Rag (A) | Joplin | Avanzato | 8 |
| New Age | River Flows in You | Yiruma | Intermedio | 8 |

## Formato ibrido

Ogni voce di canzone contiene tre livelli:

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

### Formato delle note

Le note utilizzano la notazione scientifica dell'intonazione con la durata inline:

| Simbolo | Durata | Esempio |
|--------|----------|---------|
| `:w` | Nota intera | `C4:w` |
| `:h.` | Mezza nota puntata | `E4:h.` |
| `:h` | Mezza nota | `E4:h` |
| `:q.` | Quarto di nota puntato | `G4:q.` |
| `:q` | Quarto di nota | `G4:q` |
| `:e.` | Ottavo di nota puntato | `A4:e.` |
| `:e` | Ottavo di nota | `A4:e` |
| `:s` | Sedicesimo di nota | `B4:s` |
| `R` | Pausa | `R:h` |

Gli accordi sono separati da spazi: `"C4 E4 G4:q"`

## API di registrazione

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

## API di importazione MIDI

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

## Aggiunta di canzoni

### Da MIDI (consigliato)

1. Inserire il file `.mid` nella cartella `songs/raw/<slug>.mid`
2. Scrivere il file di configurazione nella cartella `songs/config/<slug>.json`:

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

3. Eseguire `pnpm build:songs` — genera TypeScript nella cartella `songs/generated/`
4. Eseguire `pnpm test` — la convalida rileva automaticamente i dati errati.

### Manuale (eredità)

1. Creare `src/songs/<genre>/<slug>.ts`
2. Esportare un oggetto `SongEntry`
3. Importare e aggiungere a `src/songs/index.ts`
4. Eseguire `pnpm test`

## Architettura

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

## Correlati

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — Lettore di pianoforte con motore audio integrato. Server MCP + CLI che carica questa libreria e riproduce canzoni tramite altoparlanti con feedback didattico in tempo reale e canto.

## Sviluppo

```bash
pnpm install
pnpm test          # 113 tests
pnpm typecheck     # tsc --noEmit
pnpm build         # compile to dist/
pnpm build:songs   # MIDI → SongEntry generator
```

## Sicurezza e ambito dei dati

- **Dati a cui si accede:** Legge i file MIDI e i file di configurazione JSON dal file system locale durante l'importazione delle canzoni. Include i dati delle canzoni come moduli TypeScript statici.
- **Dati a cui NON si accede:** Nessuna richiesta di rete. Nessuna telemetria. Nessun archivio di dati utente. Nessuna credenziale o token.
- **Autorizzazioni richieste:** Accesso in lettura ai file sorgente MIDI/JSON durante la compilazione. Non sono necessarie autorizzazioni durante l'esecuzione.

## Valutazione

| Livello di sicurezza | Stato |
|------|--------|
| A. Linee guida di sicurezza | PASS (Superato) |
| B. Gestione degli errori | PASS (Superato) |
| C. Documentazione per gli operatori | PASS (Superato) |
| D. Pratiche di sviluppo | PASS (Superato) |
| E. Identità | PASS (Superato) |

## Licenza

[MIT](LICENSE)

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
