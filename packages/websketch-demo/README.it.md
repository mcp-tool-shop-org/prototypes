<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-demo/readme.png" width="400" alt="WebSketch">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-demo/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Sito dimostrativo interattivo per [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) — per visualizzare la rappresentazione dell'interfaccia utente basata su grammatica.

## Come iniziare

1. Visitate la [demo live](https://mcp-tool-shop-org.github.io/websketch-demo/)
2. Inserite un file JSON di acquisizione WebSketch nel pannello "Input"
3. Cliccate su **Visualizza** per vedere le viste ad albero e ASCII
4. Passate alla modalità **Confronta** per confrontare due acquisizioni affiancate
5. Cliccate su **Esporta bundle** per scaricare un file `.ws.json` condivisibile

Le acquisizioni vengono create con l'[estensione per Chrome](https://github.com/mcp-tool-shop-org/websketch-extension). Consultate la [guida completa](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started).

## Funzionalità

- Visualizzazione interattiva della grammatica di WebSketch IR
- Editor JSON con validazione della sintassi
- Vista ad albero con badge di ruolo, suggerimenti semantici e informazioni sul riquadro di delimitazione
- Rendering di wireframe ASCII
- Modalità di confronto con rendering ASCII affiancato e riepilogo delle differenze
- Esportazione di un bundle per la condivisione delle acquisizioni
- Visualizzazione di avvisi integrati per acquisizioni troncate
- Implementazione TypeScript semplice e leggera
- Design reattivo per tutti i dispositivi

## Guida rapida

### Per sviluppatori

#### Prerequisiti

- Node.js 20+
- npm o yarn

#### Installazione

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-demo.git
cd websketch-demo

npm ci
npm run dev
```

L'applicazione si aprirà a `http://localhost:3000`.

#### Script disponibili

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

## Struttura del progetto

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

## Stack tecnologico

- **Framework**: Vanilla TypeScript (nessun overhead di framework)
- **Strumento di build**: Vite
- **Testing**: Vitest
- **Linting**: ESLint + TypeScript ESLint
- **Formattazione**: Prettier
- **CI/CD**: GitHub Actions

## Link

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Problemi**: [github.com/mcp-tool-shop-org/websketch-demo/issues](https://github.com/mcp-tool-shop-org/websketch-demo/issues)

## Licenza

MIT — vedere [LICENSE](LICENSE).

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
