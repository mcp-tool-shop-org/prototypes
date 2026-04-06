<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ConsensusOS/readme.png" width="400" alt="ConsensusOS">
</p>

# ConsensusOS

> Parte di [MCP Tool Shop](https://mcptoolshop.com)

**Piattaforma di controllo modulare e senza dipendenze per la governance del consenso multi-catena.**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ConsensusOS/actions"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/ConsensusOS/npm.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/ConsensusOS?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/ConsensusOS/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/consensus-os"><img src="https://img.shields.io/npm/v/@mcptoolshop/consensus-os?style=flat-square&color=cb3837" alt="npm version"></a>
  <img src="https://img.shields.io/badge/dependencies-0-blue?style=flat-square" alt="Dependencies: 0">
</p>

---

## Perché ConsensusOS?

Gestire un'infrastruttura multi-catena significa affidarsi a nodi che non si controllano completamente, distribuire rilasci che non devono divergere e gestire modifiche alla configurazione in reti che non si fermano mai. Molti team risolvono questo problema con script improvvisati e sperano nel meglio.

ConsensusOS sostituisce questa speranza con una **piattaforma di controllo basata su plugin**, dove ogni modulo comunica tramite un bus di eventi condiviso, ogni transizione di stato è protetta da invarianti "fail-closed" e l'intera cronologia del sistema può essere riprodotta in modo deterministico.

- **Nessuna dipendenza di produzione** — niente nella tua catena di fornitura che tu non abbia scritto.
- **API dei plugin v1 "congelata"** — contratto stabile che non comprometterà le tue integrazioni.
- **Invarianti "fail-closed"** — le transizioni non valide vengono sempre rifiutate, mai applicate parzialmente.
- **Riproduzione deterministica** — riproduci qualsiasi stato del sistema dalla cronologia degli eventi.
- **Esecuzione con limiti di risorse** — limiti di CPU, memoria e tempo applicati tramite token.
- **Adattatori multi-catena** — XRPL, Ethereum e Cosmos pronti all'uso.

---

## Installazione

```bash
npm install @mcptoolshop/consensus-os
```

Richiede **Node.js 18+**. Nessuna dipendenza di runtime.

---

## Guida rapida

### Utilizzo programmatico

```ts
import {
  CoreLoader,
  createHealthSentinel,
  createReleaseVerifier,
  createConfigGuardian,
  createXrplAdapter,
} from "@mcptoolshop/consensus-os";

// Create the loader (orchestrates plugin lifecycle)
const loader = new CoreLoader({
  configs: {
    "health-sentinel": { intervalMs: 10_000 },
  },
});

// Register plugins
loader.register(createHealthSentinel());
loader.register(createReleaseVerifier());
loader.register(createConfigGuardian());
loader.register(createXrplAdapter());

// Boot resolves dependencies, inits, and starts all plugins
await loader.boot();

// Subscribe to events
loader.events.subscribe("health.*", (event) => {
  console.log(`[${event.topic}] from ${event.source}:`, event.data);
});

// Check invariants before a state transition
const verdict = await loader.invariants.check({ action: "deploy" });
console.log("Transition allowed:", verdict.allowed);

// Graceful shutdown (reverse boot order)
await loader.shutdown();
```

### Crea un plugin personalizzato

```ts
import { BasePlugin, ManifestBuilder } from "@mcptoolshop/consensus-os/plugin";

class MyMonitor extends BasePlugin {
  readonly manifest = ManifestBuilder.create("my-monitor")
    .name("My Monitor")
    .version("1.0.0")
    .capability("sentinel")
    .build();

  protected async onStart() {
    this.on("health.check.completed", (event) => {
      this.log.info("Health check result", event.data as Record<string, unknown>);
    });
    this.emit("my-monitor.ready", { status: "online" });
  }
}
```

### CLI (Interfaccia a riga di comando)

```bash
npx consensusos doctor     # Run health checks
npx consensusos verify     # Verify release artifact integrity
npx consensusos config     # Config validation / diff / migration
npx consensusos status     # System status overview
npx consensusos plugins    # List loaded plugins
npx consensusos adapters   # List and query chain adapters
```

---

## Architettura

```
┌─────────────────────────────────────────────────┐
│                   CLI (entry)                   │
├─────────────────────────────────────────────────┤
│              Plugin SDK / Attestation           │
├──────────┬──────────┬──────────┬────────────────┤
│  Health  │ Verifier │  Config  │    Sandbox     │
│ Sentinel │ (Release)│ Guardian │ (Replay/Amend) │
├──────────┴──────────┴──────────┼────────────────┤
│           Governor Layer       │   Adapters     │
│  (Token · Policy · Queue)     │ (XRPL/ETH/ATOM)│
├────────────────────────────────┴────────────────┤
│                 Core Layer                      │
│    EventBus · InvariantEngine · Loader · Logger │
├─────────────────────────────────────────────────┤
│              Plugin API v1 (frozen)             │
└─────────────────────────────────────────────────┘
```

Consulta [ARCHITECTURE.md](ARCHITECTURE.md) per la specifica completa.

---

## API

### Core (Nucleo)

| Esportazione | Descrizione |
| -------- | ------------- |
| `CoreLoader` | Orchestratore del ciclo di vita dei plugin — registrazione, avvio, arresto |
| `CoreEventBus` | Bus di eventi ordinato, tipizzato e riproducibile con sottoscrizioni wildcard |
| `CoreInvariantEngine` | Motore di invarianti "fail-closed" con registrazione a sola scrittura |
| `createLogger(scope)` | Logger strutturato con ambito a un modulo |

### Moduli

| Factory (Fabbrica) | Scopo |
| --------- | --------- |
| `createHealthSentinel()` | Monitoraggio dello stato dei nodi tramite heartbeat |
| `createReleaseVerifier()` | Verifica dell'hash delle release software |
| `createConfigGuardian()` | Validazione e migrazione dello schema di configurazione |
| `createSandboxPlugin()` | Motore di simulazione, riproduzione e modifica isolato |
| `createGovernorPlugin()` | Esecuzione basata su token, applicazione di policy, coda di build |

### Adattatori

| Factory (Fabbrica) | Chain | Stato |
| --------- | ------- | -------- |
| `createXrplAdapter()` | XRPL | Implementato |
| `createEthereumAdapter()` | Ethereum | Implementato |
| `createCosmosAdapter()` | Cosmos | Implementato |

### Plugin SDK (Kit di sviluppo software)

| Esportazione | Descrizione |
| -------- | ------------- |
| `BasePlugin` | Classe base astratta con impostazioni predefinite del ciclo di vita e metodi di convenienza |
| `ManifestBuilder` | Costruttore "fluent" per manifest dei plugin type-safe |
| `validatePlugin()` | Validazione preliminare con errori e avvisi |
| `AttestationPipeline` | Attestazione delle release e provenienza della build |

### Esportazioni di sottoperte

```ts
import { ... } from "@mcptoolshop/consensus-os";          // Full API
import { ... } from "@mcptoolshop/consensus-os/plugin";   // Plugin SDK + types
import { ... } from "@mcptoolshop/consensus-os/cli";      // CLI dispatch
```

---

## Test

```bash
npm test         # Full suite (295 tests)
npx vitest       # Watch mode
```

Categorie di test:
- **Architettura** (16 test) — applicazione di invarianti strutturali
- **Sicurezza** (27 test) — resistenza agli abusi e determinismo
- **Stress** (22 test) — casi limite e throughput
- **Unit** (230 test) — copertura a livello di componente

---

## Documentazione

| Documento | Scopo |
| ---------- | --------- |
| [QUICKSTART.md](QUICKSTART.md) | Inizia a utilizzare in 3 minuti |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Specifiche dell'architettura v1.0 "congelata" |
| [PLUGIN_GUIDE.md](PLUGIN_GUIDE.md) | Come scrivere un plugin |
| [ADAPTER_GUIDE.md](ADAPTER_GUIDE.md) | Come creare un adattatore per una blockchain |
| [SANDBOX_GUIDE.md](SANDBOX_GUIDE.md) | Sandbox, riproduzione e guida alla modifica. |
| [GOVERNOR_GUIDE.md](GOVERNOR_GUIDE.md) | Esecuzione dei token, politiche e coda di build. |
| [SECURITY.md](SECURITY.md) | Politica di sicurezza e segnalazione di vulnerabilità. |
| [THREAT_MODEL.md](THREAT_MODEL.md) | Analisi delle minacce STRIDE. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Flusso di sviluppo e checklist per le pull request. |
| [BUILD.md](BUILD.md) | Build e verifica riproducibili. |

---

## Supporto

- **Domande / assistenza:** [Discussioni](https://github.com/mcp-tool-shop-org/ConsensusOS/discussions)
- **Segnalazione di bug:** [Problemi](https://github.com/mcp-tool-shop-org/ConsensusOS/issues)

---

## Licenza

[MIT](LICENSE)
