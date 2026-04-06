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

> *Là où la créativité humaine rencontre l'intelligence artificielle*

Claude Collaborate est un environnement de test unifié pour la collaboration en temps réel entre l'humain et l'IA. Il regroupe des espaces de travail interactifs, une communication fluide et des outils créatifs dans une interface élégante.

## ✨ La vision

Imaginez un espace de travail où vous pouvez :
- **Dessiner et faire du brainstorming** sur un tableau blanc partagé
- **Écrire du code ensemble** avec un aperçu instantané
- **Jouer aux échecs** et discuter de la stratégie
- **Créer du contenu** avec des outils prêts pour GitHub
- **Communiquer en temps réel** via une connexion WebSocket

Tout en un seul endroit. Tout, parfaitement intégré.

## 🚀 Démarrage rapide

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

## 🎨 Environnements

| Environnement | Description |
| ------------- | ------------- |
| **Whiteboard** | Dessin, croquis et brainstorming visuels |
| **Code Workshop** | Éditeur HTML/CSS/JS avec aperçu en direct |
| **Chess Workshop** | Terrain de jeu pour la stratégie et les tactiques |
| **Capture Viewer** | Visionneuse de captures d'écran et d'enregistrements |
| **GitHub Toolkit** | Générateurs de README et de contenu marketing |
| **Creative Lab** | Expériences interactives |
| **Template** | Point de départ pour créer de nouveaux environnements |

## 🏗️ Architecture

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

## 🔌 Protocole WebSocket

Claude Collaborate inclut une connexion WebSocket pour la communication en temps réel avec Claude Code :

```javascript
// Browser sends to Claude
{ "type": "user_message", "content": "Hello!" }

// Claude responds
{ "type": "claude_response", "content": "Hi there!" }

// Connection status
{ "type": "connected", "message": "Connected to Claude Collaborate Bridge" }
```

## 🔗 Points d'accès API

| Point d'accès | Méthode | Description |
| ---------- | -------- | ------------- |
| `/` | GET | Interface utilisateur principale de Claude Collaborate |
| `/{file}` | GET | Fichiers statiques (tableau blanc, etc.) |
| `/ws` | WS | Connexion WebSocket |
| `/api/ws/messages` | GET | Lecture des messages utilisateur en attente |
| `/api/ws/respond` | POST | Envoi d'une réponse au navigateur |
| `/api/ws/status` | GET | État de la connexion WebSocket |
| `/health` | GET | Vérification de l'état du serveur |

## 💬 Pour les utilisateurs de Claude Code

Intégrez-vous à Claude Collaborate via la connexion WebSocket :

```bash
# Read messages from the UI
curl http://localhost:8877/api/ws/messages

# Send a response back
curl -X POST http://localhost:8877/api/ws/respond \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from Claude!"}'
```

## 🎭 Optionnel : Intégration vocale

Claude Collaborate fonctionne parfaitement avec [Voice Soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) pour la synthèse vocale :

```bash
# In another terminal, start Voice Soundboard
cd voice-soundboard
python -m voice_soundboard.web_server

# Voice Studio will be available at http://localhost:8080/studio
```

## 🛠️ Création de nouveaux environnements

1. Copiez `template.html` vers `your-environment.html`
2. Ajoutez-le à la barre latérale dans `index.html` :
```html
<div class="env-item" data-url="/your-environment.html" data-name="Your Environment">
    <div class="env-icon" style="background: linear-gradient(...);">🎯</div>
    <div class="env-info">
        <h3>Your Environment</h3>
        <p>Description</p>
    </div>
</div>
```
3. Actualisez et commencez à développer !

## 📋 Prérequis

- Python 3.10+
- aiohttp
- Navigateur moderne avec prise en charge de WebSocket

## 🤝 Contributions

Nous encourageons les contributions ! Que ce soit :
- De nouveaux modèles d'environnement
- Améliorations de l'interface utilisateur/de l'expérience utilisateur
- Corrections de bugs
- Documentation

Veuillez ouvrir un problème ou soumettre une demande de tirage (PR).

## 📄 Licence

Licence MIT - Consultez [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Anthropic** - Pour Claude et la vision d'une IA utile
- **La communauté** - Pour repousser les limites de la collaboration homme-IA

---

<p align="center">
  <i>Built with ❤️ for the future of collaboration</i><br>
  <a href="https://github.com/mcp-tool-shop-org">MCP Tool Shop</a>
</p>
