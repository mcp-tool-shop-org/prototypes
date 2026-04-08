---
title: Reference
description: Deep dive into every Dev-Op-Typer feature — adaptive learning, content system, audio, accessibility, project structure, and security.
sidebar:
  order: 2
---

## Adaptive learning

Dev-Op-Typer does not just track your WPM. It builds a model of your strengths and weaknesses and uses that model to select practice material.

### Per-language Elo ratings

Each of the six languages has an independent Elo-like rating. Completing a snippet adjusts your rating based on the snippet’s difficulty and your accuracy. Over time, the rating converges on your true skill level for that language.

### Mistake heatmap

Every character you mistype is recorded in a per-character heatmap. The app tracks confusion pairs (typing `(` when you meant `{`), frequency of each mistake, and whether each weakness is improving, worsening, steady, or newly appearing. The heatmap is bounded — it stores up to 200 tracked characters with up to 20 confusion pairs each — and persists across sessions.

### Guided Mode

Guided Mode is an opt-in feature (off by default) that uses your heatmap data to bias snippet selection toward your weak spots. When enabled:

- Within your current difficulty band, the app slightly prefers snippets that exercise your weakest symbol groups (brackets, operators, quotes, etc.)
- The bias is bounded at +15 — a nudge, not a redirect
- The diversity guard requires at least two weak symbol groups before activating
- Difficulty band, XP, and scoring are never affected
- Micro-drills can be triggered: short sets of five snippets focused on a specific weakness

Guided Mode respects your autonomy. It never forces you into a specific path, and toggling it off restores standard selection instantly.

### Session planning

Each session is composed from a target/review/stretch mix (50/30/20). The session planner also supports declared intents — optional labels like *Focus*, *Challenge*, *Maintenance*, or *Exploration* that you can attach to a session. Intents are stored for your own reflection but never alter snippet selection, scoring, or difficulty.

### Fatigue detection

The app monitors your rolling WPM and accuracy during a session. If it detects a significant drop, it surfaces a break suggestion. The suggestion is informational only — it never pauses or locks the app.

## Content system

Dev-Op-Typer ships with 168+ calibration snippets across all six languages, but the real power is in the content system that lets you practice your own code.

### Built-in snippets

The calibration set covers common patterns at every difficulty level: loops, conditionals, function definitions, class hierarchies, SQL joins, Bash pipelines, and more. Each snippet has a difficulty rating (D1–D7), topic tags, and optional teaching notes.

### Paste Code

The fastest way to practice your own code. Open the Settings panel, scroll to Paste Code, paste any code into the text box, and click Add. The language is auto-detected from the content. Your snippet enters the rotation immediately.

### Import File or Folder

For larger additions, use the Import feature in Settings. Import File adds a single source file; Import Folder scans an entire project directory. The app auto-detects language from file extensions (`.py`, `.js`, `.cs`, `.java`, `.sql`, `.sh`). Every imported snippet is deduplicated by SHA-256 content hash — the same code is never added twice, even if you import it from different locations.

### Snippet packs (JSON)

For curated sets, drop a JSON file into your user snippets folder:

```
%LocalAppData%\DevOpTyper\UserSnippets\
```

The format is straightforward:

```json
{
  "language": "python",
  "snippets": [
    {
      "id": "my_list_comp",
      "title": "List comprehension",
      "difficulty": 3,
      "topics": ["lists", "comprehension"],
      "code": "squares = [x**2 for x in range(10)]
"
    }
  ]
}
```

Each snippet needs a unique `id`, a `difficulty` from 1–7, and `code` that ends with `
`. You can optionally include `topics` (string array), `explain` (1–3 teaching bullets), `symbols` (symbol clusters like `["()","{}","=>"]`), and `source` (attribution). Packs can be organized in subdirectories one level deep.

### Sharing content with .ldtpack bundles

Export your custom snippets as a portable `.ldtpack` bundle via Settings, then share the file with teammates or the community. Recipients import it through Settings as well. Only user-authored content travels in a bundle — never practice history, ratings, or settings.

### Scaffolds and demonstrations

The teaching layer offers two kinds of contextual support:

