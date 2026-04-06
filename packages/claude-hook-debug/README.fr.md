<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/">
    <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-hook-debug/readme.png" width="400" alt="claude-hook-debug" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug/branch/main/graph/badge.svg" alt="Coverage" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-hook-debug"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-hook-debug" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

Outil de diagnostic en ligne de commande pour les problèmes liés aux extensions Claude Code. Il détecte les extensions "fantômes" provenant de plugins désactivés, les conflits de portée, les paramètres mal configurés et les bogues connus de Claude Code.

## Installation

```bash
npm install -g @mcptoolshop/claude-hook-debug
```

Ou exécutez directement :

```bash
npx @mcptoolshop/claude-hook-debug
```

## Utilisation

```bash
# Scan current workspace
claude-hook-debug

# Scan a specific project
claude-hook-debug /path/to/project

# JSON output (for piping/scripting)
claude-hook-debug --json
```

Code de sortie 1 si des erreurs sont détectées, 0 sinon.

## Ce qu'il détecte

| ID | Gravité | Description |
|----|----------|-------------|
| `GHOST_HOOK_PREVIEW` | erreur | L'extension "claude-preview" est désactivée, mais le hook "Stop" est toujours activé ([#19893](https://github.com/anthropics/claude-code/issues/19893)). |
| `GHOST_HOOK_GENERIC` | avertissement | Toute extension désactivée qui pourrait encore avoir des hooks actifs. |
| `LOCAL_ONLY_PLUGINS` | erreur | La section `enabledPlugins` dans les paramètres locaux écrase silencieusement les paramètres ([#25086](https://github.com/anthropics/claude-code/issues/25086)). |
| `SCOPE_CONFLICT` | avertissement | Une extension est activée dans une portée, mais désactivée dans une autre. |
| `STOP_CONTINUE_LOOP` | erreur | Le hook "Stop" renvoie `continue:true`, ce qui provoque une boucle infinie ([#1288](https://github.com/anthropics/claude-code/issues/1288)). |
| `DISABLE_ALL_HOOKS_ACTIVE` | avertissement/erreur | `disableAllHooks: true` désactive tous les hooks (devient une erreur si des paramètres gérés existent). |
| `BROKEN_SETTINGS_JSON` | erreur | Un JSON invalide désactive silencieusement tous les paramètres de ce fichier. |
| `LARGE_SETTINGS_FILE` | avertissement | Un fichier de paramètres de plus de 100 Ko (peut entraîner un démarrage lent). |
| `PLUGIN_HOOKS_INVISIBLE` | information | Aucun hook utilisateur, mais les plugins sont activés : les hooks des plugins ne sont pas visibles. |

## Portées des paramètres

L'outil lit les quatre portées de paramètres dans l'ordre de chargement de Claude Code :

| Portée | Chemin | Priorité |
|-------|------|------------|
| gérée | `~/.claude/managed-settings.json` | La plus élevée |
| utilisateur | `~/.claude/settings.json` | |
| projet | `.claude/settings.json` | |
| locale | `.claude/settings.local.json` | La plus faible (la dernière écriture est prioritaire) |

## Utilisation des bibliothèques

```typescript
import { debug } from '@mcptoolshop/claude-hook-debug';

const report = debug({ projectRoot: '/path/to/project' });

console.log(report.diagnostics);
// [{ id: 'GHOST_HOOK_PREVIEW', severity: 'error', title: '...', ... }]

console.log(report.plugins);
// [{ pluginId: 'claude-preview@...', mergedEnabled: false, scopes: [...] }]
```

## Sécurité et modèle de menace

**Ce que cela touche :** Fichiers de paramètres de Claude Code (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/managed-settings.json`). Toutes les lectures sont en lecture seule ; l'outil ne modifie jamais aucun fichier.

**Ce que cela NE touche PAS :** Aucune clé API, aucun jeton, aucune valeur de variable d'environnement ou aucune information d'identification n'est lue ou enregistrée. Le bloc `env` dans les paramètres est complètement ignoré. Aucun fichier en dehors des chemins de paramètres de Claude Code n'est accessible.

**Autorisations requises :** Accès en lecture au système de fichiers pour `~/.claude/` et le répertoire `.claude/` du projet. Aucune autorisation élevée, aucun accès réseau, aucune exécution de shell.

**Aucune télémétrie.** Aucune analyse. Aucun signalement. Aucune collecte de données de quelque sorte que ce soit. Aucune dépendance de production.

---

Créé par [MCP Tool Shop](https://mcp-tool-shop.github.io/)
