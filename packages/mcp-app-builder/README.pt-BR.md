<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-app-builder/readme.png" alt="MCP App Builder" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder"><img src="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder/branch/main/graph/badge.svg" alt="codecov" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-1.0-green" alt="MCP" /></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-app-builder/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

> Crie servidores MCP com componentes de interface de usuário interativos — diretamente do VS Code.

## Visão geral

O **MCP App Builder** ajuda desenvolvedores a criar, testar e implantar rapidamente servidores MCP (Model Context Protocol). Ele suporta o novo padrão **MCP Apps** (janeiro de 2026), permitindo componentes de interface de usuário interativos diretamente em conversas de IA.

## Recursos

### Estrutura
- **Assistente para Novo Servidor**: Crie servidores MCP com configuração guiada.
- **Modelos**: Configurações básicas, com interface de usuário e completas para servidores.
- **Configuração automática**: TypeScript, MCP SDK e estrutura do projeto.

### Desenvolvimento
- **Validação de Esquema**: Validação em tempo real de `mcp.json` e `mcp-tools.json`.
- **Validação automática ao salvar**: Esquemas verificados automaticamente ao salvar (configurável).
- **Geração de Tipos**: Gere tipos TypeScript a partir de definições de ferramentas.
- **IntelliSense**: Suporte para JSON Schema em arquivos de configuração.

### Testes
- **Ambiente de Teste**: Execute testes contra suas ferramentas MCP.
- **Testes Gerados Automaticamente**: Testes criados a partir de definições de ferramentas e exemplos.
- **Canal de Saída**: Resultados de teste formatados com status de aprovação/reprovação.

### Painel
- **Interface Visual**: Acesso rápido a todos os comandos.
- **Integração com o Workspace**: Detecta projetos MCP automaticamente.
- **Barra de Status**: Indicador MCP quando em um projeto MCP.

## Como Começar

1. **Instale a extensão** da VS Code Marketplace (em breve).
2. **Crie um novo servidor**: `Cmd+Shift+P` → "MCP: Novo Servidor"
3. **Escolha um modelo**:
- `básico` - Servidor simples de "olá, mundo".
- `com-interface` - Servidor com componentes de interface de usuário de tabela e gráfico.
- `completo` - Servidor completo com ferramentas, recursos e prompts.

## Atalhos de Teclado

| Atalho | Comando |
|----------|---------|
| `Ctrl+Alt+N` (`Cmd+Alt+N` no Mac) | Novo Servidor |
| `Ctrl+Alt+V` (`Cmd+Alt+V` no Mac) | Validar Esquema |

## Comandos

| Comando | Descrição |
|---------|-------------|
| `MCP: New Server` | Cria um novo projeto de servidor MCP. |
| `MCP: Validate Schema` | Valida o arquivo `mcp.json` ou `mcp-tools.json` atual. |
| `MCP: Generate Types` | Gera tipos TypeScript a partir de definições de ferramentas. |
| `MCP: Test Server` | Executa testes contra suas ferramentas MCP. |
| `MCP: Open Dashboard` | Abre o painel visual. |

## Configurações

| Configuração | Padrão | Descrição |
|---------|---------|-------------|
| `mcp-app-builder.defaultTemplate` | `basic` | Modelo padrão para novos servidores (básico/com-interface/completo). |
| `mcp-app-builder.autoValidate` | `true` | Validar esquemas automaticamente ao salvar. |
| `mcp-app-builder.testPort` | `3000` | Porta para o servidor de teste MCP. |

## Componentes de Interface de Usuário MCP Apps

A extensão fornece ferramentas para componentes de interface de usuário MCP Apps:

```typescript
import { table, chart, form, card } from '@mcp-app-builder/ui-components';

// Create a search results table
const results = table(
  [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status' },
  ],
  data,
  { pageSize: 10 }
);

// Create a dashboard with metrics
const dashboard = dashboard({
  title: 'Analytics',
  metrics: [
    { label: 'Users', value: 1234, change: 12 },
    { label: 'Revenue', value: '$5,678', change: -3 },
  ],
  chart: lineChart,
});
```

## Estrutura de Arquivos

Projetos de servidor MCP gerados seguem esta estrutura:

```
my-mcp-server/
├── mcp.json           # Server configuration
├── mcp-tools.json     # Tool definitions
├── package.json       # Node.js dependencies
├── tsconfig.json      # TypeScript configuration
└── src/
    ├── index.ts       # Server entry point
    ├── resources.ts   # Resource handlers (full template)
    └── prompts.ts     # Prompt handlers (full template)
```

## Desenvolvimento

### Pré-requisitos

- Node.js 18+
- VS Code 1.85+

### Configuração

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-app-builder
cd mcp-app-builder
npm install
npm run compile
```

### Execução

Pressione `F5` no VS Code para iniciar o Ambiente de Desenvolvimento de Extensões.

### Testes

```bash
npm test
```

## Próximos Passos

### Fase 1 (Atual) - Fundação Determinística
- [x] Estrutura de projeto com modelos.
- [x] Sistema de validação de esquema.
- [x] Geração de tipos a partir de esquemas.
- [x] Componentes primitivos de interface de usuário.
- [x] Fundação do ambiente de teste.
- [x] Painel web.

### Fase 2 - Desenvolvimento Assistido por IA
- [ ] Geração de ferramentas por IA a partir de linguagem natural.
- [ ] Preenchimento automático inteligente para manipuladores de ferramentas.
- [ ] Geração automatizada de documentação.

### Fase 3 - Publicação e Distribuição
- [ ] Publicação com um clique em registros MCP.
- [ ] Gerenciamento de versões.
- [ ] Resolução de dependências.

### Fase 4 - Construtor Visual
- [ ] Construtor de componentes de interface de usuário de arrastar e soltar.
- [ ] Visualização em tempo real de aplicativos MCP.
- [ ] Editor de fluxo visual.

## Contribuições

As contribuições são bem-vindas! Por favor, leia nossas diretrizes de contribuição (em breve).

## Segurança e Privacidade

**Dados acessados:** arquivos do espaço de trabalho (mcp.json, mcp-tools.json, TypeScript gerado), configurações do VS Code, canais de saída da extensão.

**Dados NÃO acessados:** código-fonte além das configurações do MCP, histórico do Git, rede (exceto para o ambiente de testes local), credenciais, variáveis de ambiente. Nenhuma informação de telemetria é coletada ou enviada.

**Permissões:** leitura/escrita no sistema de arquivos para a criação de estruturas e geração de tipos (apenas no espaço de trabalho), rede local para o ambiente de testes. Consulte [SECURITY.md](SECURITY.md) para a política completa.

## Licença

MIT

## Links

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP Apps Specification](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [Organização do GitHub](https://github.com/mcp-tool-shop-org)

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
