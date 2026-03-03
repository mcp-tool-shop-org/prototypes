<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-demo/readme.png" width="400" alt="WebSketch">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-demo/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Site de demonstração interativa para [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) — visualize a representação da interface do usuário baseada em gramática.

## Como Começar

1. Visite a [demonstração online](https://mcp-tool-shop-org.github.io/websketch-demo/)
2. Cole um arquivo JSON de captura do WebSketch no painel de entrada
3. Clique em **Visualizar** para ver as visualizações em árvore e ASCII
4. Alterne para o modo **Comparar** para comparar duas capturas lado a lado
5. Clique em **Exportar Pacote** para baixar um arquivo `.ws.json` compartilhável

As capturas são criadas com a [extensão do Chrome](https://github.com/mcp-tool-shop-org/websketch-extension). Consulte o [guia completo](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started).

## Recursos

- Visualização interativa da gramática do WebSketch IR
- Editor JSON com validação de sintaxe
- Visualização em árvore com identificadores de função, dicas semânticas e informações de caixa delimitadora
- Renderização de wireframe ASCII
- Modo de comparação com visualizações ASCII lado a lado e resumo das diferenças
- Exportação de pacote para compartilhar capturas
- Exibição de avisos embutidos para capturas truncadas
- Implementação rápida e leve em TypeScript puro
- Design responsivo para todos os dispositivos

## Início Rápido

### Para Desenvolvedores

#### Pré-requisitos

- Node.js 20+
- npm ou yarn

#### Instalação

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-demo.git
cd websketch-demo

npm ci
npm run dev
```

O aplicativo será aberto em `http://localhost:3000`.

#### Scripts Disponíveis

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

## Estrutura do Projeto

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

## Tecnologias Utilizadas

- **Framework**: TypeScript puro (sem sobrecarga de framework)
- **Ferramenta de Build**: Vite
- **Testes**: Vitest
- **Linting**: ESLint + TypeScript ESLint
- **Formatação**: Prettier
- **CI/CD**: GitHub Actions

## Links

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Problemas**: [github.com/mcp-tool-shop-org/websketch-demo/issues](https://github.com/mcp-tool-shop-org/websketch-demo/issues)

## Licença

MIT — veja [LICENSE](LICENSE).

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
