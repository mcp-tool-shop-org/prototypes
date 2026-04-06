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

> *Dove la creatività umana incontra l'intelligenza artificiale*

Claude Collaborate è un ambiente sandbox unificato per la collaborazione in tempo reale tra esseri umani e intelligenza artificiale. Unisce spazi di lavoro interattivi, comunicazioni fluide e strumenti creativi in un'unica interfaccia elegante.

## ✨ La visione

Immaginate un ambiente di lavoro in cui potete:
- **Disegnare e fare brainstorming** su una lavagna condivisa
- **Scrivere codice insieme** con anteprima immediata
- **Giocare a scacchi** e discutere di strategie
- **Creare contenuti** con strumenti pronti per GitHub
- **Comunicare in tempo reale** tramite un bridge WebSocket

Tutto in un unico posto. Tutto perfettamente integrato.

## 🚀 Inizio rapido

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

## 🎨 Ambienti

| Ambiente | Descrizione |
| ------------- | ------------- |
| **Whiteboard** | Disegno, schizzi e brainstorming visivi |
| **Code Workshop** | Editor HTML/CSS/JS con anteprima in tempo reale |
| **Chess Workshop** | Area di gioco per strategie e tattiche |
| **Capture Viewer** | Visualizzatore di screenshot e registrazioni |
| **GitHub Toolkit** | Generatori di README e materiali di marketing |
| **Creative Lab** | Esperimenti interattivi |
| **Template** | Punto di partenza per la creazione di nuovi ambienti |

## 🏗️ Architettura

```
claude-collaborate/
├── index.html           # Main UI with environment switcher
├── server.py            # aiohttp server
├── ws_bridge.py         # WebSocket bridge for Claude Code
├── whiteboard.html      # Drawing and brainstorming
├── code-playground.html # Live HTML/CSS/JS editor
├── chess.html           # Chess analysis board
├── capture-viewer.html  # Screenshot/recording viewer
├── github-toolkit.html  # README and marketing tools
├── template.html        # Starter for new environments
└── adventures/          # Creative Lab experiments
    └── index.html
```

## 🔌 Protocollo WebSocket

Claude Collaborate include un bridge WebSocket per la comunicazione in tempo reale con Claude Code:

```javascript
// Browser sends to Claude
{ "type": "user_message", "content": "Hello!" }

// Claude responds
{ "type": "claude_response", "content": "Hi there!" }

// Connection status
{ "type": "connected", "message": "Connected to Claude Collaborate Bridge" }
```

## 🔗 Punti di accesso API

| Punto di accesso | Metodo | Descrizione |
| ---------- | -------- | ------------- |
| `/` | GET | Interfaccia utente principale di Claude Collaborate |
| `/{file}` | GET | File statici (lavagna, ecc.) |
| `/ws` | WS | Bridge WebSocket |
| `/api/ws/messages` | GET | Lettura dei messaggi utente in sospeso |
| `/api/ws/respond` | POST | Invio di una risposta al browser |
| `/api/ws/status` | GET | Stato del bridge WebSocket |
| `/health` | GET | Controllo dello stato del server |

## 💬 Per gli utenti di Claude Code

Integrate con Claude Collaborate tramite il bridge WebSocket:

```bash
# Read messages from the UI
curl http://localhost:8877/api/ws/messages

# Send a response back
curl -X POST http://localhost:8877/api/ws/respond \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from Claude!"}'
```

## 🎭 Opzionale: Integrazione vocale

Claude Collaborate funziona perfettamente con [Voice Soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) per la sintesi vocale:

```bash
# In another terminal, start Voice Soundboard
cd voice-soundboard
python -m voice_soundboard.web_server

# Voice Studio will be available at http://localhost:8080/studio
```

## 🛠️ Creazione di nuovi ambienti

1. Copiate `template.html` in `your-environment.html`
2. Aggiungetelo alla barra laterale in `index.html`:
```html
<div class="env-item" data-url="/your-environment.html" data-name="Your Environment">
    <div class="env-icon" style="background: linear-gradient(...);">🎯</div>
    <div class="env-info">
        <h3>Your Environment</h3>
        <p>Description</p>
    </div>
</div>
```
3. Ricaricate e iniziate a sviluppare!

## 📋 Requisiti

- Python 3.10+
- aiohttp
- Browser moderno con supporto WebSocket

## 🤝 Contributi

Accettiamo contributi! Che si tratti di:
- Modelli di ambiente
- Miglioramenti dell'interfaccia utente/esperienza utente
- Correzioni di bug
- Documentazione

Si prega di aprire un issue o inviare una pull request.

## 📄 Licenza

Licenza MIT - Consultare [LICENSE](LICENSE) per i dettagli.

## 🙏 Ringraziamenti

- **Anthropic** - Per Claude e la visione di un'intelligenza artificiale utile
- **La comunità** - Per aver ampliato i confini della collaborazione tra esseri umani e intelligenza artificiale

---

<p align="center">
  <i>Built with ❤️ for the future of collaboration</i><br>
  <a href="https://github.com/mcp-tool-shop-org">MCP Tool Shop</a>
</p>
