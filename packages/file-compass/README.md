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

**Semantic file search for AI workstations using HNSW vector indexing**

*Find files by describing what you're looking for, not just by name*

---

## Why File Compass?

| Problem | Solution |
|---------|----------|
| "Where's that database connection file?" | `file-compass search "database connection handling"` |
| Keyword search misses semantic matches | Vector embeddings understand meaning |
| Slow search across large codebases | HNSW index: <100ms for 10K+ files |
| Need to integrate with AI assistants | MCP server for Claude Code |

## Quick Start

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

## Features

- **Semantic Search** - Find files by describing what you're looking for
- **Quick Search** - Instant filename/symbol search (no embedding required)
- **Multi-Language AST** - Tree-sitter support for Python, JS, TS, Rust, Go
- **Result Explanations** - Understand why each result matched
- **Local Embeddings** - Uses Ollama (no API keys needed)
- **Fast Search** - HNSW indexing for sub-second queries
- **Git-Aware** - Optionally filter to git-tracked files only
- **MCP Server** - Integrates with Claude Code and other MCP clients
- **Security Hardened** - Input validation, path traversal protection

## Installation

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

### Requirements

- Python 3.10+
- [Ollama](https://ollama.com/) with `nomic-embed-text` model

## Usage

### Build the Index

```bash
# Index a directory
file-compass index -d "C:/Projects"

# Index multiple directories
file-compass index -d "C:/Projects" "D:/Code"
```

### Search Files

```bash
# Semantic search
file-compass search "database connection handling"

# Filter by file type
file-compass search "training loop" --types python

# Git-tracked files only
file-compass search "API endpoints" --git-only
```

### Quick Search (No Embeddings)

```bash
# Search by filename or symbol name
file-compass scan -d "C:/Projects"  # Build quick index
```

### Check Status

```bash
file-compass status
```

## MCP Server

File Compass includes an MCP server for integration with Claude Code and other AI assistants.

### Available Tools

| Tool | Description |
|------|-------------|
| `file_search` | Semantic search with explanations |
| `file_preview` | Code preview with syntax highlighting |
| `file_quick_search` | Fast filename/symbol search |
| `file_quick_index_build` | Build the quick search index |
| `file_actions` | Context, usages, related, history, symbols |
| `file_index_status` | Check index statistics |
| `file_index_scan` | Build or rebuild the full index |

### Claude Code Integration

Add to your `claude_desktop_config.json`:

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

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `FILE_COMPASS_DIRECTORIES` | `F:/AI` | Comma-separated directories |
| `FILE_COMPASS_OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `FILE_COMPASS_EMBEDDING_MODEL` | `nomic-embed-text` | Embedding model |

## How It Works

1. **Scanning** - Discovers files matching configured extensions, respects `.gitignore`
2. **Chunking** - Splits files into semantic pieces:
   - Python/JS/TS/Rust/Go: AST-aware via tree-sitter (functions, classes)
   - Markdown: Heading-based sections
   - JSON/YAML: Top-level keys
   - Other: Sliding window with overlap
3. **Embedding** - Generates 768-dim vectors via Ollama
4. **Indexing** - Stores vectors in HNSW index, metadata in SQLite
5. **Search** - Embeds query, finds nearest neighbors, returns ranked results

## Performance

| Metric | Value |
|--------|-------|
| Index Size | ~1KB per chunk |
| Search Latency | <100ms for 10K+ chunks |
| Quick Search | <10ms for filename/symbol |
| Embedding Speed | ~3-4s per chunk (local) |

## Architecture

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

## Security

- **Input Validation** - All MCP inputs are validated
- **Path Traversal Protection** - Files outside allowed directories blocked
- **SQL Injection Prevention** - Parameterized queries only
- **Error Sanitization** - Internal errors not exposed

## Development

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=file_compass --cov-report=term-missing

# Type checking
mypy file_compass/
```

## Related Projects

Part of [**MCP Tool Shop**](https://mcp-tool-shop.github.io/) — the Compass Suite for AI-powered development:

- [Tool Compass](https://github.com/mcp-tool-shop-org/tool-compass) - Semantic MCP tool discovery
- [Integradio](https://github.com/mcp-tool-shop-org/integradio) - Vector-embedded Gradio components
- [Backpropagate](https://github.com/mcp-tool-shop-org/backpropagate) - Headless LLM fine-tuning
- [Comfy Headless](https://github.com/mcp-tool-shop-org/comfy-headless) - ComfyUI without the complexity

## Security & Data Scope

File Compass is a **local-first** semantic file search tool and MCP server.

- **Data accessed:** Local file contents for indexing, HNSW vector index, SQLite metadata, Ollama embeddings (local inference)
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. No external API calls beyond local Ollama
- **Permissions:** File system read for indexing, write for index storage. Path traversal protection enforced

Full policy: [SECURITY.md](SECURITY.md)

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

---

## Support

- **Questions / help:** [Discussions](https://github.com/mcp-tool-shop-org/file-compass/discussions)
- **Bug reports:** [Issues](https://github.com/mcp-tool-shop-org/file-compass/issues)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Ollama](https://ollama.com/) for local LLM inference
- [hnswlib](https://github.com/nmslib/hnswlib) for fast vector search
- [nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) for embeddings
- [tree-sitter](https://tree-sitter.github.io/) for multi-language AST parsing

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
