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

**Statut : v0.1.0 — Phase 1 terminée, Phase 2A livrée**

Un journal d'événements cryptographiquement vérifiable, conçu pour être utilisé localement et ne permettant que l'ajout de nouvelles données, pour la collaboration entre humains et IA.

## Ce que vous pouvez faire aujourd'hui

```bash
# Generate a testimony report
witness testify --format json --emit-artifact ./output

# Verify events cryptographically
witness verify

# Include exact stored JSON for deep audits
witness testify --format json --include-events
```

**Les tiers peuvent valider les témoignages sans avoir Witness installé** — le schéma JSON et les règles de vérification sont entièrement documentés.

## Pourquoi cela compte

Witness crée des chaînes de preuves portables :
- **Déterministe** : Les mêmes entrées produisent les mêmes octets de sortie (utilisez `--generated-at` pour la reproductibilité).
- **Vérifiable** : Signatures Ed25519 + sommes de contrôle SHA-256 sur du JSON canonique.
- **Portable** : Envoyez-le par e-mail, joignez-le à des tickets, intégrez-le dans un dépôt.
- **Exact** : `--include-events` inclut le contenu du stockage byte par byte.

## Démarrage rapide

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

## Modèle de confiance

Toutes les opérations cryptographiques utilisent du **JSON canonique** → des **sommes de contrôle SHA-256** → des **signatures Ed25519**.

Consultez [VERIFICATION.md](VERIFICATION.md) pour :
- Les règles de sérialisation exactes.
- Des exemples de vérification fonctionnels.
- Les codes de sortie (0 = succès, 2 = avertissements, 3 = échec cryptographique).
- Les notes de confidentialité pour `--include-events`.

## Garanties stables

| Artefact | Emplacement | Contrat |
|----------|----------|----------|
| Schéma des événements | Tests unitaires | `tests/fixtures/golden/*.json` |
| Schéma des témoignages | `schemas/testimony.schema.v0.1.json` | Structure de la sortie JSON |
| Codes de sortie | [VERIFICATION.md](VERIFICATION.md) | Sémantique de 0/2/3 |
| Flags | [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | 4 types de drapeaux, à titre informatif uniquement. |

## Documentation

> **Commencez ici :** [CONTRACT.md](CONTRACT.md) — Qu'est-ce que la loi par rapport à un exemple.

| Document | Objectif |
|----------|---------|
| [CONTRACT.md](CONTRACT.md) | Contenu normatif vs exemples |
| [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | Invariants verrouillés |
| [VERIFICATION.md](VERIFICATION.md) | Règles cryptographiques + exemples fonctionnels |
| [docs/](docs/README.md) | Index complet de la documentation |

## Statut de la phase 2

| Track | Statut |
|-------|--------|
| **2A : Témoignage en tant qu'artefact** | ✅ Livré |
| **2B : Pipelines** | ⏸️ En pause ([RFC](docs/RFC_PHASE2_PIPELINES.md)) |
| 2C–2E | Non démarré |

Consultez [docs/PHASE2_STATUS.md](docs/PHASE2_STATUS.md) pour plus de détails.

## Structure du projet

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

## Philosophie

> Witness vise la véracité, pas le jugement.
> Enregistrez ce qui s'est passé. Vérifiez-le plus tard. Laissez les humains décider de sa signification.

## Licence

MIT — voir [LICENSE](LICENSE).
