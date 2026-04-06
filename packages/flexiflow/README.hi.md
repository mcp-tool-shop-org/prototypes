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

**एक छोटा एसिंक्रोनस घटक इंजन, जिसमें इवेंट, स्टेट मशीन और एक न्यूनतम कमांड-लाइन इंटरफेस (CLI) है।**

---

## फ्लेक्सीफ्लो क्यों?

अधिकांश वर्कफ़्लो इंजन भारी-भरकम होते हैं, एक विशेष दृष्टिकोण अपनाते हैं, और यह मानते हैं कि आप एक DAG (डायरेक्टेड एसाइक्लिक ग्राफ) रनर चाहते हैं।
फ्लेक्सीफ्लो इनमें से किसी भी चीज़ नहीं है। यह आपको निम्नलिखित प्रदान करता है:

- **घटक** जो घोषणात्मक नियमों और प्लगेबल स्टेट मशीनों के साथ आते हैं।
- **एक एसिंक्रोनस इवेंट बस** जिसमें प्राथमिकता, फ़िल्टर और अनुक्रमिक या समवर्ती डिलीवरी की सुविधा है।
- **संरचित लॉगिंग** जिसमें सहसंबंध आईडी शामिल हैं।
- **डेटा भंडारण** (डेवलपमेंट के लिए JSON, प्रोडक्शन के लिए SQLite) जिसमें स्नैपशॉट इतिहास और डेटा छंटाई की सुविधा है।
- **एक न्यूनतम CLI** ताकि आप बिना किसी अतिरिक्त ढांचे के प्रदर्शन कर सकें और डिबग कर सकें।
- **कॉन्फ़िगरेशन की जांच** (`explain()`) ताकि आप चलाने से पहले सत्यापन कर सकें।

यह सब 2,000 से कम लाइनों के शुद्ध पायथन कोड में उपलब्ध है। इसमें कोई भारी निर्भरता नहीं है। इसमें कोई जादू नहीं है।

---

## इंस्टॉल करें

```bash
pip install flexiflow
```

वैकल्पिक अतिरिक्त सुविधाओं के साथ:

```bash
pip install flexiflow[reload]   # hot-reload with watchfiles
pip install flexiflow[api]      # FastAPI integration
pip install flexiflow[dev]      # pytest + coverage
```

---

## शुरुआत कैसे करें

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

### एम्बेडेड (पायथन)

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

आप `FLEXIFLOW_CONFIG=/path/to/config.yaml` भी सेट कर सकते हैं और CLI से `--config` को छोड़ सकते हैं।

---

## API का अवलोकन

### इवेंट बस

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

**त्रुटि नीतियां:** `continue` (लॉग करें और आगे बढ़ें) या `raise` (तुरंत त्रुटि दिखाएं)।

### स्टेट मशीनें

अंतर्निहित संदेश प्रकार: `start`, `confirm`, `cancel`, `complete`, `error`, `acknowledge`.

डॉटेड पाथ के माध्यम से कस्टम स्टेट लोड करें:

```yaml
initial_state: "mypkg.states:MyInitialState"
```

या संपूर्ण स्टेट पैक रजिस्टर करें:

```yaml
states:
  InitialState: "mypkg.states:InitialState"
  Processing: "mypkg.states:ProcessingState"
  Complete: "mypkg.states:CompleteState"
initial_state: InitialState
```

### ऑब्जर्वेबिलिटी इवेंट

| Event | When | पेयलोड |
| ------- | ------ | --------- |
| `engine.component.registered` | घटक पंजीकृत | `{component}` |
| `component.message.received` | संदेश प्राप्त | `{component, message}` |
| `state.changed` | स्टेट में परिवर्तन | `{component, from_state, to_state}` |
| `event.handler.failed` | हैंडलर अपवाद (जारी रखने मोड) | `{event_name, component_name, exception}` |

### रीट्राय डेकोरेटर

```python
from flexiflow.extras.retry import retry_async, RetryConfig

@retry_async(RetryConfig(max_attempts=3, base_delay=0.2, jitter=0.2))
async def my_handler(data):
    ...
```

### डेटा भंडारण

| विशेषता | JSON | SQLite |
| --------- | ------ | -------- |
| इतिहास | ओवरराइट | जोड़ना |
| धारण | N/A | `prune_snapshots_sqlite()` |
| किसके लिए सबसे उपयुक्त | डेवलपमेंट/डिबगिंग | प्रोडक्शन |

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

### कॉन्फ़िगरेशन की जांच

```python
from flexiflow import explain

result = explain("config.yaml")
if result.is_valid:
    print(result.format())
```

---

## त्रुटि प्रबंधन

सभी अपवाद `FlexiFlowError` से प्राप्त होते हैं, जिनमें संरचित संदेश होते हैं (क्या / क्यों / समाधान / संदर्भ)।

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

## उदाहरण

कस्टम स्टेट, SQLite डेटा भंडारण, ऑब्जर्वेबिलिटी सदस्यता और डेटा छंटाई के साथ एक पूर्ण, कार्यशील उदाहरण देखने के लिए [`examples/embedded_app/`](examples/embedded_app/) पर जाएं।

---

## लाइसेंस

[MIT](LICENSE) -- कॉपीराइट (c) 2025-2026 mcp-tool-shop
