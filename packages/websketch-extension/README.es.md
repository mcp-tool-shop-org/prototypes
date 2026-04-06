<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-extension

**Extensión para Chrome que captura páginas web como [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir).**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-extension/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

---

## Cómo empezar

1. Construye y carga la extensión (consulta [Instalación](#installation))
2. Navega a cualquier página web y haz clic en el icono de WebSketch
3. Haz clic en "Capturar página actual" — los datos JSON de la captura se copian al portapapeles
4. Valida: `websketch validate capture.json` o pega en el [demostrador](https://mcptoolshop.com)
5. Visualiza: `websketch render capture.json` o utiliza las vistas de árbol/ASCII del demostrador

Configura los límites a través de la configuración (icono de engranaje en la ventana emergente). Consulta la guía completa de [flujo de trabajo](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started).

## Características

- Captura de página con un solo clic
- Copia automática al portapapeles
- Captura completa del árbol DOM con estilos
- Límites y posicionamiento de los elementos
- Límites configurables (maxDepth, maxNodes, maxStringLength)
- Avisos cuando la captura se trunca
- Rápido, ligero, sin dependencias externas

## Instalación

### Desde el código fuente (desarrollo)

1. **Clona el repositorio**
```bash
git clone https://github.com/mcp-tool-shop-org/websketch-extension.git
cd websketch-extension
```

2. **Instala las dependencias**
```bash
npm ci
```

3. **Construye la extensión**
```bash
npm run build
```

4. **Carga en Chrome**
- Abre `chrome://extensions/`
- Activa "Modo para desarrolladores"
- Haz clic en "Cargar sin comprimir"
- Selecciona el directorio `dist/`

### Tienda de Chrome Web (Próximamente)

La extensión estará disponible en la Chrome Web Store próximamente.

## Uso

1. **Navega** a cualquier página web
2. **Haz clic** en el icono de la extensión WebSketch en tu barra de herramientas
3. **Haz clic** en "Capturar página actual"
4. **Copia** los datos de la captura (se copian automáticamente al portapapeles)
5. **Utiliza** los datos de WebSketch IR con otras herramientas

## Desarrollo

### Requisitos previos

- Node.js 18+
- npm
- Navegador Chrome o Edge

### Configuración

```bash
npm ci
npm run typecheck
npm run lint
npm test
```

### Construcción

```bash
npm run build       # Production build
npm run dev         # Development build with watch mode
```

La extensión construida estará en el directorio `dist/`.

### Estructura del proyecto

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

La extensión captura páginas en el formato WebSketch IR:

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

## Solución de problemas

**La construcción falla con activos faltantes:**
```bash
npm run build -- --allow-missing
```

**La extensión no se carga:** Asegúrate de que exista `dist/manifest.json`. Comprueba `chrome://extensions/` en busca de errores. Intenta `npm run clean && npm run build`.

**La captura no funciona:** Comprueba la consola del navegador en busca de errores. Asegúrate de que estás en una página web normal (no en páginas `chrome://`). Recarga la extensión después de reconstruirla.

## Contribución

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para obtener pautas.

## Licencia

MIT — consulta [LICENSE](LICENSE) para obtener detalles.

## Enlaces

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Problemas**: [github.com/mcp-tool-shop-org/websketch-extension/issues](https://github.com/mcp-tool-shop-org/websketch-extension/issues)
