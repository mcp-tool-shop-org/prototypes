<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <strong>English</strong> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.ja.md">日本語</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.zh.md">中文</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.es.md">Español</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.fr.md">Français</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.hi.md">हिन्दी</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.it.md">Italiano</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-vscode/readme.png" alt="WebSketch" width="400"></p>

<p align="center"><strong>Turn any web page into a structured tree that LLMs can actually understand.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.websketch-vscode.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode"><img src="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> &middot;
  <a href="#the-solution">The Solution</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-reads">How It Reads</a> &middot;
  <a href="#use-cases">Use Cases</a> &middot;
  <a href="#ecosystem">Ecosystem</a>
</p>

---

## Il Problema

Si desidera che un modello linguistico (LLM) analizzi una pagina web, comprendendone la struttura, la navigazione, gli elementi interattivi e la gerarchia dei contenuti. Le soluzioni attualmente disponibili non sono sufficienti.

| Approccio | Token | Cosa si perde |
|----------|--------|---------------|
| **Screenshot** | 1.000+ (visione) | Impossibile leggere il testo piccolo, stima la struttura, informazioni sull'interattività assenti. |
| **Raw HTML** | 50.000–500.000 | Sovraccarico di `div`, stili inline, script, rumore SVG. |
| **Readability extract** | 2.000–10.000 | Eliminazione di tutta la struttura: nessuna navigazione, nessun pulsante, nessun modulo. |
| **DOM dump** | 10.000–100.000 | Classi, attributi di dati, artefatti del framework ovunque. |

Il problema principale: **nessuna di queste soluzioni "parla" il linguaggio dell'interfaccia utente (UI)**. Gli LLM non hanno bisogno di `<div class="sc-bdnxRM jJFqsI">`; hanno bisogno di `NAV`, `BUTTON`, `CARD`, `LIST`.

## La Soluzione

WebSketch trasforma la pagina in un **albero semantico** utilizzando 23 elementi primitivi dell'interfaccia utente. Un solo clic in VS Code, incolla in qualsiasi LLM:

```
PAGE
├─ HEADER {sticky}
│  ├─ *LINK "Home"
│  ├─ *LINK "Products"
│  ├─ *LINK "Pricing"
│  └─ *INPUT <search> "Search..."
├─ SECTION <main>
│  ├─ TEXT <h1> "Welcome to Acme"
│  ├─ TEXT "Build faster with our platform..."
│  └─ *BUTTON "Get Started"
├─ LIST (3 items)
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "Real-time sync across devices"
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "99.9% uptime guarantee"
│  └─ CARD
│     ├─ IMAGE "Feature icon"
│     └─ TEXT "Enterprise-grade security"
└─ FOOTER
   ├─ NAV
   │  ├─ *LINK "Terms"
   │  ├─ *LINK "Privacy"
   │  └─ *LINK "Contact"
   └─ TEXT "© 2026 Acme Inc."
```

**200–800 token**. Non 50.000. Non una griglia di pixel. Un albero chiaro che qualsiasi modello di testo può analizzare.

### Confronto diretto

| Metrica | WebSketch | HTML grezzo | Screenshot |
|--------|-----------|----------|------------|
| **Tokens** | 200–800 | 50,000+ | 1.000+ (visione) |
| **Structure** | Albero semantico completo | Caos di `div` nidificati | Griglia di pixel |
| **Text content** | Citato, etichettato | Nascosto nel codice | Dipendente da OCR |
| **Interactive elements** | Marcato con `*` | Nascosto negli attributi | Invisibile |
| **Heading hierarchy** | `<h1>` a `<h6>` | Perso tra i nomi delle classi | Stimato in base alle dimensioni |
| **Landmarks** | `<main>`, `<nav>`, `<search>` | Richiede competenza nel DOM | Non disponibile |
| **Works with** | Qualsiasi LLM di testo | Informazioni inutili | Solo modelli di visione |

## Guida rapida

