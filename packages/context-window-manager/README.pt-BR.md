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

**Restauração de contexto sem perdas para sessões de LLM por meio da persistência do cache KV**

---

## O que é isso?

O Context Window Manager (CWM) é um servidor MCP que resolve o **problema de esgotamento do contexto** em aplicações de LLM. Em vez de perder o histórico da sua conversa quando o contexto se esgota, o CWM permite que você:

- **Congelar** o contexto atual para armazenamento persistente
- **Descongelar** posteriormente, sem perda de informações
- **Clonar** contextos para explorar diferentes ramificações da conversa
- **Retomar** exatamente de onde você parou

Ao contrário de abordagens de sumarização ou RAG, o CWM preserva os tensores reais do cache KV, proporcionando uma **restauração verdadeira e sem perdas**.

---

## Como funciona

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

O CWM utiliza:
- **O cache de prefixo do vLLM** com `cache_salt` para isolamento de sessões
- **LMCache** para armazenamento em camadas do cache KV (GPU → CPU → Disco → Redis)
- **Protocolo MCP** para integração perfeita com Claude Code e outros clientes MCP

---

## Início rápido

### Pré-requisitos

- Python 3.11+
- Servidor vLLM com cache de prefixo habilitado
- LMCache configurado com o vLLM

### Instalação

```bash
pip install cwm-mcp
```

### Configuração

Adicione às configurações do seu Claude Code (`.claude/settings.json`):

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

## Funcionalidades

### Operações principais

| Tool | Descrição |
| ------ | ------------- |
| `window_freeze` | Congelar o contexto da sessão para armazenamento |
| `window_thaw` | Restaurar o contexto de uma janela salva |
| `window_list` | Listar janelas de contexto disponíveis |
| `window_status` | Obter informações detalhadas da sessão/janela |
| `window_clone` | Criar uma ramificação do contexto para exploração |
| `window_delete` | Remover uma janela salva |

### Camadas de armazenamento

O CWM gerencia automaticamente o armazenamento em diferentes camadas:

1. **Memória da CPU** - Rápida, capacidade limitada
2. **Disco** - Grande capacidade, compactado
3. **Redis** - Distribuído, compartilhado entre instâncias

### Isolamento de sessões

Cada sessão recebe um `cache_salt` único, garantindo:
- Ausência de vazamento de dados entre sessões
- Proteção contra ataques de temporização
- Separação limpa de contextos

---

## Documentação

| Documento | Descrição |
| ---------- | ------------- |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | Começando e fluxos de trabalho |
| [API.md](docs/API.md) | Referência completa da API |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Análise aprofundada da arquitetura técnica |
| [SECURITY.md](docs/SECURITY.md) | Considerações de segurança |
| [ERROR_HANDLING.md](docs/ERROR_HANDLING.md) | Taxonomia e tratamento de erros |
| [ROADMAP.md](docs/ROADMAP.md) | Fases e marcos de desenvolvimento |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Diretrizes de desenvolvimento |

---

## Requisitos

### Configuração do servidor vLLM

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

## Desenvolvimento

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

Consulte [CONTRIBUTING.md](docs/CONTRIBUTING.md) para obter diretrizes detalhadas.

---

## Roteiro

- [x] Fase 0: Documentação e Arquitetura
- [x] Fase 1: Infraestrutura principal
- [x] Fase 2: Shell do servidor MCP
- [x] Fase 3: Implementação de congelamento
- [x] Fase 4: Implementação de descongelamento
- [x] Fase 5: Recursos avançados (clonagem, congelamento automático)
- [x] Fase 6: Reforço para produção
- [x] Fase 7: Integração e polimento

Consulte [ROADMAP.md](docs/ROADMAP.md) para obter detalhes.

---

## Licença

Licença MIT - consulte [LICENSE](LICENSE) para obter detalhes.

---

## Agradecimentos

- [vLLM](https://github.com/vllm-project/vllm) - Serviço de LLM de alto desempenho
- [LMCache](https://github.com/LMCache/LMCache) - Camada de persistência do cache KV
- [Model Context Protocol](https://modelcontextprotocol.io/) - Padrão de integração
- [Recursive Language Models](https://arxiv.org/abs/2512.24601) - Inspiração para gerenciamento de contexto

---

## Status

**Beta (v0.6.4)** - Finalização do processo de otimização para produção. Integração contínua consolidada (2 fluxos de trabalho). 366 testes aprovados.
