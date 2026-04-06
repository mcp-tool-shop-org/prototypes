<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-mcp

**Server MCP che espone strumenti [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) per agenti LLM.**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/websketch-mcp"><img src="https://img.shields.io/npm/v/websketch-mcp?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

Server MCP che espone strumenti [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) per agenti LLM.

## Come Iniziare

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

Consultare la [guida completa](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started) in websketch-ir.

## Funzionalità

- 🛡️ **websketch_validate**: Validazione preliminare (non genera errori, restituisce `{ ok: true/false }`)
- 🎨 **websketch_render**: Genera rappresentazioni ASCII delle catture WebSketch IR
- 🔍 **websketch_diff**: Calcola le differenze tra le catture dell'interfaccia utente
- 🔑 **websketch_fingerprint**: Genera impronte digitali deterministiche per le catture

## Installazione

### npm

```bash
npm install -g websketch-mcp
```

### Da Sorgente

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp
npm ci
npm run build
npm link
```

## Utilizzo

### Claude Desktop

Aggiungere quanto segue al file `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "websketch": {
      "command": "websketch-mcp"
    }
  }
}
```

### Programmaticamente

```bash
# Run as stdio server
websketch-mcp
```

Oppure, programmaticamente in Node.js:

```typescript
import { spawn } from 'child_process';

const server = spawn('websketch-mcp', [], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Send MCP protocol messages via stdin/stdout
```

## Strumenti

### websketch_render

Genera una rappresentazione ASCII di una cattura WebSketch IR.

**Input:**
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

**Output:**
```
┌─────────────────────┐
│ Frame (root)        │
│ ├── Button (#btn1)  │
│ └── Text (#text1)   │
└─────────────────────┘
```

### websketch_diff

Calcola la differenza tra due catture WebSketch IR.

**Input:**
```json
{
  "before": { "root": {...} },
  "after": { "root": {...} }
}
```

**Output:**
```json
{
  "added": [...],
  "removed": [...],
  "modified": [...]
}
```

### websketch_fingerprint

Genera un'impronta digitale deterministica per una cattura.

**Input:**
```json
{
  "capture": { "root": {...} }
}
```

**Output:**
```
abc123def456...
```

## Sviluppo

### Prerequisiti

- Node.js 18+
- npm

### Configurazione

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

### Script

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

### Struttura del Progetto

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

## Test

```bash
# Run all tests
npm test

# Run tests once (for CI)
npm run test:run

# Generate coverage report
npm run test:coverage
```

I test sono scritti utilizzando Vitest. Consultare la directory `tests/` per esempi.

## Pubblicazione

Il pacchetto è configurato con controlli di sicurezza pre-pubblicazione:

```bash
# This will automatically:
# 1. Run type checking
# 2. Run linting
# 3. Run tests
# 4. Build the package
npm publish
```

Passaggi manuali per la pubblicazione:

```bash
# Bump version
npm version patch|minor|major

# Publish to npm
npm publish

# Push tags
git push --follow-tags
```

## Risoluzione dei Problemi

### CLI Non Trovata Dopo l'Installazione

```bash
# Ensure global bin directory is in PATH
npm config get prefix

# Or use npx
npx websketch-mcp
```

### Errori di Compilazione

```bash
# Clean and rebuild
npm run clean
npm ci
npm run build
```

### Errori di Permesso su Sistemi Unix

Lo script di post-compilazione rende automaticamente eseguibile il file `dist/index.js`. Se si riscontrano problemi:

```bash
chmod +x dist/index.js
```

## Contributi

Consultare [CONTRIBUTING.md](CONTRIBUTING.md) per le linee guida.

## Licenza

MIT - consultare il file [LICENSE](LICENSE) per i dettagli.

## Link

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Model Context Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Issues**: [github.com/mcp-tool-shop-org/websketch-mcp/issues](https://github.com/mcp-tool-shop-org/websketch-mcp/issues)

## Supporto

Per domande o problemi, si prega di aprire un ticket su GitHub.
