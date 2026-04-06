<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/code-bearings/readme.png" width="400" alt="Code Bearings">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/actions"><img src="https://github.com/mcp-tool-shop-org/code-bearings/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@code-bearings/cli"><img src="https://img.shields.io/npm/v/@code-bearings/cli" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/code-bearings/"><img src="https://img.shields.io/badge/Landing_Page-blue" alt="Landing Page"></a>
</p>

**Recupere o controle do seu código.**

Code Bearings é uma ferramenta que analisa o código e fornece informações contextuais para projetos modernos. Ela indexa seu projeto TypeScript em um grafo de arquivos, símbolos, módulos e dependências, e então disponibiliza essas informações em diferentes ambientes: linha de comando, VS Code e sistemas de integração contínua (CI).

A informação é sempre precisa e consistente. A inteligência artificial ajuda a explicar, ensinar e apresentar as informações. O usuário humano permanece no controle.

## O que ele faz

| Funcionalidades | O que você recebe |
|---------|-------------|
| **CLI** | `code-bearings analyze` indexa seu projeto. `code-bearings review` gera um resumo de alterações a partir de qualquer diff do Git, com avaliação de risco, evidências e orientações para o revisor. |
| **VS Code** | Árvores na barra de atividades, painéis de revisão interativos, dicas de ferramentas ao passar o mouse, anotações CodeLens, decorações na margem, contexto na barra de status — tudo alimentado pela mesma fonte de informação precisa. |
| **CI** | `code-bearings ci` gera artefatos de revisão (Markdown, JSON, HTML) e, opcionalmente, pode interromper o processo se os limites de risco forem excedidos. |

## Instalação

```bash
# CLI (global)
npm install -g @code-bearings/cli

# Or run directly
npx @code-bearings/cli analyze

# VS Code extension (from marketplace or local)
# Search "Code Bearings" in the VS Code extensions panel
```

## Início rápido

```bash
# 1. Index your project
code-bearings analyze

# 2. Review your changes
code-bearings review

# 3. Explore the graph
code-bearings modules
code-bearings module store
code-bearings function generateChangeBrief

# 4. Compare branches
code-bearings compare main feature-branch

# 5. Generate CI artifacts
code-bearings ci --fail-on-risk high
```

## Arquitetura

Code Bearings é um monorepository com três pacotes que compartilham um contrato de camadas bem definido:

```
@code-bearings/core    ← Shared product logic (extraction, graph, review, rendering)
@code-bearings/cli     ← Thin CLI consuming core
@code-bearings/vscode  ← Thin editor surface consuming core
```

**O núcleo é responsável pela informação precisa.** A interface de linha de comando é simples. A extensão para VS Code é simples. Não há produtos derivados.

### Três Camadas de Informação

| Camada | O que | Exemplo |
|-------|------|---------|
| **A. Extracted Truth** | Fatos extraídos do código-fonte | "A função X chama a função Y" |
| **B. Derived Structure** | Calculado a partir da Camada A | "O módulo M tem 7 dependências, com um risco de 25" |
| **C. Human Narration** | Explicações baseadas em A+B | "Esta alteração remove o tratamento de erros de um caminho com alto tráfego" |

### Cinco Modos de Uso

A revisão geral apresenta a informação precisa. Outros modos ajudam os humanos a pensar com base nessa informação.

| Modo | Função |
|------|------|
| **General** | Resumo conciso das alterações — o que mudou, risco, evidências |
| **Bug Hunter** | Hipóteses de falha, pontos cegos, sugestões de inspeção |
| **Learning** | Traduções de sintaxe, explicações "antes/depois" |
| **Architecture** | Funções dos módulos, saúde das interfaces, posição no sistema |
| **Exploration** | Perguntas guiadas para bases de código desconhecidas |

## Pacotes

| Pacote | Descrição | npm |
|---------|-------------|-----|
| [`@code-bearings/core`](packages/core/) | Lógica compartilhada para extração, grafo, revisão e renderização | [![npm](https://img.shields.io/npm/v/@code-bearings/core)](https://www.npmjs.com/package/@code-bearings/core) |
| [`@code-bearings/cli`](packages/cli/) | Interface de linha de comando | [![npm](https://img.shields.io/npm/v/@code-bearings/cli)](https://www.npmjs.com/package/@code-bearings/cli) |
| [`@code-bearings/vscode`](packages/vscode/) | Extensão para VS Code | — |

## Requisitos

- Node.js >= 20
- Projeto TypeScript com um arquivo `tsconfig.json`
- Git (para os comandos de revisão/comparação)

## Segurança e Confiança

- **Sem acesso à rede.** Sem telemetria. Sem análise de dados. Sem envio de informações.
- **Acesso somente leitura ao código-fonte.** Code Bearings lê seus arquivos de código através da análise da árvore sintática (AST). Ele nunca os modifica.
- **Banco de dados local apenas.** O arquivo SQLite `.code-bearings/bearings.db` permanece no seu projeto.
- **Sem execução de código.** Apenas análise estática.

Consulte [SECURITY.md](SECURITY.md) para o modelo de ameaças completo.

## Licença

[MIT](LICENSE)

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
