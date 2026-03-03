<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## यह क्या है?

एक टाइपस्क्रिप्ट लाइब्रेरी जो पियानो गानों का संग्रह है, जो तीन-स्तरीय हाइब्रिड प्रारूप में है:

1. **मेटाडेटा** — संरचित JSON (शैली, कुंजी, टेम्पो, कठिनाई, संगीतकार)
2. **संगीत भाषा** — एलएलएम (LLM) के लिए मानव-पठनीय विवरण (संरचना, महत्वपूर्ण क्षण, शिक्षण लक्ष्य, शैली संबंधी सुझाव)
3. **कोड-तैयार** — MIDI प्लेबैक या विश्लेषण के लिए माप-दर-माप नोट डेटा

एक एलएलएम (LLM) `musicalLanguage` ब्लॉक को पढ़कर किसी छात्र को गाने के बारे में समझा सकता है, और फिर MIDI प्लेबैक को चलाने या अभ्यास उत्पन्न करने के लिए `measures` सरणी का उपयोग कर सकता है।

### MIDI इनजेस्ट पाइपलाइन

लाइब्रेरी को बढ़ाना अब बहुत आसान है:

1. `.mid` फ़ाइल को `songs/raw/` में डालें।
2. `songs/config/` में एक छोटा JSON कॉन्फ़िगरेशन लिखें (मेटाडेटा + संगीत भाषा)।
3. `pnpm build:songs` चलाएं।
4. कनवर्टर नोट्स निकालता है, मापों को विभाजित करता है, हाथों को अलग करता है, कॉर्ड्स का पता लगाता है, और एक पूर्ण `SongEntry` बनाता है।

MIDI फ़ाइल नोट्स और समय के लिए स्रोत है। मनुष्य केवल उच्च-मूल्य वाले एलएलएम (LLM) परत को लिखते हैं।

## इंस्टॉल करें

```bash
npm install @mcptoolshop/ai-music-sheets
```

## शुरुआत कैसे करें

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

### MIDI → SongEntry रूपांतरण

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

## गाने की लाइब्रेरी (10 अंतर्निहित गाने, 10 शैलियाँ)

| शैली | गाना | संगीतकार | कठिनाई | माप |
|-------|------|----------|------------|----------|
| शास्त्रीय | मूनलाइट सोनाटा, भाग 1 | बीथोवन | मध्यवर्ती | 8 |
| जैज़ | ऑटम लीव्स | कोस्मा | मध्यवर्ती | 8 |
| पॉप | लेट इट बी | लेनन/मैककार्टनी | शुरुआती | 8 |
| ब्लूज़ | 12-बार ब्लूज़ इन सी | पारंपरिक | शुरुआती | 12 |
| रॉक | ड्रीम ऑन (इंट्रो) | टाइलर | मध्यवर्ती | 8 |
| आर एंड बी | ऐंट नो सनशाइन | विथर्स | शुरुआती | 8 |
| लैटिन | बॉसा नोवा बेसिक | पारंपरिक | मध्यवर्ती | 8 |
| फिल्म | द एंटरटेनर | जॉप्लिन | मध्यवर्ती | 8 |
| रैग्टाइम | मेपल लीफ रैग (ए) | जॉप्लिन | उन्नत | 8 |
| न्यू एज | रिवर फ्लोज़ इन यू | यिरुमा | मध्यवर्ती | 8 |

## हाइब्रिड प्रारूप

प्रत्येक गाने में तीन परतें होती हैं:

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

### नोट प्रारूप

नोट वैज्ञानिक पिच नोटेशन का उपयोग करते हैं जिसमें इनलाइन अवधि होती है:

| प्रतीक | अवधि | उदाहरण |
|--------|----------|---------|
| `:w` | पूरा नोट | `C4:w` |
| `:h.` | बिंदु वाला आधा | `E4:h.` |
| `:h` | आधा नोट | `E4:h` |
| `:q.` | बिंदु वाला चौथाई | `G4:q.` |
| `:q` | चौथाई नोट | `G4:q` |
| `:e.` | बिंदु वाला आठवां | `A4:e.` |
| `:e` | आठवां नोट | `A4:e` |
| `:s` | सोलहवां नोट | `B4:s` |
| `R` | विराम | `R:h` |

कॉर्ड्स स्पेस-सेपरेटेड हैं: `"C4 E4 G4:q"`

## रजिस्ट्री एपीआई

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

## MIDI इनजेस्ट एपीआई

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

## गाने जोड़ना

### MIDI से (अनुशंसित)

1. `.mid` फ़ाइल को `songs/raw/<slug>.mid` में रखें।
2. `songs/config/<slug>.json` में कॉन्फ़िगरेशन लिखें:

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

3. `pnpm build:songs` चलाएं — टाइपस्क्रिप्ट `songs/generated/` में उत्पन्न होता है।
4. `pnpm test` चलाएं — सत्यापन खराब डेटा को स्वचालित रूप से पकड़ता है।

### मैन्युअल (विरासत)

1. `src/songs/<genre>/<slug>.ts` बनाएं।
2. एक `SongEntry` ऑब्जेक्ट निर्यात करें।
3. `src/songs/index.ts` में आयात करें और जोड़ें।
4. `pnpm test` चलाएं।

## आर्किटेक्चर

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

## संबंधित

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — अंतर्निहित ऑडियो इंजन के साथ पियानो प्लेयर। एमसीपी सर्वर + सीएलआई जो इस लाइब्रेरी को लोड करता है और स्पीकर्स के माध्यम से गाने चलाता है, जिसमें गायन और लाइव शिक्षण प्रतिक्रिया शामिल है।

## विकास

```bash
pnpm install
pnpm test          # 113 tests
pnpm typecheck     # tsc --noEmit
pnpm build         # compile to dist/
pnpm build:songs   # MIDI → SongEntry generator
```

## सुरक्षा और डेटा स्कोप

- **डेटा तक पहुंच:** गाने को शामिल करते समय, यह स्थानीय फ़ाइल सिस्टम से MIDI फ़ाइलें और JSON कॉन्फ़िगरेशन पढ़ता है। यह अंतर्निहित गाने के डेटा को स्थिर टाइपस्क्रिप्ट मॉड्यूल के रूप में प्रदान करता है।
- **डेटा तक नहीं पहुंच:** कोई नेटवर्क अनुरोध नहीं। कोई टेलीमेट्री नहीं। कोई उपयोगकर्ता डेटा भंडारण नहीं। कोई क्रेडेंशियल या टोकन नहीं।
- **आवश्यक अनुमतियाँ:** बिल्ड के दौरान MIDI/JSON स्रोत फ़ाइलों तक पढ़ने की पहुंच। रनटाइम पर किसी भी अनुमति की आवश्यकता नहीं है।

## स्कोरकार्ड

| गेट | स्थिति |
|------|--------|
| ए. सुरक्षा आधार | पास |
| बी. त्रुटि प्रबंधन | पास |
| सी. ऑपरेटर दस्तावेज़ | पास |
| डी. शिपिंग स्वच्छता | पास |
| ई. पहचान | पास |

## लाइसेंस

[MIT](LICENSE)

---

MCP टूल शॉप द्वारा बनाया गया: <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
