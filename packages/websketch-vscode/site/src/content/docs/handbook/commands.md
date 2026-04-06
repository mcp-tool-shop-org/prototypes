---
title: Commands
description: All 6 WebSketch commands, the 4 export views, and practical use cases for prompt engineering, development, and AI agents.
sidebar:
  order: 3
---

All commands are available through the VS Code Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).

## Command Reference

| Command | Description |
|---------|-------------|
| **WebSketch: Capture URL** | Prompts for a URL, captures the page, and displays the result in a panel with all four views. |
| **WebSketch: Capture URL from Clipboard** | Reads the URL from your clipboard and captures it immediately -- no prompt needed. |
| **WebSketch: Copy LLM Tree to Clipboard** | Copies the semantic tree from the current capture so you can paste it straight into any LLM. |
| **WebSketch: Export LLM Tree** | Saves the semantic tree as a `.md` file for prompt libraries or documentation. |
| **WebSketch: Export Capture as JSON** | Saves the full `WebSketchCapture` IR including bounding boxes, hashes, and metadata. |
| **WebSketch: Export ASCII Wireframe** | Saves a box-drawing spatial layout view of the captured page. |

## The 4 Views

Every capture opens in a panel with four tabs. Each view shows the same data in a different format:

| View | What it shows | Best for |
|------|---------------|----------|
| **LLM** (default) | Indented semantic tree with labels, semantic hints, and flags. | Pasting into LLM prompts. This is the primary output. |
| **ASCII** | Box-drawing wireframe showing spatial layout relationships. | Understanding visual layout and element positioning. |
| **Tree** | Collapsible node tree with color-coded role badges. | Debugging captures and exploring the hierarchy interactively. |
| **JSON** | Full `WebSketchCapture` IR with syntax highlighting. | Programmatic use, pipelines, and integration with other tools. |

## Use Cases

### Prompt Engineering

**Describe a page's layout** -- Paste the LLM tree into your prompt. The model sees exact structure, headings, and navigation without drowning in HTML. Works with ChatGPT, Claude, Gemini, Llama, and any other text model.

**Enumerate user actions** -- Every interactive element is marked with `*` and labeled with its visible text. Ask the LLM what a user can do on the page and it can list every link, button, input, checkbox, and radio.

**Compare two pages** -- Capture both pages, paste the trees side by side. The LLM can diff structure, spot missing elements, and compare navigation patterns in a few hundred tokens.

### Development

**Generate a test plan** -- The tree maps directly to test targets. `*BUTTON "Submit"`, `*INPUT <email> "Enter email"`, `*LINK "Terms"` -- each is a testable interaction with its visible label already extracted.

**Scaffold components** -- The semantic tree is close to a component hierarchy. `HEADER > NAV > LIST > LINK` maps directly to React, Vue, or Svelte components. The LLM can generate a matching layout from the tree.

**Audit accessibility** -- Missing landmarks, unlabeled inputs, and heading hierarchy gaps are all visible in the tree. Semantic hints like `<main>`, `<nav>`, and `<search>` show which ARIA roles are present or absent.

### AI Agents

**MCP integration** -- Use [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) to give your AI agent the ability to capture and reason about any web page as part of its tool chain. The MCP server exposes the same capture pipeline as this extension.

**Automated monitoring** -- Use [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) to capture pages on a schedule, diff the trees, and detect structural changes before they reach production.

---

[Back to landing page](/websketch-vscode/)
