<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/linux-dev-typer/readme.png" alt="Linux Dev Typer logo" width="400"></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/linux-dev-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/linux-dev-typer/actions/workflows/build.yml/badge.svg" alt="CI"></a>
  <a href="https://www.nuget.org/packages/LinuxDevTyper.Core"><img src="https://img.shields.io/nuget/v/LinuxDevTyper.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/linux-dev-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Code-typing practice for developers — Avalonia UI, adaptive difficulty, trend tracking, fatigue detection.**

> Also available as a native Windows app: [dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) (WinUI 3, Microsoft Store)

---

## Why Linux Dev Typer?

- **Practice real code, not prose.** Every snippet is a real-world pattern from Python, Rust, JavaScript, C#, or Java — not “the quick brown fox.”
- **Adaptive difficulty.** An Elo-inspired rating system adjusts to your skill per language, with anti-yo-yo protection and comfort-zone detection.
- **Weakness-aware.** Per-character mistake heatmaps and confusion pairs guide snippet selection so you practice what you actually struggle with.
- **Fatigue-aware.** The engine detects declining performance and suggests breaks before bad habits set in.
- **Cross-platform.** Built on Avalonia UI — runs on Linux, macOS, and Windows from a single codebase.
- **Fully offline.** No telemetry, no accounts, no network calls. Your typing data stays on your machine.
- **Extensible.** The core engine ships as a standalone NuGet package with zero UI dependencies.

---

## NuGet Packages

