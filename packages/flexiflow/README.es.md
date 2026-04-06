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

**Un pequeño motor de componentes asíncronos con eventos, máquinas de estados y una CLI minimalista.**

---

## ¿Por qué FlexiFlow?

La mayoría de los motores de flujo de trabajo son complejos, con características predefinidas y asumen que desea un ejecutor de grafos dirigidos acíclicos (DAG).
FlexiFlow no es ninguna de esas cosas. Le ofrece:

- **Componentes** con reglas declarativas y máquinas de estados modulares.
- **Un bus de eventos asíncrono** con prioridad, filtros y entrega secuencial o concurrente.
- **Registro estructurado** con identificadores de correlación integrados.
- **Persistencia** (JSON para desarrollo, SQLite para producción) con historial de instantáneas y poda.
- **Una CLI minimalista** para que pueda demostrar y depurar sin tener que escribir un entorno de pruebas.
- **Inspección de la configuración** (`explain()`) para validar antes de ejecutar.

Todo en menos de 2000 líneas de código Python puro. Sin dependencias pesadas. Sin trucos.

---

## Instalación

```bash
pip install flexiflow
```

Con extras opcionales:

```bash
pip install flexiflow[reload]   # hot-reload with watchfiles
pip install flexiflow[api]      # FastAPI integration
pip install flexiflow[dev]      # pytest + coverage
```

---

## Inicio rápido

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

### Integrado (Python)

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

También puede establecer `FLEXIFLOW_CONFIG=/path/to/config.yaml` y omitir `--config` de la CLI.

---

## Descripción general de la API

### Bus de eventos

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

**Políticas de error:** `continue` (registrar y continuar) o `raise` (fallo rápido).

### Máquinas de estados

Tipos de mensajes integrados: `start`, `confirm`, `cancel`, `complete`, `error`, `acknowledge`.

Cargue estados personalizados a través de rutas con puntos:

```yaml
initial_state: "mypkg.states:MyInitialState"
```

O registre paquetes de estados completos:

```yaml
states:
  InitialState: "mypkg.states:InitialState"
  Processing: "mypkg.states:ProcessingState"
  Complete: "mypkg.states:CompleteState"
initial_state: InitialState
```

### Eventos de observabilidad

| Event | When | Carga útil |
| ------- | ------ | --------- |
| `engine.component.registered` | Componente registrado | `{component}` |
| `component.message.received` | Mensaje recibido | `{component, message}` |
| `state.changed` | Transición de estado | `{component, from_state, to_state}` |
| `event.handler.failed` | Excepción del controlador (modo continue) | `{event_name, component_name, exception}` |

### Decorador de reintento

```python
from flexiflow.extras.retry import retry_async, RetryConfig

@retry_async(RetryConfig(max_attempts=3, base_delay=0.2, jitter=0.2))
async def my_handler(data):
    ...
```

### Persistencia

| Función | JSON | SQLite |
| --------- | ------ | -------- |
| Historial | Sobrescrituras | Anexiones |
| Retención | N/A | `prune_snapshots_sqlite()` |
| Ideal para | Desarrollo/depuración | Producción |

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

### Inspección de la configuración

```python
from flexiflow import explain

result = explain("config.yaml")
if result.is_valid:
    print(result.format())
```

---

## Manejo de errores

Todas las excepciones heredan de `FlexiFlowError` con mensajes estructurados (Qué / Por qué / Solución / Contexto):

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

## Ejemplos

Consulte [`examples/embedded_app/`](examples/embedded_app/) para obtener un ejemplo de trabajo completo con estados personalizados, persistencia de SQLite, suscripciones de observabilidad y poda de retención.

---

## Licencia

[MIT](LICENSE) -- Copyright (c) 2025-2026 mcp-tool-shop
