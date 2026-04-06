<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh.md">中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.it.md">Italiano</a> ·
  <a href="README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-cli/readme.png" alt="WebSketch CLI" width="400"></p>

<p align="center"><strong>CLI for WebSketch IR — render, diff, and fingerprint web UI captures so LLMs and CI pipelines can reason about what users see.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/websketch"><img src="https://img.shields.io/npm/v/@mcptoolshop/websketch.svg" alt="npm version"></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT">
  <a href="https://mcp-tool-shop-org.github.io/websketch-cli/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

## Visão Geral

- **Renderização em ASCII:** Converta qualquer captura do WebSketch em um layout de desenho de caixas que se encaixe em um terminal ou em uma janela de contexto de LLM.
- **Impressão digital estrutural:** Calcule um hash do layout de uma página para que você possa detectar alterações sem comparar pixels.
- **Diferença semântica:** Compare duas capturas e obtenha um relatório de alterações classificado (adicionado, movido, redimensionado, texto alterado).
- **Empacotamento em lote:** Combine capturas (e, opcionalmente, a diferença) em um único arquivo `.ws.json` compartilhável.
- **Foco em pipelines:** Todos os comandos suportam a saída `--json` e códigos de saída determinísticos para scripts de CI.
- **Modo otimizado para LLM:** A flag `--llm` produz uma saída rica em metadados, projetada para ser consumida por agentes.

## Instalação

```bash
pnpm add -g @mcptoolshop/websketch
```

Ou execute sem instalar:

```bash
npx @mcptoolshop/websketch render capture.json
```

## Comandos

### validate

Verifica se um arquivo de captura está em conformidade com o esquema WebSketch IR.

```bash
websketch validate capture.json
```

### render-ascii

Renderiza uma captura em arte ASCII (legível para LLM).

```bash
# Default 80x24 grid
websketch render-ascii capture.json

# LLM-optimized format with metadata and legend
websketch render-ascii --llm capture.json

# Custom dimensions
websketch render-ascii --width 120 --height 40 capture.json

# Minimal structure-only view
websketch render-ascii --structure capture.json
```

**Exemplo de saída:**

```
+---------------------------------------------------------------------------+
|[NAV:primary_nav]                                                          |
+---------------------------------------------------------------------------+
|                    +----------------------------------------+             |
|                    |[FRM:login]                             |             |
|                    |  [INP:email]                           |             |
|                    |  [INP:password]                        |             |
|                    |  [BTN:primary_cta]                     |             |
|                    +----------------------------------------+             |
+---------------------------------------------------------------------------+
```

### fingerprint

Calcula uma impressão digital estrutural para comparação.

```bash
# Full fingerprint (includes text)
websketch fingerprint capture.json
# Output: e33442b6

# Layout-only fingerprint (ignores text changes)
websketch fingerprint --layout-only capture.json
```

### diff

Compara duas capturas e relata as alterações.

```bash
# Human-readable diff report
websketch diff before.json after.json

# JSON output
websketch diff --json before.json after.json

# Layout-only (ignore text changes)
websketch diff --layout-only before.json after.json

# Custom match threshold
websketch diff --threshold 0.7 before.json after.json
```

### bundle

Empacota uma ou mais capturas em um arquivo `.ws.json` compartilhável. Quando exatamente duas capturas são fornecidas, o pacote inclui automaticamente um resumo da diferença.

```bash
websketch bundle capture.json -o bundle.ws.json
websketch bundle before.json after.json -o bundle.ws.json
```

## Modo Pipeline

Adicione `--json` antes de qualquer comando para obter uma saída legível por máquina:

```bash
websketch --json validate capture.json
websketch --json render capture.json
websketch --json fingerprint capture.json
websketch --json diff before.json after.json
```

**Sucesso:** `{ "ok": true, ... }`

**Erro:** `{ "ok": false, "error": { "code": "WS_...", "message": "..." } }`

Os códigos de saída ainda se aplicam no modo JSON – use `$?` ou `set -e` em scripts.

## Códigos de Saída

| Code | Significado |
| ------ | --------- |
| 0 | Sucesso |
| 1 | Erro de validação / dados (JSON inválido, captura inválida, comando desconhecido) |
| 2 | Erro do sistema de arquivos (arquivo não encontrado, permissão negada, erro de E/S) |

## Formato da Captura

Esta CLI funciona com arquivos de captura WebSketch IR (JSON). Crie capturas usando:

- [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) -- Extensão do Chrome para captura de página com um clique.
- [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) -- Crie capturas programaticamente.

## Documentação

| Documento | Descrição |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | Guia detalhado: arquitetura, comandos, padrões de pipeline, integração. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Como contribuir, configuração de desenvolvimento, diretrizes para PRs. |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Padrões da comunidade. |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de lançamentos. |

## Licença

MIT
