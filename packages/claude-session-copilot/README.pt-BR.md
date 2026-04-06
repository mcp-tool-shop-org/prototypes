<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-session-copilot/readme.png" width="400" />
</p>

<p align="center">
  <strong>Session memory for Claude Code.</strong><br>
  Captures decisions, timelines, and patterns across sessions. Makes context recoverable after <code>/compact</code>.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-session-copilot"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-session-copilot" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/claude-session-copilot" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-session-copilot/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## Por quê?

As sessões do Claude Code são temporárias. Quando você usa o comando `/compact` ou inicia uma nova sessão, seu raciocínio, decisões e progresso são perdidos. O Session Copilot captura tudo isso e permite que você recupere.

**Este plugin funciona apenas no Claude Code** — ele depende de ganchos (hooks) PostToolUse, habilidades (skills), notificações de recursos e da injeção de contexto CLAUDE.md, que nenhum outro cliente MCP possui.

## Como Começar

```bash
npx @mcptoolshop/claude-session-copilot
```

### Plugin do Claude Code

Adicione o seguinte ao arquivo `.mcp.json` do seu projeto:

```json
{
  "mcpServers": {
    "session-copilot": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/claude-session-copilot"]
    }
  }
}
```

## O que ele faz

### 7 Ferramentas

| Ferramenta | Propósito |
| ------ | --------- |
| `copilot.decision` | Registra uma decisão (o que, por quê, alternativas rejeitadas) |
| `copilot.snapshot` | Salva o estado da sessão para continuidade |
| `copilot.resume` | Carrega a última versão + decisões para uma nova sessão |
| `copilot.timeline_event` | Registra um evento na linha do tempo |
| `copilot.query` | Pesquisa decisões/linha do tempo/versões |
| `copilot.pulse` | Painel de saúde do projeto |
| `copilot.forget` | Remove dados antigos |

### 4 Habilidades (Claude Code apenas)

| Habilidade | O que ela faz |
| ------- | ------------- |
| `/copilot:resume` | Continua de onde a última sessão parou |
| `/copilot:snapshot` | Salva o estado completo antes de usar `/compact` |
| `/copilot:decisions` | Revisa o registro de decisões |
| `/copilot:pulse` | Painel de saúde do projeto |

### 4 Ganchos PostToolUse (Claude Code apenas)

Registro automático na linha do tempo após:
- **Bash** — detecta resultados de compilação/teste (pass/fail)
- **Write** — registra a criação de arquivos
- **Edit** — registra a modificação de arquivos
- **TodoWrite** — registra mudanças no estado das tarefas

### Detecção de Padrões

Exibe alertas quando detecta:
- **Falha repetida** — o mesmo comando falha 3 ou mais vezes
- **Alterações frequentes de arquivos** — o mesmo arquivo é editado 5 ou mais vezes em uma sessão
- **Sessão longa** — 100 ou mais eventos sem um registro de versão

### 4 Recursos

| URI | O que ele mostra |
| ----- | --------------- |
| `copilot://pulse` | Saúde do projeto em tempo real |
| `copilot://timeline` | Eventos da sessão atual |
| `copilot://decisions` | Registro de decisões recente |
| `copilot://snapshot/latest` | Observação de entrega mais recente |

## Ciclo de Vida da Sessão

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Session Start│ ──► │  /copilot:resume  │ ──► │   Work normally  │
└─────────────┘     └──────────────────┘     │  (hooks auto-    │
                                              │   track events)  │
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │ copilot.decision │
                                              │ (log key choices)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │/copilot:snapshot │
                                              │ (before /compact)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  Next session    │
                                              │  /copilot:resume │
                                              └─────────────────┘
```

## Armazenamento

Os dados são armazenados em `.claude/copilot/store.json` (local do projeto) ou `~/.claude/copilot/store.json` (armazenamento global).

Pode ser substituído pela variável de ambiente `COPILOT_STORE_PATH`.

## Por que apenas para Claude Code?

Este servidor depende de primitivas específicas do Claude Code:

| Recurso | Primitiva do Claude Code | Outros Clientes MCP |
| --------- | ---------------------- | ------------------- |
| Linha do tempo automática | Ganchos PostToolUse | Sem sistema de ganchos |
| Comandos de barra | Habilidades (SKILL.md) | Sem habilidades |
| Injeção de contexto | CLAUDE.md | Sem equivalente |
| Painéis em tempo real | Notificações de recursos | Não monitora recursos |
| Coordenação de tarefas | Ganchos TodoWrite | Sem TodoWrite |

Sem esses recursos, o servidor é apenas um arquivo JSON sem uma maneira de preenchê-lo automaticamente.

## Licença

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
