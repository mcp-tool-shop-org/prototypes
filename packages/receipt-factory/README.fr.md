<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" alt="receipt-factory">
</p>

<p align="center">
  Receipts are how we prove work happened — without trusting vibes.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/receipt-factory/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

Un reçu est un enregistrement signé, horodaté et reproductible de **ce qui s'est passé** :

- **Ce qui a été fait** — actions, entrées, sorties
- **Pourquoi cela a été fait** — intention, politique, contexte
- **Qui/quoi l'a fait** — acteur, exécution, versions des outils
- **Preuve que cela s'est produit** — hachages, liens, sommes de contrôle, journaux
- **Comment vérifier cela** — commandes, instructions de réexécution

Vous pouvez lire un reçu en 30 secondes et le vérifier en 2 minutes. Tout est reproductible. Si ce n'est pas le cas, ce n'est pas un reçu.

## Paquets

| Paquet | Description |
|---------|-------------|
| [`@receipt-factory/core`](packages/core) | Schéma de reçu, normalisation, hachage SHA-256, API de construction fluide |
| [`@receipt-factory/render`](packages/render) | Rendu Markdown et HTML autonome |
| [`@receipt-factory/verify`](packages/verify) | Validation de schéma, intégrité des hachages, vérification des liens, application des politiques |
| [`@receipt-factory/sign`](packages/sign) | Signature basée sur Cosign — reçus, politiques, ensembles (modules complémentaires détachés) |
| [`@receipt-factory/evidence`](packages/evidence) | Ensembles de preuves — ensembles de preuves portables et adressables par contenu |
| [`@receipt-factory/index`](packages/index) | Index de reçus — analyse, recherche, filtrage des répertoires de reçus |
| [`@receipt-factory/policy`](packages/policy) | Ensembles de politiques — configuration de lint portable et versionnée |
| [`@receipt-factory/bundle`](packages/bundle) | Ensembles de reçus — capsules de vérité auto-vérifiantes (zip) |
| [`@receipt-factory/adapter-github`](packages/adapters/github) | Récupération des données GitHub Actions via l'interface de ligne de commande `gh` |
| [`@receipt-factory/cli`](apps/factory-cli) | La commande `rf` — création, collecte, rendu, vérification, signature des reçus |

## Pipelines

| Pipeline | Type de reçu | Ce qu'il prouve |
|----------|-------------|----------------|
| [`ci-receipts`](pipelines/ci-receipts) | `ci_run` | Une construction/un test CI s'est déroulé avec des entrées et des résultats spécifiques |
| [`release-receipts`](pipelines/release-receipts) | `release` | Une publication a été effectuée avec des actifs et des commits spécifiques |
| [`registry-sync`](pipelines/registry-sync) | `registry_sync` | Ce qui est publié par rapport à ce qui se trouve dans le dépôt — classification de la dérive |
| [`security-audit`](pipelines/security-audit) | `audit` | Ce qui a été analysé, avec quel outil, quelles vulnérabilités ont été détectées |
| [`sbom`](pipelines/sbom) | `sbom` | Liste de matériaux logiciels générée et attestée |

## Démarrage rapide

```bash
# Install the CLI
npm install -g @receipt-factory/cli

# Create a receipt from a GitHub Actions run
rf make ci --from github --run 12345678

# Render it
rf render receipts/ci/2026-03-03/12345678.json --format html

# Verify it
rf verify receipts/ci/2026-03-03/12345678.json

# Verify with strict lint + policy
rf verify receipts/ci/2026-03-03/12345678.json --strict --policy policy.json

# Bundle receipts into a portable capsule
rf bundle create receipts/ci/2026-03-03/12345678.json --follow --policy policy.json

# Sign the bundle
rf bundle sign bundles/abc123.bundle.zip --keyless
```

## Couches de confiance

receipt-factory fournit quatre couches de confiance superposables :

1. **Intégrité du reçu** — reçus adressables par contenu (hachage SHA-256) (empêchant toute modification)
2. **Intégrité de la gouvernance** — règles de lint basées sur des politiques avec des fichiers de politique signés
3. **Intégrité de l'ensemble** — ensembles zip auto-vérifiants avec manifestes de hachage
4. **Autorité de l'ensemble** — signatures Cosign détachées sur les ensembles (empêchant toute modification)

Ordre de vérification : signature → intégrité du fichier → intégrité sémantique → gouvernance.

## Ce que cela prouve

- Une construction, un test, une publication, un audit ou une génération de SBOM a eu lieu à un moment précis
- Les entrées et les sorties sont adressables par contenu et ne peuvent pas être modifiées
- Vous pouvez vérifier le reçu à tout moment avec `rf verify`
- La chaîne de provenance complète est accessible avec `rf graph`

## Ce que cela NE prouve PAS

- Que le code sous-jacent est correct (les reçus prouvent le processus, pas la qualité)
- Que l'environnement CI lui-même n'a pas été compromis (c'est un problème de chaîne d'approvisionnement)
- Que les artefacts n'ont pas été modifiés après la création du reçu (utilisez la signature pour cela)

## Sécurité

Consultez [SECURITY.md](SECURITY.md) pour le modèle de menace et le signalement.

**Aucune télémétrie.** receipt-factory ne communique jamais avec un serveur distant, ne suit pas l'utilisation ni ne collecte d'analyses.

## Licence

MIT

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
