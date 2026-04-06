---
title: Beginners Guide
description: A guided introduction to claude-collaborate for first-time users.
sidebar:
  order: 99
---

New to claude-collaborate? This page walks you through the core ideas, your first session, and where to go next.

## What is claude-collaborate?

claude-collaborate is a local Python server that hosts interactive browser environments and connects them to Claude Code through a WebSocket bridge. You open a browser tab, pick an environment (whiteboard, code editor, chess board, and more), and everything you do is visible to Claude in real time. Claude reads your messages via a REST API and sends responses back through the same bridge.

No cloud accounts are needed. No build step. The server runs on localhost and every environment is a single HTML file.

## Prerequisites

You need three things installed before you start:

- **Python 3.10 or later** -- check with `python --version`
- **pip** -- the Python package manager (ships with Python)
- **A modern browser** -- Chrome, Firefox, Edge, or Safari

That is the entire stack. There is no database, no Docker, no Node.js required for the server itself.

## Installation

Clone the repository and install the single runtime dependency:

```bash
git clone https://github.com/mcp-tool-shop-org/claude-collaborate.git
cd claude-collaborate
pip install aiohttp
```

Verify the installation:

```bash
python server.py --version
```

This prints the version number (e.g., `claude-collaborate 1.0.3`) and exits.

## Your first session

Start the server:

```bash
python server.py
```

Open `http://localhost:8877` in your browser. You will see a dark-themed UI with a sidebar listing all available environments. The default environment is the **Whiteboard**.

Try these steps to confirm everything works:

1. **Open the Whiteboard** -- it loads automatically as the default environment
2. **Check the health endpoint** -- run `curl http://localhost:8877/health` in a terminal. You should see `{"status": "healthy", ...}`
3. **Switch environments** -- click "Code Workshop" in the sidebar to load the HTML/CSS/JS editor
4. **Try the chat** -- type a message in the chat panel at the bottom. The WebSocket bridge relays it to Claude Code

If the health check returns a response, the server is running correctly.

## Key concepts

Understanding these four ideas will make everything else click:

- **Environments** are self-contained HTML files. Each one is loaded into an iframe when you click its sidebar entry. Whiteboard, Code Workshop, Chess Workshop, Creative Lab, Capture Viewer, and GitHub Toolkit are built in. Voice Studio requires a separate server.

- **The WebSocket bridge** runs inside `server.py` on port 8877. When you type in the chat panel, your message is sent over WebSocket to the server, which writes it to a JSONL file on disk. Claude Code reads that file via the REST API.

- **The REST API** has three main endpoints: `GET /api/ws/messages` (read pending messages), `POST /api/ws/respond` (send a response to the browser), and `GET /api/ws/status` (check connection status). Claude Code uses these to communicate without maintaining a persistent WebSocket connection.

- **Zero build step** means every environment is plain HTML, CSS, and JavaScript. To create a new environment, copy `template.html`, add a sidebar entry in `index.html`, and refresh the browser.

## Common tasks

### Send a message to the browser from Claude Code

```bash
curl -X POST http://localhost:8877/api/ws/respond \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from Claude!"}'
```

### Read messages sent from the browser

```bash
curl http://localhost:8877/api/ws/messages
```

This returns all pending messages and clears the queue. The response format is:

```json
{
  "messages": [
    {"type": "user_message", "content": "...", "timestamp": "..."}
  ],
  "count": 1
}
```

### Create a new environment

```bash
cp template.html my-tool.html
```

Then add a sidebar entry in `index.html` (see the [Environments](/claude-collaborate/handbook/environments/) page for the exact HTML).

### Run the standalone bridge

If you want the WebSocket bridge running separately from the static file server:

```bash
python ws_bridge.py
```

This starts a dedicated bridge on port 8878 with file rotation and async locking.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: No module named 'aiohttp'` | Run `pip install aiohttp` |
| Browser shows a blank page | Confirm the server is running and navigate to `http://localhost:8877` (not `https`) |
| Chat messages are not reaching Claude | Check that the WebSocket connection is active: `curl http://localhost:8877/api/ws/status` should show `"status": "active"` with at least 1 connected client |
| Port 8877 is already in use | Stop whatever is using the port, or edit the `PORT` variable in `server.py` |
| Voice Studio shows "refused to connect" | Voice Studio requires [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) running separately on port 8080 |

## Next steps

- **[Getting Started](/claude-collaborate/handbook/getting-started/)** -- covers installation and Claude Code integration in more depth
- **[Environments](/claude-collaborate/handbook/environments/)** -- tour of every built-in environment and how to build your own
- **[API Reference](/claude-collaborate/handbook/api/)** -- full WebSocket protocol and REST endpoint documentation
