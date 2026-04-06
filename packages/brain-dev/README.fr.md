<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

**Couche d'intelligence pour des informations précieuses aux développeurs** : analyse de couverture, génération de tests, suggestions de refactoring, audits de sécurité et informations sur l'expérience utilisateur via MCP.

## Fonctionnalités

- **9 outils d'analyse** : lacunes de couverture, analyse du comportement, génération de tests, refactoring, informations sur l'expérience utilisateur, audits de sécurité, et plus encore.
- **Génération de tests basée sur l'AST** : génération automatique de tests pytest avec des mocks qui compilent réellement.
- **Détection de vulnérabilités de sécurité** : analyse de type OWASP pour les injections SQL, les injections de commandes et les secrets codés en dur.
- **Analyse de la documentation** : recherche des docstrings manquants et suggestions de modèles.
- **Intégration native MCP** : s'intègre parfaitement à Claude et aux autres clients MCP.

## Installation

```bash
pip install dev-brain
```

Ou pour le développement :

```bash
git clone https://github.com/mcp-tool-shop-org/brain-dev.git
cd brain-dev
pip install -e ".[dev]"
```

## Démarrage rapide

```bash
# Run the MCP server
dev-brain
```

Ajoutez ceci à votre configuration Claude Desktop (`claude_desktop_config.json`) :

```json
{
  "mcpServers": {
    "dev-brain": {
      "command": "dev-brain"
    }
  }
}
```

## Outils

### Outils d'analyse

| Outil | Description |
| ------ | ------------- |
| `coverage_analyze` | Comparez les modèles observés à la couverture des tests, identifiez les lacunes. |
| `behavior_missing` | Détectez les comportements des utilisateurs qui ne sont pas gérés dans le code. |
| `refactor_suggest` | Suggérez des refactorings en fonction de la complexité, de la duplication et de la nomenclature. |
| `ux_insights` | Extrayez des informations sur l'expérience utilisateur à partir des modèles de comportement (abandons, erreurs). |

### Outils de génération

| Outil | Description |
| ------ | ------------- |
| `tests_generate` | Générez des suggestions de tests pour les lacunes de couverture. |
| `smart_tests_generate` | Génération de tests pytest basée sur l'AST avec des mocks et des fixtures appropriés. |
| `docs_generate` | Générez des modèles de documentation pour le code non documenté. |

### Outils de sécurité

| Outil | Description |
| ------ | ------------- |
| `security_audit` | Recherchez les vulnérabilités (injections SQL, injections de commandes, secrets, etc.). |

### Outils utilitaires

| Outil | Description |
| ------ | ------------- |
| `brain_stats` | Obtenez les statistiques et la configuration du serveur. |

## Exemples d'utilisation

### Audit de sécurité

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

### Génération intelligente de tests

```python
result = await client.call_tool("smart_tests_generate", {
    "file_path": "/path/to/your/module.py"
})
# Returns complete pytest file with fixtures and mocks
```

## Architecture

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

## Modèles de sécurité détectés

| Catégorie | Gravité | CWE |
| ---------- | ---------- | ----- |
| Injection SQL | Critique | CWE-89 |
| Injection de commandes | Critique | CWE-78 |
| Désérialisation non sécurisée | Critique | CWE-502 |
| Secrets codés en dur | Élevée | CWE-798 |
| Traversée de chemin | Élevée | CWE-22 |
| Cryptographie non sécurisée | Moyenne | CWE-327 |

## Développement

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

## Licence

Licence MIT — voir [LICENSE](LICENSE) pour plus de détails.

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