| Package | Description |
|---------|-------------|
| [`LinuxDevTyper.Core`](https://www.nuget.org/packages/LinuxDevTyper.Core) | Portable typing practice engine with Elo rating, adaptive difficulty, weakness heatmaps, fatigue detection, session planning, and micro-drills. Zero UI dependencies. |

The core engine is a standalone library with no Avalonia or platform dependencies. Implement `IStorage`, `IAudioService`, and `IAssetProvider` for your platform and you have a complete typing trainer.

---

## Features

### Core Typing Engine
- Per-character feedback: correct (teal), errors (red + underline), untyped (muted)
- Live stats: WPM, accuracy, error count, XP
- Elo-inspired per-language rating system
- Level progression with XP and difficulty ramp
- Completion cards with snippet explanations
- Configurable: font size, whitespace rules, line-ending normalization

### Adaptive Learning
- Per-character mistake tracking with symbol classification (10 categories)
- Cross-session weakness profiling with adaptive snippet selection
- Trend tracking: rolling WPM and accuracy trends per language
- Adaptive difficulty with comfort-zone detection and anti-yo-yo protection
- Post-session insights: personal bests, milestones, trend signals
- Fatigue detection with break suggestions
- Hardcore mode: fix each mistake before advancing

### Agency & Reflection
- Practice intent picker: tag sessions as Warmup, Drill, Explore, or Challenge
- Session notes and session browser with search/filter
- Welcome-back detection with contextual greetings and automatic difficulty aging
- Override system suggestions: dismiss yo-yo locks, insight types, and fatigue alerts
- Monthly history compression for sessions beyond 200
- Orientation cues: gentle pre-session suggestions based on content
- Plateau detection with reassurance
- Personalization controls: freeze learning, reset preferences

### Content System
- User snippet packs: drop JSON into `~/.config/linux-dev-typer/packs/`
- Practice profiles: named parameter sets that tune engine behavior
- Import/export `.ldtpack` bundles for sharing content
- Paste Code, Import File, Import Folder with auto-detected language
- Content-addressed IDs (SHA-256 deduplication)
- Unified canonical pipeline: all content enters as CodeItem with metrics-based difficulty (D1–D7)

### Teaching & Community
- Scaffolds: progressive learning context with optional deeper layers
- Variants: alternative implementations shown as equal peers
- Community notes: optional tips and perspectives in `.ldtpack` packs
- Community difficulty: display-only signal for crowd-sourced difficulty
- Anonymous by design — imported content is indistinguishable from local
- All teaching and community features are optional and display-only

### Structured Practice
- 168 calibration snippets across 5 languages (D1–D7 coverage)
- Session planner: Target (50%) / Review (30%) / Stretch (20%) mix
- Rolling weakness detection with time-decayed window
- Selection transparency: "Why this snippet" explains every pick
- Per-character MistakeHeatmap with confusion pairs
- Weakness trajectories: daily snapshots track improvement

### Guided Practice
- Guided Mode: opt-in toggle that allows weakness signals to influence selection
- WeaknessBias: bounded category-level bias (+0 to +3, never changes difficulty band)
- Micro-drills: 5-item focused practice sessions targeting top weakness
- SignalPolicy: feature-flag architecture with master switch and per-feature sub-flags
- Storage hygiene: heatmap capped at 200 chars, confusion pairs at 20, snapshots at 90
- Default OFF — all prior behavior preserved unless explicitly opted in

### Audio
- 5 keyboard sound themes (8 variations each)
- 4 ambient soundscape categories (15 tracks total)
- Per-channel volume controls and mute

### Accessibility
- Keyboard-first UX with visible focus outlines
- Reduced sensory mode (caps audio volumes)
- High-contrast dark theme

---

## Quick Start

**Requirements:** [.NET SDK 8.x](https://dotnet.microsoft.com/download/dotnet/8.0)

```bash
git clone https://github.com/mcp-tool-shop-org/linux-dev-typer.git
cd linux-dev-typer
dotnet restore
dotnet build -c Release
dotnet run --project src/LinuxDevTyper.App/LinuxDevTyper.App.csproj
```

---

## Run Tests

```bash
dotnet test
```

817 tests covering all core engine modules.

---

## Project Structure

| Path | Purpose |
|------|---------|
| `src/LinuxDevTyper.Core` | Portable engine — typing, rating, trends, difficulty, profiles, community, pedagogy, calibration, planner, weakness, heatmap, guided mode |
| `src/LinuxDevTyper.Core.Tests` | xUnit tests (817 tests) |
| `src/LinuxDevTyper.App` | Avalonia desktop shell — UI, platform services, import/export |
| `assets/snippets` | Built-in JSON snippet packs |
| `assets/sounds` | WAV files (ambient + keyboard SFX) |
| `lib/meta-content-system` | Shared content library |
| `docs/` | Architecture, schema docs, phase plans, extension guides |

---

## Persistence

State file: `~/.config/linux-dev-typer/state.json` (schema v12)

To reset: `rm -rf ~/.config/linux-dev-typer`

---

## Adding Your Own Code

There are three ways to practice your own code:

### Option 1: Paste Code (easiest)

1. Open the sidebar (click the gear icon)
2. Find the **Paste Code** section
3. Paste any code snippet into the text box
4. Click **Add** — the language is auto-detected
5. Your code appears in the snippet rotation immediately

### Option 2: Import a File or Folder

1. Open the sidebar → find **Import**
2. Click **Import File** to add a single source file, or **Import Folder** to scan an entire project
3. The app auto-detects language from file extensions (`.py`, `.rs`, `.js`, `.cs`, `.java`, `.sh`)
4. Imported code is deduplicated by content hash — the same code is never added twice

### Option 3: Create a Snippet Pack (JSON)

For curated sets of practice snippets:

1. Create a JSON file in your packs folder:
   ```
   ~/.config/linux-dev-typer/packs/
   ```

2. Name it after the language (e.g. `python.json`):
   ```json
   {
     "language": "python",
     "snippets": [
       {
         "id": "my_list_comp",
         "title": "List comprehension",
         "difficulty": 3,
         "topics": ["lists", "comprehension"],
         "code": "squares = [x**2 for x in range(10)]\n"
       },
       {
         "id": "my_dict_comp",
         "title": "Dictionary comprehension",
         "difficulty": 4,
         "topics": ["dicts", "comprehension"],
         "code": "counts = {word: len(word) for word in words}\n"
       }
     ]
   }
   ```

3. Restart the app — your snippets merge with built-in ones and can be enabled/disabled from the sidebar

**Tips:**
- `id` must be unique across all packs
- `difficulty` ranges from 1 (easy) to 7 (hard)
- `code` should end with `\n`
- User packs can be toggled on/off without deleting the file

### Sharing Content

Export your custom snippets as a portable `.ldtpack` bundle:

1. Open the sidebar → click **Export**
2. Share the `.ldtpack` file with others
3. They import it via the sidebar → **Import**

Only user-authored content travels — never practice history or settings.

---

## Security & Data Scope

Linux Dev Typer is a **fully offline** Avalonia desktop typing practice app.

- **Data accessed:** Local state file (`~/.config/linux-dev-typer/state.json`), user snippet packs, `.ldtpack` import/export files
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. No accounts. No network calls
- **Permissions:** Local file system for state persistence and content packs only
- **No telemetry** is collected or sent

Full policy: [SECURITY.md](SECURITY.md)

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

---

## License

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