- **Scaffolds** are progressive hints attached to a snippet. They start with a brief orientation and reveal deeper context layer by layer when you click "More context."
- **Demonstrations** are alternative implementations shown alongside a snippet — not as corrections, but as peers. A Python list comprehension might have a generator expression demonstration alongside it.

Both are optional metadata that content authors can attach to snippet packs.

## Audio

Dev-Op-Typer includes ambient soundscapes and mechanical keyboard sounds to create an immersive practice environment.

### Keyboard sounds

Five mechanical keyboard themes are available, each with eight sound variations to avoid repetitive clicking: Cherry MX Blue, Cherry MX Brown, Cherry MX Red, Topre, and Buckling Spring. Sounds are triggered per keypress during typing sessions.

### Ambient soundscapes

Background soundscapes play during practice to help with focus. Themes include rain, deep focus, cafe, and white noise.

### Volume controls

Each audio channel (ambient, keyboard, UI) has an independent volume slider in Settings. The title bar includes a mute/unmute toggle that silences all audio instantly.

## Accessibility

Dev-Op-Typer is built with accessibility as a first-class concern, not an afterthought.

### Keyboard navigation

Every interactive control is reachable with Tab. The tab order follows a logical flow: title bar, then main content, then sidebar. A strong visible focus indicator makes it clear which control is active.

### Screen reader support

All interactive elements have `AutomationProperties` labels (the WinUI equivalent of ARIA attributes). The app avoids announcing each character as it is typed — instead, it provides periodic status updates for WPM and accuracy. Controls report clear names and states.

### Visual accessibility

High contrast theme support respects the Windows system setting. Font size scales with the system DPI. Error states use underlines and icons in addition to color, so they remain visible under any color vision condition.

### Reduced motion

When the OS reduce-motion setting is active, the app disables animations and transitions. A reduced sensory mode lowers volumes and reduces sound effects frequency.

## Project structure

```
DevOpTyper/
├── Assets/
│   ├── Icons/         # App icons and Store tile assets
│   ├── Snippets/      # JSON snippet packs by language (6 files)
│   └── Sounds/        # Ambient and SFX audio files
├── Controls/          # Custom controls (CodeRenderer, TypingPresenter)
├── Models/            # Data models (Profile, Snippet, AppSettings, etc.)
├── Panels/            # UI panels (Typing, Stats, Settings, Explanation, etc.)
├── Services/          # Core services (Audio, Typing, Persistence, Content)
├── Themes/            # Color and high-contrast themes
├── MainWindow.xaml    # Main application window
└── Package.appxmanifest
external/
└── meta-content-system/   # Shared content library (git submodule)
```

- **Controls/** contains the two main rendering components: `CodeRenderer` (displays the snippet with diff highlighting) and `TypingPresenter` (handles input and accuracy tracking).
- **Services/** is where the core logic lives: the adaptive engine, audio playback, content indexing, persistence, and session management.
- **Panels/** are the UI pages: Typing (the main practice view), Stats (charts and heatmaps), Settings (configuration and content import), and Explanation (scaffolds and demonstrations).
- **external/meta-content-system/** is a git submodule containing the shared content library used across Dev-Op-Typer variants.

## Persistence and data lifecycle

All data is stored locally in `%LocalAppData%\DevOpTyper\`. Nothing is ever transmitted.

| Data | Retention | Cap |
|------|-----------|-----|
| Session records | Indefinite | 500 most recent |
| Session timestamps | Indefinite | 200 most recent |
| Language trend points | Indefinite | 50 per language |
| Weakness snapshots | Indefinite | 90 most recent |
| Practice context | Per-session | Stored with record |
| Session notes | Per-session | 280 characters max |

Monthly compression merges older session records to keep the data footprint small. All data can be exported as JSON and all data can be reset from the Settings panel.

## Security and data scope

Dev-Op-Typer is a local-first desktop application with a minimal security surface.

- **Data accessed:** User typing input during sessions, profile and session history in `%LocalAppData%\DevOpTyper\`, user snippet packs (JSON), community content bundles (.ldtpack)
- **Data NOT accessed:** No cloud sync, no telemetry, no analytics, no network calls, no authentication
- **Permissions:** File system read/write for the local user data directory only. No elevated permissions. No access to system files.

The app makes zero network connections. Your typing data, ratings, and practice history stay on your machine.
