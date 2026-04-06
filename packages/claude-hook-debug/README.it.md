<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/">
    <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-hook-debug/readme.png" width="400" alt="claude-hook-debug" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug/branch/main/graph/badge.svg" alt="Coverage" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-hook-debug"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-hook-debug" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

Strumento di diagnostica a riga di comando per la risoluzione dei problemi relativi all'integrazione di Claude Code. Rileva "hook" inattivi provenienti da plugin disabilitati, conflitti di ambito, impostazioni configurate in modo errato e bug noti di Claude Code.

## Installazione

```bash
npm install -g @mcptoolshop/claude-hook-debug
```

Oppure, eseguirlo direttamente:

```bash
npx @mcptoolshop/claude-hook-debug
```

## Utilizzo

```bash
# Scan current workspace
claude-hook-debug

# Scan a specific project
claude-hook-debug /path/to/project

# JSON output (for piping/scripting)
claude-hook-debug --json
```

Codice di uscita 1 se vengono rilevati errori, 0 altrimenti.

## Cosa rileva

| ID | Gravità | Descrizione |
|----|----------|-------------|
| `GHOST_HOOK_PREVIEW` | errore | Il plugin "claude-preview" è disabilitato, ma l'hook "Stop" è comunque attivo ([#19893](https://github.com/anthropics/claude-code/issues/19893)). |
| `GHOST_HOOK_GENERIC` | avviso | Qualsiasi plugin disabilitato che potrebbe comunque avere hook attivi. |
| `LOCAL_ONLY_PLUGINS` | errore | La sezione `enabledPlugins` nelle impostazioni locali sovrascrive silenziosamente le impostazioni precedentemente applicate ([#25086](https://github.com/anthropics/claude-code/issues/25086)). |
| `SCOPE_CONFLICT` | avviso | Un plugin è abilitato in un ambito, ma disabilitato in un altro. |
| `STOP_CONTINUE_LOOP` | errore | L'hook "Stop" restituisce `continue:true`, causando un ciclo infinito ([#1288](https://github.com/anthropics/claude-code/issues/1288)). |
| `DISABLE_ALL_HOOKS_ACTIVE` | avviso/errore | `disableAllHooks: true` disabilita tutti gli hook (si trasforma in errore se esistono impostazioni gestite). |
| `BROKEN_SETTINGS_JSON` | errore | Un JSON non valido disabilita silenziosamente tutte le impostazioni presenti in quel file. |
| `LARGE_SETTINGS_FILE` | avviso | File di impostazioni superiore a 100 KB (potrebbe causare un avvio lento). |
| `PLUGIN_HOOKS_INVISIBLE` | informazione | Nessun hook definito dall'utente, ma i plugin sono abilitati: gli hook dei plugin non sono visibili durante l'analisi. |

## Ambiti delle impostazioni

Lo strumento legge tutti e quattro gli ambiti delle impostazioni nell'ordine di caricamento di Claude Code:

| Ambito | Percorso | Priorità |
|-------|------|------------|
| gestito | `~/.claude/managed-settings.json` | Massima |
| utente | `~/.claude/settings.json` | |
| progetto | `.claude/settings.json` | |
| locale | `.claude/settings.local.json` | Minima (l'ultima scrittura ha la precedenza) |

## Utilizzo delle librerie

```typescript
import { debug } from '@mcptoolshop/claude-hook-debug';

const report = debug({ projectRoot: '/path/to/project' });

console.log(report.diagnostics);
// [{ id: 'GHOST_HOOK_PREVIEW', severity: 'error', title: '...', ... }]

console.log(report.plugins);
// [{ pluginId: 'claude-preview@...', mergedEnabled: false, scopes: [...] }]
```

## Sicurezza e modello di minaccia

**Cosa accede:** File di impostazioni di Claude Code (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/managed-settings.json`). Tutte le operazioni di lettura sono in sola lettura: lo strumento non modifica mai alcun file.

**Cosa NON accede:** Nessuna chiave API, token, valori di variabili d'ambiente o credenziali vengono letti o registrati. Il blocco `env` nelle impostazioni viene completamente ignorato. Nessun file al di fuori dei percorsi delle impostazioni di Claude Code viene accessibile.

**Autorizzazioni richieste:** Accesso in lettura al file system delle directory `~/.claude/` e `.claude/` del progetto. Nessuna autorizzazione elevata, nessun accesso alla rete, nessuna esecuzione di shell.

**Nessuna telemetria.** Nessuna analisi. Nessuna trasmissione di dati. Nessuna raccolta di dati di alcun tipo. Nessuna dipendenza da componenti in esecuzione.

---

Creato da [MCP Tool Shop](https://mcp-tool-shop.github.io/)
