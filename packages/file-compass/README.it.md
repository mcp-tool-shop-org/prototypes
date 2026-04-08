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

**Ricerca semantica di file per workstation AI utilizzando l'indicizzazione vettoriale HNSW**

*Trova i file descrivendo cosa stai cercando, non solo per nome.*

---

## Perché File Compass?

| Problema | Soluzione |
| --------- | ---------- |
| "Dove si trova il file di connessione al database?" | `file-compass search "database connection handling"` |
| La ricerca per parole chiave non trova corrispondenze semantiche. | Gli embedding vettoriali comprendono il significato. |
| Ricerca lenta in grandi basi di codice. | Indice HNSW: meno di 100 ms per oltre 10.000 file. |
| È necessario integrarsi con gli assistenti AI. | Server MCP per Claude Code. |

## Guida rapida

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

## Funzionalità

- **Ricerca semantica** - Trova i file descrivendo cosa stai cercando.
- **Ricerca rapida** - Ricerca istantanea per nome file/simbolo (non sono necessari embedding).
- **AST multi-linguaggio** - Supporto per Tree-sitter per Python, JS, TS, Rust, Go.
- **Spiegazioni dei risultati** - Comprendi perché ogni risultato corrisponde.
- **Embedding locali** - Utilizza Ollama (non sono necessarie chiavi API).
- **Ricerca veloce** - Indicizzazione HNSW per query in frazioni di secondo.
- **Consapevolezza di Git** - Facoltativamente, filtra solo i file tracciati da Git.
- **Server MCP** - Si integra con Claude Code e altri client MCP.
- **Sicurezza avanzata** - Validazione dell'input, protezione contro l'attraversamento di percorsi.

## Installazione

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

### Requisiti

- Python 3.10+
- [Ollama](https://ollama.com/) con il modello `nomic-embed-text`.

## Utilizzo

### Crea l'indice

```bash
# Index a directory
file-compass index -d "C:/Projects"

# Index multiple directories
file-compass index -d "C:/Projects" "D:/Code"
```

### Cerca i file

```bash
# Semantic search
file-compass search "database connection handling"

# Filter by file type
file-compass search "training loop" --types python

# Git-tracked files only
file-compass search "API endpoints" --git-only
```

### Ricerca rapida (senza embedding)

```bash
# Search by filename or symbol name
file-compass scan -d "C:/Projects"  # Build quick index
```

### Controlla lo stato

```bash
file-compass status
```

## Server MCP

File Compass include un server MCP per l'integrazione con Claude Code e altri assistenti AI.

### Strumenti disponibili

| Tool | Descrizione |
| ------ | ------------- |
| `file_search` | Ricerca semantica con spiegazioni. |
| `file_preview` | Anteprima del codice con evidenziazione della sintassi. |
| `file_quick_search` | Ricerca rapida per nome file/simbolo. |
| `file_quick_index_build` | Crea l'indice per la ricerca rapida. |
| `file_actions` | Contesto, utilizzi, correlati, cronologia, simboli. |
| `file_index_status` | Controlla le statistiche dell'indice. |
| `file_index_scan` | Crea o ricostruisci l'indice completo. |

### Integrazione con Claude Code

Aggiungi al tuo `claude_desktop_config.json`:

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

## Configurazione

| Variabile | Valore predefinito | Descrizione |
| ---------- | --------- | ------------- |
| `FILE_COMPASS_DIRECTORIES` | `F:/AI` | Directory separate da virgola. |
| `FILE_COMPASS_OLLAMA_URL` | `http://localhost:11434` | URL del server Ollama. |
| `FILE_COMPASS_EMBEDDING_MODEL` | `nomic-embed-text` | Modello di embedding. |

## Come funziona

1. **Scansione** - Scopre i file che corrispondono alle estensioni configurate, rispetta `.gitignore`.
2. **Chunking** - Divide i file in segmenti semantici:
- Python/JS/TS/Rust/Go: consapevole dell'AST tramite tree-sitter (funzioni, classi).
- Markdown: sezioni basate su intestazioni.
- JSON/YAML: chiavi di livello superiore.
- Altri: finestra scorrevole con sovrapposizione.
3. **Embedding** - Genera vettori a 768 dimensioni tramite Ollama.
4. **Indicizzazione** - Memorizza i vettori nell'indice HNSW, i metadati in SQLite.
5. **Ricerca** - Incorpora la query, trova i vicini più prossimi, restituisce i risultati classificati.

## Prestazioni

| Metrica | Value |
| -------- | ------- |
| Dimensione dell'indice | ~1 KB per segmento. |
| Latenza della ricerca | Meno di 100 ms per oltre 10.000 segmenti. |
| Ricerca rapida | Meno di 10 ms per nome file/simbolo. |
| Velocità di embedding | ~3-4 secondi per segmento (locale). |

## Architettura

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

## Sicurezza

- **Validazione degli input:** Tutti gli input di MCP sono validati.
- **Protezione contro l'accesso non autorizzato ai file:** I file al di fuori delle directory consentite sono bloccati.
- **Prevenzione di attacchi SQL injection:** Vengono utilizzate solo query parametrizzate.
- **Sanificazione degli errori:** Gli errori interni non vengono esposti.

## Sviluppo

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=file_compass --cov-report=term-missing

# Type checking
mypy file_compass/
```

## Progetti correlati

Parte di [**MCP Tool Shop**](https://mcp-tool-shop.github.io/) — la suite Compass per lo sviluppo potenziato dall'intelligenza artificiale:

- [Tool Compass](https://github.com/mcp-tool-shop-org/tool-compass) - Scoperta semantica di strumenti MCP.
- [Integradio](https://github.com/mcp-tool-shop-org/integradio) - Componenti Gradio con incorporamenti vettoriali.
- [Backpropagate](https://github.com/mcp-tool-shop-org/backpropagate) - Fine-tuning di modelli linguistici di grandi dimensioni (LLM) senza interfaccia grafica.
- [Comfy Headless](https://github.com/mcp-tool-shop-org/comfy-headless) - ComfyUI senza la complessità.

## Supporto

- **Domande / assistenza:** [Discussioni](https://github.com/mcp-tool-shop-org/file-compass/discussions)
- **Segnalazione di bug:** [Problemi](https://github.com/mcp-tool-shop-org/file-compass/issues)

## Licenza

Licenza MIT - vedere [LICENSE](LICENSE) per i dettagli.

## Ringraziamenti

- [Ollama](https://ollama.com/) per l'inferenza locale di modelli linguistici.
- [hnswlib](https://github.com/nmslib/hnswlib) per la ricerca vettoriale rapida.
- [nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) per gli incorporamenti.
- [tree-sitter](https://tree-sitter.github.io/) per l'analisi sintattica multi-linguaggio (AST).
