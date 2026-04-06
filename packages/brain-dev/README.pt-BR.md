<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
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

**Camada de inteligência para insights de desenvolvedores** — análise de cobertura, geração de testes, sugestões de refatoração, auditorias de segurança e insights de UX, tudo através do MCP.

## Recursos

- **9 Ferramentas de Análise** — Identificação de lacunas de cobertura, análise de comportamento, geração de testes, refatoração, insights de UX, auditorias de segurança e muito mais.
- **Geração de Testes Baseada em AST** — Gera automaticamente testes pytest com mocks que realmente compilam.
- **Detecção de Vulnerabilidades de Segurança** — Verificação no estilo OWASP para injeção de SQL, injeção de comandos e segredos codificados.
- **Análise de Documentação** — Encontra docstrings ausentes e sugere modelos.
- **Compatível com MCP** — Integra-se perfeitamente com o Claude e outros clientes MCP.

## Instalação

```bash
pip install dev-brain
```

Ou para desenvolvimento:

```bash
git clone https://github.com/mcp-tool-shop-org/brain-dev.git
cd brain-dev
pip install -e ".[dev]"
```

## Início Rápido

```bash
# Run the MCP server
dev-brain
```

Adicione à sua configuração do Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dev-brain": {
      "command": "dev-brain"
    }
  }
}
```

## Ferramentas

### Ferramentas de Análise

| Ferramenta | Descrição |
| ------ | ------------- |
| `coverage_analyze` | Compare padrões observados com a cobertura de testes, encontre lacunas. |
| `behavior_missing` | Identifique comportamentos do usuário que não são tratados no código. |
| `refactor_suggest` | Sugira refatorações com base na complexidade, duplicação e nomenclatura. |
| `ux_insights` | Extraia insights de UX a partir de padrões de comportamento (abandono, erros). |

### Ferramentas de Geração

| Ferramenta | Descrição |
| ------ | ------------- |
| `tests_generate` | Gere sugestões de testes para lacunas de cobertura. |
| `smart_tests_generate` | Geração de testes pytest baseada em AST com mocks e fixtures adequados. |
| `docs_generate` | Gere modelos de documentação para código não documentado. |

### Ferramentas de Segurança

| Ferramenta | Descrição |
| ------ | ------------- |
| `security_audit` | Verifique vulnerabilidades (injeção de SQL, injeção de comandos, segredos, etc.). |

### Ferramentas Utilitárias

| Ferramenta | Descrição |
| ------ | ------------- |
| `brain_stats` | Obtenha estatísticas e configurações do servidor. |

## Exemplo de Uso

### Auditoria de Segurança

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

### Geração Inteligente de Testes

```python
result = await client.call_tool("smart_tests_generate", {
    "file_path": "/path/to/your/module.py"
})
# Returns complete pytest file with fixtures and mocks
```

## Arquitetura

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

## Padrões de Segurança Detectados

| Categoria | Severidade | CWE |
| ---------- | ---------- | ----- |
| Injeção de SQL | Crítica | CWE-89 |
| Injeção de Comandos | Crítica | CWE-78 |
| Desserialização Insegura | Crítica | CWE-502 |
| Segredos Codificados | Alta | CWE-798 |
| Travessia de Caminho | Alta | CWE-22 |
| Criptografia Insegura | Média | CWE-327 |

## Desenvolvimento

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

## Licença

Licença MIT — veja [LICENSE](LICENSE) para detalhes.

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
