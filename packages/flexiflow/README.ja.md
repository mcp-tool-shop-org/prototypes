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

**イベント、ステートマシン、そして最小限のCLIを備えた、軽量な非同期コンポーネントエンジンです。**

---

## なぜFlexiFlowを使うのか？

多くのワークフローエンジンは、機能が過剰で、特定の考え方に基づいており、DAG（有向非巡回グラフ）の実行を前提としています。
FlexiFlowは、そのようなものではありません。FlexiFlowは、以下の機能を提供します。

- **コンポーネント:** 宣言的なルールと、プラグイン可能なステートマシン
- **非同期イベントバス:** 優先順位、フィルタ、およびシーケンシャルまたは並列配信
- **構造化されたロギング:** 相関IDを組み込み
- **永続化:** 開発にはJSON、本番環境にはSQLiteを使用。スナップショット履歴と不要データの削除機能
- **最小限のCLI:** ハーネスを作成せずにデモやデバッグが可能
- **設定の検証機能 (`explain()`):** 実行前に設定を検証

すべて、2000行以下の純粋なPythonで記述されています。重い依存関係はありません。魔法のような機能もありません。

---

## インストール

```bash
pip install flexiflow
```

オプションの追加機能あり。

```bash
pip install flexiflow[reload]   # hot-reload with watchfiles
pip install flexiflow[api]      # FastAPI integration
pip install flexiflow[dev]      # pytest + coverage
```

---

## クイックスタート

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

### 組み込み (Python)

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

`FLEXIFLOW_CONFIG=/path/to/config.yaml` を設定し、CLIからの `--config` オプションを省略することもできます。

---

## APIの概要

### イベントバス

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

**エラーポリシー:** `continue` (ログに記録して続行) または `raise` (エラーを発生させてすぐに停止)。

### ステートマシン

組み込みメッセージタイプ: `start` (開始), `confirm` (確認), `cancel` (キャンセル), `complete` (完了), `error` (エラー), `acknowledge` (確認)。

ドット区切りのパスでカスタムステートをロードできます。

```yaml
initial_state: "mypkg.states:MyInitialState"
```

または、ステートパック全体を登録できます。

```yaml
states:
  InitialState: "mypkg.states:InitialState"
  Processing: "mypkg.states:ProcessingState"
  Complete: "mypkg.states:CompleteState"
initial_state: InitialState
```

### 監視イベント

| Event | When | ペイロード |
| ------- | ------ | --------- |
| `engine.component.registered` | コンポーネント登録 | `{component}` |
| `component.message.received` | メッセージ受信 | `{component, message}` |
| `state.changed` | ステート遷移 | `{component, from_state, to_state}` |
| `event.handler.failed` | ハンドラ例外 (continueモード) | `{event_name, component_name, exception}` |

### リトライデコレータ

```python
from flexiflow.extras.retry import retry_async, RetryConfig

@retry_async(RetryConfig(max_attempts=3, base_delay=0.2, jitter=0.2))
async def my_handler(data):
    ...
```

### 永続化

| 機能 | JSON | SQLite |
| --------- | ------ | -------- |
| 履歴 | 上書き | 追記 |
| 保持期間 | N/A | `prune_snapshots_sqlite()` |
| 最適な用途 | 開発/デバッグ | 本番環境 |

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

### 設定の検証

```python
from flexiflow import explain

result = explain("config.yaml")
if result.is_valid:
    print(result.format())
```

---

## エラー処理

すべての例外は `FlexiFlowError` を継承し、構造化されたメッセージ（何が起きたか / なぜ起きたか / 解決策 / コンテキスト）を含みます。

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

## 例

カスタムステート、SQLite永続化、監視サブスクリプション、および不要データの削除機能を含む、完全な動作例については、[`examples/embedded_app/`](examples/embedded_app/) を参照してください。

---

## ライセンス

[MIT](LICENSE) -- Copyright (c) 2025-2026 mcp-tool-shop
