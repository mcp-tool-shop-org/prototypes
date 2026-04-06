---
title: claude-collaborate Handbook
description: Complete guide to the unified sandbox for real-time human-AI collaboration.
sidebar:
  order: 0
---

Welcome to the claude-collaborate handbook.

claude-collaborate is a unified sandbox for real-time human-AI collaboration. It provides six built-in environments -- whiteboard, code workshop, chess workshop, creative lab, capture viewer, and GitHub toolkit -- plus an optional Voice Studio link, all connected through a WebSocket bridge to Claude Code. You draw, write, strategize, and experiment in the browser while Claude sees your work and responds in real time.

## How it works

A lightweight Python server (`server.py`) hosts the environments and runs a WebSocket bridge. When you open a browser tab to `http://localhost:8877`, you get a sidebar with all six environments. Every message you type in the chat panel travels over WebSocket to Claude Code, which reads it via REST and sends a response back through the same channel. No polling, no copy-paste, no context switching.

## What's inside

- **[Beginners](/claude-collaborate/handbook/beginners/)** -- New to claude-collaborate? Start here for a guided walkthrough
- **[Getting Started](/claude-collaborate/handbook/getting-started/)** -- Clone the repo, install one dependency, and open the sandbox in under a minute
- **[Environments](/claude-collaborate/handbook/environments/)** -- Tour of all built-in environments and how to create your own
- **[API Reference](/claude-collaborate/handbook/api/)** -- WebSocket protocol, REST endpoints, and Claude Code integration examples

## Design principles

- **Zero build step** -- Every environment is a single HTML file. No bundler, no framework, no transpiler.
- **Extensible by copy** -- Create a new environment by duplicating `template.html` and adding one sidebar entry.
- **AI-native** -- The WebSocket bridge is a first-class feature, not an afterthought. Claude Code can read, respond, and drive any environment.

[Back to landing page](/claude-collaborate/)
