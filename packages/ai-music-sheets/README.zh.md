<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## 这是一个什么？

一个 TypeScript 钢琴歌曲库，采用三层混合格式：

1. **元数据** — 结构化的 JSON 格式（流派、调性、速度、难度、作曲家）
2. **音乐语言** — 人类可读的描述，用于 LLM 的推理（结构、重要部分、教学目标、风格提示）
3. **可直接用于代码** — 每个小节的音符数据，用于 MIDI 播放或分析

LLM 可以读取 `musicalLanguage` 部分来向学生解释一首歌曲，然后使用 `measures` 数组来驱动 MIDI 播放或生成练习。

### MIDI 导入流水线

现在扩展这个库变得非常简单：

1. 将 `.mid` 文件放入 `songs/raw/` 目录
2. 在 `songs/config/` 目录中编写一个简短的 JSON 配置文件（元数据 + 音乐语言）
3. 运行 `pnpm build:songs`
4. 转换器会提取音符，分割小节，分离左右手，检测和弦，并生成完整的 `SongEntry` 对象

MIDI 文件是音符和时序的原始数据来源。人类只负责编写高价值的 LLM 层。

## 安装

```bash
npm install @mcptoolshop/ai-music-sheets
```

## 快速开始

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

### MIDI → SongEntry 转换

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

## 歌曲库（包含 10 首内置歌曲，10 个流派）

| 流派 | 歌曲 | 作曲家 | 难度 | 小节 |
|-------|------|----------|------------|----------|
| 古典 | 月光奏鸣曲，第一乐章 | 贝多芬 | 中级 | 8 |
| 爵士 | 秋叶 | 科斯玛 | 中级 | 8 |
| 流行 | Let It Be | 列侬/麦卡特尼 | 初级 | 8 |
| 布鲁斯 | C 大调 12 拍布鲁斯 | 传统 | 初级 | 12 |
| 摇滚 | Dream On (前奏) | 泰勒 | 中级 | 8 |
| R&B | Ain't No Sunshine | 惠特尼 | 初级 | 8 |
| 拉丁 | Bossa Nova 基础 | 传统 | 中级 | 8 |
| 电影 | The Entertainer | 乔普林 | 中级 | 8 |
| 拉格泰姆 | Maple Leaf Rag (A) | 乔普林 | 高级 | 8 |
| 新世纪 | River Flows in You | Yiruma | 中级 | 8 |

## 混合格式

每个歌曲条目包含三层：

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

### 音符格式

音符使用科学音高表示法，并包含内联时长：

| 符号 | 时长 | 示例 |
|--------|----------|---------|
| `:w` | 全音符 | `C4:w` |
| `:h.` | 附点半音符 | `E4:h.` |
| `:h` | 半音符 | `E4:h` |
| `:q.` | 附点四分音符 | `G4:q.` |
| `:q` | 四分音符 | `G4:q` |
| `:e.` | 附点八分音符 | `A4:e.` |
| `:e` | 八分音符 | `A4:e` |
| `:s` | 十六分音符 | `B4:s` |
| `R` | 休止符 | `R:h` |

和弦用空格分隔： `"C4 E4 G4:q"`

## 注册 API

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

## MIDI 导入 API

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

## 添加歌曲

### 从 MIDI 文件（推荐）

1. 将 `.mid` 文件放入 `songs/raw/<slug>.mid` 目录
2. 在 `songs/config/<slug>.json` 目录中编写配置文件：

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

3. 运行 `pnpm build:songs` — 生成 TypeScript 文件到 `songs/generated/` 目录
4. 运行 `pnpm test` — 验证过程会自动检测错误数据

### 手动（旧方法）

1. 创建 `src/songs/<genre>/<slug>.ts` 文件
2. 导出 `SongEntry` 对象
3. 导入并添加到 `src/songs/index.ts` 文件
4. 运行 `pnpm test`

## 架构

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

## 相关

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — 带有内置音频引擎的钢琴演奏器。MCP 服务器 + CLI，用于加载此库并通过扬声器播放歌曲，并提供唱歌和实时教学反馈。

## 开发

```bash
pnpm install
pnpm test          # 113 tests
pnpm typecheck     # tsc --noEmit
pnpm build         # compile to dist/
pnpm build:songs   # MIDI → SongEntry generator
```

## 安全与数据范围

- **访问的数据：** 在导入歌曲时，会从本地文件系统中读取 MIDI 文件和 JSON 配置文件。内置的歌曲数据以静态 TypeScript 模块的形式提供。
- **未访问的数据：** 不进行任何网络请求。不收集任何遥测数据。不存储任何用户数据。不涉及任何凭证或令牌。
- **所需权限：** 在构建过程中，需要读取 MIDI/JSON 源代码文件的权限。运行时不需要任何权限。

## 评分卡

| 门禁 | 状态 |
|------|--------|
| A. 安全基线 | 通过 |
| B. 错误处理 | 通过 |
| C. 操作手册 | 通过 |
| D. 发布规范 | 通过 |
| E. 身份验证 | 通过 |

## 许可证

[MIT](LICENSE)

---

构建者：<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
