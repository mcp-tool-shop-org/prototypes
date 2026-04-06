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

**Un piccolo motore di componenti asincroni con eventi, macchine a stati e una CLI minimalista.**

---

## Perché FlexiFlow?

La maggior parte dei motori di workflow sono complessi, predefiniti e presuppongono che si desideri un esecutore di grafi aciclici (DAG).
FlexiFlow non è affatto così. Offre:

- **Componenti** con regole dichiarative e macchine a stati modulari.
- **Un bus di eventi asincrono** con priorità, filtri e consegna sequenziale o concorrente.
- **Logging strutturato** con ID di correlazione integrati.
- **Persistenza** (JSON per lo sviluppo, SQLite per la produzione) con cronologia degli snapshot e funzionalità di pruning.
- **Una CLI minimalista** per poter eseguire demo e debug senza scrivere codice aggiuntivo.
- **Introspezione della configurazione** (`explain()`) per la validazione prima dell'esecuzione.

Il tutto in meno di 2.000 righe di puro Python. Nessuna dipendenza pesante. Nessuna magia.

---

## Installazione

```bash
pip install flexiflow
```

Con opzioni aggiuntive:

```bash
pip install flexiflow[reload]   # hot-reload with watchfiles
pip install flexiflow[api]      # FastAPI integration
pip install flexiflow[dev]      # pytest + coverage
```

---

## Guida rapida

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

### Embedded (Python)

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

È anche possibile impostare `FLEXIFLOW_CONFIG=/path/to/config.yaml` e omettere `--config` dalla CLI.

---

## Panoramica dell'API

### Bus di eventi

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

**Politiche di errore:** `continue` (registra e continua) o `raise` (fallimento immediato).

### Macchine a stati

Tipi di messaggi predefiniti: `start`, `confirm`, `cancel`, `complete`, `error`, `acknowledge`.

Caricare stati personalizzati tramite percorsi puntati:

```yaml
initial_state: "mypkg.states:MyInitialState"
```

Oppure registrare interi pacchetti di stati:

```yaml
states:
  InitialState: "mypkg.states:InitialState"
  Processing: "mypkg.states:ProcessingState"
  Complete: "mypkg.states:CompleteState"
initial_state: InitialState
```

### Eventi di osservabilità

| Event | When | Payload |
| ------- | ------ | --------- |
| `engine.component.registered` | Componente registrato | `{component}` |
| `component.message.received` | Messaggio ricevuto | `{component, message}` |
| `state.changed` | Transizione di stato | `{component, from_state, to_state}` |
| `event.handler.failed` | Eccezione del gestore (modalità continue) | `{event_name, component_name, exception}` |

### Decoratore di retry

```python
from flexiflow.extras.retry import retry_async, RetryConfig

@retry_async(RetryConfig(max_attempts=3, base_delay=0.2, jitter=0.2))
async def my_handler(data):
    ...
```

### Persistenza

| Funzionalità | JSON | SQLite |
| --------- | ------ | -------- |
| Cronologia | Sovrascritture | Aggiunte |
| Conservazione | N/A | `prune_snapshots_sqlite()` |
| Ideale per | Sviluppo/debug | Produzione |

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

### Introspezione della configurazione

```python
from flexiflow import explain

result = explain("config.yaml")
if result.is_valid:
    print(result.format())
```

---

## Gestione degli errori

Tutte le eccezioni ereditano da `FlexiFlowError` con messaggi strutturati (Cosa / Perché / Soluzione / Contesto):

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

## Esempi

Consultare [`examples/embedded_app/`](examples/embedded_app/) per un esempio completo e funzionante con stati personalizzati, persistenza SQLite, sottoscrizioni di osservabilità e pruning della conservazione.

---

## Licenza

[MIT](LICENSE) -- Copyright (c) 2025-2026 mcp-tool-shop
