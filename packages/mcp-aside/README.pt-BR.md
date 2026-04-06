<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-aside/readme.png" alt="mcp-aside logo" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-aside"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-aside" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-aside/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  An MCP server that gives your AI a place to jot things down mid-conversation — without derailing the task at hand.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="#tools">Tools</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#license">License</a>
</p>

---

## Por que

Os LLMs (Large Language Models) perdem o controle de informações. Um pensamento isolado, uma preocupação não totalmente formada, um "precisamos voltar a isso" que nunca é retomado. O **mcp-aside** oferece ao modelo uma caixa de entrada dedicada para armazenar esses elementos, com limites de taxa, remoção de duplicatas e expiração automática, para que a caixa de entrada não se torne um problema em si mesma.

Pense nisso como um bloco de notas colado ao lado da conversa. O modelo escreve notas. Você (ou o modelo) as lê quando for o momento certo.

## Como Funciona

1. O modelo chama `aside.push` com um pensamento, classificado por prioridade.
2. As proteções (guardrails) verificam duplicatas, limites de taxa e limites de tempo de vida (TTL).
3. Se passar, a informação é armazenada em uma caixa de entrada na memória.
4. Os clientes são notificados via `notifications/resources/updated`.
5. Qualquer pessoa pode ler a caixa de entrada através do recurso `interject://inbox`.

Não há banco de dados. Não há persistência. Se o servidor parar, a caixa de entrada é apagada — por design.

## Início Rápido

```bash
npm install
npm run build
node build/index.js
```

O servidor usa MCP através de **stdio**. Aponte qualquer cliente compatível com MCP para ele:

```json
{
  "mcpServers": {
    "aside": {
      "command": "node",
      "args": ["build/index.js"]
    }
  }
}
```

## Ferramentas

| Ferramenta | O que ela faz |
| --- | --- |
| `aside.push` | Envia uma informação para a caixa de entrada. Aceita `text`, `priority` (baixo/médio/alto), `reason`, `tags`, `expiresAt`, `source` e `meta`. |
| `aside.configure` | Ajusta as proteções (guardrails) em tempo de execução — limites de tempo de vida (TTL), limites de taxa, janelas de remoção de duplicatas, limites de notificação. |
| `aside.clear` | Limpa a caixa de entrada. |
| `aside.status` | Captura somente leitura do tamanho da caixa de entrada e da configuração atual das proteções (guardrails). |

## Recurso

| URI | Descrição |
| --- | --- |
| `interject://inbox` | Array JSON de informações pendentes, da mais recente para a mais antiga. Itens expirados são filtrados na leitura. |

## Proteções (Guardrails)

Tudo é configurável via `aside.configure`. Valores padrão:

| Configuração | Valor Padrão | O que ela controla |
| --- | --- | --- |
| `defaultTtlSeconds` | 600 (10 min) | Quanto tempo uma informação permanece na caixa de entrada se nenhuma data de expiração for definida explicitamente. |
| `maxTtlSeconds` | 3600 (1 hr) | Limite máximo de tempo de vida (TTL), mesmo que o cliente solicite mais tempo. |
| `dedupeWindowSeconds` | 300 (5 min) | Mesma prioridade + texto + motivo = suprimido dentro desta janela. |
| `rateLimitWindowSeconds` | 60 | Janela deslizante para limitar a taxa. |
| `rateLimitMax` | baixo: 6, médio: 3, alto: 1 | Número máximo de envios por prioridade por janela. |
| `notifyAtOrAbove` | alto | Envia notificações de log apenas para informações com prioridade igual ou superior a esta. |

## Configuração

### Gatilho de Temporizador

Um temporizador interno é acionado a cada 5 minutos, enviando uma verificação de baixa prioridade "há algum problema?". Ele respeita as mesmas proteções (guardrails) das inserções manuais (ou seja, será removido ou limitado de taxa como qualquer outra coisa). Desative-o comentando a chamada `startTimerTrigger` em `index.ts`.

### Inspetor MCP

Para testes locais:

```
Transport: STDIO
Command:   node
Args:      build/index.js
```

## Observações

- Os logs vão para **stderr** — stdout é reservado para MCP JSON-RPC.
- A caixa de entrada é volátil. Reiniciar = tela limpa.
- As informações são armazenadas da mais recente para a mais antiga. Itens expirados são removidos a cada leitura e envio.

## Licença

[MIT](LICENSE)

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
