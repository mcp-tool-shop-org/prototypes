<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh.md">中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.it.md">Italiano</a> ·
  <a href="README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-cli/readme.png" alt="WebSketch CLI" width="400"></p>

<p align="center"><strong>CLI for WebSketch IR — render, diff, and fingerprint web UI captures so LLMs and CI pipelines can reason about what users see.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/websketch"><img src="https://img.shields.io/npm/v/@mcptoolshop/websketch.svg" alt="npm version"></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT">
  <a href="https://mcp-tool-shop-org.github.io/websketch-cli/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

## Panoramica

- **Rendering in ASCII:** converte qualsiasi acquisizione di WebSketch in un layout a caratteri che si adatti a un terminale o a una finestra di contesto di un modello linguistico di grandi dimensioni (LLM).
- **Impronta digitale strutturale:** calcola un'impronta digitale del layout di una pagina, in modo da poter rilevare le modifiche senza confrontare i pixel.
- **Differenza semantica:** confronta due acquisizioni e ottieni un rapporto dettagliato delle modifiche (aggiunte, spostamenti, ridimensionamenti, modifiche al testo).
- **Creazione di pacchetti:** combina acquisizioni (e, opzionalmente, la differenza) in un singolo file `.ws.json` condivisibile.
- **Orientato alle pipeline:** ogni comando supporta l'output in formato JSON e codici di uscita deterministici per la scrittura di script per sistemi di integrazione continua (CI).
- **Modalità ottimizzata per LLM:** il flag `--llm` produce un output ricco di metadati, progettato per essere utilizzato da agenti.

## Installazione

```bash
pnpm add -g @mcptoolshop/websketch
```

Oppure, eseguilo senza installazione:

```bash
npx @mcptoolshop/websketch render capture.json
```

## Comandi

### validate

Verifica che un file di acquisizione sia conforme allo schema WebSketch IR.

```bash
websketch validate capture.json
```

### render-ascii

Converte un'acquisizione in un'immagine ASCII (leggibile da LLM).

```bash
# Default 80x24 grid
websketch render-ascii capture.json

# LLM-optimized format with metadata and legend
websketch render-ascii --llm capture.json

# Custom dimensions
websketch render-ascii --width 120 --height 40 capture.json

# Minimal structure-only view
websketch render-ascii --structure capture.json
```

**Esempio di output:**

```
+---------------------------------------------------------------------------+
|[NAV:primary_nav]                                                          |
+---------------------------------------------------------------------------+
|                    +----------------------------------------+             |
|                    |[FRM:login]                             |             |
|                    |  [INP:email]                           |             |
|                    |  [INP:password]                        |             |
|                    |  [BTN:primary_cta]                     |             |
|                    +----------------------------------------+             |
+---------------------------------------------------------------------------+
```

### fingerprint

Calcola un'impronta digitale strutturale per il confronto.

```bash
# Full fingerprint (includes text)
websketch fingerprint capture.json
# Output: e33442b6

# Layout-only fingerprint (ignores text changes)
websketch fingerprint --layout-only capture.json
```

### diff

Confronta due acquisizioni e segnala le modifiche.

```bash
# Human-readable diff report
websketch diff before.json after.json

# JSON output
websketch diff --json before.json after.json

# Layout-only (ignore text changes)
websketch diff --layout-only before.json after.json

# Custom match threshold
websketch diff --threshold 0.7 before.json after.json
```

### bundle

Crea un pacchetto contenente una o più acquisizioni in un file `.ws.json` condivisibile. Quando vengono forniti esattamente due file di acquisizione, il pacchetto include automaticamente un riepilogo delle differenze.

```bash
websketch bundle capture.json -o bundle.ws.json
websketch bundle before.json after.json -o bundle.ws.json
```

## Modalità Pipeline

Aggiungi `--json` prima di qualsiasi comando per ottenere un output leggibile dalle macchine:

```bash
websketch --json validate capture.json
websketch --json render capture.json
websketch --json fingerprint capture.json
websketch --json diff before.json after.json
```

**Successo:** `{ "ok": true, ... }`

**Errore:** `{ "ok": false, "error": { "code": "WS_...", "message": "..." } }`

I codici di uscita sono comunque validi in modalità JSON; utilizza `$?` o `set -e` negli script.

## Codici di uscita

| Code | Significato |
| ------ | --------- |
| 0 | Successo |
| 1 | Errore di validazione / dati (JSON non valido, acquisizione non valida, comando sconosciuto) |
| 2 | Errore del file system (file non trovato, autorizzazione negata, errore di I/O) |

## Formato dell'acquisizione

Questa interfaccia a riga di comando funziona con i file di acquisizione WebSketch IR (JSON). Crea acquisizioni utilizzando:

- [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) -- Estensione per Chrome per l'acquisizione di pagine con un solo clic.
- [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) -- Crea acquisizioni in modo programmatico.

## Documentazione

| Documento | Descrizione |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | Guida approfondita: architettura, comandi, modelli di pipeline, integrazione. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Come contribuire, configurazione per sviluppatori, linee guida per le richieste di modifica (PR). |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Standard della comunità. |
| [CHANGELOG.md](CHANGELOG.md) | Cronologia delle versioni. |

## Licenza

MIT
