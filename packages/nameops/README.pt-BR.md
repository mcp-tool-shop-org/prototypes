<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nameops/readme.png" alt="NameOps" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml"><img src="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nameops/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

Orquestrador de verificação de nomes para o [clearance-opinion-engine](https://github.com/mcp-tool-shop-org/clearance-opinion-engine).

Converte uma lista de nomes canônicos em execuções de verificação em lote, artefatos publicados e resumos de pull requests (PRs) legíveis por humanos.

## Como funciona

1. `data/names.txt` contém a lista canônica de nomes a serem verificados.
2. `data/profile.json` contém as flags padrão da interface de linha de comando (CLI) do COE (canais, risco, concorrência, etc.).
3. `src/run.mjs` orquestra: lote do COE, publicação, validação.
4. `src/build-pr-body.mjs` gera um corpo de Markdown para o PR, com resumos de níveis, cartões de colisão e estatísticas de custo.
5. O fluxo de trabalho agendado do repositório de marketing chama essa lógica e abre PRs com os artefatos incluídos.

## Uso

```bash
# Install the clearance engine
npm install -g @mcptoolshop/clearance-opinion-engine

# Run the pipeline
node src/run.mjs --out artifacts --profile data/profile.json --names data/names.txt

# Build a PR body from the output
node src/build-pr-body.mjs artifacts
```

## Configuração

### `data/names.txt`

Um nome por linha. As linhas que começam com `#` são comentários. Máximo de 500 nomes.

### `data/profile.json`

| Field | Flag do COE | Padrão |
| ------- | ---------- | --------- |
| `channels` | `--channels` | `all` |
| `org` | `--org` | `mcp-tool-shop-org` |
| `dockerNamespace` | `--dockerNamespace` | `mcptoolshop` |
| `hfOwner` | `--hfOwner` | `mcptoolshop` |
| `risk` | `--risk` | `conservative` |
| `radar` | `--radar` | `true` |
| `concurrency` | `--concurrency` | `3` |
| `maxAgeHours` | `--max-age-hours` | `168` (7 dias) |
| `variantBudget` | `--variantBudget` | `12` |
| `fuzzyQueryMode` | `--fuzzyQueryMode` | `registries` |
| `cacheDir` | `--cache-dir` | `.coe-cache` |
| `maxRuntimeMinutes` | tempo limite do fluxo de trabalho | `15` |

## Saída

```
artifacts/
  metadata.json           # Run metadata (date, duration, counts)
  pr-body.md              # Markdown PR body
  batch/                  # Raw COE batch output
  published/              # Published artifacts (for marketing site)
    runs.json             # Index of all runs
    <slug>/
      report.html
      summary.json
      clearance-index.json
      run.json
```

## Arquitetura

NameOps é um orquestrador, não um serviço. Ele não possui nenhum modelo de dados e não tem dependências de tempo de execução além da CLI do COE. O repositório de marketing possui o agendamento (de acordo com as regras do CLAUDE.md); o nameops possui a lógica.

## Testes

```bash
npm test
```

## Licença

MIT
