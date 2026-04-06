---
title: Environments
description: Tour of all six built-in environments and how to create your own.
sidebar:
  order: 2
---

claude-collaborate ships with six built-in environments plus an optional Voice Studio link. Each built-in environment is a self-contained HTML file served by the Python server. Switch between them instantly from the sidebar -- no page reload, no lost state.

## Whiteboard

A freeform drawing canvas for visual brainstorming. Sketch diagrams, map out architectures, or annotate screenshots while chatting with Claude. Supports freehand drawing, shapes, and text. Claude can see what you draw and respond with suggestions or modifications.

## Code Workshop

A live HTML/CSS/JS editor with instant preview. Write code in the left panel and see results in the right panel in real time. Ideal for prototyping UI components, testing CSS layouts, or building quick demos together with Claude. No build step -- what you type is what you see.

## Chess Workshop

A strategy and tactics playground. Set up positions, walk through openings, or analyze games with Claude. The board is interactive -- click to place and move pieces. Use the chat panel to discuss strategy, ask for move suggestions, or explore variations.

## Capture Viewer

Browse screenshots and recordings from your collaboration sessions. When you capture the whiteboard or code output, files appear here organized by timestamp. Useful for reviewing what you built, sharing progress, or picking up where you left off.

## GitHub Toolkit

README and marketing content generators built into the sandbox. Describe your project in the chat, and Claude helps you draft a README, generate badges, or create marketing copy. Output can be copied directly or pushed to a repository.

## Creative Lab

An open-ended workspace for experiments and one-off creative explorations. No fixed purpose -- use it for anything that does not fit the other five environments. Interactive visualizations, generative art, data explorations, or whatever you and Claude dream up.

## Voice Studio (optional)

An external link to the [Voice Soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) TTS studio at `http://localhost:8080/studio`. This entry only works when voice-soundboard is running separately. It opens in the same iframe container as the built-in environments.

## Creating a new environment

Every environment is a plain HTML file. To add your own:

1. **Copy the template:**

```bash
cp template.html my-workspace.html
```

2. **Add a sidebar entry** in `index.html`. Find the `env-list` `<div>` and add an entry before the "Add Environment" item:

```html
<div class="env-item" data-url="/my-workspace.html" data-name="My Workspace">
    <div class="env-icon" style="background: linear-gradient(135deg, #58a6ff, #79c0ff);">🎯</div>
    <div class="env-info">
        <h3>My Workspace</h3>
        <p>Description of your environment</p>
    </div>
</div>
```

3. **Refresh the browser.** Your new environment appears in the sidebar immediately. No build step, no restart.

The template includes CSS variables matching the dark theme, a header, and a content area. Wire up WebSocket communication by connecting to `ws://localhost:8877/ws` for real-time Claude integration.
