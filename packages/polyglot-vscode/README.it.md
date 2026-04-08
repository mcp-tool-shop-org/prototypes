<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="media/icon.png" width="400" alt="Polyglot">
</p>

<p><strong>Translate text, files, and READMEs directly in VS Code — powered by your local GPU. 55 languages, zero cloud dependency.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.polyglot-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.polyglot-vscode" alt="VS Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/polyglot-vscode"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/polyglot-vscode" alt="Coverage"></a>
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/polyglot-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## Cosa fa

Polyglot esegue [TranslateGemma 12B](https://ai.google.dev/gemma/docs/core/translategemma) tramite [Ollama](https://ollama.com) sulla tua GPU locale. Non sono necessari codici API, non si utilizzano servizi cloud e i tuoi dati non lasciano il tuo computer.

- **Traduci la selezione** — Seleziona il testo, premi `Ctrl+Alt+T`, scegli una lingua. Fatto.
- **Traduci il file** — Traduci un intero file in un nuovo file `file.ja.ext` accanto all'originale.
- **Traduci README** — Traduci in batch il tuo file README.md in 7 lingue, preservando blocchi di codice, tabelle e badge.
- **Pannello laterale** — Icona del globo nella barra delle attività con pulsanti di azione e stato di Ollama in tempo reale.

## Requisiti

- [Ollama](https://ollama.com) installato e in esecuzione
- Una GPU con VRAM sufficiente per il modello (12 GB per `translategemma:12b`, 2 GB per `translategemma:2b`)
- Il modello viene scaricato automaticamente al primo utilizzo

## Come iniziare

1. Installa l'estensione
2. Clicca sull'icona del globo nella barra delle attività (barra laterale sinistra)
3. Clicca su **Verifica stato** — Polyglot avvierà Ollama e scaricherà il modello se necessario
4. Seleziona del testo e premi `Ctrl+Alt+T` (o `Cmd+Alt+T` su Mac)

## Comandi

| Comando | Scorciatoia | Descrizione |
|---------|----------|-------------|
| **Polyglot: Traduci la selezione** | `Ctrl+Alt+T` | Traduci il testo selezionato direttamente |
| **Polyglot: Translate File** | — | Traduci il file corrente in un nuovo file |
| **Polyglot: Traduci README** | — | Traduci in batch il file README.md in più lingue |
| **Polyglot: Check Status** | — | Verifica la connessione a Ollama e la disponibilità del modello |
| **Polyglot: Help** | — | Accesso rapido alle impostazioni, alla guida e ai link |

## Punti di accesso

- **Pannello laterale** — Icona del globo nella barra delle attività con pulsanti di azione personalizzati
- **Barra del titolo dell'editor** — L'icona del globo appare quando viene selezionato del testo
- **Menu contestuale** — "Traduci la selezione" nel menu contestuale dell'editor
- **Palette dei comandi** — `Ctrl+Shift+P` → digita "Polyglot"
- **Scorciatoia da tastiera** — `Ctrl+Alt+T` con testo selezionato

## Impostazioni

| Impostazione | Valore predefinito | Descrizione |
|---------|---------|-------------|
| `polyglot.ollamaUrl` | `http://localhost:11434` | URL del server Ollama |
| `polyglot.model` | `translategemma:12b` | Modello di traduzione (prova `2b` per ridurre il consumo di VRAM) |
| `polyglot.defaultSourceLanguage` | `en` | Lingua di origine per le traduzioni |
| `polyglot.defaultLanguages` | 7 lingue | Lingue di destinazione per la traduzione di README |

## Lingue supportate

Arabo, bengalese, bulgaro, catalano, cinese (semplificato e tradizionale), croato, ceco, danese, olandese, inglese, estone, finlandese, francese, tedesco, greco, gujarati, ebraico, hindi, ungherese, indonesiano, italiano, giapponese, kannada, coreano, lettone, lituano, macedone, malese, malayalam, marathi, norvegese, persiano, polacco, portoghese, rumeno, russo, serbo, slovacco, sloveno, spagnolo, swahili, svedese, tamil, telugu, tailandese, turco, ucraino, urdu, vietnamita e gallese.

## Come funziona

Polyglot utilizza [@mcptoolshop/polyglot-mcp](https://www.npmjs.com/package/@mcptoolshop/polyglot-mcp), un motore di traduzione locale che:

1. Avvia automaticamente Ollama se non è in esecuzione
2. Scarica automaticamente il modello TranslateGemma al primo utilizzo
3. Divide testi lunghi in blocchi a livello di paragrafo/frase
4. Applica un glossario software per termini tecnici precisi
5. Corregge automaticamente problemi comuni del modello (alternative duplicate, punti finali)

Per la traduzione di README, utilizza una segmentazione intelligente: blocchi di codice, badge HTML e URL vengono preservati intatti, mentre titoli, paragrafi e contenuto delle tabelle vengono tradotti.

## Sicurezza e ambito dei dati

**Dati a cui si accede:** testo nell'editor attivo (solo lettura per la selezione, scrittura per la sostituzione), file nello spazio di lavoro per le funzioni "Traduci file" / "Traduci README" (crea nuovi file accanto agli originali). **Dati a cui NON si accede:** nessun file al di fuori dello spazio di lavoro, nessuna credenziale del sistema operativo, nessun dato del browser. **Rete:** si connette solo a un'istanza locale di Ollama (`localhost:11434` per impostazione predefinita) – **nessuna connessione in uscita verso il cloud**. **Nessun dato di telemetria** viene raccolto o trasmesso.

## Licenza

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
