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

**Stato: v0.1.0 — Fase 1 completata, Fase 2A rilasciata**

Un registro di eventi crittograficamente verificabile, basato su dati locali e con aggiunte successive, per la collaborazione tra esseri umani e intelligenza artificiale.

## Cosa puoi fare oggi

```bash
# Generate a testimony report
witness testify --format json --emit-artifact ./output

# Verify events cryptographically
witness verify

# Include exact stored JSON for deep audits
witness testify --format json --include-events
```

**Terze parti possono validare le testimonianze senza installare Witness** — lo schema JSON e le regole di verifica sono completamente documentati.

## Perché è importante

Witness crea percorsi di verifica portabili:
- **Deterministico**: Stessi input → stessi byte di output (utilizzare `--generated-at` per la riproducibilità)
- **Verificabile**: Firme Ed25519 + digest SHA-256 su JSON canonico
- **Portabile**: Inviarlo via email, allegarlo a ticket, integrarlo in un repository
- **Esatto**: `--include-events` include il contenuto dello storage byte per byte

## Guida rapida

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

## Modello di fiducia

Tutte le operazioni crittografiche utilizzano **JSON canonico** → **digest SHA-256** → **firme Ed25519**.

Consultare [VERIFICATION.md](VERIFICATION.md) per:
- Regole di serializzazione esatte
- Esempi di verifica funzionanti
- Codici di uscita (0 = pulito, 2 = flag, 3 = errore crittografico)
- Note sulla privacy per `--include-events`

## Garanzie stabili

| Artefatto | Posizione | Contratto |
|----------|----------|----------|
| Schema degli eventi | Test di esempio | `tests/fixtures/golden/*.json` |
| Schema delle testimonianze | `schemas/testimony.schema.v0.1.json` | Struttura dell'output JSON |
| Codici di uscita | [VERIFICATION.md](VERIFICATION.md) | Semantica di 0/2/3 |
| Flags | [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | 4 tipi di flag, solo informativi |

## Documentazione

> **Inizia qui:** [CONTRACT.md](CONTRACT.md) — Cosa è la legge rispetto a un esempio

| Documento | Scopo |
|----------|---------|
| [CONTRACT.md](CONTRACT.md) | Contenuto normativo rispetto a esempi |
| [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | Invarianti bloccate |
| [VERIFICATION.md](VERIFICATION.md) | Regole crittografiche + esempi funzionanti |
| [docs/](docs/README.md) | Indice completo della documentazione |

## Stato della Fase 2

| Track | Stato |
|-------|--------|
| **2A: Testimonianza come artefatto** | ✅ Rilasciata |
| **2B: Pipeline** | ⏸️ In pausa ([RFC](docs/RFC_PHASE2_PIPELINES.md)) |
| 2C–2E | Non ancora iniziata |

Consultare [docs/PHASE2_STATUS.md](docs/PHASE2_STATUS.md) per i dettagli.

## Struttura del progetto

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

> Witness riguarda la veridicità, non il giudizio.
> Registra ciò che è accaduto. Verificalo in seguito. Lascia che gli esseri umani decidano cosa significa.

## Licenza

MIT — vedere [LICENSE](LICENSE).
