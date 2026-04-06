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

**Ripristino del contesto senza perdita di dati per le sessioni dei modelli linguistici di grandi dimensioni (LLM) tramite la persistenza della cache KV**

---

## Cos'è?

Context Window Manager (CWM) è un server MCP che risolve il **problema dell'esaurimento del contesto** nelle applicazioni LLM. Invece di perdere la cronologia della conversazione quando il contesto si riempie, CWM permette di:

- **Congelare** il contesto corrente e salvarlo in uno spazio di archiviazione persistente.
- **Ripristinarlo** successivamente senza alcuna perdita di informazioni.
- **Clonare** i contesti per esplorare diversi rami di conversazione.
- **Riprendere** esattamente da dove ci si era interrotti.

A differenza degli approcci di riepilogo o RAG, CWM preserva i tensori effettivi della cache KV, offrendo un **ripristino completo e senza perdita di dati**.

---

## Come funziona

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

CWM utilizza:
- La **cache di prefisso di vLLM** con `cache_salt` per l'isolamento delle sessioni.
- **LMCache** per l'archiviazione a livelli della cache KV (GPU → CPU → Disco → Redis).
- Il **protocollo MCP** per una perfetta integrazione con Claude Code e altri client MCP.

---

## Guida rapida

### Prerequisiti

- Python 3.11+
- Server vLLM con la cache di prefisso abilitata.
- LMCache configurato con vLLM.

### Installazione

```bash
pip install cwm-mcp
```

### Configurazione

Aggiungere le impostazioni a Claude Code (`.claude/settings.json`):

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

### Utilizzo

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

## Funzionalità

### Operazioni principali

| Tool | Descrizione |
| ------ | ------------- |
| `window_freeze` | Congelare il contesto della sessione e salvarlo nell'archiviazione. |
| `window_thaw` | Ripristinare il contesto da una finestra salvata. |
| `window_list` | Elencare le finestre di contesto disponibili. |
| `window_status` | Ottenere informazioni dettagliate sulla sessione/finestra. |
| `window_clone` | Creare una copia del contesto per l'esplorazione. |
| `window_delete` | Rimuovere una finestra salvata. |

### Livelli di archiviazione

CWM gestisce automaticamente l'archiviazione tra i diversi livelli:

1. **Memoria CPU** - Veloce, capacità limitata.
2. **Disco** - Grande capacità, compressa.
3. **Redis** - Distribuita, condivisa tra le istanze.

### Isolamento delle sessioni

Ogni sessione riceve un `cache_salt` univoco, garantendo:
- Nessuna perdita di dati tra le sessioni.
- Protezione contro attacchi basati sui tempi.
- Una chiara separazione dei contesti.

---

## Documentazione

| Documento | Descrizione |
| ---------- | ------------- |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | Guida introduttiva e flussi di lavoro. |
| [API.md](docs/API.md) | Riferimento completo dell'API. |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Analisi approfondita dell'architettura tecnica. |
| [SECURITY.md](docs/SECURITY.md) | Considerazioni sulla sicurezza. |
| [ERROR_HANDLING.md](docs/ERROR_HANDLING.md) | Tassonomia degli errori e gestione. |
| [ROADMAP.md](docs/ROADMAP.md) | Fasi e traguardi di sviluppo. |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Linee guida per lo sviluppo. |

---

## Requisiti

### Configurazione del server vLLM

```bash
vllm serve "meta-llama/Llama-3.1-8B-Instruct" \
  --enable-prefix-caching \
  --kv-transfer-config '{"kv_connector":"LMCacheConnectorV1","kv_role":"kv_both"}'
```

### Ambiente LMCache

```bash
export LMCACHE_USE_EXPERIMENTAL=True
export LMCACHE_LOCAL_CPU=True
export LMCACHE_MAX_LOCAL_CPU_SIZE=8.0
```

---

## Sviluppo

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

Consultare [CONTRIBUTING.md](docs/CONTRIBUTING.md) per linee guida dettagliate.

---

## Roadmap

- [x] Fase 0: Documentazione e Architettura
- [x] Fase 1: Infrastruttura di base
- [x] Fase 2: Shell del server MCP
- [x] Fase 3: Implementazione del congelamento
- [x] Fase 4: Implementazione dello scongelamento
- [x] Fase 5: Funzionalità avanzate (clonazione, congelamento automatico)
- [x] Fase 6: Ottimizzazione per la produzione
- [x] Fase 7: Integrazione e rifinitura

Consultare [ROADMAP.md](docs/ROADMAP.md) per i dettagli.

---

## Licenza

Licenza MIT - vedere [LICENSE](LICENSE) per i dettagli.

---

## Ringraziamenti

- [vLLM](https://github.com/vllm-project/vllm) - Servizio LLM ad alta velocità.
- [LMCache](https://github.com/LMCache/LMCache) - Livello di persistenza della cache KV.
- [Model Context Protocol](https://modelcontextprotocol.io/) - Standard di integrazione.
- [Recursive Language Models](https://arxiv.org/abs/2512.24601) - Fonte di ispirazione per la gestione del contesto.

---

## Stato

**Beta (versione 0.6.4)** - Completata la fase di ottimizzazione per la produzione. Integrazione continua consolidata (2 flussi di lavoro). 366 test superati.
