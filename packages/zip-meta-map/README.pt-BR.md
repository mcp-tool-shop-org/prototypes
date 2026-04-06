<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/zip-meta-map/readme.png" width="400" />
</p>

<p align="center">
  Turn a ZIP or folder into a guided, LLM-friendly metadata bundle.<br>
  <strong>Map + Route + Guardrails</strong> — inside the archive itself.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://pypi.org/project/zip-meta-map/"><img src="https://img.shields.io/pypi/v/zip-meta-map" alt="PyPI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/zip-meta-map" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/zip-meta-map/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## O que ele faz

zip-meta-map gera uma camada de metadados determinística que responde a três perguntas para agentes de IA:

- **O que está aqui?** — inventário de arquivos classificados por função, com níveis de confiança.
- **O que é mais importante?** — lista classificada de "começar aqui" com trechos.
- **Como navegar sem me perder no contexto?** — planos de navegação com limites de uso de dados.

## Demonstração rápida

```bash
$ zip-meta-map build my-project/ -o output/ --summary

Wrote META_ZIP_FRONT.md and META_ZIP_INDEX.json to output/
  Profile:  python_cli
  Files:    47
  Modules:  8
  Flagged:  2 file(s) with risk flags
```

```bash
$ zip-meta-map explain my-project/

Profile:  python_cli
Files:    47

Top files to read first:
  README.md                     [doc]        conf=0.95  README is primary documentation
  src/app/main.py               [entrypoint] conf=0.95  matches profile entrypoint pattern
  pyproject.toml                [config]     conf=0.95  Python project configuration

Overview plan:
  Quick orientation — what is this tool and how is it structured?
  1. READ README.md for project purpose and usage
  2. READ pyproject.toml for dependencies and entry points
  3. READ entrypoint file to understand CLI structure
  Budget: ~32 KB
```

Veja a [demonstração completa](examples/tiny_python_cli/) para um exemplo completo.

## Instalação

```bash
pip install zip-meta-map
```

