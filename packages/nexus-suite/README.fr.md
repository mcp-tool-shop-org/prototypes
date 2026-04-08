<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nexus-suite/readme.png" alt="Nexus Suite" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nexus-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/nexus-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nexus-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Infrastructure de gouvernance, d'attestation et de routage pour les écosystèmes d'outils MCP.**

---

## Aperçu

- **Attestation** : Signer et vérifier les résultats des outils avec `nexus-attest`.
- **Gouvernance** : Définir et appliquer des politiques avec `nexus-control`.
- **Routage** : Diriger les requêtes via des adaptateurs interchangeables avec `nexus-router`.
- **Modulaire** : Six paquets indépendants, utilisez ce dont vous avez besoin.
- **Native Python** : Flux de travail standard `pip install -e .`, `pytest` pour les tests.

---

## Projets

| Paquet | Description |
| --------- | ------------- |
| `nexus-attest` | Signature et vérification de l'attestation. |
| `nexus-control` | Plan de contrôle pour les politiques de gouvernance. |
| `nexus-router` | Routage et distribution des requêtes. |
| `nexus-router-adapter-stdout` | Adaptateur de routeur pour le transport via la sortie standard. |
| `nexus-router-adapter-http` | Adaptateur de routeur pour le transport HTTP. |
| `nexus-router-adapter-template` | Modèle pour la création d'adaptateurs personnalisés. |

---

## Démarrage rapide

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/nexus-suite.git
cd nexus-suite

# Install a component
cd src/nexus-router
pip install -e .

# Run tests
pytest
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     nexus-control                            │
│              (governance policies, config)                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     nexus-router                             │
│              (request dispatch + routing)                    │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   stdout    │      │    http     │      │  (custom)   │
│   adapter   │      │   adapter   │      │   adapter   │
└─────────────┘      └─────────────┘      └─────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     nexus-attest                             │
│              (signature verification)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Licence

[MIT](LICENSE)
