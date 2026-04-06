<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/flexiflow/readme.png" alt="FlexiFlow logo" width="400">
</p>

<p align="center">
    <em>A lightweight async component engine with events, state machines, and a minimal CLI.</em>
</p>

<p align="center">
    <a href="https://github.com/mcp-tool-shop-org/flexiflow/actions/workflows/tests.yml">
        <img src="https://github.com/mcp-tool-shop-org/flexiflow/actions/workflows/tests.yml/badge.svg" alt="CI">
    </a>
    <a href="https://pypi.org/project/flexiflow/">
        <img src="https://img.shields.io/pypi/v/flexiflow" alt="PyPI version">
    </a>
    <a href="https://opensource.org/licenses/MIT">
        <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
    </a>
    <a href="https://mcp-tool-shop-org.github.io/flexiflow/">
        <img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page">
    </a>
</p>

**Un petit moteur de composants asynchrones avec des événements, des machines à états et une CLI minimaliste.**

---

## Pourquoi FlexiFlow ?

La plupart des moteurs de flux de travail sont complexes, rigides et supposent que vous souhaitez un exécuteur de graphes orientés.
FlexiFlow n'est rien de tout cela. Il vous offre :

- **Des composants** avec des règles déclaratives et des machines à états modulaires.
- **Un bus d'événements asynchrone** avec priorité, filtres et envoi séquentiel ou concurrent.
- **Une journalisation structurée** avec des identifiants de corrélation intégrés.
- **Une persistance** (JSON pour le développement, SQLite pour la production) avec historique des snapshots et suppression.
- **Une CLI minimaliste** pour que vous puissiez faire des démonstrations et déboguer sans écrire de code d'intégration.
- **Une introspection de la configuration** (`explain()`) pour valider avant l'exécution.

Tout cela en moins de 2000 lignes de code Python pur. Aucune dépendance lourde. Pas de magie.

---

## Installation

```bash
pip install flexiflow
```

Avec des options supplémentaires :

```bash
pip install flexiflow[reload]   # hot-reload with watchfiles
pip install flexiflow[api]      # FastAPI integration
pip install flexiflow[dev]      # pytest + coverage
```

---

## Démarrage rapide

### CLI

```bash
# Register a component and start it
flexiflow register --config examples/config.yaml --start

# Send messages through the state machine
flexiflow handle --config examples/config.yaml confirm --content confirmed
flexiflow handle --config examples/config.yaml complete

# Hot-swap rules at runtime
flexiflow update_rules --config examples/config.yaml examples/new_rules.yaml
```

### Intégré (Python)

```python
from flexiflow.engine import FlexiFlowEngine
from flexiflow.config_loader import ConfigLoader

config = ConfigLoader.load_component_config("config.yaml")
engine = FlexiFlowEngine()

# Register and interact
component = engine.create_component(config)
await engine.handle_message(component.name, "start")
await engine.handle_message(component.name, "confirm", content="confirmed")
```

Vous pouvez également définir `FLEXIFLOW_CONFIG=/path/to/config.yaml` et omettre `--config` dans la CLI.

---

## Aperçu de l'API

### Bus d'événements

```python
# Subscribe with priority (1=highest, 5=lowest)
handle = await bus.subscribe("my.event", "my_component", handler, priority=2)

# Publish with delivery mode
await bus.publish("my.event", data, delivery="sequential")   # ordered
await bus.publish("my.event", data, delivery="concurrent")    # parallel

# Cleanup
bus.unsubscribe(handle)
bus.unsubscribe_all("my_component")
```

**Politiques d'erreur :** `continue` (enregistrer et continuer) ou `raise` (échouer rapidement).

### Machines à états

Types de messages intégrés : `start`, `confirm`, `cancel`, `complete`, `error`, `acknowledge`.

Chargement d'états personnalisés via des chemins pointillés :

```yaml
initial_state: "mypkg.states:MyInitialState"
```

Ou enregistrement de packs d'états entiers :

```yaml
states:
  InitialState: "mypkg.states:InitialState"
  Processing: "mypkg.states:ProcessingState"
  Complete: "mypkg.states:CompleteState"
initial_state: InitialState
```

### Événements d'observabilité

| Event | When | Charge utile |
| ------- | ------ | --------- |
| `engine.component.registered` | Composant enregistré | `{component}` |
| `component.message.received` | Message reçu | `{component, message}` |
| `state.changed` | Transition d'état | `{component, from_state, to_state}` |
| `event.handler.failed` | Exception du gestionnaire (mode continue) | `{event_name, component_name, exception}` |

### Décorateur de nouvelle tentative

```python
from flexiflow.extras.retry import retry_async, RetryConfig

@retry_async(RetryConfig(max_attempts=3, base_delay=0.2, jitter=0.2))
async def my_handler(data):
    ...
```

### Persistance

| Fonctionnalité | JSON | SQLite |
| --------- | ------ | -------- |
| Historique | Écrasements | Ajouts |
| Conservation | N/A | `prune_snapshots_sqlite()` |
| Idéal pour | Développement/débogage | Production |

```python
from flexiflow.extras import save_component, load_snapshot, restore_component

# JSON: save and restore
save_component(component, "state.json")
snapshot = load_snapshot("state.json")
restored = restore_component(snapshot, engine)
```

```python
import sqlite3
from flexiflow.extras import save_snapshot_sqlite, load_latest_snapshot_sqlite

conn = sqlite3.connect("state.db")
save_snapshot_sqlite(conn, snapshot)
latest = load_latest_snapshot_sqlite(conn, "my_component")
```

### Introspection de la configuration

```python
from flexiflow import explain

result = explain("config.yaml")
if result.is_valid:
    print(result.format())
```

---

## Gestion des erreurs

Toutes les exceptions héritent de `FlexiFlowError` avec des messages structurés (Quoi / Pourquoi / Solution / Contexte) :

```
FlexiFlowError (base)
├── ConfigError      # Configuration validation failures
├── StateError       # State registry/machine errors
├── PersistenceError # JSON/SQLite persistence errors
└── ImportError_     # Dotted path import failures
```

```python
from flexiflow import FlexiFlowError, StateError

try:
    sm = StateMachine.from_name("BadState")
except StateError as e:
    print(e)  # includes What, Why, Fix, and Context
```

---

## Exemples

Consultez [`examples/embedded_app/`](examples/embedded_app/) pour un exemple de travail complet avec des états personnalisés, une persistance SQLite, des abonnements d'observabilité et une suppression de conservation.

---

## Licence

[MIT](LICENSE) -- Copyright (c) 2025-2026 mcp-tool-shop
