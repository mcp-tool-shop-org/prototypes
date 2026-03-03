<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-demo/readme.png" width="400" alt="WebSketch">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-demo/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Site de démonstration interactif pour [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) — permet de visualiser la représentation de l'interface utilisateur basée sur la grammaire.

## Premiers pas

1. Visitez la [démonstration en direct](https://mcp-tool-shop-org.github.io/websketch-demo/)
2. Collez un fichier JSON de capture WebSketch dans le panneau d'entrée
3. Cliquez sur **Visualiser** pour voir les vues arborescente et ASCII
4. Passez en mode **Comparer** pour afficher côte à côte deux captures et leurs différences
5. Cliquez sur **Exporter le package** pour télécharger un fichier `.ws.json` partageable

Les captures sont créées avec l' [extension Chrome](https://github.com/mcp-tool-shop-org/websketch-extension). Consultez le [guide complet](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started).

## Fonctionnalités

- Visualisation interactive de la grammaire WebSketch IR
- Éditeur JSON avec validation syntaxique
- Vue arborescente avec badges de rôle, indications sémantiques et informations sur les boîtes englobantes
- Rendu de maquettes ASCII
- Mode comparaison avec affichage côte à côte des maquettes ASCII et résumé des différences
- Exportation du package pour partager les captures
- Affichage des avertissements intégrés pour les captures tronquées
- Implémentation TypeScript simple et légère
- Conception réactive pour tous les appareils

## Démarrage rapide

### Pour les développeurs

#### Prérequis

- Node.js 20+
- npm ou yarn

#### Installation

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-demo.git
cd websketch-demo

npm ci
npm run dev
```

L'application s'ouvrira à l'adresse `http://localhost:3000`.

#### Scripts disponibles

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build

npm run typecheck        # Run TypeScript type checking
npm run lint             # Check code with ESLint
npm run format           # Format code with Prettier

npm test                 # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## Structure du projet

```
websketch-demo/
├── src/
│   ├── __tests__/          # Test files
│   ├── main.ts             # Application entry point
│   └── styles.css          # Global styles
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD pipeline
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── vitest.config.ts        # Vitest configuration
```

## Pile technologique

- **Framework**: TypeScript natif (sans surcharge de framework)
- **Outil de construction**: Vite
- **Tests**: Vitest
- **Linting**: ESLint + TypeScript ESLint
- **Formatage**: Prettier
- **CI/CD**: GitHub Actions

## Liens

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Problèmes**: [github.com/mcp-tool-shop-org/websketch-demo/issues](https://github.com/mcp-tool-shop-org/websketch-demo/issues)

## Licence

MIT — voir [LICENSE](LICENSE).

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
