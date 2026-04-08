<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/edgepacks/readme.png" width="400" alt="EdgePacks" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/actions"><img src="https://github.com/mcp-tool-shop-org/edgepacks/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/edgepacks/"><img src="https://img.shields.io/badge/docs-landing%20page-brightgreen" alt="Landing Page" /></a>
</p>

Plateforme de création de jeux de données pour l'entraînement de petits modèles sur des tâches spécifiques.

## Qu'est-ce que c'est ?

Une bibliothèque de jeux de données structurés, de haute qualité et exempts de problèmes de licence, conçus pour des tâches spécifiques. Chaque jeu de données comprend des règles de génération, des règles de validation, des ensembles d'évaluation et des chemins d'exportation pour les plateformes de réglage fin courantes.

## Ce que ce n'est PAS

- Un ensemble de données générique.
- Un wrapper pour HuggingFace.
- Un framework d'entraînement.

## Installation

```bash
pip install edgepacks
```

## Démarrage rapide

```bash
# List available packs
edgepacks list

# Inspect a pack
edgepacks info tool-routing

# Build a dataset (requires Ollama running locally)
edgepacks build tool-routing --count 2000 --model qwen2.5:7b

# Export for your trainer
edgepacks export tool-routing --format unsloth --output ./data/
```

## Lancement des jeux de données

| Jeu de données | Tâche | Ce que cela entraîne |
|------|------|---------------|
| `tool-routing` | Classification | Requête en langage naturel → outil approprié + arguments |
| `structured-extraction` | Extraction | Texte non structuré → JSON structuré |
| `error-triage` | Classification | Journaux d'erreurs → cause + gravité + prochaine étape |

## Architecture

Trois couches :

1. **Schéma** — Spécification formelle de ce qu'est un jeu de données.
2. **Plateforme de création** — Outils pour créer, valider et diviser les jeux de données.
3. **Distribution** — Interface en ligne de commande (CLI) + export vers JSONL, HuggingFace, Unsloth, torchtune.

## Chaque jeu de données comprend :

- Définition de la tâche + schéma canonique.
- Divisions d'entraînement / validation / test.
- Exemples positifs et exemples négatifs difficiles.
- Recette de génération (synthétique via Ollama).
- Validateur qui rejette les lignes mal formées ou avec un faible signal.
- Ensemble d'évaluation qui teste la compétence réelle après le réglage fin.
- Export vers des formats qui s'intègrent directement aux outils courants.

## Sécurité et confidentialité

**Données utilisées :** Fichiers `.json` / `.jsonl` locaux dans les répertoires de sortie spécifiés par l'utilisateur. Les exemples initiaux sont inclus dans le package. Les exemples générés sont écrits dans `./output/` ou un chemin que vous spécifiez.

**Réseau :** HTTP uniquement vers Ollama local (`localhost:11434`) pour la génération synthétique. Pas d'API cloud, pas de télémétrie, pas d'analyses. Fonctionne entièrement hors ligne une fois qu'Ollama est disponible.

**Données NON utilisées :** Pas de fichiers d'informations d'identification, pas de fichiers système, pas de variables d'environnement. Ne lit ni n'écrit en dehors du répertoire de sortie que vous spécifiez.

**Aucune télémétrie** n'est collectée ou envoyée.

## Plateformes

- Python 3.11+
- Fonctionne sur Linux, macOS, Windows
- Ollama requis uniquement pour les commandes `generate`, `mutate` et `build`.

## Licence

MIT

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
