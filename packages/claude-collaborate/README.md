<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-collaborate/readme.png" alt="Claude Collaborate" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-collaborate/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-collaborate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-collaborate/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

> *Where Human Creativity Meets AI Intelligence*

Claude Collaborate is a unified sandbox environment for real-time human-AI collaboration. It brings together interactive workspaces, seamless communication, and creative tools in one beautiful interface.

## ✨ The Vision

Imagine a workspace where you can:
- **Draw and brainstorm** on a shared whiteboard
- **Write code together** with instant preview
- **Play chess** and discuss strategy
- **Create content** with GitHub-ready tools
- **Communicate in real-time** via WebSocket bridge

All in one place. All beautifully integrated.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/claude-collaborate.git
cd claude-collaborate

# Install dependencies
pip install aiohttp

# Start the server
python server.py

# Open in browser
# http://localhost:8877
```

## 🎨 Environments

| Environment | Description |
|-------------|-------------|
| **Whiteboard** | Draw, sketch, and brainstorm visually |
| **Code Workshop** | HTML/CSS/JS editor with live preview |
| **Chess Workshop** | Strategy and tactics playground |
| **Creative Lab** | Interactive experiments and explorations |
| **Capture Viewer** | Screenshots and recordings viewer |
| **GitHub Toolkit** | README and marketing generators |
| **Voice Studio** | TTS integration (requires [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard)) |
| **Add Environment** | Starter template for creating new environments |

## 🏗️ Architecture

```
claude-collaborate/
├── server.py            # aiohttp server + built-in WebSocket bridge
├── ws_bridge.py         # Standalone WebSocket bridge (port 8878)
├── index.html           # Main UI with environment switcher
├── whiteboard.html      # Drawing and brainstorming
├── code-playground.html # Live HTML/CSS/JS editor
├── chess.html           # Chess analysis board
├── capture-viewer.html  # Screenshot/recording viewer
├── github-toolkit.html  # README and marketing tools
├── template.html        # Starter for new environments
├── adventures/          # Creative Lab experiments
│   └── index.html
├── tests/               # pytest test suite
└── site/                # Starlight handbook
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CC_PORT` | `8877` | Main server port |
| `CC_HOST` | `127.0.0.1` | Main server bind address |
| `CC_MAX_CLIENTS` | `50` | Maximum concurrent WebSocket connections |
| `CC_MAX_MESSAGE_SIZE` | `65536` | Maximum WebSocket message size in bytes |
| `WS_BRIDGE_PORT` | `8878` | Standalone bridge port (`ws_bridge.py`) |
| `WS_BRIDGE_HOST` | `127.0.0.1` | Standalone bridge bind address |

## 🔌 WebSocket Protocol

Claude Collaborate includes a WebSocket bridge for real-time communication with Claude Code.

**Client -> Server message types:**

| Type | Description |
|------|-------------|
| `user_message` | Chat message from the browser (`content` field) |
| `typing_start` | Typing indicator broadcast to other clients |
| `typing_stop` | End typing indicator broadcast |
| `resume` | Reconnection: send `session_id` + `last_seen_seq` to replay missed messages |
| `ping` | Keepalive; server replies with `pong` |

**Server -> Client message types:**

| Type | Description |
|------|-------------|
| `connected` | Welcome message with `session_id` on connect |
| `message_received` | Ack after `user_message` is persisted (includes `message_id`, `seq`) |
| `claude_response` | Full response broadcast from Claude Code via `POST /api/ws/respond` |
| `resume_complete` | Confirms reconnection; includes `replayed` count |
| `replay` | Missed message replayed during reconnection |
| `typing_start` / `typing_stop` | Ephemeral typing indicators from other clients |
| `pong` | Reply to `ping` |
| `error` | Error with human-readable `message` field |

All sequenced messages carry a monotonic `seq` field. The server maintains a 500-entry ring buffer for reconnection replay.

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main Claude Collaborate UI |
| `/{file}` | GET | Static files (whiteboard, etc.) |
| `/ws` | WS | WebSocket bridge |
| `/api/ws/messages` | GET | Read pending user messages |
| `/api/ws/respond` | POST | Send response to browser |
| `/api/ws/status` | GET | WebSocket bridge status |
| `/api/ws/typing` | POST | Broadcast typing indicator (`status`: start/stop) |
| `/api/ws/stream` | POST | Stream chunked response (`message_id`, `chunk`, `done`) |
| `/api/sessions` | GET | Active WebSocket sessions |
| `/api/history` | GET | Message history ring buffer (non-destructive, `?limit=N`) |
| `/api/metrics` | GET | Server metrics (uptime, message counts, client count) |
| `/adventures` | GET | List adventure files |
| `/adventures/{filename}` | GET | Serve specific adventure file |
| `/health` | GET | Server health check |

## 💬 For Claude Code Users

Integrate with Claude Collaborate via the WebSocket bridge:

```bash
# Read messages from the UI
curl http://localhost:8877/api/ws/messages

# Send a response back
curl -X POST http://localhost:8877/api/ws/respond \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from Claude!"}'
```

## 🎭 Optional: Voice Integration

Claude Collaborate works beautifully with [Voice Soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) for TTS:

```bash
# In another terminal, start Voice Soundboard
cd voice-soundboard
python -m voice_soundboard.web_server

# Voice Studio will be available at http://localhost:8080/studio
```

## 🛠️ Creating New Environments

1. Copy `template.html` to `your-environment.html`
2. Add it to the sidebar in `index.html`:
```html
<div class="env-item" data-url="/your-environment.html" data-name="Your Environment">
    <div class="env-icon" style="background: linear-gradient(...);">🎯</div>
    <div class="env-info">
        <h3>Your Environment</h3>
        <p>Description</p>
    </div>
</div>
```
3. Refresh and start building!

## 📋 Requirements

- Python 3.11+
- aiohttp
- Modern browser with WebSocket support

## 🤝 Contributing

We welcome contributions! Whether it's:
- New environment templates
- UI/UX improvements
- Bug fixes
- Documentation

Please open an issue or submit a PR.

## Security & Data Scope

Claude Collaborate is a **local-first collaboration sandbox** — no telemetry, no cloud services.

- **Data accessed:** Serves static HTML/JS files from the project directory. WebSocket bridge relays messages via JSONL files on disk (`messages.jsonl`, `claude_responses.jsonl`), cleared after read. The standalone bridge (`ws_bridge.py`) rotates files at 10 MB.
- **Data NOT accessed:** No telemetry. No cloud services. No credential storage. No database.
- **Permissions required:** Network listen on localhost (port 8877 for the main server, 8878 for the standalone bridge). File system read/write for static assets and bridge message files.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## Scorecard

| Category | Score |
|----------|-------|
| Security | 10/10 |
| Error Handling | 8/10 |
| Operator Docs | 10/10 |
| Shipping Hygiene | 8/10 |
| Identity | 10/10 |
| **Overall** | **46/50** |

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
