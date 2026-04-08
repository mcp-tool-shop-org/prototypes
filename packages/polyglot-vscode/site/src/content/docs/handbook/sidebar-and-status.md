---
title: Sidebar and Status
description: The sidebar panel, status bar indicator, and status tree explained.
sidebar:
  order: 4
---

Polyglot provides three UI elements to keep you informed and give quick access to translation features: the **sidebar panel**, the **status bar indicator**, and the **status tree**.

## Sidebar panel

Click the **globe icon** in the VS Code activity bar (left edge) to open the Polyglot sidebar. It contains two sections:

### Quick Actions

Styled buttons for the three main translation commands:

- **Translate Selection** — the primary action button, includes the `Ctrl+Alt+T` hint
- **Translate File** — translates the entire current file
- **Translate README** — batch-translates README.md into 7 languages

### Tools

- **Check Status** — verifies Ollama is running and the model is installed
- **Settings** — opens VS Code settings filtered to Polyglot
- **Help** — opens the help quick-pick menu

The sidebar buttons send messages to the extension, which dispatches the corresponding VS Code command. This means every sidebar action behaves identically to running the command from the Command Palette.

## Status bar indicator

A status bar item appears in the bottom-right corner of VS Code. It shows the current connection state at a glance:

| Icon | Meaning |
|------|---------|
| Globe icon (`Polyglot`) | Ready — Ollama is running and the model is installed |
| Spinning sync icon | Checking connection status |
| Warning icon (yellow) | Ollama is not running, or the model is missing |
| Cloud download icon (yellow) | Model needs to be downloaded |
| Error icon (red) | Cannot reach the Ollama server |

Click the status bar item at any time to run **Check Status**, which can automatically start Ollama and pull the model.

### Polling behavior

The status bar polls Ollama every **30 seconds** to keep the indicator current. This is a lightweight HTTP check against the Ollama API — it does not load the model or consume GPU resources.

## Status tree

Below the sidebar action buttons, the **Status** tree view shows detailed connection information:

- **Ollama** — Connected / Not running
- **Model** — Current model name and installation status
- **Available** — Lists all TranslateGemma-related models on your Ollama instance
- **Server** — The Ollama URL being used
- **Languages** — Confirms 55 languages are supported

The tree refreshes automatically every 30 seconds, or you can click the **refresh icon** in the tree view title bar to force an immediate update.
