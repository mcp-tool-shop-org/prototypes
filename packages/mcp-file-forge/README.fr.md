<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-file-forge/readme.png" alt="MCP File Forge" width="400"></p>

<p align="center">
  Secure file operations and project scaffolding for AI agents.
  <br />
  Part of <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/file-forge"><img alt="npm version" src="https://img.shields.io/npm/v/@mcptoolshop/file-forge"></a>
  <a href="https://github.com/mcp-tool-shop-org/mcp-file-forge/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-file-forge/"><img alt="Landing Page" src="https://img.shields.io/badge/Landing_Page-live-blue"></a>
</p>

---

## At a Glance

MCP File Forge est un serveur [Model Context Protocol](https://modelcontextprotocol.io) (MCP) qui offre aux agents d'IA un accès sécurisé et contrôlé par des politiques au système de fichiers local. Il comprend **17 outils** répartis en cinq catégories :

| Catégorie | Outils | Description |
| ---------- | ------- | ------------- |
| **Reading** | `read_file`, `read_directory`, `read_multiple` | Lecture de fichiers et listes de répertoires |
| **Writing** | `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file` | Création, modification, copie, déplacement et suppression |
| **Search** | `glob_search`, `grep_search`, `find_by_content` | Recherche de fichiers par nom ou contenu |
| **Metadata** | `file_stat`, `file_exists`, `get_disk_usage`, `compare_files` | Inspection de la taille, des horodatages et de l'existence |
| **Scaffolding** | `scaffold_project`, `list_templates` | Création de projets à partir de modèles avec substitution de variables |

Propriétés clés :

- **Environnement isolé (sandboxed)** : les opérations sont limitées aux répertoires explicitement autorisés.
- **Mode lecture seule** : activer une variable d'environnement pour désactiver tous les outils d'écriture.
- **Sécurité des liens symboliques** : le suivi des liens symboliques est désactivé par défaut pour éviter les failles de sécurité.
- **Conçu pour Windows** : optimisé pour les chemins et conventions de Windows, mais fonctionne partout.
- **Moteur de modèles** : substitution `{{var}}` / `${var}` ainsi que renommage au niveau du chemin avec `__var__`.

---

## Installation

```bash
npm install -g @mcptoolshop/file-forge
```

Ou exécutez directement avec npx :

```bash
npx @mcptoolshop/file-forge
```

---

## Configuration de Claude Desktop

Ajoutez ce qui suit à votre fichier `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/file-forge"],
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects,C:/Users/you/Documents"
      }
    }
  }
}
```

Si vous avez installé globalement, vous pouvez pointer directement vers le fichier binaire :

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "mcp-file-forge",
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects"
      }
    }
  }
}
```

---

## Référence des outils

### Lecture

| Outil | Description | Paramètres clés |
| ------ | ------------- | ---------------- |
| `read_file` | Lecture du contenu d'un fichier | `path`, `encoding?`, `start_line?`, `end_line?`, `max_size_kb?` |
| `read_directory` | Liste des entrées d'un répertoire | `path`, `recursive?`, `max_depth?`, `include_hidden?`, `pattern?` |
| `read_multiple` | Lecture en lot de plusieurs fichiers | `paths`, `encoding?`, `fail_on_error?` |

### Écriture

| Outil | Description | Paramètres clés |
| ------ | ------------- | ---------------- |
| `write_file` | Écriture ou remplacement d'un fichier | `path`, `content`, `encoding?`, `create_dirs?`, `overwrite?`, `backup?` |
| `create_directory` | Création d'un répertoire | `path`, `recursive?` |
| `copy_file` | Copie d'un fichier ou d'un répertoire | `source`, `destination`, `overwrite?`, `recursive?` |
| `move_file` | Déplacement ou renommage | `source`, `destination`, `overwrite?` |
| `delete_file` | Suppression d'un fichier ou d'un répertoire | `path`, `recursive?`, `force?` |

### Recherche

| Outil | Description | Paramètres clés |
| ------ | ------------- | ---------------- |
| `glob_search` | Recherche de fichiers par motif glob | `pattern`, `base_path?`, `max_results?`, `include_dirs?` |
| `grep_search` | Recherche de contenu de fichier avec une expression régulière | `pattern`, `path?`, `glob?`, `case_sensitive?`, `max_results?`, `context_lines?` |
| `find_by_content` | Recherche de texte littéral (sans expression régulière) | `text`, `path?`, `file_pattern?`, `max_results?` |

### Métadonnées

| Outil | Description | Paramètres clés |
| ------ | ------------- | ---------------- |
| `file_stat` | Statistiques de fichiers/répertoires | `path` |
| `file_exists` | Vérification de l'existence et du type | `path`, `type?` (`file` / `directory` / `any`) |
| `get_disk_usage` | Répartition de la taille d'un répertoire | `path`, `max_depth?` |
| `compare_files` | Comparaison de deux chemins | `path1`, `path2` |

### Génération de code

| Outil | Description | Paramètres clés |
| ------ | ------------- | ---------------- |
| `scaffold_project` | Création d'un projet à partir d'un modèle | `template`, `destination`, `variables?`, `overwrite?` |
| `list_templates` | Liste des modèles disponibles | `category?` |

La documentation complète des paramètres, des exemples et des codes d'erreur se trouve dans le fichier [HANDBOOK.md](HANDBOOK.md).

---

## Variables d'environnement

| Variable | Description | Valeur par défaut |
| ---------- | ------------- | --------- |
| `MCP_FILE_FORGE_ALLOWED_PATHS` | Liste séparée par des virgules des répertoires racines autorisés | `.` (répertoire courant) |
| `MCP_FILE_FORGE_DENIED_PATHS` | Liste séparée par des virgules des motifs de chemins interdits | `**/node_modules/**`, `**/.git/**` |
| `MCP_FILE_FORGE_READ_ONLY` | Désactive toutes les opérations d'écriture | `false` |
| `MCP_FILE_FORGE_MAX_FILE_SIZE` | Taille maximale d'un fichier en octets | `104857600` (100 Mo) |
| `MCP_FILE_FORGE_MAX_DEPTH` | Profondeur de récursion maximale | `20` |
| `MCP_FILE_FORGE_FOLLOW_SYMLINKS` | Autoriser le suivi des liens symboliques en dehors de l'environnement isolé | `false` |
| `MCP_FILE_FORGE_TEMPLATE_PATHS` | Répertoires de modèles séparés par des virgules | `./templates` |
| `MCP_FILE_FORGE_LOG_LEVEL` | Niveau de verbosité des journaux (`error`, `warn`, `info`, `debug`) | `info` |
| `MCP_FILE_FORGE_LOG_FILE` | Chemin vers un fichier de journalisation (en plus de stderr) | _aucun_ |

---

## Fichier de configuration

Créez un fichier `mcp-file-forge.json` (ou `.mcp-file-forge.json`) dans ou au-dessus de votre répertoire de travail :

```json
{
  "sandbox": {
    "allowed_paths": ["C:/Projects", "C:/Users/you/Documents"],
    "denied_paths": ["**/secrets/**", "**/.env"],
    "follow_symlinks": false,
    "max_file_size": 52428800,
    "max_depth": 20
  },
  "templates": {
    "paths": ["./templates", "~/.mcp-file-forge/templates"]
  },
  "logging": {
    "level": "info",
    "file": "./logs/mcp-file-forge.log"
  },
  "read_only": false
}
```

Priorité de configuration (la plus élevée l'emporte) :

1. Variables d'environnement
2. Fichier de configuration
3. Valeurs par défaut intégrées

---

## Sécurité

MCP File Forge impose plusieurs niveaux de protection pour empêcher les agents d'IA de sortir de leur espace de travail désigné :

- **Environnement isolé (sandboxing) des chemins** : chaque chemin est résolu en un chemin absolu et vérifié par rapport à la liste `allowed_paths` avant toute opération d'entrée/sortie.
- **Chemins interdits** : les motifs glob qui sont bloqués, même dans les répertoires autorisés (par exemple, `**/secrets/**`).
- **Protection des liens symboliques** : les liens symboliques ne sont pas suivis par défaut ; si la cible d'un lien symbolique se trouve en dehors de l'environnement isolé, l'opération est refusée.
- **Détection de parcours de chemins** : les séquences `..` qui permettraient de sortir de l'environnement isolé sont rejetées.
- **Limites de taille** : les fichiers dont la taille dépasse `max_file_size` sont refusés afin d'éviter une consommation excessive de mémoire.
- **Limites de profondeur** : les opérations récursives sont limitées à `max_depth` niveaux.
- **Mode lecture seule** : définissez `MCP_FILE_FORGE_READ_ONLY=true` pour désactiver `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file` et `scaffold_project`.
- **Rejet des octets nuls** : les chemins contenant `\0` sont refusés.
- **Protection contre les longs chemins Windows** : les chemins dépassant 32 767 caractères sont refusés.

---

## Documentation

| Document | Description |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | Analyse approfondie : modèle de sécurité, référence des outils, modèles, architecture, FAQ |
| [CHANGELOG.md](CHANGELOG.md) | Historique des versions (format Keep a Changelog) |
| [docs/PLANNING.md](docs/PLANNING.md) | Notes de planification et de recherche internes |

---

## Développement

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

---

## Licence

[MIT](LICENSE)

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
