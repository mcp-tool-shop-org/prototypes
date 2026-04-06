<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-app-builder/readme.png" alt="MCP App Builder" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder"><img src="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder/branch/main/graph/badge.svg" alt="codecov" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-1.0-green" alt="MCP" /></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-app-builder/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

> Creare server MCP con componenti di interfaccia utente interattivi direttamente da VS Code.

## Panoramica

**MCP App Builder** aiuta gli sviluppatori a creare, testare e distribuire rapidamente server MCP (Model Context Protocol). Supporta il nuovo standard **MCP Apps** (gennaio 2026), consentendo l'integrazione di componenti di interfaccia utente interattivi direttamente nelle conversazioni di intelligenza artificiale.

## Funzionalità

### Struttura di base
- **Nuova procedura guidata per il server**: Creare server MCP con una configurazione guidata.
- **Modelli**: Configurazioni di server di base, con interfaccia utente e complete.
- **Configurazione automatica**: TypeScript, MCP SDK e struttura del progetto.

### Sviluppo
- **Validazione dello schema**: Validazione in tempo reale di `mcp.json` e `mcp-tools.json`.
- **Validazione automatica al salvataggio**: Gli schemi vengono controllati automaticamente al momento del salvataggio (configurabile).
- **Generazione di tipi**: Generare tipi TypeScript dalle definizioni degli strumenti.
- **IntelliSense**: Supporto per JSON Schema per i file di configurazione.

### Test
- **Ambiente di test**: Eseguire test sugli strumenti MCP.
- **Test generati automaticamente**: Test creati dalle definizioni degli strumenti e dagli esempi.
- **Canale di output**: Risultati dei test formattati con stato di successo/fallimento.

### Cruscotto
- **Interfaccia visiva**: Accesso rapido a tutti i comandi.
- **Integrazione con l'area di lavoro**: Rileva automaticamente i progetti MCP.
- **Barra di stato**: Indicatore MCP quando si lavora su un progetto MCP.

## Guida rapida

1. **Installare l'estensione** dal VS Code Marketplace (in arrivo).
2. **Creare un nuovo server**: `Cmd+Shift+P` → "MCP: Nuovo server".
3. **Scegliere un modello**:
- `basic` - Server semplice "hello world".
- `with-ui` - Server con componenti di interfaccia utente di tabella e grafico.
- `full` - Server completo con strumenti, risorse e suggerimenti.

## Scorciatoie da tastiera

| Scorciatoia | Comando |
|----------|---------|
| `Ctrl+Alt+N` (`Cmd+Alt+N` su Mac) | Nuovo server |
| `Ctrl+Alt+V` (`Cmd+Alt+V` su Mac) | Valida schema |

## Comandi

| Comando | Descrizione |
|---------|-------------|
| `MCP: New Server` | Crea un nuovo progetto server MCP. |
| `MCP: Validate Schema` | Valida il file `mcp.json` o `mcp-tools.json` corrente. |
| `MCP: Generate Types` | Genera tipi TypeScript dalle definizioni degli strumenti. |
| `MCP: Test Server` | Esegui test sugli strumenti MCP. |
| `MCP: Open Dashboard` | Apri il cruscotto visivo. |

## Impostazioni

| Impostazione | Valore predefinito | Descrizione |
|---------|---------|-------------|
| `mcp-app-builder.defaultTemplate` | `basic` | Modello predefinito per i nuovi server (basic/with-ui/full). |
| `mcp-app-builder.autoValidate` | `true` | Valida automaticamente gli schemi al momento del salvataggio. |
| `mcp-app-builder.testPort` | `3000` | Porta per il server di test MCP. |

## Componenti dell'interfaccia utente MCP Apps

L'estensione fornisce strumenti per i componenti dell'interfaccia utente MCP Apps:

```typescript
import { table, chart, form, card } from '@mcp-app-builder/ui-components';

// Create a search results table
const results = table(
  [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status' },
  ],
  data,
  { pageSize: 10 }
);

// Create a dashboard with metrics
const dashboard = dashboard({
  title: 'Analytics',
  metrics: [
    { label: 'Users', value: 1234, change: 12 },
    { label: 'Revenue', value: '$5,678', change: -3 },
  ],
  chart: lineChart,
});
```

## Struttura dei file

I progetti server MCP generati seguono questa struttura:

```
my-mcp-server/
├── mcp.json           # Server configuration
├── mcp-tools.json     # Tool definitions
├── package.json       # Node.js dependencies
├── tsconfig.json      # TypeScript configuration
└── src/
    ├── index.ts       # Server entry point
    ├── resources.ts   # Resource handlers (full template)
    └── prompts.ts     # Prompt handlers (full template)
```

## Sviluppo

### Prerequisiti

- Node.js 18+
- VS Code 1.85+

### Configurazione

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-app-builder
cd mcp-app-builder
npm install
npm run compile
```

### Esecuzione

Premi `F5` in VS Code per avviare l'ambiente di sviluppo dell'estensione.

### Test

```bash
npm test
```

## Roadmap

### Fase 1 (Attuale) - Fondamenta deterministiche
- [x] Struttura di base del progetto con modelli.
- [x] Sistema di validazione dello schema.
- [x] Generazione di tipi dagli schemi.
- [x] Componenti primitivi dell'interfaccia utente.
- [x] Fondamenta dell'ambiente di test.
- [x] Webview del cruscotto.

### Fase 2 - Sviluppo assistito dall'intelligenza artificiale
- [ ] Generazione di strumenti tramite linguaggio naturale.
- [ ] Completamento intelligente del codice per i gestori degli strumenti.
- [ ] Generazione automatica della documentazione.

### Fase 3 - Pubblicazione e distribuzione
- [ ] Pubblicazione con un solo clic nei registri MCP.
- [ ] Gestione delle versioni.
- [ ] Risoluzione delle dipendenze.

### Fase 4 - Costruttore visivo
- [ ] Costruttore di componenti dell'interfaccia utente con trascinamento della selezione.
- [ ] Anteprima in tempo reale delle applicazioni MCP.
- [ ] Editor di flusso visivo.

## Contributi

Siamo lieti di ricevere contributi! Si prega di leggere le nostre linee guida per i contributi (disponibili a breve).

## Sicurezza e Privacy

**Dati a cui si accede:** file di lavoro (mcp.json, mcp-tools.json, file TypeScript generati), impostazioni di VS Code, canali di output dell'estensione.

**Dati a cui NON si accede:** codice sorgente al di fuori delle configurazioni MCP, cronologia di Git, rete (eccetto l'ambiente di test locale), credenziali, variabili d'ambiente. Non vengono raccolti né trasmessi dati di telemetria.

**Autorizzazioni:** lettura/scrittura del file system per la creazione di scheletri e la generazione di tipi (solo per l'area di lavoro), rete locale per l'ambiente di test. Consultare il file [SECURITY.md](SECURITY.md) per la politica completa.

## Licenza

MIT

## Link

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP Apps Specification](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [Organizzazione GitHub](https://github.com/mcp-tool-shop-org)

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
