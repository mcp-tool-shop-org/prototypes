<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-mcp

**Servidor MCP que expõe ferramentas [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) para agentes de LLM.**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/websketch-mcp"><img src="https://img.shields.io/npm/v/websketch-mcp?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

Servidor MCP que expõe ferramentas [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) para agentes de LLM.

## Começando

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

Consulte o [guia de fluxo de trabalho](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started) completo em websketch-ir.

## Funcionalidades

- 🛡️ **websketch_validate**: Validação preliminar (nunca gera erros, retorna `{ ok: true/false }`)
- 🎨 **websketch_render**: Renderiza capturas do WebSketch IR em diagramas ASCII
- 🔍 **websketch_diff**: Calcula as diferenças entre capturas de interface do usuário
- 🔑 **websketch_fingerprint**: Gera impressões digitais determinísticas para capturas

## Instalação

### npm

```bash
npm install -g websketch-mcp
```

### A partir do código-fonte

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp
npm ci
npm run build
npm link
```

## Uso

### Claude Desktop

Adicione ao seu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "websketch": {
      "command": "websketch-mcp"
    }
  }
}
```

### Programático

```bash
# Run as stdio server
websketch-mcp
```

Ou, programaticamente, em Node.js:

```typescript
import { spawn } from 'child_process';

const server = spawn('websketch-mcp', [], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Send MCP protocol messages via stdin/stdout
```

## Ferramentas

### websketch_render

Renderiza uma captura do WebSketch IR em um diagrama ASCII.

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

**Saída:**
```
┌─────────────────────┐
│ Frame (root)        │
│ ├── Button (#btn1)  │
│ └── Text (#text1)   │
└─────────────────────┘
```

### websketch_diff

Calcula a diferença entre duas capturas do WebSketch IR.

**Entrada:**
```json
{
  "before": { "root": {...} },
  "after": { "root": {...} }
}
```

**Saída:**
```json
{
  "added": [...],
  "removed": [...],
  "modified": [...]
}
```

### websketch_fingerprint

Gera uma impressão digital determinística para uma captura.

**Entrada:**
```json
{
  "capture": { "root": {...} }
}
```

**Saída:**
```
abc123def456...
```

## Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm

### Configuração

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

### Estrutura do projeto

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

## Testes

```bash
# Run all tests
npm test

# Run tests once (for CI)
npm run test:run

# Generate coverage report
npm run test:coverage
```

Os testes são escritos usando Vitest. Consulte o diretório `tests/` para exemplos.

## Publicação

O pacote está configurado com verificações de segurança antes da publicação:

```bash
# This will automatically:
# 1. Run type checking
# 2. Run linting
# 3. Run tests
# 4. Build the package
npm publish
```

Etapas manuais de publicação:

```bash
# Bump version
npm version patch|minor|major

# Publish to npm
npm publish

# Push tags
git push --follow-tags
```

## Solução de problemas

### Comando não encontrado após a instalação

```bash
# Ensure global bin directory is in PATH
npm config get prefix

# Or use npx
npx websketch-mcp
```

### Falhas na compilação

```bash
# Clean and rebuild
npm run clean
npm ci
npm run build
```

### Erros de permissão no Unix

O script de pós-compilação torna automaticamente o arquivo `dist/index.js` executável. Se você encontrar problemas:

```bash
chmod +x dist/index.js
```

## Contribuição

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para obter diretrizes.

## Licença

MIT - consulte o arquivo [LICENSE](LICENSE) para obter detalhes.

## Links

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Model Context Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Problemas**: [github.com/mcp-tool-shop-org/websketch-mcp/issues](https://github.com/mcp-tool-shop-org/websketch-mcp/issues)

## Suporte

Para perguntas ou problemas, abra um problema no GitHub.
