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

> *Donde la creatividad humana se encuentra con la inteligencia artificial*

Claude Collaborate es un entorno de pruebas unificado para la colaboración en tiempo real entre humanos e IA. Reúne espacios de trabajo interactivos, comunicación fluida y herramientas creativas en una interfaz elegante.

## ✨ La visión

Imagina un espacio de trabajo donde puedas:
- **Dibujar y hacer lluvia de ideas** en una pizarra compartida.
- **Escribir código juntos** con vista previa instantánea.
- **Jugar al ajedrez** y discutir estrategias.
- **Crear contenido** con herramientas listas para GitHub.
- **Comunicarte en tiempo real** a través de un puente WebSocket.

Todo en un solo lugar. Todo perfectamente integrado.

## 🚀 Inicio rápido

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

## 🎨 Entornos

| Entorno | Descripción |
| ------------- | ------------- |
| **Whiteboard** | Dibuja, esboza y haz lluvia de ideas visualmente. |
| **Code Workshop** | Editor de HTML/CSS/JS con vista previa en vivo. |
| **Chess Workshop** | Entorno de pruebas para estrategias y tácticas. |
| **Capture Viewer** | Visor de capturas de pantalla y grabaciones. |
| **GitHub Toolkit** | Generadores de README y materiales de marketing. |
| **Creative Lab** | Experimentos interactivos. |
| **Template** | Plantilla para crear nuevos entornos. |

## 🏗️ Arquitectura

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

## 🔌 Protocolo WebSocket

Claude Collaborate incluye un puente WebSocket para la comunicación en tiempo real con Claude Code:

```javascript
// Browser sends to Claude
{ "type": "user_message", "content": "Hello!" }

// Claude responds
{ "type": "claude_response", "content": "Hi there!" }

// Connection status
{ "type": "connected", "message": "Connected to Claude Collaborate Bridge" }
```

## 🔗 Puntos finales de la API

| Punto final | Método | Descripción |
| ---------- | -------- | ------------- |
| `/` | GET | Interfaz de usuario principal de Claude Collaborate. |
| `/{file}` | GET | Archivos estáticos (pizarra, etc.). |
| `/ws` | WS | Puente WebSocket. |
| `/api/ws/messages` | GET | Leer mensajes pendientes del usuario. |
| `/api/ws/respond` | POST | Enviar respuesta al navegador. |
| `/api/ws/status` | GET | Estado del puente WebSocket. |
| `/health` | GET | Comprobación de la salud del servidor. |

## 💬 Para usuarios de Claude Code

Integra Claude Collaborate a través del puente WebSocket:

```bash
# Read messages from the UI
curl http://localhost:8877/api/ws/messages

# Send a response back
curl -X POST http://localhost:8877/api/ws/respond \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from Claude!"}'
```

## 🎭 Opcional: Integración de voz

Claude Collaborate funciona perfectamente con [Voice Soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) para texto a voz:

```bash
# In another terminal, start Voice Soundboard
cd voice-soundboard
python -m voice_soundboard.web_server

# Voice Studio will be available at http://localhost:8080/studio
```

## 🛠️ Creación de nuevos entornos

1. Copia `template.html` a `your-environment.html`.
2. Agrégalo a la barra lateral en `index.html`:
```html
<div class="env-item" data-url="/your-environment.html" data-name="Your Environment">
    <div class="env-icon" style="background: linear-gradient(...);">🎯</div>
    <div class="env-info">
        <h3>Your Environment</h3>
        <p>Description</p>
    </div>
</div>
```
3. Actualiza y ¡empieza a crear!

## 📋 Requisitos

- Python 3.10+
- aiohttp
- Navegador moderno con soporte para WebSocket.

## 🤝 Contribuciones

¡Aceptamos contribuciones! Ya sea:
- Plantillas de nuevos entornos.
- Mejoras de la interfaz de usuario/experiencia de usuario.
- Corrección de errores.
- Documentación.

Por favor, abre un problema o envía una solicitud de extracción (PR).

## 📄 Licencia

Licencia MIT - Consulta [LICENSE](LICENSE) para obtener más detalles.

## 🙏 Agradecimientos

- **Anthropic** - Por Claude y la visión de una IA útil.
- **La comunidad** - Por impulsar los límites de la colaboración entre humanos e IA.

---

<p align="center">
  <i>Built with ❤️ for the future of collaboration</i><br>
  <a href="https://github.com/mcp-tool-shop-org">MCP Tool Shop</a>
</p>
