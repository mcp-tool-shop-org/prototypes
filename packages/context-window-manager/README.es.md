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

**Restauración de contexto sin pérdidas para sesiones de LLM mediante la persistencia de la caché KV**

---

## ¿Qué es esto?

Context Window Manager (CWM) es un servidor MCP que resuelve el **problema de agotamiento del contexto** en aplicaciones de LLM. En lugar de perder el historial de la conversación cuando el contexto se llena, CWM le permite:

- **Congelar** el contexto actual y almacenarlo de forma persistente.
- **Descongelarlo** más tarde sin pérdida de información.
- **Clonar** contextos para explorar diferentes ramas de la conversación.
- **Reanudar** exactamente donde lo dejó.

A diferencia de los enfoques de resumen o RAG, CWM conserva los tensores de la caché KV reales, lo que le brinda una **restauración verdadera y sin pérdidas**.

---

## Cómo funciona

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

CWM utiliza:
- El **almacenamiento en caché de prefijos de vLLM** con `cache_salt` para el aislamiento de sesiones.
- **LMCache** para el almacenamiento de la caché KV en niveles (GPU → CPU → Disco → Redis).
- El **protocolo MCP** para una integración perfecta con Claude Code y otros clientes MCP.

---

## Comienzo rápido

### Requisitos previos

- Python 3.11+
- Servidor vLLM con el almacenamiento en caché de prefijos habilitado.
- LMCache configurado con vLLM.

### Instalación

```bash
pip install cwm-mcp
```

### Configuración

Agregue lo siguiente a la configuración de Claude Code (`.claude/settings.json`):

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

### Uso

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

## Características

### Operaciones principales

| Tool | Descripción |
| ------ | ------------- |
| `window_freeze` | Congelar el contexto de la sesión y almacenarlo. |
| `window_thaw` | Restaurar el contexto desde una ventana guardada. |
| `window_list` | Listar las ventanas de contexto disponibles. |
| `window_status` | Obtener información detallada de la sesión/ventana. |
| `window_clone` | Crear una rama de contexto para su exploración. |
| `window_delete` | Eliminar una ventana guardada. |

### Niveles de almacenamiento

CWM gestiona automáticamente el almacenamiento en diferentes niveles:

1. **Memoria de la CPU**: Rápida, capacidad limitada.
2. **Disco**: Gran capacidad, comprimido.
3. **Redis**: Distribuido, compartido entre instancias.

### Aislamiento de sesiones

Cada sesión recibe un `cache_salt` único, lo que garantiza:
- Sin fuga de datos entre sesiones.
- Protección contra ataques de sincronización.
- Separación limpia de contextos.

---

## Documentación

| Documento | Descripción |
| ---------- | ------------- |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | Comienzo y flujos de trabajo |
| [API.md](docs/API.md) | Referencia completa de la API. |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Análisis profundo de la arquitectura técnica. |
| [SECURITY.md](docs/SECURITY.md) | Consideraciones de seguridad. |
| [ERROR_HANDLING.md](docs/ERROR_HANDLING.md) | Taxonomía y manejo de errores. |
| [ROADMAP.md](docs/ROADMAP.md) | Fases y hitos de desarrollo. |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Directrices de desarrollo. |

---

## Requisitos

### Configuración del servidor vLLM

```bash
vllm serve "meta-llama/Llama-3.1-8B-Instruct" \
  --enable-prefix-caching \
  --kv-transfer-config '{"kv_connector":"LMCacheConnectorV1","kv_role":"kv_both"}'
```

### Entorno LMCache

```bash
export LMCACHE_USE_EXPERIMENTAL=True
export LMCACHE_LOCAL_CPU=True
export LMCACHE_MAX_LOCAL_CPU_SIZE=8.0
```

---

## Desarrollo

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

Consulte [CONTRIBUTING.md](docs/CONTRIBUTING.md) para obtener pautas detalladas.

---

## Hoja de ruta

- [x] Fase 0: Documentación y arquitectura.
- [x] Fase 1: Infraestructura central.
- [x] Fase 2: Shell del servidor MCP.
- [x] Fase 3: Implementación de congelación.
- [x] Fase 4: Implementación de descongelación.
- [x] Fase 5: Características avanzadas (clonación, congelación automática).
- [x] Fase 6: Endurecimiento para producción.
- [x] Fase 7: Integración y pulido.

Consulte [ROADMAP.md](docs/ROADMAP.md) para obtener más detalles.

---

## Licencia

Licencia MIT: consulte [LICENSE](LICENSE) para obtener más detalles.

---

## Agradecimientos

- [vLLM](https://github.com/vllm-project/vllm): Servicio de LLM de alto rendimiento.
- [LMCache](https://github.com/LMCache/LMCache): Capa de persistencia de caché KV.
- [Model Context Protocol](https://modelcontextprotocol.io/): Estándar de integración.
- [Recursive Language Models](https://arxiv.org/abs/2512.24601): Inspiración para la gestión de contextos.

---

## Estado

**Beta (v0.6.4)**: Se ha completado la optimización para producción. El sistema de integración continua (CI) se ha consolidado (2 flujos de trabajo). Se han superado 366 pruebas.
