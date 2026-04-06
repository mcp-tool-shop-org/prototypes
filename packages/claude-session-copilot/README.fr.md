<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-session-copilot/readme.png" width="400" />
</p>

<p align="center">
  <strong>Session memory for Claude Code.</strong><br>
  Captures decisions, timelines, and patterns across sessions. Makes context recoverable after <code>/compact</code>.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-session-copilot"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-session-copilot" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/claude-session-copilot" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-session-copilot/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## Pourquoi ?

Les sessions Claude Code sont éphémères. Lorsque vous utilisez la commande `/compact` ou démarrez une nouvelle session, vos réflexions, vos décisions et votre progression disparaissent. Session Copilot capture toutes ces informations et les rend accessibles.

**Ce plugin ne fonctionne qu'avec Claude Code** — il dépend des mécanismes PostToolUse, des compétences, des notifications de ressources et de l'injection de contexte CLAUDE.md, que les autres clients MCP n'ont pas.

## Démarrage rapide

```bash
npx @mcptoolshop/claude-session-copilot
```

### Plugin Claude Code

Ajoutez ceci à votre fichier `.mcp.json` :

```json
{
  "mcpServers": {
    "session-copilot": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/claude-session-copilot"]
    }
  }
}
```

## Ce que fait ce plugin

### 7 Outils

| Outil | Fonction |
| ------ | --------- |
| `copilot.decision` | Enregistrer une décision (quoi, pourquoi, alternatives rejetées) |
| `copilot.snapshot` | Sauvegarder l'état de la session pour assurer la continuité |
| `copilot.resume` | Charger la dernière version sauvegardée et les décisions pour une nouvelle session |
| `copilot.timeline_event` | Enregistrer un événement dans la chronologie |
| `copilot.query` | Rechercher des décisions, la chronologie ou les versions sauvegardées |
| `copilot.pulse` | Tableau de bord de l'état du projet |
| `copilot.forget` | Supprimer les données anciennes |

### 4 Compétences (Claude Code uniquement)

| Compétence | Ce qu'elle fait |
| ------- | ------------- |
| `/copilot:resume` | Reprendre là où la dernière session s'est arrêtée |
| `/copilot:snapshot` | Sauvegarder l'état complet avant la commande `/compact` |
| `/copilot:decisions` | Consulter l'historique des décisions |
| `/copilot:pulse` | Tableau de bord de l'état du projet |

### 4 Mécanismes PostToolUse (Claude Code uniquement)

Enregistrement automatique dans la chronologie après :
- **Bash** — détecte les résultats de la compilation/des tests (réussite/échec)
- **Write** — enregistre la création de fichiers
- **Edit** — enregistre les modifications de fichiers
- **TodoWrite** — enregistre les changements d'état des tâches

### Détection de motifs

Affiche des alertes lorsqu'il détecte :
- **Échec répété** — la même commande échoue 3 fois ou plus
- **Modifications fréquentes de fichiers** — le même fichier est modifié 5 fois ou plus lors d'une même session
- **Session longue** — 100 événements ou plus sans sauvegarde

### 4 Ressources

| URI | Ce qu'elle affiche |
| ----- | --------------- |
| `copilot://pulse` | État actuel du projet |
| `copilot://timeline` | Événements de la session actuelle |
| `copilot://decisions` | Historique récent des décisions |
| `copilot://snapshot/latest` | Note de transmission la plus récente |

## Cycle de vie de la session

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Session Start│ ──► │  /copilot:resume  │ ──► │   Work normally  │
└─────────────┘     └──────────────────┘     │  (hooks auto-    │
                                              │   track events)  │
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │ copilot.decision │
                                              │ (log key choices)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │/copilot:snapshot │
                                              │ (before /compact)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  Next session    │
                                              │  /copilot:resume │
                                              └─────────────────┘
```

## Stockage

Les données sont stockées dans `.claude/copilot/store.json` (local au projet) ou `~/.claude/copilot/store.json` (sauvegarde globale).

Possibilité de modifier ce chemin avec la variable d'environnement `COPILOT_STORE_PATH`.

## Pourquoi Claude Code uniquement ?

Ce serveur dépend de fonctionnalités spécifiques à Claude Code :

| Fonctionnalité | Fonctionnalité spécifique à Claude Code | Autres clients MCP |
| --------- | ---------------------- | ------------------- |
| Chronologie automatique | Mécanismes PostToolUse | Pas de système de mécanismes |
| Commandes abrégées | Compétences (SKILL.md) | Pas de compétences |
| Injection de contexte | CLAUDE.md | Pas d'équivalent |
| Tableaux de bord en direct | Notifications de ressources | Ne vérifie pas l'état des ressources |
| Coordination des tâches | Mécanismes TodoWrite | Pas de TodoWrite |

Sans ces éléments, le serveur n'est qu'un fichier JSON sans moyen de le remplir automatiquement.

## Licence

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
