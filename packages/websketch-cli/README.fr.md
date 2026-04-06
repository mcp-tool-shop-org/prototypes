<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh.md">中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.it.md">Italiano</a> ·
  <a href="README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-cli/readme.png" alt="WebSketch CLI" width="400"></p>

<p align="center"><strong>CLI for WebSketch IR — render, diff, and fingerprint web UI captures so LLMs and CI pipelines can reason about what users see.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/websketch"><img src="https://img.shields.io/npm/v/@mcptoolshop/websketch.svg" alt="npm version"></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT">
  <a href="https://mcp-tool-shop-org.github.io/websketch-cli/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

## Aperçu

- **Rendu ASCII** : Convertissez n'importe quelle capture WebSketch en une disposition de dessin de boîtes qui s'intègre dans un terminal ou une fenêtre de contexte de LLM.
- **Empreinte structurelle** : Calculez une empreinte du layout d'une page afin de détecter les modifications sans comparer les pixels.
- **Différentiel sémantique** : Comparez deux captures et obtenez un rapport de modifications classé (ajouté, déplacé, redimensionné, texte modifié).
- **Emballage en lot** : Combinez des captures (et éventuellement un différentiel) dans un seul fichier `.ws.json` partageable.
- **Priorité aux pipelines** : Chaque commande prend en charge la sortie `--json` et les codes de sortie déterministes pour les scripts d'intégration continue.
- **Mode optimisé pour les LLM** : L'option `--llm` génère une sortie riche en métadonnées, conçue pour être utilisée par les agents.

## Installation

```bash
pnpm add -g @mcptoolshop/websketch
```

Ou exécutez sans installation :

```bash
npx @mcptoolshop/websketch render capture.json
```

## Commandes

### validate

Vérifie qu'un fichier de capture est conforme au schéma WebSketch IR.

```bash
websketch validate capture.json
```

### render-ascii

Convertit une capture en art ASCII (lisible par les LLM).

```bash
# Default 80x24 grid
websketch render-ascii capture.json

# LLM-optimized format with metadata and legend
websketch render-ascii --llm capture.json

# Custom dimensions
websketch render-ascii --width 120 --height 40 capture.json

# Minimal structure-only view
websketch render-ascii --structure capture.json
```

**Exemple de sortie :**

```
+---------------------------------------------------------------------------+
|[NAV:primary_nav]                                                          |
+---------------------------------------------------------------------------+
|                    +----------------------------------------+             |
|                    |[FRM:login]                             |             |
|                    |  [INP:email]                           |             |
|                    |  [INP:password]                        |             |
|                    |  [BTN:primary_cta]                     |             |
|                    +----------------------------------------+             |
+---------------------------------------------------------------------------+
```

### fingerprint

Calcule une empreinte structurelle pour la comparaison.

```bash
# Full fingerprint (includes text)
websketch fingerprint capture.json
# Output: e33442b6

# Layout-only fingerprint (ignores text changes)
websketch fingerprint --layout-only capture.json
```

### diff

Compare deux captures et signale les modifications.

```bash
# Human-readable diff report
websketch diff before.json after.json

# JSON output
websketch diff --json before.json after.json

# Layout-only (ignore text changes)
websketch diff --layout-only before.json after.json

# Custom match threshold
websketch diff --threshold 0.7 before.json after.json
```

### bundle

Regroupe une ou plusieurs captures dans un fichier `.ws.json` partageable. Lorsqu'exactement deux captures sont fournies, le regroupement inclut automatiquement un résumé des différences.

```bash
websketch bundle capture.json -o bundle.ws.json
websketch bundle before.json after.json -o bundle.ws.json
```

## Mode Pipeline

Ajoutez `--json` avant n'importe quelle commande pour obtenir une sortie lisible par machine :

```bash
websketch --json validate capture.json
websketch --json render capture.json
websketch --json fingerprint capture.json
websketch --json diff before.json after.json
```

**Succès :** `{ "ok": true, ... }`

**Erreur :** `{ "ok": false, "error": { "code": "WS_...", "message": "..." } }`

Les codes de sortie s'appliquent toujours en mode JSON. Utilisez `$?` ou `set -e` dans les scripts.

## Codes de sortie

| Code | Signification |
| ------ | --------- |
| 0 | Succès |
| 1 | Erreur de validation / de données (JSON incorrect, capture invalide, commande inconnue) |
| 2 | Erreur du système de fichiers (fichier introuvable, permission refusée, erreur d'entrée/sortie) |

## Format de capture

Cet outil en ligne de commande fonctionne avec les fichiers de capture WebSketch IR (JSON). Créez des captures à l'aide de :

- [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) : Extension Chrome pour la capture de page en un clic.
- [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) : Créez des captures de manière programmatique.

## Documentation

| Documentation | Description |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | Guide détaillé : architecture, commandes, modèles de pipeline, intégration. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Comment contribuer, configuration du développement, directives pour les pull requests. |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Normes de la communauté. |
| [CHANGELOG.md](CHANGELOG.md) | Historique des versions. |

## Licence

MIT
