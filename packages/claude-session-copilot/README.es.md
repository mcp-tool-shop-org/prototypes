<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-session-copilot/readme.png" width="400" />
</p>

<p align="center">
  <strong>Session memory for Claude Code.</strong><br>
  Captures decisions, timelines, and patterns across sessions. Makes context recoverable after <code>/compact</code>.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-session-copilot"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-session-copilot" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/claude-session-copilot" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-session-copilot/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## ¿Por qué?

Las sesiones de Claude Code son efímeras. Cuando usas el comando `/compact` o comienzas una sesión nueva, tu razonamiento, tus decisiones y tu progreso desaparecen. Session Copilot captura todo eso y lo hace recuperable.

**Este plugin solo funciona en Claude Code**; depende de los "hooks" de PostToolUse, habilidades, notificaciones de recursos y la inyección de contexto CLAUDE.md, que ningún otro cliente de MCP tiene.

## Guía de inicio rápido

```bash
npx @mcptoolshop/claude-session-copilot
```

### Plugin de Claude Code

Añade esto a tu archivo `.mcp.json`:

```json
{
  "mcpServers": {
    "session-copilot": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/claude-session-copilot"]
    }
  }
}
```

## ¿Qué hace?

### 7 Herramientas

| Herramienta | Propósito |
| ------ | --------- |
| `copilot.decision` | Registra una decisión (qué, por qué, alternativas rechazadas) |
| `copilot.snapshot` | Guarda el estado de la sesión para la continuidad |
| `copilot.resume` | Carga la última instantánea y las decisiones para una nueva sesión |
| `copilot.timeline_event` | Registra un evento en la línea de tiempo |
| `copilot.query` | Busca decisiones, línea de tiempo o instantáneas |
| `copilot.pulse` | Panel de estado del proyecto |
| `copilot.forget` | Elimina datos antiguos |

### 4 Habilidades (solo para Claude Code)

| Habilidad | ¿Qué hace? |
| ------- | ------------- |
| `/copilot:resume` | Continúa donde la última sesión se detuvo |
| `/copilot:snapshot` | Guarda el estado completo antes de usar `/compact` |
| `/copilot:decisions` | Revisa el registro de decisiones |
| `/copilot:pulse` | Panel de estado del proyecto |

### 4 "Hooks" de PostToolUse (solo para Claude Code)

Registro automático en la línea de tiempo después de:
- **Bash** — detecta los resultados de compilación/prueba (éxito/fracaso)
- **Write** — registra la creación de archivos
- **Edit** — registra la modificación de archivos
- **TodoWrite** — registra los cambios en el estado de las tareas

### Detección de patrones

Muestra alertas cuando detecta:
- **Fallos repetidos** — el mismo comando falla 3 o más veces
- **Alta actividad de archivos** — el mismo archivo se edita 5 o más veces en una sesión
- **Sesión larga** — 100 o más eventos sin una instantánea

### 4 Recursos

| URI | ¿Qué muestra? |
| ----- | --------------- |
| `copilot://pulse` | Estado actual del proyecto |
| `copilot://timeline` | Eventos de la sesión actual |
| `copilot://decisions` | Registro de decisiones reciente |
| `copilot://snapshot/latest` | Nota de entrega más reciente |

## Ciclo de vida de la sesión

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Session Start│ ──► │  /copilot:resume  │ ──► │   Work normally  │
└─────────────┘     └──────────────────┘     │  (hooks auto-    │
                                              │   track events)  │
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │ copilot.decision │
                                              │ (log key choices)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │/copilot:snapshot │
                                              │ (before /compact)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  Next session    │
                                              │  /copilot:resume │
                                              └─────────────────┘
```

## Almacenamiento

Los datos se almacenan en `.claude/copilot/store.json` (local al proyecto) o en `~/.claude/copilot/store.json` (almacenamiento global de respaldo).

Se puede sobrescribir con la variable de entorno `COPILOT_STORE_PATH`.

## ¿Por qué solo para Claude Code?

Este servidor depende arquitectónicamente de los componentes básicos de Claude Code:

| Componente | Claude Code | Otros clientes de MCP |
| --------- | ---------------------- | ------------------- |
| Línea de tiempo automática | "Hooks" de PostToolUse | Sin sistema de "hooks" |
| Comandos con barra | Habilidades (SKILL.md) | Sin habilidades |
| Inyección de contexto | CLAUDE.md | Sin equivalente |
| Paneles en vivo | Notificaciones de recursos | No consulta los recursos |
| Coordinación de tareas | "Hooks" de TodoWrite | Sin TodoWrite |

Sin estos, el servidor es solo un archivo JSON sin forma de completarlo automáticamente.

## Licencia

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
