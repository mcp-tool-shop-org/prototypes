<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-extension

**Estensione per Chrome per acquisire pagine web come [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir).**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-extension/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

---

## Come iniziare

1. Costruire e caricare l'estensione (vedere [Installazione](#installation))
2. Navigare in qualsiasi pagina web e fare clic sull'icona di WebSketch
3. Fare clic su "Acquisisci la pagina corrente" — i dati JSON acquisiti vengono copiati negli appunti
4. Verificare: `websketch validate capture.json` oppure incollare i dati nella [demo](https://mcptoolshop.com)
5. Visualizzare: `websketch render capture.json` oppure utilizzare le viste ad albero/ASCII della demo

Configurare i limiti tramite le impostazioni (icona dell'ingranaggio nel popup). Consultare la guida completa [workflow](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started).

## Funzionalità

- Acquisizione di una pagina con un solo clic
- Copia automatica negli appunti
- Acquisizione completa dell'albero DOM con stili
- Limiti e posizionamento degli elementi
- Limiti configurabili (maxDepth, maxNodes, maxStringLength)
- Avvisi quando l'acquisizione viene troncata
- Veloce, leggero, senza dipendenze esterne

## Installazione

### Da sorgente (sviluppo)

1. **Clonare il repository**
```bash
git clone https://github.com/mcp-tool-shop-org/websketch-extension.git
cd websketch-extension
```

2. **Installare le dipendenze**
```bash
npm ci
```

3. **Costruire l'estensione**
```bash
npm run build
```

4. **Caricare in Chrome**
- Aprire `chrome://extensions/`
- Abilitare "Modalità sviluppatore"
- Fare clic su "Carica estensione non compressa"
- Selezionare la directory `dist/`

### Chrome Web Store (in arrivo)

L'estensione sarà disponibile presto sul Chrome Web Store.

## Utilizzo

1. **Navigare** in qualsiasi pagina web
2. **Fare clic** sull'icona dell'estensione WebSketch nella barra degli strumenti
3. **Fare clic** su "Acquisisci la pagina corrente"
4. **Copiare** i dati acquisiti (copiati automaticamente negli appunti)
5. **Utilizzare** i dati WebSketch IR con altri strumenti

## Sviluppo

### Prerequisiti

- Node.js 18+
- npm
- Browser Chrome o Edge

### Configurazione

```bash
npm ci
npm run typecheck
npm run lint
npm test
```

### Costruzione

```bash
npm run build       # Production build
npm run dev         # Development build with watch mode
```

L'estensione costruita si troverà nella directory `dist/`.

### Struttura del progetto

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

### Script

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

L'estensione acquisisce le pagine nel formato WebSketch IR:

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

## Risoluzione dei problemi

**La compilazione fallisce a causa di risorse mancanti:**
```bash
npm run build -- --allow-missing
```

**L'estensione non si carica:** Verificare che esista `dist/manifest.json`. Controllare `chrome://extensions/` per eventuali errori. Provare `npm run clean && npm run build`.

**L'acquisizione non funziona:** Controllare la console del browser per eventuali errori. Assicurarsi di essere su una pagina web normale (non su pagine `chrome://`). Ricaricare l'estensione dopo averla ricostruita.

## Contributi

Consultare [CONTRIBUTING.md](CONTRIBUTING.md) per le linee guida.

## Licenza

MIT — vedere [LICENSE](LICENSE) per i dettagli.

## Link

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Problemi**: [github.com/mcp-tool-shop-org/websketch-extension/issues](https://github.com/mcp-tool-shop-org/websketch-extension/issues)
