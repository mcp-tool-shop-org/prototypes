<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/">
    <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-hook-debug/readme.png" width="400" alt="claude-hook-debug" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug/branch/main/graph/badge.svg" alt="Coverage" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-hook-debug"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-hook-debug" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

Ferramenta de linha de comando para diagnóstico de problemas com o hook do Claude Code. Detecta hooks "fantasma" de plugins desativados, conflitos de escopo, configurações incorretas e bugs conhecidos do Claude Code.

## Instalação

```bash
npm install -g @mcptoolshop/claude-hook-debug
```

Ou execute diretamente:

```bash
npx @mcptoolshop/claude-hook-debug
```

## Uso

```bash
# Scan current workspace
claude-hook-debug

# Scan a specific project
claude-hook-debug /path/to/project

# JSON output (for piping/scripting)
claude-hook-debug --json
```

Código de saída 1 se algum erro for encontrado, 0 caso contrário.

## O que é detectado

| ID | Severidade | Descrição |
|----|----------|-------------|
| `GHOST_HOOK_PREVIEW` | erro | O plugin "claude-preview" está desativado, mas o hook "Stop" ainda é executado ([#19893](https://github.com/anthropics/claude-code/issues/19893)) |
| `GHOST_HOOK_GENERIC` | aviso | Qualquer plugin desativado que possa ainda ter hooks ativos. |
| `LOCAL_ONLY_PLUGINS` | erro | `enabledPlugins` nas configurações locais apenas — sobrescreve silenciosamente as configurações padrão ([#25086](https://github.com/anthropics/claude-code/issues/25086)) |
| `SCOPE_CONFLICT` | aviso | Plugin habilitado em um escopo, desabilitado em outro. |
| `STOP_CONTINUE_LOOP` | erro | O hook "Stop" retorna `continue:true`, causando um loop infinito ([#1288](https://github.com/anthropics/claude-code/issues/1288)) |
| `DISABLE_ALL_HOOKS_ACTIVE` | aviso/erro | `disableAllHooks: true` desativa todos os hooks (eleva-se a erro se configurações gerenciadas existirem). |
| `BROKEN_SETTINGS_JSON` | erro | JSON inválido desativa silenciosamente todas as configurações daquele arquivo. |
| `LARGE_SETTINGS_FILE` | aviso | Arquivo de configurações com tamanho > 100KB (pode causar inicialização lenta). |
| `PLUGIN_HOOKS_INVISIBLE` | informação | Nenhum hook de usuário, mas os plugins estão habilitados — os hooks dos plugins não são visíveis para inspeção. |

## Escopos de Configuração

A ferramenta lê todos os quatro escopos de configuração na ordem de carregamento do Claude Code:

| Escopo | Caminho | Precedência |
|-------|------|------------|
| gerenciado | `~/.claude/managed-settings.json` | Maior |
| usuário | `~/.claude/settings.json` | |
| projeto | `.claude/settings.json` | |
| local | `.claude/settings.local.json` | Menor (a última escrita tem precedência) |

## Uso de Bibliotecas

```typescript
import { debug } from '@mcptoolshop/claude-hook-debug';

const report = debug({ projectRoot: '/path/to/project' });

console.log(report.diagnostics);
// [{ id: 'GHOST_HOOK_PREVIEW', severity: 'error', title: '...', ... }]

console.log(report.plugins);
// [{ pluginId: 'claude-preview@...', mergedEnabled: false, scopes: [...] }]
```

## Segurança e Modelo de Ameaças

**O que a ferramenta acessa:** Arquivos de configuração do Claude Code (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/managed-settings.json`). Todas as leituras são somente leitura — a ferramenta nunca modifica nenhum arquivo.

**O que a ferramenta NÃO acessa:** Nenhuma chave de API, token, valor de variável de ambiente ou credenciais são lidos ou registrados. O bloco `env` nas configurações é completamente ignorado. Nenhum arquivo fora dos caminhos de configuração do Claude Code é acessado.

**Permissões necessárias:** Acesso de leitura ao sistema de arquivos para `~/.claude/` e o diretório `.claude/` do projeto. Nenhuma permissão elevada, nenhum acesso à rede, nenhuma execução de shell.

**Sem telemetria.** Sem análises. Sem envio de dados. Sem coleta de dados de qualquer tipo. Sem dependências de produção.

---

Desenvolvido por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
