<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-extension

**Extensão para Chrome que captura páginas da web como [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir).**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-extension/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

---

## Começando

1. Compile e carregue a extensão (veja [Instalação](#installation))
2. Navegue até qualquer página da web e clique no ícone do WebSketch
3. Clique em "Capturar Página Atual" — o JSON da captura é copiado para a área de transferência
4. Valide: `websketch validate capture.json` ou cole no [demo](https://mcptoolshop.com)
5. Visualize: `websketch render capture.json` ou use as visualizações de Árvore/ASCII do demo

Configure os limites nas Configurações (ícone de engrenagem na janela pop-up). Consulte o [guia completo](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started).

## Recursos

- Captura de página com um clique
- Cópia automática para a área de transferência
- Captura completa da árvore DOM com estilos
- Limites e posicionamento dos elementos
- Limites configuráveis (maxDepth, maxNodes, maxStringLength)
- Avisos quando a captura é truncada
- Rápido, leve, sem dependências externas

## Instalação

### A partir do Código Fonte (Desenvolvimento)

1. **Clone o repositório**
```bash
git clone https://github.com/mcp-tool-shop-org/websketch-extension.git
cd websketch-extension
```

2. **Instale as dependências**
```bash
npm ci
```

3. **Compile a extensão**
```bash
npm run build
```

4. **Carregue no Chrome**
- Abra `chrome://extensions/`
- Ative o "Modo de desenvolvedor"
- Clique em "Carregar sem compactar"
- Selecione o diretório `dist/`

### Chrome Web Store (Em Breve)

A extensão estará disponível na Chrome Web Store em breve.

## Uso

1. **Navegue** até qualquer página da web
2. **Clique** no ícone da extensão WebSketch na sua barra de ferramentas
3. **Clique** em "Capturar Página Atual"
4. **Copie** os dados da captura (copiados automaticamente para a área de transferência)
5. **Use** os dados do WebSketch IR com outras ferramentas

## Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm
- Navegador Chrome ou Edge

### Configuração

```bash
npm ci
npm run typecheck
npm run lint
npm test
```

### Compilação

```bash
npm run build       # Production build
npm run dev         # Development build with watch mode
```

A extensão compilada estará no diretório `dist/`.

### Estrutura do Projeto

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

## Formato WebSketch IR

A extensão captura páginas no formato WebSketch IR:

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

## Solução de Problemas

**A compilação falha com ativos ausentes:**
```bash
npm run build -- --allow-missing
```

**A extensão não é carregada:** Verifique se o arquivo `dist/manifest.json` existe. Verifique se há erros em `chrome://extensions/`. Tente `npm run clean && npm run build`.

**A captura não funciona:** Verifique o console do navegador em busca de erros. Certifique-se de que você está em uma página da web normal (não em páginas `chrome://`). Recarregue a extensão após recompilá-la.

## Contribuições

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para obter diretrizes.

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.

## Links

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Problemas**: [github.com/mcp-tool-shop-org/websketch-extension/issues](https://github.com/mcp-tool-shop-org/websketch-extension/issues)
