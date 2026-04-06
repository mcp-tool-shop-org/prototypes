<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-mcp

**Servidor MCP que expone herramientas de [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) para agentes de modelos de lenguaje (LLM).**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/websketch-mcp"><img src="https://img.shields.io/npm/v/websketch-mcp?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

Servidor MCP que expone herramientas de [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) para agentes de modelos de lenguaje (LLM).

## Cómo empezar

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

Consulte la [guía de flujo de trabajo](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started) completa en websketch-ir.

## Características

- 🛡️ **websketch_validate**: Validación preliminar (nunca genera errores, devuelve `{ ok: true/false }`).
- 🎨 **websketch_render**: Renderiza capturas de WebSketch IR a diagramas de alambre ASCII.
- 🔍 **websketch_diff**: Calcula las diferencias entre capturas de la interfaz de usuario.
- 🔑 **websketch_fingerprint**: Genera huellas digitales deterministas para las capturas.

## Instalación

### npm

```bash
npm install -g websketch-mcp
```

### Desde el código fuente

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp
npm ci
npm run build
npm link
```

## Uso

### Claude Desktop

Agregue lo siguiente a su `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "websketch": {
      "command": "websketch-mcp"
    }
  }
}
```

### Programáticamente

```bash
# Run as stdio server
websketch-mcp
```

O, de forma programática, en Node.js:

```typescript
import { spawn } from 'child_process';

const server = spawn('websketch-mcp', [], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Send MCP protocol messages via stdin/stdout
```

## Herramientas

### websketch_render

Renderiza una captura de WebSketch IR a un diagrama de alambre ASCII.

**Entrada:**
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

**Salida:**
```
┌─────────────────────┐
│ Frame (root)        │
│ ├── Button (#btn1)  │
│ └── Text (#text1)   │
└─────────────────────┘
```

### websketch_diff

Calcula una diferencia entre dos capturas de WebSketch IR.

**Entrada:**
```json
{
  "before": { "root": {...} },
  "after": { "root": {...} }
}
```

**Salida:**
```json
{
  "added": [...],
  "removed": [...],
  "modified": [...]
}
```

### websketch_fingerprint

Genera una huella digital determinista para una captura.

**Entrada:**
```json
{
  "capture": { "root": {...} }
}
```

**Salida:**
```
abc123def456...
```

## Desarrollo

### Requisitos previos

- Node.js 18+
- npm

### Configuración

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

### Estructura del proyecto

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

## Pruebas

```bash
# Run all tests
npm test

# Run tests once (for CI)
npm run test:run

# Generate coverage report
npm run test:coverage
```

Las pruebas se escriben utilizando Vitest. Consulte el directorio `tests/` para obtener ejemplos.

## Publicación

El paquete está configurado con comprobaciones de seguridad previas a la publicación:

```bash
# This will automatically:
# 1. Run type checking
# 2. Run linting
# 3. Run tests
# 4. Build the package
npm publish
```

Pasos manuales para la publicación:

```bash
# Bump version
npm version patch|minor|major

# Publish to npm
npm publish

# Push tags
git push --follow-tags
```

## Solución de problemas

### No se encuentra la CLI después de la instalación

```bash
# Ensure global bin directory is in PATH
npm config get prefix

# Or use npx
npx websketch-mcp
```

### Fallos en la compilación

```bash
# Clean and rebuild
npm run clean
npm ci
npm run build
```

### Errores de permisos en Unix

El script de compilación posterior hace que `dist/index.js` sea ejecutable. Si tiene problemas:

```bash
chmod +x dist/index.js
```

## Contribución

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para obtener pautas.

## Licencia

MIT: consulte el archivo [LICENSE](LICENSE) para obtener detalles.

## Enlaces

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Model Context Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Problemas**: [github.com/mcp-tool-shop-org/websketch-mcp/issues](https://github.com/mcp-tool-shop-org/websketch-mcp/issues)

## Soporte

Para preguntas o problemas, abra un problema en GitHub.
