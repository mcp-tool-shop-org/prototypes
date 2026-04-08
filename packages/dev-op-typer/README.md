<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/dev-op-typer/readme.png" alt="Dev-Op-Typer" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml/badge.svg" alt="Build"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/dev-op-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**A developer-focused typing practice app for Windows — every test is real code.**

> Also available for Linux/macOS: [linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) (Avalonia UI)

## Features

### Real Code Practice
- Type actual code snippets in **Python, JavaScript, C#, Java, SQL, and Bash**
- Character-by-character accuracy tracking with diff highlighting
- Exact symbol matching: `{ } [ ] ( ) < > ; : , . " ' \``
- Newlines and indentation matter

### Adaptive Learning
- Smart snippet selection based on your skill level
- Per-language Elo-like rating system
- Session planner: Target (50%) / Review (30%) / Stretch (20%) mix
- Per-character mistake heatmap with weakness trajectories
- Guided Mode: opt-in weakness-biased selection with micro-drills
- Difficulty scaling (D1–D7) with comfort-zone detection

### Live Statistics
- Real-time WPM, accuracy, and error count
- Session completion with retrospective insights
- Trend tracking: rolling WPM and accuracy per language
- Fatigue detection with break suggestions
- Weak spots panel with character-level analysis

### Teaching & Community
- Scaffolds: progressive context hints with "More context" layers
- Demonstrations: alternative implementations shown as equal peers
- Community signals: display-only tips and difficulty ratings
- Guidance notes from shared content packs
- Skill layers panel for structural understanding

### Content System
- 168+ calibration snippets across 6 languages
- User snippet packs: drop JSON into the packs folder
- Paste Code: paste any code from clipboard as practice content
- Import File/Folder: index source files with auto-detected language
- Export/Import `.ldtpack` bundles for sharing content
- Content-addressed IDs (SHA-256 deduplication)

### Audio
- Ambient soundscapes with multiple themes
- Mechanical keyboard click sounds (5 themes, 8 variations each)
- Per-channel volume controls (ambient, keyboard, UI)
- Mute/unmute from the title bar

### Accessibility
- Full keyboard navigation
- High contrast theme support
- Reduced motion option
- AutomationProperties on all interactive elements

### Persistence
- Profile with XP, levels, and per-language ratings
- Settings and language selection saved across sessions
- Session history (up to 500 records) with monthly compression
- Practice configs: named parameter sets for engine tuning

## Install

### Microsoft Store (recommended)
Coming soon — pending Store certification.

### Build from Source

**Requirements:**
- Windows 10 version 1809+ or Windows 11
- .NET 10.0 SDK
- Visual Studio 2022 (with Windows App SDK workload) — or CLI

```bash
git clone https://github.com/mcp-tool-shop-org/dev-op-typer.git
cd dev-op-typer
dotnet build DevOpTyper/DevOpTyper.csproj -c Release -p:Platform=x64
```

Run the built executable:
```
DevOpTyper\bin\x64\Release\net10.0-windows10.0.19041.0\DevOpTyper.exe
```

## Project Structure

```
DevOpTyper/
├── Assets/
│   ├── Icons/         # App icons and Store tile assets
│   ├── Snippets/      # JSON snippet packs by language
│   └── Sounds/        # Ambient and SFX audio files
├── Controls/          # Custom controls (CodeRenderer, TypingPresenter)
├── Models/            # Data models (Profile, Snippet, AppSettings, etc.)
├── Panels/            # UI panels (Typing, Stats, Settings, Explanation, etc.)
├── Services/          # Core services (Audio, Typing, Persistence, Content)
├── Themes/            # Color and high-contrast themes
├── MainWindow.xaml    # Main application window
└── Package.appxmanifest  # MSIX packaging manifest
external/
└── meta-content-system/  # Shared content library (submodule)
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab / Shift+Tab | Navigate controls |
| Enter | Start new test |
| Escape | Reset current test |

## Adding Your Own Code

There are three ways to practice your own code:

### Option 1: Paste Code (easiest)

1. Open the **Settings** panel (click ⚙ in the title bar)
2. Scroll to **Paste Code**
3. Paste any code snippet into the text box
4. Click **Add** — the language is auto-detected
5. Your code appears in the snippet rotation immediately

### Option 2: Import a File or Folder

1. Open **Settings** → scroll to **Import**
2. Click **Import File** to add a single source file, or **Import Folder** to scan an entire project
3. The app auto-detects language from file extensions (`.py`, `.js`, `.cs`, `.java`, `.sql`, `.sh`)
4. Imported code is deduplicated by content hash — the same code is never added twice

### Option 3: Create a Snippet Pack (JSON)

For curated sets of practice snippets:

1. Open your user snippets folder:
   ```
   %LocalAppData%\DevOpTyper\UserSnippets\
   ```
   (or click **Open Snippets Folder** in Settings)

2. Create a JSON file named after the language (e.g. `python.json`):
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

3. Restart the app — your snippets appear alongside the built-in ones

**Tips:**
- `id` must be unique across all packs
- `difficulty` ranges from 1 (easy) to 7 (hard)
- `code` should end with `\n`
- You can organize packs in subdirectories one level deep

### Sharing Content

Export your custom snippets as a portable `.ldtpack` bundle:

1. Open **Settings** → click **Export Bundle**
2. Share the `.ldtpack` file with others
3. They import it via **Settings** → **Import Bundle**

Only user-authored content travels — never practice history or settings.

## Privacy

Dev-Op-Typer is fully offline. No data is collected, transmitted, or shared. See [PRIVACY.md](PRIVACY.md).

## Security & Data Scope

Dev-Op-Typer is a **local-first** WinUI 3 desktop application.

- **Data accessed:** User typing input, profile data and session history in `%LOCALAPPDATA%/DevOpTyper/`, user snippet packs (JSON), community content bundles (.ldtpack)
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. No network calls. No authentication
- **Permissions:** File system read/write for local user data directory. No elevated permissions

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

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
