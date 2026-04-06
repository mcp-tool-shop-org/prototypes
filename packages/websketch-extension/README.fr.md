<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-extension

**Extension Chrome permettant de capturer des pages web au format [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir).**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-extension/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

---

## Premiers pas

1. Construire et charger l'extension (voir [Installation](#installation))
2. Accéder à n'importe quelle page web et cliquer sur l'icône WebSketch
3. Cliquer sur "Capturer la page actuelle" — le fichier JSON de capture est copié dans le presse-papiers
4. Vérifier : `websketch validate capture.json` ou coller le contenu dans la [démonstration](https://mcptoolshop.com)
5. Visualiser : `websketch render capture.json` ou utiliser les vues Arbre/ASCII de la démonstration

Configurer les limites via les paramètres (icône d'engrenage dans la fenêtre contextuelle). Consultez le [guide complet](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started).

## Fonctionnalités

- Capture de page en un clic
- Copie automatique vers le presse-papiers
- Capture complète de l'arborescence DOM avec les styles
- Position et limites des éléments
- Limites configurables (maxDepth, maxNodes, maxStringLength)
- Bannières d'avertissement lorsque la capture est tronquée
- Rapide, léger, sans dépendances externes

## Installation

### À partir du code source (développement)

1. **Cloner le dépôt**
```bash
git clone https://github.com/mcp-tool-shop-org/websketch-extension.git
cd websketch-extension
```

2. **Installer les dépendances**
```bash
npm ci
```

3. **Construire l'extension**
```bash
npm run build
```

4. **Charger dans Chrome**
- Ouvrir `chrome://extensions/`
- Activer le "Mode développeur"
- Cliquer sur "Charger l'extension non empaquetée"
- Sélectionner le répertoire `dist/`

### Chrome Web Store (Bientôt disponible)

L'extension sera bientôt disponible sur le Chrome Web Store.

## Utilisation

1. **Accéder** à n'importe quelle page web
2. **Cliquer** sur l'icône de l'extension WebSketch dans votre barre d'outils
3. **Cliquer** sur "Capturer la page actuelle"
4. **Copier** les données de capture (copiées automatiquement dans le presse-papiers)
5. **Utiliser** les données WebSketch IR avec d'autres outils

## Développement

### Prérequis

- Node.js 18+
- npm
- Navigateur Chrome ou Edge

### Configuration

```bash
npm ci
npm run typecheck
npm run lint
npm test
```

### Construction

```bash
npm run build       # Production build
npm run dev         # Development build with watch mode
```

L'extension construite se trouve dans le répertoire `dist/`.

### Structure du projet

```
websketch-extension/
├── src/
│   ├── content.ts         # Content script (captures pages)
│   ├── popup.ts           # Popup UI script
│   └── static/
│       ├── popup.html     # Popup HTML
│       └── icons/         # Extension icons
├── tests/
│   └── capture.test.ts    # Tests
├── build.js               # Build script
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Scripts

```bash
npm run build           # Build for production
npm run dev             # Watch mode for development
npm run clean           # Remove dist/ directory
npm run typecheck       # Run TypeScript type checking
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm test                # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:coverage   # Generate coverage report
npm run validate        # Run all checks (typecheck, lint, test, build)
```

## Format WebSketch IR

L'extension capture les pages au format WebSketch IR :

```json
{
  "root": {
    "type": "HTML",
    "id": "...",
    "classes": ["..."],
    "children": [...]
  },
  "metadata": {
    "url": "https://example.com",
    "title": "Page Title",
    "timestamp": "2026-01-29T...",
    "viewport": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

## Dépannage

**La construction échoue avec des ressources manquantes :**
```bash
npm run build -- --allow-missing
```

**L'extension ne se charge pas :** Vérifiez que `dist/manifest.json` existe. Vérifiez les erreurs dans `chrome://extensions/`. Essayez `npm run clean && npm run build`.

**La capture ne fonctionne pas :** Vérifiez la console du navigateur pour les erreurs. Assurez-vous que vous êtes sur une page web normale (et non sur une page `chrome://`). Rechargez l'extension après l'avoir reconstruite.

## Contribution

Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour connaître les directives.

## Licence

MIT — voir [LICENSE](LICENSE) pour plus de détails.

## Liens

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Problèmes**: [github.com/mcp-tool-shop-org/websketch-extension/issues](https://github.com/mcp-tool-shop-org/websketch-extension/issues)
