<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/context-window-manager/readme.png" alt="Context Window Manager" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/context-window-manager/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/context-window-manager/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/cwm-mcp/"><img src="https://img.shields.io/pypi/v/cwm-mcp" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/context-window-manager/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Restauration contextuelle sans perte pour les sessions LLM grâce à la persistance du cache KV**

---

## Qu'est-ce que c'est ?

Context Window Manager (CWM) est un serveur MCP qui résout le **problème de saturation du contexte** dans les applications LLM. Au lieu de perdre l'historique de votre conversation lorsque le contexte est plein, CWM vous permet de :

- **"Geler"** votre contexte actuel et de le stocker de manière persistante.
- de le **"dégeler"** ultérieurement sans aucune perte d'information.
- de **"cloner"** des contextes pour explorer différentes branches de conversation.
- de **reprendre** exactement là où vous vous étiez arrêté.

Contrairement aux approches de résumé ou de RAG, CWM conserve les tenseurs de cache KV réels, ce qui vous offre une **restauration véritablement sans perte**.

---

## Comment ça marche

```
Traditional Approach (Lossy):
┌─────────────────────────────────────────────┐
│ Context fills up → Summarize → Lose details │
└─────────────────────────────────────────────┘

CWM Approach (Lossless):
┌──────────────────────────────────────────────────────────────┐
│ Context fills up → Freeze KV cache → Store tensors → Thaw   │
│                                                    ↓        │
│                              Exact restoration, zero loss   │
└──────────────────────────────────────────────────────────────┘
```

CWM utilise :
- le **prefix caching de vLLM** avec `cache_salt` pour l'isolation des sessions.
- **LMCache** pour le stockage hiérarchique du cache KV (GPU → CPU → Disque → Redis).
- le **protocole MCP** pour une intégration transparente avec Claude Code et d'autres clients MCP.

---

## Démarrage rapide

### Prérequis

- Python 3.11+
- Serveur vLLM avec le prefix caching activé.
- LMCache configuré avec vLLM.

### Installation

```bash
pip install cwm-mcp
```

### Configuration

Ajoutez ceci à vos paramètres de Claude Code (`.claude/settings.json`) :

```json
{
  "mcpServers": {
    "context-window-manager": {
      "command": "python",
      "args": ["-m", "context_window_manager"],
      "env": {
        "CWM_VLLM_URL": "http://localhost:8000"
      }
    }
  }
}
```

### Utilisation

```
# Freeze your current session
> window_freeze session_abc123 my-coding-project

# Later, restore it
> window_thaw my-coding-project

# List all saved windows
> window_list

# Check status
> window_status my-coding-project
```

---

## Fonctionnalités

### Opérations principales

| Tool | Description |
| ------ | ------------- |
| `window_freeze` | Enregistrer le contexte de la session dans le stockage. |
| `window_thaw` | Restaurer le contexte à partir d'une fenêtre enregistrée. |
| `window_list` | Lister les fenêtres de contexte disponibles. |
| `window_status` | Obtenir des informations détaillées sur la session/la fenêtre. |
| `window_clone` | Créer une branche de contexte pour l'exploration. |
| `window_delete` | Supprimer une fenêtre enregistrée. |

### Niveaux de stockage

CWM gère automatiquement le stockage entre les différents niveaux :

1. **Mémoire CPU** - Rapide, capacité limitée.
2. **Disque** - Grande capacité, compressé.
3. **Redis** - Distribué, partagé entre les instances.

### Isolation des sessions

Chaque session reçoit un `cache_salt` unique, ce qui garantit :
- Absence de fuite de données entre les sessions.
- Protection contre les attaques par temporisation.
- Séparation claire des contextes.

---

## Documentation

| Documentation | Description |
| ---------- | ------------- |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | Démarrage et flux de travail |
| [API.md](docs/API.md) | Référence complète de l'API. |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Analyse approfondie de l'architecture technique. |
| [SECURITY.md](docs/SECURITY.md) | Considérations de sécurité. |
| [ERROR_HANDLING.md](docs/ERROR_HANDLING.md) | Taxonomie et gestion des erreurs. |
| [ROADMAP.md](docs/ROADMAP.md) | Phases et jalons du développement. |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Directives de développement. |

---

## Exigences

### Configuration du serveur vLLM

```bash
vllm serve "meta-llama/Llama-3.1-8B-Instruct" \
  --enable-prefix-caching \
  --kv-transfer-config '{"kv_connector":"LMCacheConnectorV1","kv_role":"kv_both"}'
```

### Environnement LMCache

```bash
export LMCACHE_USE_EXPERIMENTAL=True
export LMCACHE_LOCAL_CPU=True
export LMCACHE_MAX_LOCAL_CPU_SIZE=8.0
```

---

## Développement

```bash
# Clone and setup
git clone https://github.com/mcp-tool-shop-org/context-window-manager.git
cd context-window-manager
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -e ".[dev]"

# Run tests
pytest tests/unit/

# Run with coverage
pytest tests/unit/ --cov=src/context_window_manager
```

Consultez [CONTRIBUTING.md](docs/CONTRIBUTING.md) pour obtenir des directives détaillées.

---

## Feuille de route

- [x] Phase 0 : Documentation et architecture
- [x] Phase 1 : Infrastructure de base
- [x] Phase 2 : Shell du serveur MCP
- [x] Phase 3 : Implémentation de la "gelée"
- [x] Phase 4 : Implémentation de la "décongélation"
- [x] Phase 5 : Fonctionnalités avancées (clonage, "gel" automatique)
- [x] Phase 6 : Renforcement pour la production
- [x] Phase 7 : Intégration et perfectionnement

Consultez [ROADMAP.md](docs/ROADMAP.md) pour plus de détails.

---

## Licence

Licence MIT - consultez [LICENSE](LICENSE) pour plus de détails.

---

## Remerciements

- [vLLM](https://github.com/vllm-project/vllm) - Service LLM à haut débit.
- [LMCache](https://github.com/LMCache/LMCache) - Couche de persistance du cache KV.
- [Model Context Protocol](https://modelcontextprotocol.io/) - Standard d'intégration.
- [Recursive Language Models](https://arxiv.org/abs/2512.24601) - Source d'inspiration pour la gestion du contexte.

---

## Statut

**Version bêta (v0.6.4)** - Finalisation des optimisations pour la production. Intégration continue consolidée (2 flux de travail). 366 tests réussis.
