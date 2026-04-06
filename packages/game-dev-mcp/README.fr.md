<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/game-dev-mcp/readme.png" alt="Game Dev MCP" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/game-dev-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/game-dev-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/game-dev-mcp"><img src="https://img.shields.io/npm/v/@mcptoolshop/game-dev-mcp" alt="npm version"></a>
  <a href="https://mcp-tool-shop-org.github.io/game-dev-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  Talk to your game engine. Spawn actors, build levels, tweak properties — all through natural conversation with any LLM.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#what-can-it-do">44 Tools</a> &middot;
  <a href="#knowledge-library">Knowledge Library</a> &middot;
  <a href="HANDBOOK.md">Handbook</a>
</p>

---

Actuellement, il prend en charge **Unreal Engine 5** via l'API de contrôle à distance intégrée. Pas de plugins tiers. Pas de compilation C++. Il suffit d'activer l'API et de commencer à communiquer.

## Qu'est-ce que ça donne ?

> **Vous :** Créez une lumière ponctuelle au-dessus de la table et faites-la briller d'une lumière chaude.

Le LLM appelle `ue_spawn_actor`, définit la transformation, ajuste la température de la couleur via `ue_set_property`, et la lumière apparaît dans votre fenêtre de visualisation. Vous continuez de parler, et il continue de construire.

## Démarrage rapide

### 1. Activez l'API de contrôle à distance dans UE5

1. Ouvrez votre projet UE5 (5.4+).
2. **Édition > Plugins** → recherchez "Remote Control API" → Activez.
3. Redémarrez l'éditeur.

Ce plugin est déjà inclus dans UE5 ; vous ne faites que l'activer.

### 2. Installation et configuration

```bash
npx @mcptoolshop/game-dev-mcp
```

Ajoutez ceci à la configuration de votre client MCP (par exemple, `claude_desktop_config.json` de Claude Desktop) :

```json
{
  "mcpServers": {
    "gamedev": {
      "command": "npx",
      "args": ["@mcptoolshop/game-dev-mcp"]
    }
  }
}
```

### 3. Test

Demandez à votre LLM : **"Ping Unreal Engine"** — il appelle `ue_ping` et confirme la connexion.

## Que peut-il faire ?

### Acteurs (9 outils)
Création, suppression, duplication, transformation, listage, recherche et sélection d'acteurs dans le niveau. Fonctionne avec n'importe quelle classe d'acteur : maillages, lumières, caméras, volumes.

### Propriétés (4 outils)
Lecture et écriture de n'importe quelle UPROPERTY sur n'importe quel UObject. Utilisez `ue_describe_object` pour découvrir ce qui est disponible, puis obtenez ou définissez exactement ce dont vous avez besoin.

### Ressources (8 outils)
Recherche dans le navigateur de contenu, listage des répertoires, vérification de l'existence, duplication, renommage, suppression et sauvegarde des ressources.

### Niveaux (4 outils)
Sauvegarde du niveau actuel, chargement d'un niveau différent, obtention d'informations sur le niveau, ou sauvegarde de tous les packages modifiés en une seule fois.

### Blueprints (5 outils)
Création de classes Blueprint à partir de zéro, ajout de composants, configuration de leurs propriétés, compilation et création d'instances — le tout par conversation.

### Éditeur (4 outils)
Test de la connexion, exécution de commandes de console, obtention d'informations sur le moteur, et ancrage de la fenêtre de visualisation à n'importe quel acteur.

### Connaissances (1 outil)
Recherche de 35 tutoriels intégrés à UE5 sur demande — afin que votre LLM puisse rechercher comment fonctionne Nanite, ou ce qu'est un Behavior Tree, au cours de la conversation.

### Projet (7 outils)
Stockage des conventions, notes et contexte spécifiques au projet dans le répertoire `.game-dev-mcp/`, qui persiste entre les sessions.

### Mission (2 outils)
Suivi des progrès pendant les opérations en plusieurs étapes. Intégration avec [mcp-aside](https://github.com/mcp-tool-shop-org/mcp-aside) pour les notifications en temps réel.

**Total : 44 outils**

## Bibliothèque de connaissances

Le serveur inclut 35 tutoriels en tant que ressources MCP. Votre LLM les lit sur demande — aucune information n'est gaspillée tant qu'elle n'a pas réellement besoin de ces informations :

| Catégorie | Contenu |
| ---------- | -------- |
| **Getting Started** | Configuration, premières commandes, structure du projet |
| **Actors** | Création, transformations, référence de type, composants |
| **Assets** | Navigateur de contenu, modèles de recherche, importation |
| **Blueprints** | Bases, création, configuration des composants |
| **Levels** | Gestion, composition du monde |
| **Materials** | Bases, instances de matériaux |
| **Lighting** | Types de lumière, flux de travail |
| **Physics** | Simulation, collisions, contraintes |
| **Audio** | Signaux sonores, atténuation, audio spatial |
| **Animation** | Maillage squelettique, AnimBP, montages |
| **Visual Effects** | Particules Niagara, simulation GPU |
| **Rendering** | Nanite, Lumen, cartes de profondeur virtuelles |
| **AI & Navigation** | NavMesh, arbres de comportement, EQS |
| **Cinematics** | Sequencer, caméras, rendu cinématographique |
| **Virtual Assistant** | Assistants MetaHuman, intégration LLM |
| **API Reference** | API de contrôle à distance, référence de sous-système |
| **Patterns** | Flux de travail courants, gestion des erreurs, performances |

## Connaissances du projet

Votre LLM peut stocker et rappeler le contexte spécifique au projet :

```
ue_project_init(name: "My Game", ueVersion: "5.4")
ue_project_set_convention(convention: "All Blueprints use BP_ prefix")
ue_project_add_note(title: "Level Layout", content: "Main hall is 2000x1000 cm")
```

Stocké dans le dossier `.game-dev-mcp/` – persiste entre les sessions, ce qui permet à l'IA de reprendre là où vous vous étiez arrêté.

## Configuration

| Variable | Valeur par défaut | Description |
| ---------- | --------- | ------------- |
| `GAMEDEV_MCP_HOST` | `127.0.0.1` | Nom d'hôte de l'éditeur du moteur de jeu |
| `GAMEDEV_MCP_PORT` | `30010` | Port de l'API distante |
| `GAMEDEV_MCP_TIMEOUT` | `10000` | Délai d'attente des requêtes (ms) |
| `GAMEDEV_MCP_LOG_LEVEL` | `info` | Niveau de journalisation (erreur/avertissement/information/débogage) |

## Prérequis

- Node.js 18+
- Unreal Engine 5.4+ avec le plugin Remote Control API activé

## Guide

Pour un guide complet – configuration, exemples pratiques, dépannage et description de chaque outil – consultez le **[Guide](HANDBOOK.md)**.

## Licence

MIT – Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
