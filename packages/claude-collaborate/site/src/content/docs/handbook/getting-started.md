---
title: Getting Started
description: Clone, install, and start collaborating with Claude in under a minute.
sidebar:
  order: 1
---

This guide walks you through setting up claude-collaborate and opening your first collaboration session.

## Requirements

- **Python 3.10+** -- the server and WebSocket bridge run on Python
- **aiohttp** -- the only runtime dependency (async HTTP and WebSocket server)
- **A modern browser** -- Chrome, Firefox, Edge, or Safari with WebSocket support

## Install

Clone the repository and install the single dependency:

```bash
git clone https://github.com/mcp-tool-shop-org/claude-collaborate.git
cd claude-collaborate
pip install aiohttp
```

## Start the server

```bash
python server.py
```

The server starts on `http://localhost:8877` by default. Open that URL in your browser and you will see the sidebar with all environments.

The server also supports CLI flags:

```bash
python server.py --version   # Print version and exit
python server.py --help      # Print usage and exit
```

## Verify the connection

Once the page loads, the chat panel connects to the WebSocket bridge automatically. You can confirm the bridge is running:

```bash
curl http://localhost:8877/health
```

This returns a JSON health check. If the server is up, you are ready to collaborate.

## Connect Claude Code

Claude Code integrates through the REST API. From a Claude Code session, read messages sent from the browser:

```bash
curl http://localhost:8877/api/ws/messages
```

Send a response back to the browser:

```bash
curl -X POST http://localhost:8877/api/ws/respond \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from Claude!"}'
```

The response appears in the browser chat panel immediately.

## Run the test suite

The project includes a Makefile for verification:

```bash
make verify   # Runs lint + typecheck + tests
make test     # Tests only (pytest)
make lint     # ruff check
```

## What to read next

- [Beginners](/claude-collaborate/handbook/beginners/) walks through your first collaboration session step by step

- [Environments](/claude-collaborate/handbook/environments/) describes each of the six workspaces and how to create new ones
- [API Reference](/claude-collaborate/handbook/api/) covers the WebSocket protocol and all REST endpoints
