---
title: Getting Started
description: Prerequisites, build instructions, and project overview for Linux Dev Typer.
sidebar:
  order: 1
---

## Prerequisites

- **.NET 8 SDK** (or later) — [download from Microsoft](https://dotnet.microsoft.com/download)
- **Git** — for cloning the repository
- A Linux, macOS, or Windows machine (Avalonia UI is cross-platform)

No accounts, no API keys, no network connection required. Everything runs locally.

## Clone and build

```bash
git clone https://github.com/mcp-tool-shop-org/linux-dev-typer.git
cd linux-dev-typer
dotnet restore
dotnet build -c Release
```

## Run the app

```bash
dotnet run --project src/LinuxDevTyper.App/LinuxDevTyper.App.csproj
```

The desktop window opens immediately. Pick a language, start typing, and the engine begins tracking your performance from session one.

## Run the tests

The project includes 817 xUnit tests covering every engine, model, and integration path.

```bash
dotnet test src/LinuxDevTyper.Core.Tests/
```

All tests run without network access, external services, or special configuration.

## Project structure

| Path | Purpose |
|------|---------|
| `src/LinuxDevTyper.Core/` | Portable engine library — typing sessions, rating, trends, difficulty, weakness detection, guided mode. Zero UI dependencies. |
| `src/LinuxDevTyper.Core.Tests/` | 817 xUnit tests covering engines, models, migrations, invariants, and edge cases. |
| `src/LinuxDevTyper.App/` | Avalonia desktop shell — UI, platform services, audio, import/export. |
| `assets/snippets/` | Built-in JSON snippet packs (Python, Rust). |
| `assets/sounds/sfx/` | Keyboard sound themes (5 themes: AlpsCream, Mechanical, Membrane, SoftTouch, Topre). |
| `assets/sounds/ambient/` | Ambient soundscapes (4 categories: Ocean, Rain, Wind, Zen). |

## First session

When you launch the app for the first time:

1. Your starting rating is **1200** (per language).
2. The engine picks a snippet near your estimated skill level.
3. Type the code as displayed. The engine records your WPM, accuracy, and per-character mistakes.
4. After completion, you see a results card with XP earned, insights, and trend data.
5. Difficulty adapts automatically from session two onward.

No setup wizards, no onboarding flow. Open the app and start typing.
