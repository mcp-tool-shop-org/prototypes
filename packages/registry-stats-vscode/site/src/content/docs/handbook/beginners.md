---
title: For Beginners
description: New to Registry Stats? Start here for a gentle introduction.
sidebar:
  order: 99
---

## What is this tool?

Registry Stats is a VS Code extension that shows you how many times your project's dependencies have been downloaded. It reads your project files (`package.json`, `pyproject.toml`, or `.csproj`) and fetches live statistics from package registries like npm, PyPI, and NuGet.

Instead of visiting each registry's website to check download numbers, you see them right in your editor — in the status bar, as tooltips when you hover over dependency names, or as inline CodeLens annotations above each dependency line.

It also generates reports in three formats: a one-page PDF for stakeholders, a JSONL feed for AI tools, and a Markdown summary for dev teams.

## Who is this for?

- **Package maintainers** who want to track how their libraries are performing
- **Team leads** who need to report on dependency health and popularity
- **Developers** who are curious about the download activity of their project's dependencies
- **Anyone using AI tools** who wants structured, schema-versioned dependency data to feed into LLM pipelines

## Prerequisites

- **VS Code 1.85 or later** — check Help > About in VS Code
- **A project with dependencies** — at least one `package.json` (npm), `pyproject.toml` (Python), or `*.csproj` (.NET) file
- **Internet connection** — the extension fetches data from public registry APIs
- No API keys needed for npm, PyPI, NuGet, or VS Code Marketplace

## Your first 5 minutes

### 1. Install the extension

Open VS Code, go to the Extensions panel (`Ctrl+Shift+X`), search for **Registry Stats**, and click Install. Or visit the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode).

### 2. Open a project

Open any project folder that has a `package.json`. The extension activates automatically on startup.

### 3. Check the status bar

Look at the bottom of VS Code. You should see a download count for your primary package. Hover over it for a breakdown of daily, weekly, monthly, and all-time downloads.

### 4. Hover over a dependency

Open your `package.json` and hover over any dependency name (like `express` or `typescript`). A tooltip shows that package's download stats across registries.

### 5. Generate your first report

Press `Ctrl+Shift+P`, type **Registry Stats: Generate Report**, and pick **Dev** then **Preview in editor**. You'll see a Markdown summary of all your dependencies' download stats.

## Common mistakes

1. **Expecting stats for private packages.** Registry Stats queries public APIs. If your package is private or scoped behind authentication, download counts won't be available (except Docker Hub with a token configured).

2. **Wondering why numbers are stale.** Stats are cached to avoid hammering registry APIs. npm and PyPI cache for 6 hours by default, NuGet and VS Code Marketplace for 12 hours, Docker for 24 hours. Run **Registry Stats: Refresh Stats** to force a fresh fetch.

3. **Not seeing CodeLens inline stats.** CodeLens is opt-in — it's disabled by default. Enable it in settings: `registryStats.codeLens.enabled: true`.

4. **Opening a folder with no manifest files.** The extension needs at least one `package.json`, `pyproject.toml`, or `*.csproj` to detect dependencies. Without one, there's nothing to scan.

5. **Confusing the sidebar audiences.** The sidebar shows three report views (Executive, LLM, Dev). Switch between them using the audience buttons. Each format is designed for a different audience — Executive for stakeholders, LLM for AI pipelines, Dev for developers.

## Next steps

- [Getting Started](/registry-stats-vscode/handbook/getting-started/) — detailed walkthrough with screenshots
- [Reference](/registry-stats-vscode/handbook/reference/) — every command, setting, and report format

## Glossary

- **Registry** — A package hosting service like npm (JavaScript), PyPI (Python), NuGet (.NET), VS Code Marketplace (extensions), or Docker Hub (containers).
- **Manifest** — A project file that lists dependencies, like `package.json`, `pyproject.toml`, or `*.csproj`.
- **CodeLens** — VS Code's inline annotations that appear above lines of code. Registry Stats can optionally show download counts this way.
- **Stale-while-revalidate** — A caching strategy where old data is shown immediately while fresh data is fetched in the background. Keeps the UI fast.
- **JSONL** — JSON Lines format. Each line is a complete JSON object. Used for streaming data to AI tools.
- **TTL** — Time To Live. How long cached data is considered fresh before the extension re-fetches.
