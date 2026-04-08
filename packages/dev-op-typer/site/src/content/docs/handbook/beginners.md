---
title: Beginners Guide
description: A start-here page for people who have never used Dev-Op-Typer before.
sidebar:
  order: 99
---

## What is this tool?

Dev-Op-Typer is a typing practice application built for developers. Instead of typing random English words, you type real code — Python, JavaScript, C#, Java, SQL, and Bash — with every symbol, brace, semicolon, and indentation level counting toward your score.

The app tracks your performance per language, builds a model of your strengths and weaknesses, and adapts the difficulty of each session to match your skill level. Everything runs locally on your machine. There are no accounts, no cloud sync, and no telemetry.

## Who is this for?

- **Developers who want faster, more accurate coding.** If you spend hours a day typing code, even a small improvement in speed and accuracy compounds over time.
- **Students learning a new programming language.** Typing real code patterns builds muscle memory for syntax faster than reading documentation alone.
- **Developers switching languages.** If you are fluent in Python but learning C#, your fingers need practice with different symbol patterns (`{}` vs indentation, `;` line endings, type annotations).
- **Anyone who wants to reduce typos in code.** The mistake heatmap shows exactly which characters trip you up, and Guided Mode steers practice toward those weaknesses.

Dev-Op-Typer is **not** a general typing tutor. It does not teach touch typing or the home row. It assumes you can already type and focuses on the specific challenge of typing code accurately.

## Prerequisites

- **Windows 10** version 1809 or later, or **Windows 11**
- **.NET 10.0 SDK** — download from [dotnet.microsoft.com](https://dotnet.microsoft.com/download)
- **Visual Studio 2022** with the *Windows App SDK* workload installed (required for the XAML compiler and packaging tools, even if you build from the command line)

A Linux/macOS alternative exists: [linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer), built with Avalonia UI.

## Your first 5 minutes

1. **Clone and build the project:**
   ```bash
   git clone https://github.com/mcp-tool-shop-org/dev-op-typer.git
   cd dev-op-typer
   dotnet build DevOpTyper/DevOpTyper.csproj -c Release -p:Platform=x64
   ```

2. **Launch the app** by running:
   ```
   DevOpTyper\bin\x64\Release\net10.0-windows10.0.19041.0\DevOpTyper.exe
   ```

3. **Pick a language.** Use the language selector in the title bar. Start with whatever language you use most.

4. **Type the snippet.** Match the code character-by-character. Symbols, whitespace, and newlines all matter. Your WPM, accuracy, and error count update in real time as you type.

5. **Finish and review.** When you reach the end, a completion banner shows your results. Press **Enter** to start the next snippet — the app picks one at the right difficulty for you.

That is the entire workflow. There are no tutorials, no setup wizards, and no accounts. Open the app and start typing code.

## Common mistakes

### Ignoring symbols

New users often focus on typing speed and ignore accuracy on symbols like `{`, `}`, `(`, `)`, `;`, and `:`. These characters matter the most in real code. Slow down on symbols until your accuracy is consistent, then speed will follow naturally.

### Skipping the heatmap

The Weak Spots panel shows exactly which characters you mistype most often. Many users never look at it. Check it after every few sessions — it tells you where to focus.

### Fighting the adaptive engine

The app picks snippets at your level. If everything feels too easy, your rating will naturally climb and harder snippets will appear. If everything feels too hard, complete a few sessions honestly and the engine will recalibrate. Do not try to override this by filtering to specific difficulty levels unless you have a specific reason.

### Using Guided Mode too early

Guided Mode biases snippet selection toward your weaknesses. It needs enough data to work well — at least a few sessions with meaningful mistake data. If you enable it on day one, it has nothing to work with.

### Ignoring fatigue warnings

When the app suggests a break, your accuracy has measurably dropped. Practicing while fatigued reinforces mistakes. Take the break.

## Next steps

- **Read the [Getting Started](/dev-op-typer/handbook/getting-started/) page** for keyboard shortcuts and a deeper look at how difficulty works.
- **Add your own code** via Paste Code in Settings — practicing code from your actual projects is the fastest way to improve.
- **Check the [Reference](/dev-op-typer/handbook/reference/)** for a complete feature walkthrough: adaptive learning, audio, accessibility, and the content system.
- **Create a [Practice Config](/dev-op-typer/handbook/practice-configs/)** if you want to save parameter presets (e.g., a morning warmup with easier snippets and lenient whitespace).
- **Browse [Tips and Tricks](/dev-op-typer/handbook/tips-and-tricks/)** for session strategy, weakness targeting, and display tuning.

## Glossary

| Term | Definition |
|------|------------|
| **Snippet** | A single piece of code that you type as a practice exercise. Snippets have a title, difficulty, language, and optional teaching metadata. |
| **Difficulty (D1-D7)** | A 7-level scale rating how hard a snippet is to type accurately. D1 is simple assignments; D7 is dense multi-line logic with heavy symbol use. |
| **Elo rating** | A per-language numerical rating (starting at 1200) that tracks your skill level. It rises when you perform well and drops when you struggle. The adaptive engine uses it to pick appropriately difficult snippets. |
| **Heatmap** | A per-character record of your mistake frequency. Tracks which characters you mistype, how often, and whether each weakness is improving or worsening. |
| **Guided Mode** | An opt-in feature that biases snippet selection toward your weak symbol groups. Off by default. |
| **Micro-drill** | A short set of 5 snippets focused on your top weakness category. Triggered when Guided Mode is active. |
| **Scaffold** | A progressive hint attached to a snippet that reveals context layer by layer ("More context" button). Fades as you demonstrate competence. |
| **Demonstration** | An alternative implementation shown alongside a snippet as a peer, not a correction. |
| **Practice config** | A named JSON file that overrides session parameters (difficulty bias, whitespace rules, backspace mode). Select from the Settings dropdown. |
| **Intent** | An optional label (Focus, Challenge, Maintenance, Exploration) you attach to a session for personal reflection. Does not change behavior. |
| **`.ldtpack`** | A portable ZIP bundle for sharing custom snippets and configs. Contains only user-authored content, never practice history. |
| **XP** | Experience points earned by completing snippets. Accuracy below the accuracy floor (default 70%) earns zero XP. |
| **Fatigue detection** | The app monitors rolling WPM and accuracy and suggests a break if both drop significantly. Informational only. |
