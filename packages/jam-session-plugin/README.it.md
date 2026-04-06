<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/jam-session-plugin/readme.png" alt="Jam Session Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/jam-session-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Un pianoforte virtuale con una libreria di 100 canzoni, lezioni strutturate e sessioni di improvvisazione. Suona attraverso i tuoi altoparlanti: non è necessario alcun software esterno.

Questo plugin integra il server MCP di [AI Jam Session](https://github.com/mcp-tool-shop-org/ai_jam_session), aggiungendo comandi rapidi, personalità degli agenti e flussi di lavoro strutturati per l'apprendimento e l'improvvisazione.

## Installazione

```bash
claude plugin add ai-jam-session
```

Il server MCP (`@mcptoolshop/ai-jam-session`) viene scaricato automaticamente tramite npx. Richiede Node.js 18 o superiore.

## Cosa include

### Funzionalità (comandi rapidi)

| Comando | Descrizione |
| --------- | ------------- |
| `/ai-jam-session:teach <song>` | Avvia una lezione strutturata. |
| `/ai-jam-session:practice <song> [level]` | Ottieni un piano di pratica personalizzato. |
| `/ai-jam-session:explore [query]` | Esplora la libreria di 100 canzoni per genere, difficoltà o parola chiave. |
| `/ai-jam-session:jam <song or genre>` | Avvia una sessione di improvvisazione: Claude crea la propria interpretazione. |

### Agenti

| Agent | Descrizione |
| ------- | ------------- |
| `piano-teacher` | Insegnante paziente e pedagogico che si adatta al livello degli studenti. |
| `jam-musician` | Musicista di una band di improvvisazione rilassata: privilegia il ritmo e incoraggia la sperimentazione. |

### Strumenti MCP (15)

Esplora, riproduci, insegna, improvvisa e gestisci le canzoni. Le funzionalità del plugin orchestrano automaticamente questi strumenti, ma sono disponibili anche per un utilizzo diretto.

## Utilizzo

Utilizza i comandi rapidi:

```
/ai-jam-session:explore jazz
/ai-jam-session:teach moonlight-sonata-mvt1
/ai-jam-session:practice let-it-be beginner
/ai-jam-session:jam autumn-leaves as blues
/ai-jam-session:jam jazz
```

Oppure, semplicemente, parla in modo naturale: gli agenti si attivano in base al contesto.

```
I want to learn a beginner jazz song on piano.
Help me practice Fur Elise at half speed.
Let's jam on some blues.
```

## Libreria di canzoni

100 canzoni integrate in 10 generi (classica, jazz, pop, blues, rock, R&B, latina, colonne sonore, ragtime, new-age) a livelli principiante, intermedio e avanzato.

## Requisiti

- Node.js 18 o superiore
- Altoparlanti (il pianoforte viene riprodotto tramite l'audio del sistema)

## Link

- Server MCP: [@mcptoolshop/ai-jam-session](https://www.npmjs.com/package/@mcptoolshop/ai-jam-session)
- Codice sorgente: [mcp-tool-shop-org/ai_jam_session](https://github.com/mcp-tool-shop-org/ai_jam_session)

## Licenza

MIT
