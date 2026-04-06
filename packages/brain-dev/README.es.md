<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/brain-dev/readme.png" width="400" alt="brain-dev" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/brain-dev/actions/workflows/test.yml"><img src="https://github.com/mcp-tool-shop-org/brain-dev/actions/workflows/test.yml/badge.svg" alt="Tests" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/brain-dev"><img src="https://codecov.io/gh/mcp-tool-shop-org/brain-dev/branch/main/graph/badge.svg" alt="Codecov" /></a>
  <a href="https://pypi.org/project/dev-brain/"><img src="https://img.shields.io/pypi/v/dev-brain" alt="PyPI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/brain-dev/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

**Capa de inteligencia para obtener información valiosa para desarrolladores** — análisis de cobertura, generación de pruebas, sugerencias de refactorización, auditorías de seguridad y análisis de la experiencia de usuario a través de MCP.

## Características

- **9 Herramientas de análisis** — Detección de lagunas de cobertura, análisis de comportamiento, generación de pruebas, refactorización, análisis de la experiencia de usuario, auditorías de seguridad y más.
- **Generación de pruebas basada en AST** — Genera automáticamente pruebas pytest con mocks que realmente se compilan.
- **Detección de vulnerabilidades de seguridad** — Análisis al estilo OWASP para inyección SQL, inyección de comandos y secretos codificados.
- **Análisis de documentación** — Encuentra docstrings faltantes y sugiere plantillas.
- **Nativo de MCP** — Se integra perfectamente con Claude y otros clientes de MCP.

## Instalación

```bash
pip install dev-brain
```

O para desarrollo:

```bash
git clone https://github.com/mcp-tool-shop-org/brain-dev.git
cd brain-dev
pip install -e ".[dev]"
```

## Comienzo rápido

```bash
# Run the MCP server
dev-brain
```

Agrega lo siguiente a la configuración de tu Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dev-brain": {
      "command": "dev-brain"
    }
  }
}
```

## Herramientas

### Herramientas de análisis

| Herramienta | Descripción |
|------|-------------|
| `coverage_analyze` | Compara los patrones observados con la cobertura de las pruebas, encuentra lagunas. |
| `behavior_missing` | Identifica comportamientos de usuario que no se gestionan en el código. |
| `refactor_suggest` | Sugiere refactorizaciones basadas en la complejidad, la duplicación y la nomenclatura. |
| `ux_insights` | Extrae información sobre la experiencia de usuario a partir de los patrones de comportamiento (abandono, errores). |

### Herramientas de generación

| Herramienta | Descripción |
|------|-------------|
| `tests_generate` | Genera sugerencias de pruebas para lagunas de cobertura. |
| `smart_tests_generate` | Generación de pruebas pytest basada en AST con mocks y fixtures adecuados. |
| `docs_generate` | Genera plantillas de documentación para código sin documentación. |

### Herramientas de seguridad

| Herramienta | Descripción |
|------|-------------|
| `security_audit` | Analiza en busca de vulnerabilidades (inyección SQL, inyección de comandos, secretos, etc.). |

### Herramientas de utilidad

| Herramienta | Descripción |
|------|-------------|
| `brain_stats` | Obtén estadísticas y configuración del servidor. |

## Ejemplo de uso

### Auditoría de seguridad

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

### Generación inteligente de pruebas

```python
result = await client.call_tool("smart_tests_generate", {
    "file_path": "/path/to/your/module.py"
})
# Returns complete pytest file with fixtures and mocks
```

## Arquitectura

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

## Patrones de seguridad detectados

| Categoría | Severidad | CWE |
|----------|----------|-----|
| Inyección SQL | Crítica | CWE-89 |
| Inyección de comandos | Crítica | CWE-78 |
| Deserialización insegura | Crítica | CWE-502 |
| Secretos codificados | Alta | CWE-798 |
| Recorrido de ruta | Alta | CWE-22 |
| Criptografía insegura | Media | CWE-327 |

## Desarrollo

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

## Seguridad y alcance de datos

- **Datos accedidos:** Lee archivos de código fuente de Python de forma segura mediante `ast.parse()` para el análisis. Devuelve resultados en formato JSON con lagunas de cobertura, sugerencias de pruebas y hallazgos de seguridad. No se ejecuta ningún código.
- **Datos NO accedidos:** No se realizan escrituras de archivos, ni solicitudes de red, ni almacenamiento de datos, ni se utilizan bases de datos, ni servicios externos. Solo se realiza un análisis de solo lectura.
- **Permisos requeridos:** Acceso de lectura a los archivos de código fuente de Python en el directorio del proyecto.

Consulta [SECURITY.md](SECURITY.md) para informar sobre vulnerabilidades.

## Puntuación

| Categoría | Puntuación |
|----------|-------|
| A. Seguridad | 10/10 |
| B. Manejo de errores | 10/10 |
| C. Documentación para operadores | 10/10 |
| D. Higiene de implementación | 10/10 |
| E. Identidad (suave) | 10/10 |
| **Overall** | **50/50** |

> Evaluado con [`@mcptoolshop/shipcheck`](https://github.com/mcp-tool-shop-org/shipcheck)

## Licencia

Licencia MIT — consulta [LICENSE](LICENSE) para obtener más detalles.

---

Creado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
