<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## これは何ですか？

ピアノ曲のTypeScriptライブラリ。3層のハイブリッド形式で構成されています。

1. **メタデータ**：構造化されたJSON形式（ジャンル、調、テンポ、難易度、作曲家）
2. **音楽言語**：LLM（大規模言語モデル）が理解しやすい説明文（構成、重要な部分、教育目標、演奏のヒント）
3. **コード対応**：MIDI再生または分析のための、小節ごとの音符データ

LLMは、「musicalLanguage」ブロックを読み取って、学生に曲を説明したり、「measures」配列を使ってMIDI再生を実行したり、練習曲を生成したりすることができます。

### MIDIインジェストパイプライン

ライブラリの拡充は非常に簡単になりました。

1. `.mid`ファイルを`songs/raw/`ディレクトリに配置します。
2. `songs/config/`ディレクトリに短いJSON設定ファイル（メタデータ＋音楽言語）を作成します。
3. `pnpm build:songs`コマンドを実行します。
4. コンバータが音符を抽出し、小節を分割し、左右の手を分離し、コードを検出し、完全な`SongEntry`を作成します。

MIDIファイルが音符とタイミングの信頼できる情報源です。人間は、LLMが理解できる高付加価値な情報を記述するだけです。

## インストール

```bash
npm install @mcptoolshop/ai-music-sheets
```

## クイックスタート

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

### MIDI → SongEntryへの変換

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

## 楽曲ライブラリ（10曲内蔵、10のジャンル）

| ジャンル | 楽曲 | 作曲家 | 難易度 | 小節 |
|-------|------|----------|------------|----------|
| クラシック | エリーゼのために、第1楽章 | ベートーヴェン | 中級 | 8 |
| ジャズ | 枯葉 | コスマ | 中級 | 8 |
| ポップ | レット・イット・ビー | レノン/マッカートニー | 初級 | 8 |
| ブルース | Cメジャーの12小節ブルース | 伝統的 | 初級 | 12 |
| ロック | ドリーム・オン（イントロ） | タイラー | 中級 | 8 |
| R&B | エイント・ノー・サンシャイン | ウィザース | 初級 | 8 |
| ラテン | ボサノバ・ベーシック | 伝統的 | 中級 | 8 |
| 映画音楽 | エンターテイナー | ジョプリン | 中級 | 8 |
| ラグタイム | メープル・リーフ・ラグ（A） | ジョプリン | 上級 | 8 |
| ニューエイジ | リバー・フローズ・イン・ユー | 平野 | 中級 | 8 |

## ハイブリッド形式

各楽曲エントリは、3つの層で構成されています。

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

### 音符の形式

音符は、科学的な音階表記とインラインの持続時間を使用します。

| 記号 | 持続時間 | 例 |
|--------|----------|---------|
| `:w` | 全音符 | `C4:w` |
| `:h.` | 付点二分音符 | `E4:h.` |
| `:h` | 二分音符 | `E4:h` |
| `:q.` | 付点四分音符 | `G4:q.` |
| `:q` | 四分音符 | `G4:q` |
| `:e.` | 付点八分音符 | `A4:e.` |
| `:e` | 八分音符 | `A4:e` |
| `:s` | 十六分音符 | `B4:s` |
| `R` | 休符 | `R:h` |

コードは、スペースで区切られます。"C4 E4 G4:q"

## レジストリAPI

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

## MIDIインジェストAPI

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

## 楽曲の追加

### MIDIファイルから（推奨）

1. `.mid`ファイルを`songs/raw/<slug>.mid`ディレクトリに配置します。
2. `songs/config/<slug>.json`ディレクトリに設定ファイルを作成します。

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

3. `pnpm build:songs`コマンドを実行します。これにより、TypeScriptファイルが`songs/generated/`ディレクトリに生成されます。
4. `pnpm test`コマンドを実行します。これにより、不正なデータが自動的に検出されます。

### 手動（レガシー）

1. `src/songs/<genre>/<slug>.ts`ファイルを作成します。
2. `SongEntry`オブジェクトをエクスポートします。
3. `src/songs/index.ts`ファイルにインポートし、追加します。
4. `pnpm test`コマンドを実行します。

## アーキテクチャ

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

## 関連

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)**：内蔵オーディオエンジンを備えたピアノ演奏アプリケーション。MCPサーバー+CLIで、このライブラリをロードし、スピーカーから楽曲を再生し、歌唱とライブのレッスンフィードバックを提供します。

## 開発

```bash
pnpm install
pnpm test          # 113 tests
pnpm typecheck     # tsc --noEmit
pnpm build         # compile to dist/
pnpm build:songs   # MIDI → SongEntry generator
```

## セキュリティとデータ範囲

- **アクセスされるデータ:** 楽曲の取り込み時に、ローカルファイルシステムからMIDIファイルとJSON設定ファイルを読み込みます。組み込みの楽曲データを静的なTypeScriptモジュールとして提供します。
- **アクセスされないデータ:** ネットワークへのアクセスはありません。テレメトリー機能もありません。ユーザーデータの保存もありません。認証情報やトークンも使用しません。
- **必要な権限:** ビルド時に、MIDI/JSONソースファイルへの読み取りアクセスが必要です。実行時に必要な権限はありません。

## 評価

| ゲート | ステータス |
|------|--------|
| A. セキュリティ基準 | 合格 |
| B. エラー処理 | 合格 |
| C. 運用者向けドキュメント | 合格 |
| D. リリース時の品質管理 | 合格 |
| E. 認証 | 合格 |

## ライセンス

[MIT](LICENSE)

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>によって作成されました。
