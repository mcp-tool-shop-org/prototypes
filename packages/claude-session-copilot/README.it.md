<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## Perché?

Le sessioni di Claude Code sono temporanee. Quando si utilizza il comando `/compact` o si inizia una nuova sessione, le informazioni sul ragionamento, le decisioni e i progressi vengono perse. Session Copilot salva tutte queste informazioni e le rende recuperabili.

**Questo plugin funziona solo con Claude Code** perché dipende da funzionalità come i hook "PostToolUse", le competenze (skills), le notifiche delle risorse e l'iniezione del contesto CLAUDE.md, che nessun altro client MCP offre.

## Guida rapida

```bash
npx @mcptoolshop/claude-session-copilot
```

### Plugin per Claude Code

Aggiungi quanto segue al file `.mcp.json` del tuo progetto:

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

## Cosa fa

### 7 Strumenti

| Strumento | Scopo |
| ------ | --------- |
| `copilot.decision` | Registra una decisione (cosa, perché, alternative rifiutate) |
| `copilot.snapshot` | Salva lo stato della sessione per garantire la continuità |
| `copilot.resume` | Carica l'ultimo snapshot e le decisioni per una nuova sessione |
| `copilot.timeline_event` | Registra un evento nella cronologia |
| `copilot.query` | Cerca decisioni, cronologia e snapshot |
| `copilot.pulse` | Dashboard sullo stato del progetto |
| `copilot.forget` | Elimina i dati obsoleti |

### 4 Competenze (solo per Claude Code)

| Competenza | Cosa fa |
| ------- | ------------- |
| `/copilot:resume` | Riprende da dove si era interrotto nell'ultima sessione |
| `/copilot:snapshot` | Salva lo stato completo prima di utilizzare `/compact` |
| `/copilot:decisions` | Visualizza la cronologia delle decisioni |
| `/copilot:pulse` | Dashboard sullo stato del progetto |

### 4 Hook "PostToolUse" (solo per Claude Code)

Registrazione automatica nella cronologia dopo:
- **Bash** — rileva i risultati di build/test (superati/falliti)
- **Write** — registra la creazione di file
- **Edit** — registra le modifiche ai file
- **TodoWrite** — registra le modifiche allo stato delle attività

### Rilevamento di schemi

Mostra avvisi quando rileva:
- **Fallimenti ripetuti** — lo stesso comando fallisce 3 o più volte
- **Modifiche frequenti ai file** — lo stesso file viene modificato 5 o più volte in una sessione
- **Sessione lunga** — 100 o più eventi senza uno snapshot

### 4 Risorse

| URI | Cosa mostra |
| ----- | --------------- |
| `copilot://pulse` | Stato attuale del progetto |
| `copilot://timeline` | Eventi della sessione corrente |
| `copilot://decisions` | Cronologia delle decisioni recenti |
| `copilot://snapshot/latest` | Ultima nota di passaggio di consegne |

## Ciclo di vita della sessione

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

## Archiviazione

I dati vengono archiviati in `.claude/copilot/store.json` (locale al progetto) o in `~/.claude/copilot/store.json` (soluzione di backup globale).

È possibile sovrascrivere questa impostazione tramite la variabile d'ambiente `COPILOT_STORE_PATH`.

## Perché solo per Claude Code?

Questo server dipende dalle funzionalità specifiche di Claude Code:

| Funzionalità | Funzionalità specifica di Claude Code | Altri client MCP |
| --------- | ---------------------- | ------------------- |
| Cronologia automatica | Hook "PostToolUse" | Nessun sistema di hook |
| Comandi slash | Competenze (SKILL.md) | Nessuna competenza |
| Iniezione del contesto | CLAUDE.md | Nessun equivalente |
| Dashboard interattivi | Notifiche delle risorse | Non interroga le risorse |
| Coordinamento delle attività | Hook "TodoWrite" | Nessun hook "TodoWrite" |

Senza queste funzionalità, il server è semplicemente un file JSON senza alcun modo per popolarlo automaticamente.

## Licenza

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
