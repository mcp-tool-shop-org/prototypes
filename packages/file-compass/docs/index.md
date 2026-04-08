# File Compass

**Semantic file search for AI workstations using HNSW vector indexing**

File Compass lets you find files by describing what you're looking for, not just by name. It uses local embeddings via Ollama and HNSW vector indexing to deliver sub-second semantic search across large codebases.

## Features

- **Semantic Search** -- Find files by meaning, not just keywords
- **Quick Search** -- Instant filename and symbol lookup (no embedding required)
- **Multi-Language AST** -- Tree-sitter support for Python, JS, TS, Rust, Go
- **Result Explanations** -- Understand why each result matched
- **Local Embeddings** -- Uses Ollama with nomic-embed-text (no API keys)
- **MCP Server** -- Integrates with Claude Code and other MCP clients
- **Security Hardened** -- Input validation, path traversal protection, parameterized queries

## Quick Start

```bash
pip install file-compass

# Pull the embedding model
ollama pull nomic-embed-text

# Index a directory
file-compass index -d "/path/to/code"

# Search semantically
file-compass search "authentication middleware"
```

## MCP Server

File Compass includes an MCP server for integration with AI assistants. Add it to your MCP client configuration:

```json
{
  "mcpServers": {
    "file-compass": {
      "command": "python",
      "args": ["-m", "file_compass.gateway"]
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `file_search` | Semantic search with explanations |
| `file_preview` | Code preview with syntax highlighting |
| `file_quick_search` | Fast filename/symbol search |
| `file_actions` | Context, usages, related, history, symbols |
| `file_index_status` | Check index statistics |
| `file_index_scan` | Build or rebuild the full index |

## Requirements

- Python 3.10+
- [Ollama](https://ollama.com/) with `nomic-embed-text` model

## Links

- [Source Code](https://github.com/mcp-tool-shop-org/file-compass)
- [PyPI Package](https://pypi.org/project/file-compass/)
- [Issues](https://github.com/mcp-tool-shop-org/file-compass/issues)
- [MCP Tool Shop](https://mcp-tool-shop.github.io/)
