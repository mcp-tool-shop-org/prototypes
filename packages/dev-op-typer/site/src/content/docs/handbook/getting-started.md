---
title: Getting Started
description: Install Dev-Op-Typer, run your first typing session, and learn the keyboard shortcuts.
sidebar:
  order: 1
---

## Installation

Dev-Op-Typer is a Windows desktop app built with WinUI 3 and .NET 10. There is no installer yet (Microsoft Store certification is pending), so you build it from source.

### Requirements

- **Windows 10** version 1809 or later, or **Windows 11**
- **.NET 10.0 SDK** — download from [dotnet.microsoft.com](https://dotnet.microsoft.com/download)
- **Visual Studio 2022** with the *Windows App SDK* workload (for the XAML compiler and packaging tools)

You can also build from the CLI without the full Visual Studio IDE, but the Windows App SDK workload must be installed either way.

### Build from source

```bash
git clone https://github.com/mcp-tool-shop-org/dev-op-typer.git
cd dev-op-typer
dotnet build DevOpTyper/DevOpTyper.csproj -c Release -p:Platform=x64
```

The built executable will be at:

```
DevOpTyper\bin\x64\Release\net10.0-windows10.0.19041.0\DevOpTyper.exe
```

Run it directly — no installation step required.

:::note[Cross-platform alternative]
Looking for Linux or macOS? Check out [linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer), the Avalonia UI port.
:::

## Your first session

1. **Launch the app.** You will see a code snippet in one of the six supported languages.
2. **Start typing.** Match the code character-by-character. Symbols, indentation, and newlines all count.
3. **Watch the live stats.** WPM, accuracy, and error count update in real time as you type.
4. **Finish the snippet.** When you reach the end, the app shows a completion banner with your results — WPM, accuracy, and how you compared to your recent average.
5. **Press Enter** to start the next snippet. The adaptive engine picks one at the right difficulty for you.

That is the entire loop. There are no accounts to create, no tutorials to complete, and no setup wizards. Open the app and start typing code.

### Choosing a language

Use the language selector in the title bar to switch between Python, JavaScript, C#, Java, SQL, and Bash. Each language has its own rating, so your Python progress is tracked independently from your C# progress.

### Understanding difficulty

Snippets are rated D1 (easiest) through D7 (hardest). The app uses an Elo-like rating system per language to select snippets at your current skill level. Each session draws from a mix:

| Category | Share | Purpose |
|----------|-------|---------|
| Target   | 50%   | Snippets at your current level |
| Review   | 30%   | Slightly easier snippets to consolidate skills |
| Stretch  | 20%   | Slightly harder snippets to push your limits |

You never need to think about this — it happens automatically. But if you are curious, press **Shift+F12** (in debug builds) to open the inspector and see exactly why each snippet was chosen.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| **Enter** | Start a new test |
| **Escape** | Reset the current test |
| **Tab** | Navigate to the next control |
| **Shift+Tab** | Navigate to the previous control |

The title bar has a gear icon (⚙) for the Settings panel and a speaker icon for audio controls. Both are keyboard-accessible.