Ou com [pipx](https://pipx.pypa.io/):

```bash
pipx install zip-meta-map
```

A partir do código-fonte:

```bash
git clone https://github.com/mcp-tool-shop-org/zip-meta-map
cd zip-meta-map
pip install -e ".[dev]"
```

## Ação do GitHub

Use zip-meta-map em CI com a ação composta:

```yaml
- name: Generate metadata map
  uses: mcp-tool-shop-org/zip-meta-map@v0
  with:
    path: .
```

Isso instala a ferramenta, gera metadados e escreve um resumo da etapa. As saídas incluem `index-path`, `front-path`, `profile`, `file-count` e `warnings-count`. Defina `pr-comment: 'true'` para postar o resumo como um comentário no PR.

Veja [examples/github-action/](examples/github-action/) para um fluxo de trabalho completo.

## O que ele gera

| Arquivo | Propósito |
| ------ | --------- |
| `META_ZIP_FRONT.md` | Página de orientação legível por humanos |
| `META_ZIP_INDEX.json` | Índice legível por máquinas (funções, níveis de confiança, planos, trechos, indicadores de risco) |
| `META_ZIP_REPORT.md` | Relatório detalhado e navegável (com `--report md`) |

## Referência da linha de comando

```bash
# Build metadata for a folder or ZIP
zip-meta-map build path/to/repo -o output/
zip-meta-map build archive.zip -o output/

# Build with step summary and report
zip-meta-map build . -o output/ --summary --report md

# Output formats for piping
zip-meta-map build . --format json          # JSON to stdout
zip-meta-map build . --format ndjson        # one JSON line per file
zip-meta-map build . --manifest-only        # skip FRONT.md

# Explain what the tool detected
zip-meta-map explain path/to/repo
zip-meta-map explain path/to/repo --json

# Compare two indices (CI-friendly)
zip-meta-map diff old.json new.json             # human-readable
zip-meta-map diff old.json new.json --json       # JSON output
zip-meta-map diff old.json new.json --exit-code  # exit 1 if changes

# Validate an existing index
zip-meta-map validate META_ZIP_INDEX.json

# Policy overrides
zip-meta-map build . --policy META_ZIP_POLICY.json -o output/
```

## Perfis

Detectados automaticamente pela estrutura do repositório. Perfis padrão atuais:

| Perfil | Detectado por | Planos |
| --------- | ------------ | ------- |
| `python_cli` | `pyproject.toml`, `setup.py` | Visão geral, depuração, adição de recurso, revisão de segurança, análise aprofundada |
| `node_ts_tool` | `package.json`, `tsconfig.json` | Visão geral, depuração, adição de recurso, revisão de segurança, análise aprofundada |
| `monorepo` | `pnpm-workspace.yaml`, `lerna.json` | Visão geral, depuração, adição de recurso, revisão de segurança, análise aprofundada |

Veja [docs/PROFILES.md](docs/PROFILES.md).

## Funções e níveis de confiança

Cada entrada de arquivo inclui uma **função** (vocabulário limitado), um **nível de confiança** (0.0–1.0) e um **motivo**.

| Nível | Intervalo | Significado |
| ------ | ------- | --------- |
| Alto | >= 0.9 | Forte indicação estrutural (correspondência do nome do arquivo, ponto de entrada do perfil) |
| Bom | >= 0.7 | Correspondência de padrão (convenção de diretório, extensão + localização) |
| Regular | >= 0.5 | Apenas extensão ou sinal posicional fraco |
| Baixo | < 0.5 | Atribuído como "desconhecido"; o motivo explica a ambiguidade |

## Divulgação progressiva (v0.2)

- **Mapas de trechos** para arquivos > 32 KB — IDs estáveis, intervalos de linhas, títulos
- **Resumos de módulos** — distribuição de funções por nível de diretório e arquivos-chave
- **Trechos** — as primeiras linhas de arquivos de alto valor
- **Indicadores de risco** — exec_shell, secrets_like, network_io, path_traversal, binary_masquerade, binary_executable
- **Capacidades** — `capabilities[]` anuncia quais recursos opcionais estão disponíveis

## Estabilidade

- A versão da especificação segue regras semelhantes ao semver: pequenas atualizações adicionam campos, grandes atualizações quebram os consumidores.
- `capabilities[]` é o mecanismo oficial de negociação de recursos.
- Consumidores mais antigos que ignoram campos desconhecidos continuarão a funcionar com pequenas atualizações.
- Veja [docs/SPEC.md](docs/SPEC.md) para o contrato completo.

## Estrutura do repositório

```
src/zip_meta_map/
  cli.py        # argparse CLI (build, explain, diff, validate)
  builder.py    # scan -> index -> validate -> write
  diff.py       # index comparison (diff command)
  report.py     # GitHub step summary + detailed report
  scanner.py    # directory + ZIP scanning with SHA-256
  roles.py      # role assignment heuristics + confidence
  profiles.py   # built-in profiles + traversal plans
  chunker.py    # deterministic text chunking
  modules.py    # folder-level module summaries
  safety.py     # risk flag detection + warning generation
  schema/       # JSON Schemas and loaders
docs/
  SPEC.md       # v0.2 contract (format semantics)
  PROFILES.md   # profile behaviors + plans
examples/
  tiny_python_cli/   # golden demo output
  github-action/     # consumer workflow example
tests/
  fixtures/     # tiny fixture repos
```

## Contribuições

Este projeto é pequeno por design. Se você contribuir:

- Manter as heurísticas determinísticas.
- Manter os papéis bem definidos, e adicionar detalhes nas tags.
- Adicionar testes para qualquer nova heurística.
- Não flexibilizar os esquemas sem atualizar a documentação/SPEC.md e os exemplos.

```bash
pytest
```

## Documentação

- [Especificação (v0.2)](docs/SPEC.md) — o contrato para todos os arquivos gerados.
- [Perfis](docs/PROFILES.md) — perfis de tipos de projeto integrados.
- [Segurança](SECURITY.md) — relatório de vulnerabilidades.

## Licença

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
