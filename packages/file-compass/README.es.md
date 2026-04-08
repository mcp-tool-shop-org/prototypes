<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/file-compass/readme.png" alt="File Compass" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/file-compass/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/file-compass/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/file-compass/"><img src="https://img.shields.io/pypi/v/file-compass" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/file-compass/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Búsqueda semántica de archivos para estaciones de trabajo de IA utilizando indexación vectorial HNSW**

*Encuentra archivos describiendo lo que buscas, no solo por nombre.*

---

## ¿Por qué File Compass?

| Problema | Solución |
| --------- | ---------- |
| "¿Dónde está ese archivo de conexión a la base de datos?" | `file-compass search "database connection handling"` |
| La búsqueda por palabras clave no encuentra coincidencias semánticas. | Los incrustados vectoriales comprenden el significado. |
| Búsqueda lenta en grandes bases de código. | Índice HNSW: <100 ms para 10.000+ archivos. |
| Necesidad de integrarse con asistentes de IA. | Servidor MCP para Claude Code. |

## Comienzo rápido

```bash
# Install
git clone https://github.com/mcp-tool-shop-org/file-compass.git
cd file-compass && pip install -e .

# Pull embedding model
ollama pull nomic-embed-text

# Index your code
file-compass index -d "C:/Projects"

# Search semantically
file-compass search "authentication middleware"
```

## Características

- **Búsqueda semántica:** Encuentra archivos describiendo lo que buscas.
- **Búsqueda rápida:** Búsqueda instantánea por nombre de archivo/símbolo (no se requieren incrustaciones).
- **AST multilingüe:** Soporte de Tree-sitter para Python, JS, TS, Rust, Go.
- **Explicaciones de los resultados:** Comprende por qué cada resultado coincidió.
- **Incrustaciones locales:** Utiliza Ollama (no se necesitan claves de API).
- **Búsqueda rápida:** Indexación HNSW para consultas en fracciones de segundo.
- **Conciencia de Git:** Opcionalmente, filtra solo los archivos rastreados por Git.
- **Servidor MCP:** Se integra con Claude Code y otros clientes MCP.
- **Seguridad reforzada:** Validación de entrada, protección contra recorrido de rutas.

## Instalación

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/file-compass.git
cd file-compass

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -e .

# Pull the embedding model
ollama pull nomic-embed-text
```

### Requisitos

- Python 3.10+
- [Ollama](https://ollama.com/) con el modelo `nomic-embed-text`.

## Uso

### Crear el índice

```bash
# Index a directory
file-compass index -d "C:/Projects"

# Index multiple directories
file-compass index -d "C:/Projects" "D:/Code"
```

### Buscar archivos

```bash
# Semantic search
file-compass search "database connection handling"

# Filter by file type
file-compass search "training loop" --types python

# Git-tracked files only
file-compass search "API endpoints" --git-only
```

### Búsqueda rápida (sin incrustaciones)

```bash
# Search by filename or symbol name
file-compass scan -d "C:/Projects"  # Build quick index
```

### Comprobar el estado

```bash
file-compass status
```

## Servidor MCP

File Compass incluye un servidor MCP para la integración con Claude Code y otros asistentes de IA.

### Herramientas disponibles

| Tool | Descripción |
| ------ | ------------- |
| `file_search` | Búsqueda semántica con explicaciones. |
| `file_preview` | Vista previa del código con resaltado de sintaxis. |
| `file_quick_search` | Búsqueda rápida por nombre de archivo/símbolo. |
| `file_quick_index_build` | Crear el índice de búsqueda rápida. |
| `file_actions` | Contexto, usos, relacionados, historial, símbolos. |
| `file_index_status` | Comprobar las estadísticas del índice. |
| `file_index_scan` | Crear o reconstruir el índice completo. |

### Integración con Claude Code

Añadir a tu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "file-compass": {
      "command": "python",
      "args": ["-m", "file_compass.gateway"],
      "cwd": "C:/path/to/file-compass"
    }
  }
}
```

## Configuración

