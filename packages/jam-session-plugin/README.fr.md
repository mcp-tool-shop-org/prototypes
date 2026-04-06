<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/jam-session-plugin/readme.png" alt="Jam Session Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/jam-session-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Un pianiste virtuel basé sur l'IA, avec une bibliothèque de 100 chansons, un enseignement structuré et des sessions de jam. Il joue via vos haut-parleurs, sans nécessiter de logiciel externe.

Ce plugin encapsule le serveur MCP [AI Jam Session](https://github.com/mcp-tool-shop-org/ai_jam_session), en ajoutant des commandes abrégées, des personnalités pour les agents et des flux de travail structurés pour l'apprentissage et le jeu.

## Installation

```bash
claude plugin add ai-jam-session
```

Le serveur MCP (`@mcptoolshop/ai-jam-session`) est téléchargé automatiquement via npx. Nécessite Node.js 18 ou supérieur.

## Ce que vous obtenez

### Compétences (commandes abrégées)

| Commande | Description |
| --------- | ------------- |
| `/ai-jam-session:teach <song>` | Démarre une session d'enseignement structurée. |
| `/ai-jam-session:practice <song> [level]` | Obtient un plan de pratique personnalisé. |
| `/ai-jam-session:explore [query]` | Parcourez la bibliothèque de 100 chansons par genre, difficulté ou mot-clé. |
| `/ai-jam-session:jam <song or genre>` | Démarre une session de jam — Claude crée sa propre interprétation. |

### Agents

| Agent | Description |
| ------- | ------------- |
| `piano-teacher` | Professeur patient et pédagogique qui s'adapte au niveau de l'élève. |
| `jam-musician` | Musicien décontracté pour les sessions de jam — privilégie le rythme et encourage l'expérimentation. |

### Outils MCP (15)

Parcourez, écoutez, enseignez, improvisez et gérez les chansons. Les compétences du plugin orchestrent automatiquement ces outils, mais ils sont également disponibles pour une utilisation directe.

## Utilisation

Utilisez les commandes abrégées :

```
/ai-jam-session:explore jazz
/ai-jam-session:teach moonlight-sonata-mvt1
/ai-jam-session:practice let-it-be beginner
/ai-jam-session:jam autumn-leaves as blues
/ai-jam-session:jam jazz
```

Ou parlez simplement naturellement — les agents s'activent en fonction du contexte :

```
I want to learn a beginner jazz song on piano.
Help me practice Fur Elise at half speed.
Let's jam on some blues.
```

## Bibliothèque de chansons

100 chansons intégrées, réparties dans 10 genres (classique, jazz, pop, blues, rock, R&B, latin, musique de film, ragtime, new-age), pour les niveaux débutant, intermédiaire et avancé.

## Prérequis

- Node.js 18 ou supérieur
- Haut-parleurs (le piano joue via l'audio de votre système)

## Liens

- Serveur MCP : [@mcptoolshop/ai-jam-session](https://www.npmjs.com/package/@mcptoolshop/ai-jam-session)
- Source : [mcp-tool-shop-org/ai_jam_session](https://github.com/mcp-tool-shop-org/ai_jam_session)

## Licence

MIT
