<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# Training Studio

[![CI](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/mcp-tool-shop-org/training-studio)](LICENSE)
[![Landing Page](https://img.shields.io/badge/Landing_Page-live-blue)](https://mcp-tool-shop-org.github.io/training-studio/)

**Entraînez des modèles d'apprentissage automatique directement dans votre navigateur. Sans cloud. Sans téléchargement de données. Sans configuration de Python.**

Training Studio est une application d'entraînement ML basée sur TensorFlow.js qui fonctionne entièrement localement. Vos données ne quittent jamais votre appareil.

## Pourquoi choisir Training Studio ?

| Problème | Solution |
| --------- | ---------- |
| Difficultés liées à l'environnement Python | **Configuration nulle** - ouvrez simplement l'application et entraînez votre modèle |
| Préoccupations concernant la confidentialité avec le ML en cloud | **100% local** - vos données ne quittent jamais votre appareil |
| Outils ML complexes | **Flux de travail simple** - importez un fichier CSV, obtenez un modèle entraîné |
| Cycles d'itération lents | **Retour d'information en temps réel** - graphiques et métriques en direct |

## Fonctionnalités

### Entraînement de base
- **Chargement de jeux de données CSV** - Détection automatique des caractéristiques/étiquettes
- **Configuration de modèles MLP** - Couches cachées, fonctions d'activation, dropout
- **Graphiques d'entraînement en temps réel** - Visualisation de la perte et de la précision
- **Arrêt anticipé** - Détection automatique de la convergence
- **Accélération GPU** - WebGPU/WebGL pour un entraînement rapide

### Évaluation et Prédiction
- **Matrice de confusion** - Visualisation des performances de classification
- **Métriques par classe** - Précision, rappel, score F1
- **Prédictions individuelles** - Test de chaque échantillon
- **Inférence par lots** - Prédiction sur des fichiers CSV
- **Exportation des résultats** - Téléchargement des prédictions au format CSV

### Outils de données
- **Prétraitement** - Normalisation, gestion des valeurs manquantes
- **Encodage one-hot** - Conversion automatique des données catégorielles
- **Division entraînement/test** - Pourcentage de validation configurable
- **Historique de l'entraînement** - Comparaison des exécutions, recherche des meilleurs modèles

### Prêt pour la production
- **283 tests** - Couverture de test complète
- **Accessible** - Conforme aux normes WCAG 2.1 AA
- **Adaptatif** - Fonctionne sur les tablettes et les mobiles
- **Fonctionnement hors ligne** - Aucune connexion Internet requise après l'installation

## Installation

### À partir du code source

```bash
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web
npm install
npm run build
```

## Guide de démarrage rapide

### Validation d'un paquet (30 secondes)

```bash
# From source
npm run validate ./src/tests/fixtures/golden-v1

# JSON output
training-studio validate --json ./my-bundle
```

### Sortie JSON

```json
{
  "ok": true,
  "exit_code": 0,
  "bundle_id": "00000000-0000-4000-8000-000000000001",
  "bundle_digest": "719823b86e10fe388aa8a9b14cb135624e73c253dc69f5065f78871403c3df3f",
  "version": "0.1",
  "schema_uri": "https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json",
  "schema_version": "0.1",
  "errors": [],
  "warnings": [],
  "stats": {
    "files_total": 7,
    "artifacts_listed": 6,
    "artifacts_verified": 6
  }
}
```

### Codes de sortie

| Code | Signification |
| ------ | --------- |
| 0 | Paquet valide |
| 2 | Paquet valide avec avertissements |
| 3 | Paquet invalide |

## Format du paquet

Consultez [SPEC.md](SPEC.md) pour la spécification complète du paquet.

### Structure des répertoires

```
bundle/
├── bundle.json           # Manifest
├── model/
│   ├── model.json        # TF.js topology
│   └── weights.bin       # Model weights
├── metrics/
│   ├── metrics.jsonl     # Per-epoch metrics
│   └── summary.json      # Training summary
├── config/
│   └── run_config.json   # Hyperparameters
└── data/
    └── schema.json       # Feature/label schema
```

## Démarrage rapide (application Web)

```bash
cd TrainingStudio.Web
npm install
npm run dev
```

Ouvrez ensuite http://localhost:5173 dans votre navigateur.

### Essayez avec des données d'exemple

1. Cliquez sur l'onglet **Dataset**
2. Chargez `sample_data/iris.csv`
3. Sélectionnez les caractéristiques : sepal_length, sepal_width, petal_length, petal_width
4. Sélectionnez l'étiquette : species
5. Allez dans l'onglet **Model**, utilisez les valeurs par défaut (64, 32 couches cachées)
6. Allez dans l'onglet **Train**, cliquez sur **Start Training**
7. Observez les graphiques se mettre à jour en temps réel !

## Application de bureau (Windows)

```bash
cd TrainingStudio.Web && npm run build
cd ../TrainingStudio.App
dotnet build -c Release
dotnet run
```

Nécessite Windows 10 1809+, 4 Go de RAM (8 Go recommandés), GPU avec WebGL 2.0 ou WebGPU (facultatif, repli sur le CPU).

## Développement

```bash
cd TrainingStudio.Web

# Run all 283 tests
npm test

# Watch mode
npm test -- --watch

# Build production web app
npm run build
```

## Documentation

| Document | Description |
| ---------- | ------------- |
| [SPEC.md](SPEC.md) | Spécification du format du paquet |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Problèmes courants et solutions |
| [CHANGELOG.md](CHANGELOG.md) | Historique des versions |
| [ROADMAP.md](ROADMAP.md) | Feuille de route du développement |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Comment contribuer |

## Ensembles de données d'exemple

| File | Task | Fonctionnalités | Classes |
| ------ | ------ | ---------- | --------- |
| `sample_data/iris.csv` | Classification multi-classe | 4 | 3 |
| `sample_data/binary_classification.csv` | Classification binaire | 2 | 2 |

## Confidentialité et sécurité

- **Aucune collecte de données** : Vos données restent sur votre appareil.
- **Pas de télémétrie** : Nous ne suivons pas l'utilisation.
- **Fonctionne hors ligne** : Fonctionne sans connexion internet.
- **Open source** : Vous pouvez auditer le code vous-même.

Consultez les fichiers [PRIVACY.md](PRIVACY.md) et [SECURITY.md](SECURITY.md) pour plus de détails.

## Licence

MIT - Consultez le fichier [LICENSE](LICENSE) pour plus de détails.

---

Créé par [MCP Tool Shop](https://mcp-tool-shop.github.io/)
