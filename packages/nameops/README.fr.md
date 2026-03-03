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

Orchestrateur de vérification des noms pour le [clearance-opinion-engine](https://github.com/mcp-tool-shop-org/clearance-opinion-engine).

Convertit une liste de noms standard en exécutions de vérification par lots, publie des artefacts et génère des résumés de demandes de tirage (pull requests) lisibles par l'homme.

## Fonctionnement

1. `data/names.txt` contient la liste standard des noms à vérifier.
2. `data/profile.json` contient les paramètres par défaut de l'interface de ligne de commande (CLI) du COE (channels, risque, concurrence, etc.).
3. `src/run.mjs` orchestre les opérations suivantes : exécution par lots du COE, publication, validation.
4. `src/build-pr-body.mjs` génère le corps d'une demande de tirage (pull request) au format Markdown, avec des résumés par niveau, des cartes de détection de collisions et des statistiques de coût.
5. Le workflow planifié du dépôt marketing appelle cette logique et ouvre des demandes de tirage (pull requests) avec les artefacts intégrés.

## Utilisation

```bash
# Install the clearance engine
npm install -g @mcptoolshop/clearance-opinion-engine

# Run the pipeline
node src/run.mjs --out artifacts --profile data/profile.json --names data/names.txt

# Build a PR body from the output
node src/build-pr-body.mjs artifacts
```

## Configuration

### `data/names.txt`

Un nom par ligne. Les lignes commençant par `#` sont des commentaires. Maximum 500 noms.

### `data/profile.json`

| Field | Paramètre du COE | Valeur par défaut |
| ------- | ---------- | --------- |
| `channels` | `--channels` | `all` |
| `org` | `--org` | `mcp-tool-shop-org` |
| `dockerNamespace` | `--dockerNamespace` | `mcptoolshop` |
| `hfOwner` | `--hfOwner` | `mcptoolshop` |
| `risk` | `--risk` | `conservative` |
| `radar` | `--radar` | `true` |
| `concurrency` | `--concurrency` | `3` |
| `maxAgeHours` | `--max-age-hours` | `168` (7 jours) |
| `variantBudget` | `--variantBudget` | `12` |
| `fuzzyQueryMode` | `--fuzzyQueryMode` | `registries` |
| `cacheDir` | `--cache-dir` | `.coe-cache` |
| `maxRuntimeMinutes` | Délai d'exécution du workflow | `15` |

## Sortie

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

## Architecture

NameOps est un orchestrateur, pas un service. Il ne possède aucun modèle de données et n'a aucune dépendance d'exécution autre que l'interface de ligne de commande (CLI) du COE. Le dépôt marketing gère la planification (selon les règles définies dans CLAUDE.md) ; NameOps gère la logique.

## Tests

```bash
npm test
```

## Licence

MIT
