<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-tool-registry/readme.png" alt="MCP Tool Registry" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-tool-registry"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-tool-registry" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-tool-registry/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Il registro contiene solo metadati: è la fonte di riferimento unica per tutti gli strumenti di MCP Tool Shop.**

Lo schema viene validato ad ogni commit. Pacchetti predefiniti creati secondo regole. L'indice di ricerca predefinito è incluso nel pacchetto. Blocca una versione e ottieni metadati deterministici ogni volta.

## Guida rapida

```bash
npm install @mcptoolshop/mcp-tool-registry
```

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }

console.log(`${registry.tools.length} tools registered`)
```

## Panoramica

- **Solo dati** — nessun codice eseguibile, solo metadati JSON per ogni strumento nell'ecosistema.
- **Validato tramite schema** — ogni voce viene controllata rispetto allo schema JSON durante il commit e nell'integrazione continua (CI).
- **Sistema di pacchetti** — gli strumenti sono raggruppati in pacchetti predefiniti (`core`, `agents`, `ops`, `evaluation`) secondo regole, non tramite selezione manuale.
- **Ricerca rapida** — l'indice di ricerca predefinito, con parole chiave e filtri, è incluso nel pacchetto.
- **Minimo privilegio** — gli strumenti hanno di default zero funzionalità; gli effetti collaterali sono opzionali e devono essere dichiarati esplicitamente.
- **Riproducibile** — blocca una versione del registro e ottieni metadati deterministici ogni volta.

## Utenti

### Registro completo

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }
```

### Pacchetti

```javascript
import coreBundle from "@mcptoolshop/mcp-tool-registry/bundles/core.json" with { type: "json" }
import agents from "@mcptoolshop/mcp-tool-registry/bundles/agents.json" with { type: "json" }
```

Pacchetti disponibili: `core`, `agents`, `ops`, `evaluation`.

### Indice di ricerca

```javascript
import toolIndex from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }

const hits = toolIndex.filter(t => t.keywords.includes("accessibility"))
```

### Contesto LLM

```javascript
// Plain-text context file for LLM RAG pipelines
import llmContext from "@mcptoolshop/mcp-tool-registry/dist/registry.llms.txt"
```

## Pacchetti

| Pacchetto      | Descrizione                                          | Logica di selezione                       |
| -------------- | ---------------------------------------------------- | ----------------------------------------- |
| **core**       | Utilità essenziali                                   | Elenco ID esplicito                       |
| **agents**     | Orchestrazione, navigazione e contesto degli agenti. | ID espliciti + tag `agents`               |
| **ops**        | DevOps, infrastruttura, deployment.                  | Tag: `automation`, `packaging`, `release` |
| **evaluation** | Test, benchmark, copertura.                          | Tag: `testing`, `evaluation`, `benchmark` |

## Struttura

```
mcp-tool-registry/
├── registry.json              # Canonical source of truth
├── schema/registry.schema.json
├── bundles/                   # Rules-generated subsets
├── dist/                      # Derived artifacts (generated at publish)
│   ├── registry.index.json    # Search index
│   ├── capabilities.json      # Capability reverse map
│   ├── derived.meta.json      # Build metadata + registry hash
│   └── registry.llms.txt      # LLM-native context
└── curation/featured.json     # Featured tools and collections
```

## Aggiunta di uno strumento

1. Leggi [docs/registry-guidelines.md](docs/registry-guidelines.md)
2. Aggiungi una voce a `registry.json` (mantieni l'ordine in base all'`id`)
3. Esegui `npm run validate` e `npm run policy`
4. Invia una Pull Request

## Versioning

Il contratto della versione 1 è stabile. Nuovi campi opzionali possono essere aggiunti nelle versioni minori; i campi obbligatori e la struttura dei campi esistenti non cambieranno all'interno di una versione maggiore.

## Ecosistema

- **[mcpt CLI](https://github.com/mcp-tool-shop-org/mcpt)** — scopri, installa ed esegui gli strumenti.
- **[Invia uno strumento](https://github.com/mcp-tool-shop-org/mcp-tool-registry/issues/new/choose)** — aggiungi il tuo strumento all'ecosistema.

## Licenza

MIT — consulta [LICENSE](LICENSE) per i dettagli.
