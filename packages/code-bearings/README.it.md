<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/code-bearings/readme.png" width="400" alt="Code Bearings">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/actions"><img src="https://github.com/mcp-tool-shop-org/code-bearings/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@code-bearings/cli"><img src="https://img.shields.io/npm/v/@code-bearings/cli" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/code-bearings/"><img src="https://img.shields.io/badge/Landing_Page-blue" alt="Landing Page"></a>
</p>

**Ritrova la chiarezza nel tuo codice.**

Code Bearings è un'interfaccia di controllo basata sull'analisi del codice sorgente, progettata per progetti moderni. Indice il tuo progetto TypeScript in un grafo di file, simboli, moduli e dipendenze, e poi proietta queste informazioni in ogni ambiente in cui ne hai bisogno: riga di comando, VS Code, integrazione continua (CI).

La fonte di verità rimane unica. L'intelligenza artificiale aiuta a spiegare, insegnare e proiettare le informazioni. L'utente umano mantiene il controllo.

## Cosa fa

| Interfaccia | Cosa ottieni |
|---------|-------------|
| **CLI** | `code-bearings analyze` analizza il tuo progetto. `code-bearings review` genera un riepilogo delle modifiche da qualsiasi diff Git, con valutazione del rischio, evidenze a supporto e suggerimenti per il revisore. |
| **VS Code** | Alberi nella barra delle attività, pannelli di revisione interattivi, suggerimenti a comparsa, annotazioni CodeLens, decorazioni nella barra laterale, contesto nella barra di stato: tutto basato sulla stessa fonte di verità. |
| **CI** | `code-bearings ci` genera artefatti di revisione (Markdown, JSON, HTML) e, opzionalmente, può interrompere il processo se vengono superate le soglie di rischio. |

## Installazione

```bash
# CLI (global)
npm install -g @code-bearings/cli

# Or run directly
npx @code-bearings/cli analyze

# VS Code extension (from marketplace or local)
# Search "Code Bearings" in the VS Code extensions panel
```

## Guida rapida

```bash
# 1. Index your project
code-bearings analyze

# 2. Review your changes
code-bearings review

# 3. Explore the graph
code-bearings modules
code-bearings module store
code-bearings function generateChangeBrief

# 4. Compare branches
code-bearings compare main feature-branch

# 5. Generate CI artifacts
code-bearings ci --fail-on-risk high
```

## Architettura

Code Bearings è un monorepo con tre pacchetti che condividono un contratto di stratificazione rigoroso:

```
@code-bearings/core    ← Shared product logic (extraction, graph, review, rendering)
@code-bearings/cli     ← Thin CLI consuming core
@code-bearings/vscode  ← Thin editor surface consuming core
```

**Il core gestisce la fonte di verità.** L'interfaccia a riga di comando è semplificata. L'estensione è semplificata. Non ci sono prodotti derivati.

### Tre livelli di verità

| Livello | Cosa | Esempio |
|-------|------|---------|
| **A. Extracted Truth** | Fatti ricavati dal codice sorgente | "La funzione X chiama la funzione Y" |
| **B. Derived Structure** | Calcolato a partire dal livello A | "Il modulo M ha 7 dipendenze in entrata, punteggio di rischio 25" |
| **C. Human Narration** | Spiegazioni basate su A+B | "Questa modifica rimuove la gestione degli errori da un percorso ad alto traffico" |

### Cinque modalità operative

La modalità "Revisione generale" mostra la verità. Le altre modalità aiutano gli utenti a ragionare utilizzando questa verità.

| Modalità | Lente |
|------|------|
| **General** | Riepilogo delle modifiche: cosa è cambiato, rischio, evidenze |
| **Bug Hunter** | Ipotesi di errore, punti ciechi, suggerimenti per l'ispezione |
| **Learning** | Traduzioni sintattiche, spiegazioni "prima/dopo" |
| **Architecture** | Ruoli dei moduli, stato dei confini, posizione nel sistema |
| **Exploration** | Domande guida per progetti con codice sconosciuto |

## Pacchetti

| Pacchetto | Descrizione | npm |
|---------|-------------|-----|
| [`@code-bearings/core`](packages/core/) | Logica condivisa per l'estrazione, il grafo, la revisione e il rendering | [![npm](https://img.shields.io/npm/v/@code-bearings/core)](https://www.npmjs.com/package/@code-bearings/core) |
| [`@code-bearings/cli`](packages/cli/) | Interfaccia a riga di comando | [![npm](https://img.shields.io/npm/v/@code-bearings/cli)](https://www.npmjs.com/package/@code-bearings/cli) |
| [`@code-bearings/vscode`](packages/vscode/) | Estensione per VS Code | — |

## Requisiti

- Node.js >= 20
- Progetto TypeScript con un file `tsconfig.json`
- Git (per i comandi di revisione/confronto)

## Sicurezza e affidabilità

- **Nessun accesso alla rete.** Nessuna telemetria. Nessuna analisi. Nessuna trasmissione di dati.
- **Accesso in sola lettura al codice sorgente.** Code Bearings legge i tuoi file sorgente tramite l'analisi sintattica (AST). Non li modifica mai.
- **Solo database locale.** Il file SQLite `.code-bearings/bearings.db` rimane nel tuo progetto.
- **Nessuna esecuzione di codice.** Solo analisi statica.

Consulta [SECURITY.md](SECURITY.md) per il modello di minaccia completo.

## Licenza

[MIT](LICENSE)

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
