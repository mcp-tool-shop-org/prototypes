<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-aside/readme.png" alt="mcp-aside logo" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-aside"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-aside" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-aside/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  An MCP server that gives your AI a place to jot things down mid-conversation — without derailing the task at hand.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="#tools">Tools</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#license">License</a>
</p>

---

## Perché

I modelli linguistici di grandi dimensioni (LLM) tendono a dimenticare le cose. Un pensiero isolato, una preoccupazione non completamente definita, un "dovremmo tornare su questo" che poi non viene più affrontato. **mcp-aside** fornisce al modello una casella di posta dedicata per gestire queste "note a margine", con limiti di frequenza, eliminazione dei duplicati e scadenza automatica, in modo che la casella di posta stessa non diventi un problema.

Immaginate una graffetta accanto alla conversazione. Il modello scrive delle note. Voi (o il modello) le leggete quando è il momento giusto.

## Come Funziona

1. Il modello chiama `aside.push` con un pensiero, contrassegnato dalla priorità.
2. I controlli (guardrails) verificano la presenza di duplicati, i limiti di frequenza e i tempi di scadenza.
3. Se supera i controlli, l'annotazione viene inserita in una casella di posta in memoria.
4. I client vengono notificati tramite `notifications/resources/updated`.
5. Chiunque può leggere la casella di posta tramite la risorsa `interject://inbox`.

Non c'è database. Non c'è persistenza. Se il server si arresta, la casella di posta viene persa, ed è una scelta deliberata.

## Guida Rapida

```bash
npm install
npm run build
node build/index.js
```

Il server utilizza MCP tramite **stdio**. Puntate qualsiasi client compatibile con MCP su di esso:

```json
{
  "mcpServers": {
    "aside": {
      "command": "node",
      "args": ["build/index.js"]
    }
  }
}
```

## Strumenti

| Strumento | Cosa fa |
| --- | --- |
| `aside.push` | Inserisce un'annotazione nella casella di posta. Accetta `text`, `priority` (bassa/media/alta), `reason`, `tags`, `expiresAt`, `source` e `meta`. |
| `aside.configure` | Configura i controlli (guardrails) a runtime: limiti di tempo, limiti di frequenza, finestre di deduplicazione, soglie di notifica. |
| `aside.clear` | Svuota la casella di posta. |
| `aside.status` | Snapshot di sola lettura delle dimensioni della casella di posta e della configurazione corrente dei controlli. |

## Risorsa

| URI | Descrizione |
| --- | --- |
| `interject://inbox` | Array JSON di annotazioni in attesa, ordinate dalla più recente alla meno recente. Gli elementi scaduti vengono filtrati durante la lettura. |

## Controlli (Guardrails)

Tutto è configurabile tramite `aside.configure`. Valori predefiniti:

| Impostazione | Valore predefinito | Cosa controlla |
| --- | --- | --- |
| `defaultTtlSeconds` | 600 (10 minuti) | Durata di un'annotazione se non viene impostata una scadenza esplicita. |
| `maxTtlSeconds` | 3600 (1 ora) | Limite massimo di durata, anche se il chiamante richiede un valore superiore. |
| `dedupeWindowSeconds` | 300 (5 minuti) | Stessa priorità + testo + motivo = soppressa all'interno di questa finestra. |
| `rateLimitWindowSeconds` | 60 | Finestra scorrevole per il limite di frequenza. |
| `rateLimitMax` | bassa: 6, media: 3, alta: 1 | Numero massimo di inserimenti per priorità per finestra. |
| `notifyAtOrAbove` | alta | Invia notifiche di log solo per elementi con priorità pari o superiore a questa. |

## Configurazione

### Timer Trigger

Un timer integrato si attiva ogni 5 minuti, inviando un controllo di bassa priorità "ci sono blocchi?". Rispetta gli stessi controlli degli inserimenti manuali (quindi verrà deduplicato o limitato di frequenza come qualsiasi altra cosa). Per disabilitarlo, commentare la chiamata `startTimerTrigger` in `index.ts`.

### MCP Inspector

Per i test locali:

```
Transport: STDIO
Command:   node
Args:      build/index.js
```

## Note

- I log vengono inviati a **stderr**; **stdout** è riservato per le chiamate JSON-RPC MCP.
- La casella di posta è volatile. Il riavvio comporta una nuova casella di posta.
- Le annotazioni sono memorizzate in ordine cronologico inverso (dalla più recente alla meno recente). Gli elementi scaduti vengono eliminati ad ogni lettura e inserimento.

## Licenza

[MIT](LICENSE)

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
