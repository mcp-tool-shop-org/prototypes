---
title: For Beginners
description: New to Linux Dev Typer? Start here for a gentle introduction.
sidebar:
  order: 99
---

## What is this tool?

Linux Dev Typer is a typing practice app built specifically for programmers. Instead of typing random sentences, you practice typing real code snippets from Python, Rust, JavaScript, C#, and Java. The app tracks your mistakes at the individual character level, adapts difficulty to your skill, and helps you build muscle memory for the symbols and patterns you actually use when coding.

It runs on Linux, macOS, and Windows — the "Linux" in the name is historical, not a platform restriction.

## Who is this for?

- **Developers** who want to type code faster and with fewer mistakes
- **Students** learning to program who want to get comfortable with code syntax
- **Anyone** who struggles with special characters like `{}`, `[]`, `=>`, `::`, or `|>` when coding
- **Typing enthusiasts** who find traditional typing tutors boring because they only use prose

## Prerequisites

- **.NET 8 SDK or later** — [download from Microsoft](https://dotnet.microsoft.com/download). Check with `dotnet --version`
- **Git** — for cloning the repository
- A Linux, macOS, or Windows machine
- No accounts, API keys, or internet connection needed after cloning

## Your first 5 minutes

### 1. Clone and build

```bash
git clone https://github.com/mcp-tool-shop-org/linux-dev-typer.git
cd linux-dev-typer
dotnet restore
dotnet build -c Release
```

### 2. Launch the app

```bash
dotnet run --project src/LinuxDevTyper.App/LinuxDevTyper.App.csproj
```

A desktop window opens immediately.

### 3. Pick a language and start typing

Choose a language (Python, Rust, JavaScript, etc.) and start typing the code snippet shown on screen. Characters turn teal when correct and red when wrong.

### 4. Finish a snippet

After completing a snippet, you see a results card showing your WPM (words per minute), accuracy, XP earned, and any insights the engine detected.

### 5. Try another round

The engine adjusts difficulty based on your performance. Your second snippet will be tuned to your skill level.

## Common mistakes

1. **Expecting prose typing practice.** Linux Dev Typer is for code, not English text. The snippets contain brackets, semicolons, indentation, and operators. This is intentional — those are the characters developers need to practice.

2. **Worrying about a low starting WPM.** Code typing is harder than prose because of special characters and indentation. A 40 WPM on code snippets is perfectly normal even for fast typists. The app tracks your improvement over time.

3. **Not realizing the difficulty adapts.** If you find early snippets too easy or too hard, keep going. The Elo-based system adjusts after each snippet. By your third or fourth attempt, the difficulty should match your skill level.

4. **Ignoring the weakness insights.** After each session, the results card shows which characters and patterns gave you trouble. Pay attention to these — the engine uses them to select future snippets that target your weak spots.

5. **Typing through fatigue.** The app includes fatigue detection. If it suggests a break, take one. Practicing while tired reinforces bad habits instead of building muscle memory.

## Next steps

- [Getting Started](/linux-dev-typer/handbook/getting-started/) — build instructions and project structure
- [Adaptive Learning](/linux-dev-typer/handbook/adaptive-learning/) — how the rating system and weakness tracking work
- [Content System](/linux-dev-typer/handbook/content-system/) — add your own code snippets

## Glossary

- **WPM** — Words Per Minute. Measures typing speed. In code typing, a "word" is 5 characters (standard typing metric).
- **Elo rating** — A skill-rating system (inspired by chess). Each language has its own rating that goes up when you perform well and down when you struggle. Starts at 1200.
- **Mistake heatmap** — A per-character record of which keys you get wrong most often. Used to select snippets that target your weaknesses.
- **Confusion pair** — Two characters you frequently mix up (e.g., `{` and `[`). The engine tracks these and drills them.
- **Fatigue detection** — The engine monitors declining accuracy and WPM within a session. When it detects fatigue, it suggests a break.
- **Snippet pack** — A JSON file containing code snippets for a specific language. You can create and share your own packs.
- **Micro-drill** — A short, focused exercise targeting a specific weakness (like bracket pairs or arrow functions).
- **Avalonia UI** — A cross-platform .NET UI framework. It's what makes the app run on Linux, macOS, and Windows from one codebase.
