<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-mcp

**Serveur MCP exposant les outils [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) pour les agents LLM.**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/websketch-mcp"><img src="https://img.shields.io/npm/v/websketch-mcp?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

Serveur MCP exposant les outils [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) pour les agents LLM.

## Démarrage

```bash
# Install
npm install -g websketch-mcp

# Add to Claude Desktop config:
# { "mcpServers": { "websketch": { "command": "websketch-mcp" } } }

# The MCP server exposes 4 tools:
# 1. websketch_validate - preflight check (always call first)
# 2. websketch_render   - ASCII wireframe
# 3. websketch_diff     - compare two captures
# 4. websketch_fingerprint - structural hash
```

Consultez le [guide de démarrage](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started) complet dans websketch-ir.

## Fonctionnalités

- 🛡️ **websketch_validate**: Validation préliminaire (ne génère jamais d'erreur, renvoie `{ ok: true/false }`)
- 🎨 **websketch_render**: Génère des maquettes ASCII à partir des captures WebSketch IR
- 🔍 **websketch_diff**: Calcule les différences entre les captures d'interface utilisateur
- 🔑 **websketch_fingerprint**: Génère des empreintes numériques déterministes pour les captures

## Installation

### npm

```bash
npm install -g websketch-mcp
```

### À partir du code source

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp
npm ci
npm run build
npm link
```

## Utilisation

### Claude Desktop

Ajoutez ceci à votre `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "websketch": {
      "command": "websketch-mcp"
    }
  }
}
```

### Programmation

```bash
# Run as stdio server
websketch-mcp
```

Ou, programmez-le en Node.js :

```typescript
import { spawn } from 'child_process';

const server = spawn('websketch-mcp', [], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Send MCP protocol messages via stdin/stdout
```

## Outils

### websketch_render

Génère une maquette ASCII à partir d'une capture WebSketch IR.

**Entrée :**
```json
{
  "capture": {
    "root": {
      "type": "Frame",
      "id": "root",
      "children": [...]
    }
  }
}
```

**Sortie :**
```
┌─────────────────────┐
│ Frame (root)        │
│ ├── Button (#btn1)  │
│ └── Text (#text1)   │
└─────────────────────┘
```

### websketch_diff

Calcule une différence entre deux captures WebSketch IR.

**Entrée :**
```json
{
  "before": { "root": {...} },
  "after": { "root": {...} }
}
```

**Sortie :**
```json
{
  "added": [...],
  "removed": [...],
  "modified": [...]
}
```

### websketch_fingerprint

Génère une empreinte numérique déterministe pour une capture.

**Entrée :**
```json
{
  "capture": { "root": {...} }
}
```

**Sortie :**
```
abc123def456...
```

## Développement

### Prérequis

- Node.js 18+
- npm

### Configuration

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp

# Install dependencies
npm ci

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

### Scripts

```bash
npm run build         # Compile TypeScript to dist/
npm run dev           # Watch mode compilation
npm run start         # Run the compiled server
npm run typecheck     # Type checking without emit
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Generate coverage report
npm run clean         # Remove dist/ folder
```

### Structure du projet

```
websketch-mcp/
├── src/
│   └── index.ts          # Main server implementation
├── tests/
│   └── smoke.test.ts     # Test files
├── scripts/
│   └── add-shebang.js    # Post-build script
├── .github/
│   ├── workflows/
│   │   ├── ci.yml        # CI pipeline (includes security scanning)
│   │   └── publish.yml   # npm publish (release + dispatch)
│   └── dependabot.yml    # Dependency updates
├── dist/                 # Compiled output (gitignored)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── vitest.config.ts      # Test configuration
└── .eslintrc.cjs         # ESLint configuration
```

## Tests

```bash
# Run all tests
npm test

# Run tests once (for CI)
npm run test:run

# Generate coverage report
npm run test:coverage
```

Les tests sont écrits avec Vitest. Consultez le répertoire `tests/` pour des exemples.

## Publication

Le paquet est configuré avec des vérifications de sécurité avant la publication :

```bash
# This will automatically:
# 1. Run type checking
# 2. Run linting
# 3. Run tests
# 4. Build the package
npm publish
```

Étapes manuelles de publication :

```bash
# Bump version
npm version patch|minor|major

# Publish to npm
npm publish

# Push tags
git push --follow-tags
```

## Dépannage

### L'interface en ligne de commande (CLI) n'est pas trouvée après l'installation

```bash
# Ensure global bin directory is in PATH
npm config get prefix

# Or use npx
npx websketch-mcp
```

### Échecs de construction

```bash
# Clean and rebuild
npm run clean
npm ci
npm run build
```

### Erreurs d'autorisation sur Unix

Le script de construction automatique rend `dist/index.js` exécutable. Si vous rencontrez des problèmes :

```bash
chmod +x dist/index.js
```

## Contribution

Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour connaître les directives.

## Licence

MIT - consultez le fichier [LICENSE](LICENSE) pour plus de détails.

## Liens

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Model Context Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Problèmes**: [github.com/mcp-tool-shop-org/websketch-mcp/issues](https://github.com/mcp-tool-shop-org/websketch-mcp/issues)

## Support

Pour toute question ou problème, veuillez ouvrir un ticket sur GitHub.
