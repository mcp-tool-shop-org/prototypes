---
title: Getting Started
description: Install Code Bearings and index your first project in under a minute.
sidebar:
  order: 1
---

## Install the CLI

```bash
npm install -g @code-bearings/cli
```

Or run directly without installing:

```bash
npx @code-bearings/cli analyze
```

## Index Your Project

Navigate to any TypeScript project with a `tsconfig.json` and run:

```bash
code-bearings analyze
```

This creates a `.code-bearings/bearings.db` SQLite database containing your project's code graph: files, symbols, edges, modules, and metrics.

## Explore the Graph

```bash
# List all detected modules
code-bearings modules

# Deep-dive into a specific module
code-bearings module auth

# Inspect a specific function
code-bearings function generateChangeBrief

# See the full system map
code-bearings overview
```

## Review Your Changes

```bash
# Review staged + unstaged changes
code-bearings review

# Review staged changes only
code-bearings review --staged

# Compare branches
code-bearings compare main feature-branch

# Generate an HTML report
code-bearings review --format html -o review.html
```

## Use Purpose Modes

```bash
# Default: canonical change brief
code-bearings review --mode general

# Failure hypotheses and blind spots
code-bearings review --mode bug-hunter

# Syntax translations and before/after explanations
code-bearings review --mode learning

# Module roles and boundary health
code-bearings review --mode architecture

# Guided questions for unfamiliar code
code-bearings review --mode exploration
```

## VS Code Extension

Install "Code Bearings" from the VS Code extensions panel, then:

1. Open the Command Palette (`Ctrl+Shift+P`)
2. Run **Code Bearings: Analyze Project**
3. Run **Code Bearings: Review Changes**

The extension provides hover tooltips, CodeLens annotations, gutter decorations, and an interactive review panel — all fed from the same canonical graph as the CLI.

## CI Integration

```bash
code-bearings ci --fail-on-risk high --out ./review-artifacts
```

Generates Markdown, JSON, HTML, and compact text review artifacts. Exits non-zero if risk exceeds the threshold.
