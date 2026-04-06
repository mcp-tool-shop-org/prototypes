<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/witness/readme.png" alt="Witness" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/witness/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/witness/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/xrpl-witness/"><img src="https://img.shields.io/pypi/v/xrpl-witness" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/witness/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Status: v0.1.0 — Fase 1 concluída, Fase 2A implementada**

Um diário de eventos criptograficamente verificável, com adição contínua de informações, projetado para o trabalho entre humanos e inteligência artificial.

## O que você pode fazer hoje

```bash
# Generate a testimony report
witness testify --format json --emit-artifact ./output

# Verify events cryptographically
witness verify

# Include exact stored JSON for deep audits
witness testify --format json --include-events
```

**Terceiros podem validar depoimentos sem o Witness instalado** — o esquema JSON e as regras de verificação estão totalmente documentados.

## Por que isso é importante

O Witness cria trilhas de evidências portáteis:
- **Determinístico**: Mesmas entradas → mesmos bytes de saída (use `--generated-at` para reprodutibilidade)
- **Verificável**: Assinaturas Ed25519 + digests SHA-256 sobre JSON canônico
- **Portátil**: Envie por e-mail, anexe a tickets, inclua em um repositório
- **Exato**: `--include-events` incorpora o conteúdo do armazenamento byte a byte

## Início rápido

```bash
# Install
pip install cryptography

# Initialize a store
witness init

# Record an event
witness record --action "example.action" --intent "Demonstrate recording"

# Generate testimony
witness testify --format md

# Verify all events
witness verify
```

## Modelo de confiança

Todas as operações criptográficas usam **JSON canônico** → **digests SHA-256** → **assinaturas Ed25519**.

Consulte [VERIFICATION.md](VERIFICATION.md) para:
- Regras exatas de serialização
- Exemplos de verificação
- Códigos de saída (0 = sucesso, 2 = avisos, 3 = falha criptográfica)
- Notas de privacidade para `--include-events`

## Garantias estáveis

| Artefato | Localização | Contrato |
|----------|----------|----------|
| Esquema de eventos | Testes de referência | `tests/fixtures/golden/*.json` |
| Esquema de depoimentos | `schemas/testimony.schema.v0.1.json` | Estrutura da saída JSON |
| Códigos de saída | [VERIFICATION.md](VERIFICATION.md) | Semântica de 0/2/3 |
| Flags | [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | 4 tipos de flags, apenas informativos |

## Documentação

> **Comece aqui:** [CONTRACT.md](CONTRACT.md) — O que é lei vs. exemplo

| Documento | Propósito |
|----------|---------|
| [CONTRACT.md](CONTRACT.md) | Conteúdo normativo vs. exemplo |
| [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | Invariantes fixos |
| [VERIFICATION.md](VERIFICATION.md) | Regras criptográficas + exemplos |
| [docs/](docs/README.md) | Índice completo da documentação |

## Status da Fase 2

| Track | Status |
|-------|--------|
| **2A: Depoimento como Artefato** | ✅ Implementado |
| **2B: Pipelines (Fluxos de Trabalho)** | ⏸️ Pausado ([RFC](docs/RFC_PHASE2_PIPELINES.md)) |
| 2C–2E | Não iniciado |

Consulte [docs/PHASE2_STATUS.md](docs/PHASE2_STATUS.md) para detalhes.

## Estrutura do projeto

```
witness/
├── src/witness/           # Core library
│   ├── canon.py           # Canonical JSON
│   ├── crypto.py          # Ed25519 signing/verification
│   ├── storage.py         # SQLite append-only store
│   ├── timeline.py        # Flag analysis
│   ├── testify.py         # Testimony generation
│   └── cli.py             # Command-line interface
├── schemas/               # JSON schemas
├── tests/                 # Test suite (124 tests)
│   └── fixtures/golden/   # Authoritative fixtures
├── tools/                 # Verification utilities
└── docs/                  # Documentation + ADRs
```

## Filosofia

> O Witness é sobre veracidade, não sobre julgamento.
> Registre o que aconteceu. Verifique mais tarde. Deixe que os humanos decidam o que isso significa.

## Licença

MIT — consulte [LICENSE](LICENSE).
