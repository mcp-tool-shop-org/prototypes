<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/brain-dev/readme.png" width="400" alt="brain-dev" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/brain-dev/actions/workflows/test.yml"><img src="https://github.com/mcp-tool-shop-org/brain-dev/actions/workflows/test.yml/badge.svg" alt="Tests" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/brain-dev/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
  <a href="https://pypi.org/project/dev-brain/"><img src="https://img.shields.io/pypi/v/dev-brain" alt="PyPI" /></a>
  <a href="https://www.python.org/downloads/"><img src="https://img.shields.io/badge/python-3.11+-blue.svg" alt="Python 3.11+" /></a>
</p>

**Strato di intelligenza per fornire informazioni agli sviluppatori** — analisi della copertura, generazione di test, suggerimenti per il refactoring, audit di sicurezza e informazioni sull'esperienza utente tramite MCP.

## Funzionalità

- **9 strumenti di analisi** — lacune nella copertura, analisi del comportamento, generazione di test, refactoring, informazioni sull'esperienza utente, audit di sicurezza e altro ancora.
- **Generazione di test basata su AST** — genera automaticamente test pytest con mock che vengono effettivamente compilati.
- **Rilevamento di vulnerabilità di sicurezza** — scansione in stile OWASP per injection SQL, injection di comandi e segreti hardcoded.
- **Analisi della documentazione** — trova stringhe di documentazione mancanti e suggerisce modelli.
- **MCP nativo** — si integra perfettamente con Claude e altri client MCP.

## Installazione

```bash
pip install dev-brain
```

Oppure, per lo sviluppo:

```bash
git clone https://github.com/mcp-tool-shop-org/brain-dev.git
cd brain-dev
pip install -e ".[dev]"
```

## Guida rapida

```bash
# Run the MCP server
dev-brain
```

Aggiungi alla configurazione di Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dev-brain": {
      "command": "dev-brain"
    }
  }
}
```

## Strumenti

### Strumenti di analisi

| Strumento | Descrizione |
| ------ | ------------- |
| `coverage_analyze` | Confronta i modelli osservati con la copertura dei test, trova le lacune. |
| `behavior_missing` | Individua i comportamenti degli utenti non gestiti nel codice. |
| `refactor_suggest` | Suggerisci il refactoring in base alla complessità, alla duplicazione e alla denominazione. |
| `ux_insights` | Estrai informazioni sull'esperienza utente dai modelli di comportamento (abbandoni, errori). |

### Strumenti di generazione

| Strumento | Descrizione |
| ------ | ------------- |
| `tests_generate` | Genera suggerimenti di test per le lacune nella copertura. |
| `smart_tests_generate` | Generazione di test pytest basata su AST con mock e fixture appropriati. |
| `docs_generate` | Genera modelli di documentazione per il codice non documentato. |

### Strumenti di sicurezza

| Strumento | Descrizione |
| ------ | ------------- |
| `security_audit` | Scansiona alla ricerca di vulnerabilità (injection SQL, injection di comandi, segreti, ecc.). |

### Strumenti di utilità

| Strumento | Descrizione |
| ------ | ------------- |
| `brain_stats` | Ottieni statistiche e configurazione del server. |

## Esempio di utilizzo

### Audit di sicurezza

```python
# Via MCP client
result = await client.call_tool("security_audit", {
    "symbols": [
        {
            "name": "execute_query",
            "file_path": "db.py",
            "line": 10,
            "source_code": "cursor.execute(f\"SELECT * FROM users WHERE id = {user_id}\")"
        }
    ],
    "severity_threshold": "medium"
})
# Returns: SQL injection vulnerability detected (CWE-89)
```

### Generazione intelligente di test

```python
result = await client.call_tool("smart_tests_generate", {
    "file_path": "/path/to/your/module.py"
})
# Returns complete pytest file with fixtures and mocks
```

## Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                      DEV BRAIN MCP SERVER                    │
├─────────────────────────────────────────────────────────────┤
│  Analyzers                                                   │
│  ├─ CoverageAnalyzer    (test gaps)                         │
│  ├─ BehaviorAnalyzer    (unhandled flows)                   │
│  ├─ RefactorAnalyzer    (complexity, naming)                │
│  ├─ UXAnalyzer          (dropoff, errors)                   │
│  ├─ DocsAnalyzer        (missing docs)                      │
│  └─ SecurityAnalyzer    (vulnerabilities)                   │
├─────────────────────────────────────────────────────────────┤
│  Generators                                                  │
│  ├─ TestGenerator       (skeleton tests)                    │
│  └─ SmartTestGenerator  (AST-based pytest)                  │
└─────────────────────────────────────────────────────────────┘
```

## Modelli di sicurezza rilevati

| Categoria | Gravità | CWE |
| ---------- | ---------- | ----- |
| SQL Injection | Critica | CWE-89 |
| Command Injection | Critica | CWE-78 |
| Deserializzazione non sicura | Critica | CWE-502 |
| Segreti hardcoded | Alta | CWE-798 |
| Path Traversal | Alta | CWE-22 |
| Crittografia non sicura | Media | CWE-327 |

## Sviluppo

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=dev_brain --cov-report=html

# Type checking (optional)
mypy dev_brain
```

## Licenza

Licenza MIT — consulta [LICENSE](LICENSE) per i dettagli.

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
