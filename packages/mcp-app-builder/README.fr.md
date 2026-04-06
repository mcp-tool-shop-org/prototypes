<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-app-builder/readme.png" alt="MCP App Builder" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder"><img src="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder/branch/main/graph/badge.svg" alt="codecov" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-1.0-green" alt="MCP" /></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-app-builder/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

> Créez des serveurs MCP avec des composants d'interface utilisateur interactifs, directement depuis VS Code.

## Aperçu

**MCP App Builder** aide les développeurs à créer, tester et déployer rapidement des serveurs MCP (Model Context Protocol). Il prend en charge la nouvelle norme **MCP Apps** (janvier 2026), permettant l'intégration de composants d'interface utilisateur interactifs directement dans les conversations d'IA.

## Fonctionnalités

### Squelette (Scaffolding)
- **Assistant de création de serveur**: Créez des serveurs MCP avec une configuration guidée.
- **Modèles**: Configurations de serveur de base, avec interface utilisateur et complètes.
- **Configuration automatique**: TypeScript, MCP SDK et structure du projet.

### Développement
- **Validation du schéma**: Validation en temps réel des fichiers `mcp.json` et `mcp-tools.json`.
- **Validation automatique à la sauvegarde**: Les schémas sont vérifiés automatiquement lorsque vous enregistrez (configurable).
- **Génération de types**: Générez des types TypeScript à partir des définitions d'outils.
- **IntelliSense**: Prise en charge des schémas JSON pour les fichiers de configuration.

### Tests
- **Environnement de test**: Exécutez des tests sur vos outils MCP.
- **Tests générés automatiquement**: Tests créés à partir des définitions d'outils et des exemples.
- **Canal de sortie**: Résultats de tests formatés avec l'état de réussite/échec.

### Tableau de bord
- **Interface visuelle**: Accès rapide à toutes les commandes.
- **Intégration à l'espace de travail**: Détecte automatiquement les projets MCP.
- **Barre d'état**: Indicateur MCP lorsque vous êtes dans un projet MCP.

## Premiers pas

1. **Installez l'extension** depuis le Marketplace de VS Code (bientôt disponible).
2. **Créez un nouveau serveur**: `Cmd+Shift+P` → "MCP: Nouveau serveur"
3. **Choisissez un modèle**:
- `basic` - Serveur simple "hello world"
- `with-ui` - Serveur avec composants d'interface utilisateur (table et graphique)
- `full` - Serveur complet avec outils, ressources et invites.

## Raccourcis clavier

| Raccourci | Commande |
|----------|---------|
| `Ctrl+Alt+N` (`Cmd+Alt+N` sur Mac) | Nouveau serveur |
| `Ctrl+Alt+V` (`Cmd+Alt+V` sur Mac) | Valider le schéma |

## Commandes

| Commande | Description |
|---------|-------------|
| `MCP: New Server` | Crée un nouveau projet de serveur MCP. |
| `MCP: Validate Schema` | Valide le fichier `mcp.json` ou `mcp-tools.json` actuel. |
| `MCP: Generate Types` | Génère des types TypeScript à partir des définitions d'outils. |
| `MCP: Test Server` | Exécute des tests sur vos outils MCP. |
| `MCP: Open Dashboard` | Ouvre le tableau de bord visuel. |

## Paramètres

| Paramètre | Valeur par défaut | Description |
|---------|---------|-------------|
| `mcp-app-builder.defaultTemplate` | `basic` | Modèle par défaut pour les nouveaux serveurs (basic/with-ui/full). |
| `mcp-app-builder.autoValidate` | `true` | Valider automatiquement les schémas à la sauvegarde. |
| `mcp-app-builder.testPort` | `3000` | Port pour le serveur de test MCP. |

## Composants d'interface utilisateur MCP Apps

L'extension fournit des outils pour les composants d'interface utilisateur MCP Apps :

```typescript
import { table, chart, form, card } from '@mcp-app-builder/ui-components';

// Create a search results table
const results = table(
  [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status' },
  ],
  data,
  { pageSize: 10 }
);

// Create a dashboard with metrics
const dashboard = dashboard({
  title: 'Analytics',
  metrics: [
    { label: 'Users', value: 1234, change: 12 },
    { label: 'Revenue', value: '$5,678', change: -3 },
  ],
  chart: lineChart,
});
```

## Structure des fichiers

Les projets de serveur MCP générés suivent cette structure :

```
my-mcp-server/
├── mcp.json           # Server configuration
├── mcp-tools.json     # Tool definitions
├── package.json       # Node.js dependencies
├── tsconfig.json      # TypeScript configuration
└── src/
    ├── index.ts       # Server entry point
    ├── resources.ts   # Resource handlers (full template)
    └── prompts.ts     # Prompt handlers (full template)
```

## Développement

### Prérequis

- Node.js 18+
- VS Code 1.85+

### Installation

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-app-builder
cd mcp-app-builder
npm install
npm run compile
```

### Exécution

Appuyez sur `F5` dans VS Code pour lancer l'environnement de développement de l'extension.

### Tests

```bash
npm test
```

## Feuille de route

### Phase 1 (Actuelle) - Base Déterministe
- [x] Création de squelette de projet avec modèles.
- [x] Système de validation de schéma.
- [x] Génération de types à partir de schémas.
- [x] Composants primitifs d'interface utilisateur.
- [x] Base de l'environnement de test.
- [x] Vue web du tableau de bord.

### Phase 2 - Développement assisté par l'IA
- [ ] Génération d'outils par l'IA à partir du langage naturel.
- [ ] Complétion intelligente du code pour les gestionnaires d'outils.
- [ ] Génération automatisée de documentation.

### Phase 3 - Publication et distribution
- [ ] Publication en un clic vers les registres MCP.
- [ ] Gestion des versions.
- [ ] Résolution des dépendances.

### Phase 4 - Constructeur visuel
- [ ] Constructeur d'interface utilisateur par glisser-déposer.
- [ ] Prévisualisation en direct des applications MCP.
- [ ] Éditeur de flux visuel.

## Contributions

Les contributions sont les bienvenues ! Veuillez lire nos directives de contribution (bientôt disponibles).

## Sécurité et confidentialité

**Données concernées :** fichiers de l'espace de travail (mcp.json, mcp-tools.json, fichiers TypeScript générés), paramètres de VS Code, canaux de sortie de l'extension.

**Données NON concernées :** code source au-delà des configurations MCP, historique Git, réseau (sauf pour l'environnement de test local), identifiants, variables d'environnement. Aucune donnée de télémétrie n'est collectée ni envoyée.

**Autorisations :** lecture/écriture du système de fichiers pour la création de squelettes et la génération de types (uniquement pour l'espace de travail), réseau local pour l'environnement de test. Consultez le fichier [SECURITY.md](SECURITY.md) pour connaître la politique complète.

## Licence

MIT

## Liens

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP Apps Specification](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [Organisation GitHub](https://github.com/mcp-tool-shop-org)

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
