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

**Um pequeno motor de componentes assíncronos com eventos, máquinas de estados e uma CLI minimalista.**

---

## Por que FlexiFlow?

A maioria dos motores de fluxo de trabalho são complexos, com opiniões pré-definidas e assumem que você deseja um executor de grafos direcionados acíclicos (DAG).
FlexiFlow não é nada disso. Ele oferece:

- **Componentes** com regras declarativas e máquinas de estados personalizáveis.
- **Um barramento de eventos assíncrono** com prioridade, filtros e entrega sequencial ou concorrente.
- **Registro estruturado** com IDs de correlação integrados.
- **Persistência** (JSON para desenvolvimento, SQLite para produção) com histórico de snapshots e remoção de dados antigos.
- **Uma CLI minimalista** para que você possa demonstrar e depurar sem escrever um código de teste.
- **Inspeção da configuração** (`explain()`) para validar antes de executar.

Tudo isso em menos de 2.000 linhas de código Python puro. Sem dependências pesadas. Sem "mágica".

---

## Instalação

```bash
pip install flexiflow
```

Com extras opcionais:

```bash
pip install flexiflow[reload]   # hot-reload with watchfiles
pip install flexiflow[api]      # FastAPI integration
pip install flexiflow[dev]      # pytest + coverage
```

---

## Início Rápido

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

### Embutido (Python)

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

Você também pode definir `FLEXIFLOW_CONFIG=/path/to/config.yaml` e omitir `--config` da CLI.

---

## Visão Geral da API

### Barramento de Eventos

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

**Políticas de erro:** `continue` (registra e continua) ou `raise` (falha rápida).

### Máquinas de Estados

Tipos de mensagens integrados: `start`, `confirm`, `cancel`, `complete`, `error`, `acknowledge`.

Carregue estados personalizados através de caminhos com separadores:

```yaml
initial_state: "mypkg.states:MyInitialState"
```

Ou registre pacotes de estados inteiros:

```yaml
states:
  InitialState: "mypkg.states:InitialState"
  Processing: "mypkg.states:ProcessingState"
  Complete: "mypkg.states:CompleteState"
initial_state: InitialState
```

### Eventos de Observabilidade

| Event | When | Payload |
| ------- | ------ | --------- |
| `engine.component.registered` | Componente registrado | `{component}` |
| `component.message.received` | Mensagem recebida | `{component, message}` |
| `state.changed` | Transição de estado | `{component, from_state, to_state}` |
| `event.handler.failed` | Exceção do manipulador (modo continue) | `{event_name, component_name, exception}` |

### Decorador de Repetição

```python
from flexiflow.extras.retry import retry_async, RetryConfig

@retry_async(RetryConfig(max_attempts=3, base_delay=0.2, jitter=0.2))
async def my_handler(data):
    ...
```

### Persistência

| Recurso | JSON | SQLite |
| --------- | ------ | -------- |
| Histórico | Substituições | Adições |
| Retenção | N/A | `prune_snapshots_sqlite()` |
| Ideal para | Desenvolvimento/depuração | Produção |

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

### Inspeção da Configuração

```python
from flexiflow import explain

result = explain("config.yaml")
if result.is_valid:
    print(result.format())
```

---

## Tratamento de Erros

Todas as exceções herdam de `FlexiFlowError` com mensagens estruturadas (O que / Por que / Solução / Contexto):

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

## Exemplos

Veja [`examples/embedded_app/`](examples/embedded_app/) para um exemplo completo e funcional com estados personalizados, persistência SQLite, assinaturas de observabilidade e remoção de dados antigos.

---

## Licença

[MIT](LICENSE) -- Copyright (c) 2025-2026 mcp-tool-shop
