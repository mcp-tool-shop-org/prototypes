<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ConsensusOS/readme.png" width="400" alt="ConsensusOS">
</p>

# ConsensusOS

> Fait partie de [MCP Tool Shop](https://mcptoolshop.com)

**Plateforme de contrôle modulaire et sans dépendances pour la gouvernance de consensus multi-chaînes.**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ConsensusOS/actions"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/ConsensusOS/npm.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/ConsensusOS?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/ConsensusOS/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/consensus-os"><img src="https://img.shields.io/npm/v/@mcptoolshop/consensus-os?style=flat-square&color=cb3837" alt="npm version"></a>
  <img src="https://img.shields.io/badge/dependencies-0-blue?style=flat-square" alt="Dependencies: 0">
</p>

---

## Pourquoi ConsensusOS ?

Exploiter une infrastructure multi-chaînes implique de faire confiance à des nœuds que vous ne contrôlez pas entièrement, de déployer des versions qui ne doivent pas diverger et de gérer les modifications de configuration sur des réseaux qui ne s'arrêtent jamais. La plupart des équipes mettent tout cela en place avec des scripts ad hoc et espèrent le meilleur.

ConsensusOS remplace cet espoir par une **plateforme de contrôle basée sur des plugins**, où chaque module communique via un bus d'événements partagé, chaque transition d'état est protégée par des invariants de type "échec fermé" et l'ensemble de l'historique du système peut être rejoué de manière déterministe.

- **Aucune dépendance de production** — rien dans votre chaîne d'approvisionnement que vous n'ayez pas écrit vous-même.
- **API de plugin v1 figée** — contrat stable qui ne cassera pas vos intégrations.
- **Invariants de type "échec fermé"** — les transitions invalides sont toujours rejetées, et ne sont jamais appliquées partiellement.
- **Rejeu déterministe** — reproduire n'importe quel état du système à partir de l'historique des événements.
- **Exécution limitée en ressources** — limites de CPU, de mémoire et de temps appliquées via des jetons.
- **Adaptateurs multi-chaînes** — XRPL, Ethereum et Cosmos prêts à l'emploi.

---

## Installation

```bash
npm install @mcptoolshop/consensus-os
```

Nécessite **Node.js 18+**. Aucune dépendance d'exécution.

---

## Démarrage rapide

### Utilisation par programmation

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

### Créer un plugin personnalisé

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

### Ligne de commande (CLI)

```bash
npx consensusos doctor     # Run health checks
npx consensusos verify     # Verify release artifact integrity
npx consensusos config     # Config validation / diff / migration
npx consensusos status     # System status overview
npx consensusos plugins    # List loaded plugins
npx consensusos adapters   # List and query chain adapters
```

---

## Architecture

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

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour la spécification complète.

---

## API

### Noyau

| Exportation | Description |
| -------- | ------------- |
| `CoreLoader` | Orchestrateur du cycle de vie des plugins — enregistrement, démarrage, arrêt. |
| `CoreEventBus` | Bus d'événements ordonné, typé et rejouable avec abonnements wildcard. |
| `CoreInvariantEngine` | Moteur d'invariants de type "échec fermé" avec enregistrement en écriture seule. |
| `createLogger(scope)` | Journaliseur structuré, spécifique à un module. |

### Modules

| Fabrique | Objectif |
| --------- | --------- |
| `createHealthSentinel()` | Surveillance de la santé des nœuds via des signaux de vie. |
| `createReleaseVerifier()` | Vérification de la somme de contrôle des versions logicielles. |
| `createConfigGuardian()` | Validation et migration du schéma de configuration. |
| `createSandboxPlugin()` | Moteur de simulation, de rejeu et de modification isolé. |
| `createGovernorPlugin()` | Exécution basée sur des jetons, application de politiques, file d'attente de construction. |

### Adaptateurs

| Fabrique | Chain | Statut |
| --------- | ------- | -------- |
| `createXrplAdapter()` | XRPL | Implémenté |
| `createEthereumAdapter()` | Ethereum | Implémenté |
| `createCosmosAdapter()` | Cosmos | Implémenté |

### SDK de plugin

| Exportation | Description |
| -------- | ------------- |
| `BasePlugin` | Classe de base abstraite avec valeurs par défaut du cycle de vie et méthodes pratiques. |
| `ManifestBuilder` | Constructeur fluent pour les manifestes de plugins typés. |
| `validatePlugin()` | Validation de pré-enregistrement avec erreurs et avertissements. |
| `AttestationPipeline` | Attestation de version et provenance de la construction. |

### Exports de sous-chemins

```ts
import { ... } from "@mcptoolshop/consensus-os";          // Full API
import { ... } from "@mcptoolshop/consensus-os/plugin";   // Plugin SDK + types
import { ... } from "@mcptoolshop/consensus-os/cli";      // CLI dispatch
```

---

## Tests

```bash
npm test         # Full suite (295 tests)
npx vitest       # Watch mode
```

Catégories de tests :
- **Architecture** (16 tests) — application d'invariants structurels.
- **Sécurité** (27 tests) — résistance aux abus et déterminisme.
- **Charge** (22 tests) — cas limites et débit.
- **Unitaires** (230 tests) — couverture au niveau des composants.

---

## Documentation

| Documentation | Objectif |
| ---------- | --------- |
| [QUICKSTART.md](QUICKSTART.md) | Mise en route en 3 minutes |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Spécification de l'architecture v1.0 figée. |
| [PLUGIN_GUIDE.md](PLUGIN_GUIDE.md) | Comment écrire un plugin |
| [ADAPTER_GUIDE.md](ADAPTER_GUIDE.md) | Comment créer un adaptateur de chaîne |
| [SANDBOX_GUIDE.md](SANDBOX_GUIDE.md) | Tests en bac à sable, relecture et guide de modification. |
| [GOVERNOR_GUIDE.md](GOVERNOR_GUIDE.md) | Exécution des jetons, politiques, file d'attente de construction. |
| [SECURITY.md](SECURITY.md) | Politique de sécurité et signalement des vulnérabilités. |
| [THREAT_MODEL.md](THREAT_MODEL.md) | Analyse des menaces STRIDE. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Flux de développement et liste de contrôle des demandes de modification (PR). |
| [BUILD.md](BUILD.md) | Construction et vérification reproductibles. |

---

## Support

- **Questions / aide :** [Discussions](https://github.com/mcp-tool-shop-org/ConsensusOS/discussions)
- **Signalement de bogues :** [Issues](https://github.com/mcp-tool-shop-org/ConsensusOS/issues)

---

## Licence

[MIT](LICENSE)
