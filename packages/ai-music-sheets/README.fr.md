<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## Qu'est-ce que c'est ?

Une bibliothèque TypeScript de chansons pour piano, dans un format hybride à trois niveaux :

1. **Métadonnées** — JSON structuré (genre, tonalité, tempo, difficulté, compositeur)
2. **Langage musical** — descriptions lisibles par un humain pour le raisonnement des LLM (structure, moments clés, objectifs pédagogiques, conseils de style)
3. **Prêt pour le code** — données de notes mesure par mesure pour la lecture MIDI ou l'analyse

Un LLM peut lire le bloc `musicalLanguage` pour expliquer une chanson à un étudiant, puis utiliser le tableau `measures` pour contrôler la lecture MIDI ou générer des exercices.

### Pipeline d'importation MIDI

L'ajout de chansons à la bibliothèque est maintenant simple :

1. Déposez un fichier `.mid` dans le dossier `songs/raw/`
2. Créez un fichier de configuration JSON court dans le dossier `songs/config/` (métadonnées + langage musical)
3. Exécutez la commande `pnpm build:songs`
4. Le convertisseur extrait les notes, divise les mesures, sépare les mains, détecte les accords et crée une entrée de chanson complète (`SongEntry`).

Le fichier MIDI est la source de vérité pour les notes et le timing. Les humains ne créent que la couche de langage musical de haute valeur pour les LLM.

## Installation

```bash
npm install @mcptoolshop/ai-music-sheets
```

## Démarrage rapide

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

### Conversion MIDI → SongEntry

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

## Bibliothèque de chansons (10 chansons intégrées, 10 genres)

| Genre | Chanson | Compositeur | Difficulté | Mesures |
|-------|------|----------|------------|----------|
| Classique | Sonate au clair de lune, 1er mouvement | Beethoven | Intermédiaire | 8 |
| Jazz | Autumn Leaves | Kosma | Intermédiaire | 8 |
| Pop | Let It Be | Lennon/McCartney | Débutant | 8 |
| Blues | 12-Bar Blues en C | Traditionnel | Débutant | 12 |
| Rock | Dream On (Intro) | Tyler | Intermédiaire | 8 |
| R&B | Ain't No Sunshine | Withers | Débutant | 8 |
| Latin | Bossa Nova Basic | Traditionnel | Intermédiaire | 8 |
| Film | The Entertainer | Joplin | Intermédiaire | 8 |
| Ragtime | Maple Leaf Rag (A) | Joplin | Avancé | 8 |
| New Age | River Flows in You | Yiruma | Intermédiaire | 8 |

## Format hybride

Chaque entrée de chanson contient trois niveaux :

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

### Format des notes

Les notes utilisent la notation de hauteur scientifique avec la durée intégrée :

| Symbole | Durée | Exemple |
|--------|----------|---------|
| `:w` | Note ronde | `C4:w` |
| `:h.` | Note pointée | `E4:h.` |
| `:h` | Note blanche | `E4:h` |
| `:q.` | Note pointée | `G4:q.` |
| `:q` | Note de quart | `G4:q` |
| `:e.` | Note pointée | `A4:e.` |
| `:e` | Note de huitième | `A4:e` |
| `:s` | Note de seizième | `B4:s` |
| `R` | Pause | `R:h` |

Les accords sont séparés par des espaces : `"C4 E4 G4:q"`

## API de registre

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

## API d'importation MIDI

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

## Ajout de chansons

### À partir de MIDI (recommandé)

1. Placez le fichier `.mid` dans le dossier `songs/raw/<slug>.mid`
2. Créez un fichier de configuration dans le dossier `songs/config/<slug>.json` :

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

3. Exécutez la commande `pnpm build:songs` — génère le code TypeScript dans le dossier `songs/generated/`
4. Exécutez la commande `pnpm test` — la validation détecte automatiquement les données incorrectes.

### Manuelle (héritage)

1. Créez le fichier `src/songs/<genre>/<slug>.ts`
2. Exportez un objet `SongEntry`
3. Importez et ajoutez-le à `src/songs/index.ts`
4. Exécutez la commande `pnpm test`

## Architecture

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

## Liés

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — Lecteur de piano avec un moteur audio intégré. Serveur MCP + CLI qui charge cette bibliothèque et joue des chansons via des haut-parleurs avec un retour pédagogique en direct et une voix.

## Développement

```bash
pnpm install
pnpm test          # 113 tests
pnpm typecheck     # tsc --noEmit
pnpm build         # compile to dist/
pnpm build:songs   # MIDI → SongEntry generator
```

## Sécurité et portée des données

- **Données consultées :** Lecture des fichiers MIDI et des fichiers de configuration JSON à partir du système de fichiers local lors de l'importation des morceaux. Les données des morceaux sont fournies sous forme de modules TypeScript statiques.
- **Données non consultées :** Aucune requête réseau. Aucune télémétrie. Aucun stockage de données utilisateur. Aucun identifiant ni aucun jeton.
- **Autorisations requises :** Accès en lecture aux fichiers sources MIDI/JSON pendant la phase de construction. Aucune autorisation requise pendant l'exécution.

## Tableau de bord

| Portail | Statut |
|------|--------|
| A. Base de sécurité | PASSÉ |
| B. Gestion des erreurs | PASSÉ |
| C. Documentation pour les utilisateurs | PASSÉ |
| D. Bonnes pratiques de déploiement | PASSÉ |
| E. Identité | PASSÉ |

## Licence

[MIT](LICENSE)

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
