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

**Recherche de fichiers sémantique pour stations de travail d'IA utilisant l'indexation vectorielle HNSW**

*Trouvez des fichiers en décrivant ce que vous recherchez, et non seulement par nom.*

---

## Pourquoi File Compass ?

| Problème | Solution |
| --------- | ---------- |
| "Où se trouve ce fichier de connexion à la base de données ?" | `file-compass search "database connection handling"` |
| La recherche par mots-clés ne trouve pas les correspondances sémantiques. | Les plongements vectoriels comprennent le sens. |
| Recherche lente dans de grandes bases de code. | Index HNSW : moins de 100 ms pour 10 000 fichiers ou plus. |
| Nécessité de s'intégrer aux assistants d'IA. | Serveur MCP pour Claude Code. |

## Démarrage rapide

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

## Fonctionnalités

- **Recherche sémantique** - Trouvez des fichiers en décrivant ce que vous recherchez.
- **Recherche rapide** - Recherche instantanée par nom de fichier/symbole (pas de plongement requis).
- **AST multi-langages** - Prise en charge de Tree-sitter pour Python, JS, TS, Rust, Go.
- **Explications des résultats** - Comprenez pourquoi chaque résultat correspond.
- **Plongements locaux** - Utilise Ollama (pas de clés API nécessaires).
- **Recherche rapide** - Indexation HNSW pour des requêtes en moins d'une seconde.
- **Conscient de Git** - Filtre éventuellement les fichiers suivis par Git.
- **Serveur MCP** - S'intègre à Claude Code et à d'autres clients MCP.
- **Sécurité renforcée** - Validation des entrées, protection contre le parcours de chemin.

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

### Prérequis

- Python 3.10+
- [Ollama](https://ollama.com/) avec le modèle `nomic-embed-text`.

## Utilisation

### Créer l'index

```bash
# Index a directory
file-compass index -d "C:/Projects"

# Index multiple directories
file-compass index -d "C:/Projects" "D:/Code"
```

### Rechercher des fichiers

```bash
# Semantic search
file-compass search "database connection handling"

# Filter by file type
file-compass search "training loop" --types python

# Git-tracked files only
file-compass search "API endpoints" --git-only
```

### Recherche rapide (sans plongement)

```bash
# Search by filename or symbol name
file-compass scan -d "C:/Projects"  # Build quick index
```

### Vérifier l'état

```bash
file-compass status
```

## Serveur MCP

File Compass inclut un serveur MCP pour l'intégration avec Claude Code et d'autres assistants d'IA.

### Outils disponibles

| Tool | Description |
| ------ | ------------- |
| `file_search` | Recherche sémantique avec explications. |
| `file_preview` | Aperçu du code avec surlignement de la syntaxe. |
| `file_quick_search` | Recherche rapide par nom de fichier/symbole. |
| `file_quick_index_build` | Créer l'index de recherche rapide. |
| `file_actions` | Contexte, utilisations, liés, historique, symboles. |
| `file_index_status` | Vérifier les statistiques de l'index. |
| `file_index_scan` | Créer ou reconstruire l'index complet. |

### Intégration avec Claude Code

Ajouter à votre `claude_desktop_config.json` :

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

| Variable | Valeur par défaut | Description |
| ---------- | --------- | ------------- |
| `FILE_COMPASS_DIRECTORIES` | `F:/AI` | Répertoires séparés par une virgule. |
| `FILE_COMPASS_OLLAMA_URL` | `http://localhost:11434` | URL du serveur Ollama. |
| `FILE_COMPASS_EMBEDDING_MODEL` | `nomic-embed-text` | Modèle de plongement. |

## Fonctionnement

1. **Analyse** - Découvre les fichiers correspondant aux extensions configurées, respecte `.gitignore`.
2. **Segmentation** - Divise les fichiers en segments sémantiques :
- Python/JS/TS/Rust/Go : Conscient de l'AST via tree-sitter (fonctions, classes).
- Markdown : Sections basées sur les titres.
- JSON/YAML : Clés de niveau supérieur.
- Autres : Fenêtre glissante avec chevauchement.
3. **Plongement** - Génère des vecteurs 768 dimensions via Ollama.
4. **Indexation** - Stocke les vecteurs dans l'index HNSW, les métadonnées dans SQLite.
5. **Recherche** - Intègre la requête, trouve les voisins les plus proches, renvoie les résultats classés.

## Performance

| Métrique | Value |
| -------- | ------- |
| Taille de l'index | ~1 Ko par segment. |
| Latence de la recherche | < 100 ms pour 10 000 segments ou plus. |
| Recherche rapide | < 10 ms pour le nom de fichier/symbole. |
| Vitesse de plongement | ~ 3 à 4 secondes par segment (local). |

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

## Sécurité

- **Validation des entrées** : Toutes les entrées MCP sont validées.
- **Protection contre les attaques par traversée de chemin** : Les fichiers situés en dehors des répertoires autorisés sont bloqués.
- **Prévention des injections SQL** : Utilisation exclusive de requêtes paramétrées.
- **Nettoyage des erreurs** : Les erreurs internes ne sont pas exposées.

## Développement

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=file_compass --cov-report=term-missing

# Type checking
mypy file_compass/
```

## Projets connexes

Fait partie de [**MCP Tool Shop**](https://mcp-tool-shop.github.io/) — la suite Compass pour le développement assisté par l'IA :

- [Tool Compass](https://github.com/mcp-tool-shop-org/tool-compass) - Découverte sémantique des outils MCP.
- [Integradio](https://github.com/mcp-tool-shop-org/integradio) - Composants Gradio intégrés avec des vecteurs.
- [Backpropagate](https://github.com/mcp-tool-shop-org/backpropagate) - Ajustement fin des LLM sans interface graphique.
- [Comfy Headless](https://github.com/mcp-tool-shop-org/comfy-headless) - ComfyUI sans la complexité.

## Support

- **Questions / aide :** [Discussions](https://github.com/mcp-tool-shop-org/file-compass/discussions)
- **Signalement de bugs :** [Issues](https://github.com/mcp-tool-shop-org/file-compass/issues)

## Licence

Licence MIT - voir [LICENSE](LICENSE) pour les détails.

## Remerciements

- [Ollama](https://ollama.com/) pour l'inférence locale des LLM.
- [hnswlib](https://github.com/nmslib/hnswlib) pour la recherche vectorielle rapide.
- [nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) pour les embeddings.
- [tree-sitter](https://tree-sitter.github.io/) pour l'analyse syntaxique multi-langue.
