---
title: jam-session-plugin Handbook
description: Complete guide to the AI piano player Claude Code plugin.
sidebar:
  order: 0
---

jam-session-plugin is a Claude Code plugin that wraps the AI Jam Session MCP server. It adds a 100-song piano library, structured teaching workflows, and AI-powered jam sessions directly inside Claude Code. Audio plays through your system speakers -- no external DAW or piano software required.

## What's inside

- **[Getting Started](/jam-session-plugin/handbook/getting-started/)** -- Install the plugin and play your first song in under a minute
- **[Skills](/jam-session-plugin/handbook/skills/)** -- The 4 slash commands, 2 agent personalities, and 15 MCP tools
- **[Library](/jam-session-plugin/handbook/library/)** -- 100 songs across 10 genres at beginner, intermediate, and advanced levels
- **[Beginners](/jam-session-plugin/handbook/beginners/)** -- Zero-to-playing walkthrough for first-time users

## How it works

The plugin sits between you and the AI Jam Session MCP server. When you type a slash command like `/ai-jam-session:teach moonlight-sonata-mvt1`, the plugin orchestrates the right sequence of MCP tool calls automatically. You describe what you want in plain English (or use the slash commands), and the plugin handles the rest.

### Three ways to use it

**Learn** -- Pick a song and get a structured teaching session with lesson goals, key moments, measure-by-measure guidance, and a practice plan.

**Practice** -- Get a personalized practice plan with tempo ramp-up, mode progression, and focused work on trouble spots.

**Jam** -- Give Claude a song and a style, and it creates its own interpretation. Change the genre, mood, or feel and hear what happens.

### Under the hood

The MCP server generates MIDI in real time and plays it through your system's default audio output. Songs are defined as structured JSON with per-measure note data, dynamics, fingering, and teaching annotations. The plugin's slash commands and agent personalities add a conversational layer on top, so you never have to call MCP tools directly.

[Back to landing page](/jam-session-plugin/)