| Variable | Valor predeterminado | Descripción |
| ---------- | --------- | ------------- |
| `FILE_COMPASS_DIRECTORIES` | `F:/AI` | Directorios separados por comas. |
| `FILE_COMPASS_OLLAMA_URL` | `http://localhost:11434` | URL del servidor Ollama. |
| `FILE_COMPASS_EMBEDDING_MODEL` | `nomic-embed-text` | Modelo de incrustación. |

## Cómo funciona

1. **Escaneo:** Descubre archivos que coincidan con las extensiones configuradas, respeta `.gitignore`.
2. **Fragmentación:** Divide los archivos en fragmentos semánticos:
- Python/JS/TS/Rust/Go: Conciencia del AST a través de tree-sitter (funciones, clases).
- Markdown: Secciones basadas en encabezados.
- JSON/YAML: Claves de nivel superior.
- Otros: Ventana deslizante con superposición.
3. **Incrustación:** Genera vectores de 768 dimensiones a través de Ollama.
4. **Indexación:** Almacena los vectores en el índice HNSW, los metadatos en SQLite.
5. **Búsqueda:** Incrusta la consulta, encuentra los vecinos más cercanos y devuelve los resultados clasificados.

## Rendimiento

| Métrica | Value |
| -------- | ------- |
| Tamaño del índice | ~1 KB por fragmento. |
| Latencia de búsqueda | <100 ms para 10.000+ fragmentos. |
| Búsqueda rápida | <10 ms para nombre de archivo/símbolo. |
| Velocidad de incrustación | ~3-4 segundos por fragmento (local). |

## Arquitectura

```
file-compass/
├── file_compass/
│   ├── __init__.py      # Package init
│   ├── config.py        # Configuration
│   ├── embedder.py      # Ollama client with retry
│   ├── scanner.py       # File discovery
│   ├── chunker.py       # Multi-language AST chunking
│   ├── indexer.py       # HNSW + SQLite index
│   ├── quick_index.py   # Fast filename/symbol search
│   ├── explainer.py     # Result explanations
│   ├── merkle.py        # Incremental updates
│   ├── gateway.py       # MCP server
│   └── cli.py           # CLI
├── tests/               # 298 tests, 91% coverage
├── pyproject.toml
└── LICENSE
```

## Seguridad

- **Validación de entradas:** Todas las entradas de MCP son validadas.
- **Protección contra la manipulación de rutas:** Se bloquea el acceso a archivos que se encuentran fuera de los directorios permitidos.
- **Prevención de inyección SQL:** Solo se utilizan consultas parametrizadas.
- **Saneamiento de errores:** Los errores internos no se muestran.

## Desarrollo

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=file_compass --cov-report=term-missing

# Type checking
mypy file_compass/
```

## Proyectos relacionados

Parte de [**MCP Tool Shop**](https://mcp-tool-shop.github.io/) — el conjunto Compass para el desarrollo impulsado por IA:

- [Tool Compass](https://github.com/mcp-tool-shop-org/tool-compass) - Descubrimiento semántico de herramientas MCP.
- [Integradio](https://github.com/mcp-tool-shop-org/integradio) - Componentes Gradio con incrustaciones vectoriales.
- [Backpropagate](https://github.com/mcp-tool-shop-org/backpropagate) - Ajuste fino de LLM sin interfaz gráfica.
- [Comfy Headless](https://github.com/mcp-tool-shop-org/comfy-headless) - ComfyUI sin la complejidad.

## Soporte

- **Preguntas / ayuda:** [Discusiones](https://github.com/mcp-tool-shop-org/file-compass/discussions)
- **Informes de errores:** [Problemas](https://github.com/mcp-tool-shop-org/file-compass/issues)

## Licencia

Licencia MIT: consulte [LICENSE](LICENSE) para obtener más detalles.

## Agradecimientos

- [Ollama](https://ollama.com/) para la inferencia local de LLM.
- [hnswlib](https://github.com/nmslib/hnswlib) para la búsqueda rápida de vectores.
- [nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) para las incrustaciones.
- [tree-sitter](https://tree-sitter.github.io/) para el análisis sintáctico multi-idioma.
