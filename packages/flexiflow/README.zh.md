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

**一个小型异步组件引擎，具有事件、状态机和精简的命令行界面。**

---

## 为什么选择FlexiFlow？

大多数工作流引擎都过于庞大、带有预设的观念，并且假设您需要一个有向图（DAG）执行器。
FlexiFlow并非如此。它为您提供：

- **组件**，具有声明式规则和可插拔的状态机。
- **异步事件总线**，具有优先级、过滤器以及顺序或并发的传递方式。
- **结构化日志**，内置相关性ID。
- **持久化**（开发环境使用JSON，生产环境使用SQLite），并具有快照历史记录和清理功能。
- **精简的命令行界面**，让您无需编写测试用例即可进行演示和调试。
- **配置检查**（`explain()`）功能，可在运行前进行验证。

所有这些都包含在2000行纯Python代码中。没有过多的依赖。没有魔法。

---

## 安装

```bash
pip install flexiflow
```

带有可选扩展：

```bash
pip install flexiflow[reload]   # hot-reload with watchfiles
pip install flexiflow[api]      # FastAPI integration
pip install flexiflow[dev]      # pytest + coverage
```

---

## 快速开始

### 命令行界面

```bash
# Register a component and start it
flexiflow register --config examples/config.yaml --start

# Send messages through the state machine
flexiflow handle --config examples/config.yaml confirm --content confirmed
flexiflow handle --config examples/config.yaml complete

# Hot-swap rules at runtime
flexiflow update_rules --config examples/config.yaml examples/new_rules.yaml
```

### 嵌入式（Python）

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

您还可以设置 `FLEXIFLOW_CONFIG=/path/to/config.yaml` 并从命令行界面中省略 `--config` 参数。

---

## API 概览

### 事件总线

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

**错误策略：** `continue`（记录错误并继续）或 `raise`（快速失败）。

### 状态机

内置消息类型：`start`（开始）、`confirm`（确认）、`cancel`（取消）、`complete`（完成）、`error`（错误）、`acknowledge`（确认）。

通过点分隔路径加载自定义状态：

```yaml
initial_state: "mypkg.states:MyInitialState"
```

或者注册整个状态包：

```yaml
states:
  InitialState: "mypkg.states:InitialState"
  Processing: "mypkg.states:ProcessingState"
  Complete: "mypkg.states:CompleteState"
initial_state: InitialState
```

### 可观察性事件

| Event | When | 有效载荷 |
| ------- | ------ | --------- |
| `engine.component.registered` | 组件已注册 | `{component}` |
| `component.message.received` | 接收到消息 | `{component, message}` |
| `state.changed` | 状态转换 | `{component, from_state, to_state}` |
| `event.handler.failed` | 处理程序异常（继续模式） | `{event_name, component_name, exception}` |

### 重试装饰器

```python
from flexiflow.extras.retry import retry_async, RetryConfig

@retry_async(RetryConfig(max_attempts=3, base_delay=0.2, jitter=0.2))
async def my_handler(data):
    ...
```

### 持久化

| 特性 | JSON | SQLite |
| --------- | ------ | -------- |
| 历史记录 | 覆盖 | 追加 |
| 保留 | N/A | `prune_snapshots_sqlite()` |
| 最适合 | 开发/调试 | 生产环境 |

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

### 配置检查

```python
from flexiflow import explain

result = explain("config.yaml")
if result.is_valid:
    print(result.format())
```

---

## 错误处理

所有异常都继承自 `FlexiFlowError`，并包含结构化消息（原因/为什么/解决方案/上下文）。

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

## 示例

请参阅 [`examples/embedded_app/`](examples/embedded_app/) 目录，其中包含一个完整的示例，具有自定义状态、SQLite持久化、可观察性订阅和保留清理功能。

---

## 许可证

[MIT](LICENSE) -- 版权所有 (c) 2025-2026 mcp-tool-shop
