<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/code-bearings/readme.png" width="400" alt="Code Bearings">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/actions"><img src="https://github.com/mcp-tool-shop-org/code-bearings/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@code-bearings/cli"><img src="https://img.shields.io/npm/v/@code-bearings/cli" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/code-bearings/"><img src="https://img.shields.io/badge/Landing_Page-blue" alt="Landing Page"></a>
</p>

**Reprenez le contrôle de votre code.**

Code Bearings est une interface de contrôle basée sur l'analyse du code source, conçue pour les projets modernes. Elle indexe votre projet TypeScript en créant un graphe de fichiers, de symboles, de modules et de dépendances, puis elle affiche ces informations sur toutes les interfaces dont vous avez besoin : ligne de commande, VS Code, CI.

L'information reste cohérente. L'IA aide à expliquer, à enseigner et à présenter. L'humain conserve le contrôle.

## Ce que cela fait

| Interface | Ce que vous obtenez |
|---------|-------------|
| **CLI** | `code-bearings analyze` indexe votre projet. `code-bearings review` génère un résumé des modifications à partir de n'importe quel diff Git, avec une évaluation des risques, des preuves à l'appui et des conseils pour le relecteur. |
| **VS Code** | Arborescences dans la barre d'activité, panneaux de révision interactifs, infobulles, annotations CodeLens, décorations de marge, contexte de la barre d'état : tout est alimenté par la même source d'information cohérente. |
| **CI** | `code-bearings ci` génère des artefacts de révision (Markdown, JSON, HTML) et, éventuellement, échoue si les seuils de risque sont dépassés. |

## Installation

```bash
# CLI (global)
npm install -g @code-bearings/cli

# Or run directly
npx @code-bearings/cli analyze

# VS Code extension (from marketplace or local)
# Search "Code Bearings" in the VS Code extensions panel
```

## Démarrage rapide

```bash
# 1. Index your project
code-bearings analyze

# 2. Review your changes
code-bearings review

# 3. Explore the graph
code-bearings modules
code-bearings module store
code-bearings function generateChangeBrief

# 4. Compare branches
code-bearings compare main feature-branch

# 5. Generate CI artifacts
code-bearings ci --fail-on-risk high
```

## Architecture

Code Bearings est un monorepo comprenant trois paquets qui partagent un contrat de couches strict :

```
@code-bearings/core    ← Shared product logic (extraction, graph, review, rendering)
@code-bearings/cli     ← Thin CLI consuming core
@code-bearings/vscode  ← Thin editor surface consuming core
```

**Le cœur gère les données.** L'interface en ligne de commande est simple. L'extension est simple. Pas de produit dérivé.

### Trois niveaux d'information

| Niveau | Contenu | Exemple |
|-------|------|---------|
| **A. Extracted Truth** | Informations extraites du code source | "La fonction X appelle la fonction Y" |
| **B. Derived Structure** | Calculé à partir du niveau A | "Le module M a 7 dépendances, score de risque 25" |
| **C. Human Narration** | Explications basées sur A+B | "Cette modification supprime la gestion des erreurs d'un chemin à fort trafic" |

### Cinq modes d'utilisation

La révision générale présente les informations. Les autres modes aident les humains à réfléchir en fonction de ces informations.

| Mode | Fonctionnalité |
|------|------|
| **General** | Résumé des modifications canonique : ce qui a changé, risque, preuves |
| **Bug Hunter** | Hypothèses de défaillance, angles morts, suggestions d'inspection |
| **Learning** | Traductions de syntaxe, explications avant/après |
| **Architecture** | Rôles des modules, état des limites, position dans le système |
| **Exploration** | Questions directrices pour les bases de code inconnues |

## Paquets

| Paquet | Description | npm |
|---------|-------------|-----|
| [`@code-bearings/core`](packages/core/) | Logique partagée d'extraction, de graphe, de révision et de rendu | [![npm](https://img.shields.io/npm/v/@code-bearings/core)](https://www.npmjs.com/package/@code-bearings/core) |
| [`@code-bearings/cli`](packages/cli/) | Interface en ligne de commande | [![npm](https://img.shields.io/npm/v/@code-bearings/cli)](https://www.npmjs.com/package/@code-bearings/cli) |
| [`@code-bearings/vscode`](packages/vscode/) | Extension VS Code | — |

## Prérequis

- Node.js >= 20
- Projet TypeScript avec un fichier `tsconfig.json`
- Git (pour les commandes de révision/comparaison)

## Sécurité et confidentialité

- **Pas d'accès au réseau.** Pas de télémétrie. Pas d'analyse. Pas de transmission de données.
- **Accès en lecture seule au code source.** Code Bearings lit vos fichiers source via l'analyse syntaxique (AST). Il ne les modifie jamais.
- **Base de données locale uniquement.** Le fichier SQLite `.code-bearings/bearings.db` reste dans votre projet.
- **Pas d'exécution de code.** Analyse statique uniquement.

Consultez [SECURITY.md](SECURITY.md) pour le modèle de menace complet.

## Licence

[MIT](LICENSE)

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