1. Installa da [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode) oppure esegui:
```
ext install mcp-tool-shop.websketch-vscode
```
2. Apri la palette dei comandi (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Esegui **WebSketch: Cattura URL**
4. Incolla un URL e premi Invio
5. Clicca su **Copia per LLM** e incolla nel tuo prompt

La scheda LLM è la visualizzazione predefinita. Un solo clic copia l'albero negli appunti, pronto per qualsiasi modello.

## Come funziona

Ogni riga dell'albero contiene informazioni dense e interpretabili da macchine:

```
├─ *BUTTON <search> {sticky} "Find products"
│    │       │         │         │
│    │       │         │         └─ Actual visible text
│    │       │         └─ Flags (sticky, scrollable)
│    │       └─ Semantic hint (search, main, h1, aside...)
│    └─ Interactive (clickable/typeable)
│
└─ Tree structure shows parent-child nesting
```

### La grammatica

| Simbolo | Significato | Esempio |
|--------|---------|---------|
| `*` prefisso | L'utente può interagire con esso | `*LINK`, `*BUTTON`, `*INPUT` |
| `<semantic>` | Significato HTML5/ARIA preservato | `<h1>`, `<main>`, `<search>`, `<aside>` |
| `{flags}` | Comportamento del layout | `{sticky}`, `{scrollable}` |
| `"label"` | Contenuto di testo visibile | `"Sign up free"`, `"Search..."` |
| `(N items)` | Numero di elementi della lista | `LIST (12 items)` |
| Indentazione | Gerarchia padre-figlio | `HEADER > NAV > LIST > LINK` |

### I 23 ruoli

| Categoria | Ruoli |
|----------|-------|
| **Layout** | `PAGE`, `HEADER`, `FOOTER`, `SECTION`, `NAV` |
| **Content** | `TEXT`, `IMAGE`, `ICON`, `CARD`, `LIST`, `TABLE` |
| **Interactive** | `BUTTON`, `LINK`, `INPUT`, `CHECKBOX`, `RADIO`, `FORM` |
| **Overlays** | `MODAL`, `TOAST`, `DROPDOWN` |
| **Navigation** | `PAGINATION` |
| **Fallback** | `UNKNOWN` |

Questi 23 ruoli costituiscono un vocabolario fisso, valido per ogni sito web. Gli LLM li apprendono una volta e possono analizzare qualsiasi pagina.

## Cosa viene catturato

WebSketch non si limita a estrarre il DOM. Esegue un **classificatore a 5 livelli** su ogni elemento visibile:

| Livello | Origine | Esempio |
|------|--------|---------|
| 1. **Ruolo ARIA** | `role="navigation"` | &rarr; `NAV` |
| 2. **Tag HTML** | `<button>`, `<h1>` | &rarr; `BUTTON`, `TESTO <h1>` |
| 3. **Euristiche delle classi** | `.card`, `.modal`, `.toast` | &rarr; `CARD`, `MODAL`, `TOAST` |
| 4. **Analisi strutturale** | 3+ elementi dello stesso tipo | &rarr; `LIST` |
| 5. **Soluzione di riserva** | Elementi solo testo | &rarr; `TEXT`, `SECTION`, `UNKNOWN` |

Successivamente, viene eseguita una pulizia:

- **Attraversamento trasparente della tabella** &mdash; le tabelle `TR`/`TD`/`TH`/`LI` vengono ignorate, i nodi figli vengono spostati in superficie.
- **Eliminazione dei contenuti vuoti** &mdash; i nodi vuoti, non interattivi o invisibili vengono eliminati.
- **Collasso dei wrapper** &mdash; i wrapper `SECTION` superflui con un solo elemento figlio vengono rimossi.
- **Eliminazione a cascata** &mdash; le catene di wrapper vuoti senza contenuto vengono eliminate completamente.
- **Estrazione delle etichette** &mdash; il testo visibile viene estratto dai link, dai pulsanti, dalle intestazioni, dalle immagini e dai campi di input.

Il risultato: un albero semplificato con il numero minimo di nodi necessari per comprendere la pagina.

## Casi d'uso

### Per gli ingegneri di prompt

**"Descrivi la struttura di questa pagina"** &mdash; Incolla l'albero. Il modello linguistico (LLM) visualizza la struttura esatta, le intestazioni e la navigazione, senza essere sopraffatto dall'HTML. Funziona con ChatGPT, Claude, Gemini, Llama e qualsiasi altro modello di testo.

**"Cosa può fare un utente su questa pagina?"** &mdash; Ogni elemento interattivo è contrassegnato con `*`. Link, pulsanti, campi di input, caselle di controllo &mdash; tutti etichettati con il loro testo visibile. L'LLM può elencare tutte le possibili azioni dell'utente.

**"Confronta queste due pagine"** &mdash; Due alberi affiancati. L'LLM può confrontare la struttura, individuare elementi mancanti e confrontare i modelli di navigazione, il tutto in poche centinaia di token.

### Per gli sviluppatori

**"Genera un piano di test per questa interfaccia utente"** &mdash; L'albero corrisponde direttamente agli elementi da testare. `*BUTTON "Invia"`, `*INPUT <email> "Inserisci email"`, `*LINK "Termini"` &mdash; ognuno è un'interazione testabile con la sua etichetta visibile.

**"Crea qualcosa che assomigli a questo"** &mdash; L'albero semantico è simile a una gerarchia di componenti. `HEADER > NAV > LIST > LINK` corrisponde direttamente ai componenti React/Vue/Svelte. L'LLM può generare una struttura simile.

**"Verifica l'accessibilità di questa pagina"** &mdash; Elementi di riferimento mancanti, campi di input non etichettati, lacune nella gerarchia delle intestazioni &mdash; tutto è visibile nell'albero. Suggerimenti semantici come `<main>`, `<nav>`, `<search>` mostrano quali ruoli ARIA sono presenti (o assenti).

### Per gli agenti AI

**Integrazione con MCP** &mdash; Utilizza [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) per fornire al tuo agente AI la capacità di acquisire e analizzare qualsiasi pagina web come parte del suo set di strumenti.

**Monitoraggio automatizzato** &mdash; Utilizza [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) per acquisire le pagine secondo una pianificazione, confrontare gli alberi e rilevare modifiche strutturali.

## Quattro visualizzazioni

| Scheda | Cosa mostra | Ideale per |
|-----|---------------|----------|
| **LLM** (default) | Albero semantico indentato con etichette, semantica e flag | Incollare nei prompt degli LLM |
| **ASCII** | Schema a linee con disposizione spaziale | Comprensione visiva della disposizione |
| **Tree** | Albero di nodi espandibile con badge colorati che indicano il ruolo | Debug delle acquisizioni |
| **JSON** | IR completo di `WebSketchCapture` con evidenziazione della sintassi | Utilizzo programmatico e pipeline |

## Comandi

| Comando | Descrizione |
|---------|-------------|
| `WebSketch: Capture URL` | Richiedi URL, acquisisci e visualizza |
| `WebSketch: Capture URL from Clipboard` | Acquisisci l'URL presente negli appunti |
| `WebSketch: Copy LLM Tree to Clipboard` | Copia l'albero &mdash; incollalo direttamente in ChatGPT, Claude, ecc. |
| `WebSketch: Export LLM Tree` | Salva come `.md` per librerie di prompt o documentazione |
| `WebSketch: Export Capture as JSON` | Acquisizione completa dell'IR con riquadri di delimitazione, hash e metadati |
| `WebSketch: Export ASCII Wireframe` | Visualizzazione dello schema a linee |

## Impostazioni

| Impostazione | Valore predefinito | Descrizione |
|---------|---------|-------------|
| `websketch.chromePath` | Rilevamento automatico | Percorso dell'eseguibile di Chrome o Edge |
| `websketch.viewportWidth` | `1280` | Larghezza del viewport in pixel |
| `websketch.viewportHeight` | `800` | Altezza del viewport in pixel |
| `websketch.timeout` | `30000` | Timeout di navigazione (ms) |
| `websketch.waitAfterLoad` | `1000` | Tempo di attesa aggiuntivo per il rendering di JavaScript (ms) |

## Ecosistema

WebSketch è una famiglia di strumenti basati su una grammatica comune:

| Pacchetto | Cosa fa |
|---------|-------------|
| [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) | Core IR: grammatica, validazione, rendering, confronto delle differenze, identificazione univoca. |
| **websketch-vscode** | Estensione per VS Code: cattura pagine direttamente dal tuo editor (questo repository). |
| [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) | Cattura e rendering da riga di comando. |
| [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) | Estensione per Chrome per la cattura direttamente nel browser. |
| [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) | Server MCP per l'integrazione con agenti LLM. |

Tutti gli strumenti producono lo stesso formato IR `WebSketchCapture`, quindi gli output sono intercambiabili tra i diversi processi.

## Requisiti

- VS Code 1.85 o superiore.
- Chrome o Edge installati sul sistema.

Nessun browser incluso. Nessun download da 200 MB. WebSketch utilizza `puppeteer-core` con il browser che già hai installato.

## Sicurezza e ambito dei dati

**Dati elaborati:** URL inseriti dall'utente (navigati tramite puppeteer-core utilizzando Chrome/Edge locale in modalità senza interfaccia grafica), contenuto delle pagine catturate convertito in albero IR, esportazioni scritte in file di lavoro o negli appunti. **Dati NON elaborati:** nessun file al di fuori della cartella di lavoro, nessuna credenziale del sistema operativo, nessuna sessione di login del browser (modalità senza interfaccia grafica senza profilo). **Rete:** accede solo agli URL specificati dall'utente; non vengono effettuate altre richieste in uscita. **Non vengono raccolti né inviati dati di telemetria.**

## Licenza

Licenza MIT: vedere [LICENSE](LICENSE) per i dettagli.

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
