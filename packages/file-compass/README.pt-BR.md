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

**Pesquisa semântica de arquivos para estações de trabalho de IA usando indexação vetorial HNSW**

*Encontre arquivos descrevendo o que você está procurando, não apenas pelo nome.*

---

## Por que File Compass?

| Problema | Solução |
| --------- | ---------- |
| "Onde está o arquivo de conexão com o banco de dados?" | `file-compass search "database connection handling"` |
| A pesquisa por palavras-chave não encontra correspondências semânticas. | Incorporações vetoriais entendem o significado. |
| Pesquisa lenta em grandes bases de código. | Índice HNSW: <100ms para 10.000+ arquivos. |
| Necessidade de integração com assistentes de IA. | Servidor MCP para Claude Code. |

## Início Rápido

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

## Recursos

- **Pesquisa Semântica** - Encontre arquivos descrevendo o que você está procurando.
- **Pesquisa Rápida** - Pesquisa instantânea por nome de arquivo/símbolo (sem incorporação necessária).
- **AST Multi-Linguagem** - Suporte Tree-sitter para Python, JS, TS, Rust, Go.
- **Explicações dos Resultados** - Entenda por que cada resultado correspondeu.
- **Incorporações Locais** - Usa Ollama (não são necessárias chaves de API).
- **Pesquisa Rápida** - Indexação HNSW para consultas em frações de segundo.
- **Consciente do Git** - Opcionalmente, filtre apenas para arquivos rastreados pelo Git.
- **Servidor MCP** - Integra-se com Claude Code e outros clientes MCP.
- **Segurança Reforçada** - Validação de entrada, proteção contra travessia de caminho.

## Instalação

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
- [Ollama](https://ollama.com/) com o modelo `nomic-embed-text`.

## Uso

### Construir o Índice

```bash
# Index a directory
file-compass index -d "C:/Projects"

# Index multiple directories
file-compass index -d "C:/Projects" "D:/Code"
```

### Pesquisar Arquivos

```bash
# Semantic search
file-compass search "database connection handling"

# Filter by file type
file-compass search "training loop" --types python

# Git-tracked files only
file-compass search "API endpoints" --git-only
```

### Pesquisa Rápida (Sem Incorporações)

```bash
# Search by filename or symbol name
file-compass scan -d "C:/Projects"  # Build quick index
```

### Verificar Status

```bash
file-compass status
```

## Servidor MCP

File Compass inclui um servidor MCP para integração com Claude Code e outros assistentes de IA.

### Ferramentas Disponíveis

| Tool | Descrição |
| ------ | ------------- |
| `file_search` | Pesquisa semântica com explicações. |
| `file_preview` | Visualização de código com destaque de sintaxe. |
| `file_quick_search` | Pesquisa rápida por nome de arquivo/símbolo. |
| `file_quick_index_build` | Construir o índice de pesquisa rápida. |
| `file_actions` | Contexto, usos, relacionados, histórico, símbolos. |
| `file_index_status` | Verificar estatísticas do índice. |
| `file_index_scan` | Construir ou reconstruir o índice completo. |

### Integração com Claude Code

Adicione ao seu `claude_desktop_config.json`:

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

## Configuração

| Variável | Padrão | Descrição |
| ---------- | --------- | ------------- |
| `FILE_COMPASS_DIRECTORIES` | `F:/AI` | Diretórios separados por vírgula. |
| `FILE_COMPASS_OLLAMA_URL` | `http://localhost:11434` | URL do servidor Ollama. |
| `FILE_COMPASS_EMBEDDING_MODEL` | `nomic-embed-text` | Modelo de incorporação. |

## Como Funciona

1. **Varredura** - Descobre arquivos que correspondem às extensões configuradas, respeita `.gitignore`.
2. **Fragmentação** - Divide os arquivos em partes semânticas:
- Python/JS/TS/Rust/Go: Consciente da AST via tree-sitter (funções, classes).
- Markdown: Seções baseadas em cabeçalhos.
- JSON/YAML: Chaves de nível superior.
- Outros: Janela deslizante com sobreposição.
3. **Incorporação** - Gera vetores de 768 dimensões via Ollama.
4. **Indexação** - Armazena vetores no índice HNSW, metadados no SQLite.
5. **Pesquisa** - Incorpora a consulta, encontra os vizinhos mais próximos, retorna resultados classificados.

## Desempenho

| Métrica | Value |
| -------- | ------- |
| Tamanho do Índice | ~1KB por fragmento. |
| Latência da Pesquisa | <100ms para 10.000+ fragmentos. |
| Pesquisa Rápida | <10ms para nome de arquivo/símbolo. |
| Velocidade de Incorporação | ~3-4s por fragmento (local). |

## Arquitetura

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

## Segurança

- **Validação de Entrada** - Todas as entradas do MCP são validadas.
- **Proteção contra Acesso Indevido a Arquivos** - Arquivos fora dos diretórios permitidos são bloqueados.
- **Prevenção de Injeção de SQL** - Apenas consultas parametrizadas são permitidas.
- **Sanitização de Erros** - Erros internos não são expostos.

## Desenvolvimento

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=file_compass --cov-report=term-missing

# Type checking
mypy file_compass/
```

## Projetos Relacionados

Parte do [**MCP Tool Shop**](https://mcp-tool-shop.github.io/) — o Compass Suite para desenvolvimento com inteligência artificial:

- [Tool Compass](https://github.com/mcp-tool-shop-org/tool-compass) - Descoberta semântica de ferramentas MCP.
- [Integradio](https://github.com/mcp-tool-shop-org/integradio) - Componentes Gradio com incorporação vetorial.
- [Backpropagate](https://github.com/mcp-tool-shop-org/backpropagate) - Ajuste fino de LLMs sem interface gráfica.
- [Comfy Headless](https://github.com/mcp-tool-shop-org/comfy-headless) - ComfyUI sem a complexidade.

## Suporte

- **Dúvidas / Ajuda:** [Discussões](https://github.com/mcp-tool-shop-org/file-compass/discussions)
- **Relatórios de Bugs:** [Problemas](https://github.com/mcp-tool-shop-org/file-compass/issues)

## Licença

Licença MIT - veja [LICENSE](LICENSE) para detalhes.

## Agradecimentos

- [Ollama](https://ollama.com/) para inferência local de LLMs.
- [hnswlib](https://github.com/nmslib/hnswlib) para busca vetorial rápida.
- [nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) para incorporações.
- [tree-sitter](https://tree-sitter.github.io/) para análise sintática multi-linguagem.
