<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
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

## O que é isso?

Uma biblioteca TypeScript de músicas para piano, em um formato híbrido de três camadas:

1. **Metadados** — formato JSON estruturado (gênero, tonalidade, andamento, dificuldade, compositor).
2. **Linguagem musical** — descrições legíveis por humanos para auxiliar o raciocínio de modelos de linguagem (estrutura, momentos-chave, objetivos de ensino, dicas de estilo).
3. **Pronto para uso em código** — dados de notas detalhados, nota por nota, para reprodução MIDI ou análise.

Um modelo de linguagem grande (LLM) pode ler o bloco `musicalLanguage` para explicar uma música a um aluno, e depois usar o array `measures` para controlar a reprodução de MIDI ou gerar exercícios.

### Pipeline de ingestão de dados MIDI

Expandir a biblioteca é agora algo muito simples:

1. Coloque um arquivo `.mid` na pasta `songs/raw/`.
2. Crie um arquivo de configuração JSON curto na pasta `songs/config/` (metadados + linguagem musical).
3. Execute o comando `pnpm build:songs`.
4. O conversor extrai as notas, divide as medidas, separa as partes (mãos), detecta os acordes e gera uma entrada de música completa (`SongEntry`).

O arquivo MIDI é a fonte de informação definitiva para as notas e o ritmo. Os humanos apenas escrevem a camada de alto nível do modelo de linguagem.

## Instalar

```bash
npm install @mcptoolshop/ai-music-sheets
```

## Início rápido

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

### Conversão de MIDI para Entrada de Música

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

## Biblioteca de músicas (10 músicas pré-programadas, 10 gêneros)

| Gênero. | Canção. | Compositor. | Dificuldade. | Medidas. |
|-------|------|----------|------------|----------|
| Clássico. | Sonata ao Luar, 1º movimento. | Beethoven. | Intermediário. | 8 |
| Jazz. | Folhas de outono. | Kosma. | Intermediário. | 8 |
| Pop. | Deixe estar. | Lennon/McCartney. | Iniciante. | 8 |
| Blues. | Blues de 12 compassos em Dó. | Tradicional. | Iniciante. | 12 |
| Rochas. | Sonhe Alto (Introdução) | Tyler. | Intermediário. | 8 |
| R&B (ritmos e blues) | Não há luz alguma. | Escápulas. | Iniciante. | 8 |
| Latim. | Bossa Nova: O Básico. | Tradicional. | Intermediário. | 8 |
| Filme. | O Artista. | Joplin. | Intermediário. | 8 |
| Ragtime. | Maple Leaf Rag (A) | Joplin. | Avançado. | 8 |
| Nova Era. | O rio que flui em você. | Yiruma. | Intermediário. | 8 |

## Formato híbrido

Cada inscrição de música contém três elementos:

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

As notas utilizam a notação científica de afinação, com a duração indicada diretamente na nota.

| Símbolo. | Duração. | Exemplo. |
|--------|----------|---------|
| `:w` | Nota inteira. | `C4:w` |
| `:h.` | Metade pontilhada. | `E4:h.` |
| `:h` | Semínima. | `E4:h` |
| `:q.` | Colcheia pontuada. | `G4:q.` |
| `:q` | Semínima. | `G4:q` |
| `:e.` | Colcheia pontuada. | `A4:e.` |
| `:e` | Oitava nota. | `A4:e` |
| `:s` | Sexta nota. | `B4:s` |
| `R` | Descanso. | `R:h` |

As notas são separadas por espaços: `"C4 E4 G4:q"`

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

## API para ingestão de dados MIDI

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

## Adicionar músicas

### A partir de MIDI (recomendado)

1. Coloque o arquivo `.mid` na pasta `songs/raw/<slug>.mid`.
2. Crie um arquivo de configuração em `songs/config/<slug>.json`:

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

3. Execute o comando `pnpm build:songs` — isso gera arquivos TypeScript na pasta `songs/generated/`.
4. Execute o comando `pnpm test` — o sistema de testes detecta automaticamente dados incorretos.

### Manual (versão antiga)

1. Crie o arquivo `src/songs/<gênero>/<slug>.ts`.
2. Exporte um objeto do tipo `SongEntry`.
3. Importe e adicione ao arquivo `src/songs/index.ts`.
4. Execute o comando `pnpm test`.

## Arquitetura

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

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — Um aplicativo para tocar piano com um motor de áudio integrado. É um servidor MCP e uma interface de linha de comando que carregam esta biblioteca e tocam músicas através de alto-falantes, com acompanhamento vocal e feedback de aprendizado em tempo real.

## Desenvolvimento

```bash
pnpm install
pnpm test          # 113 tests
pnpm typecheck     # tsc --noEmit
pnpm build         # compile to dist/
pnpm build:songs   # MIDI → SongEntry generator
```

## Escopo de segurança e dados

- **Dados acessados:** Lê arquivos MIDI e configurações JSON do sistema de arquivos local durante a importação de músicas. Distribui os dados das músicas como módulos TypeScript estáticos.
- **Dados NÃO acessados:** Não há requisições de rede. Não há telemetria. Não há armazenamento de dados do usuário. Não há credenciais ou tokens.
- **Permissões necessárias:** Acesso de leitura aos arquivos de origem MIDI/JSON durante a compilação. Não são necessárias permissões em tempo de execução.

## Avaliação

| Critério | Status |
|------|--------|
| A. Base de segurança | APROVADO |
| B. Tratamento de erros | APROVADO |
| C. Documentação para operadores | APROVADO |
| D. Boas práticas de distribuição | APROVADO |
| E. Identidade | APROVADO |

## Licença

[MIT](LICENSE)

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
