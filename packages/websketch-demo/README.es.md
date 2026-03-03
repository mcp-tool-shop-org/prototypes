<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-demo/readme.png" width="400" alt="WebSketch">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-demo/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Sitio de demostración interactivo para [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir): permite visualizar la representación de la interfaz de usuario basada en gramática.

## Cómo empezar

1. Visite la [demostración en vivo](https://mcp-tool-shop-org.github.io/websketch-demo/)
2. Pegue un archivo JSON de captura de WebSketch en el panel de entrada.
3. Haga clic en **Visualizar** para ver las vistas de árbol y ASCII.
4. Cambie al modo **Comparar** para ver dos capturas una al lado de la otra.
5. Haga clic en **Exportar paquete** para descargar un archivo `.ws.json` que se puede compartir.

Las capturas se crean con la [extensión de Chrome](https://github.com/mcp-tool-shop-org/websketch-extension). Consulte la [guía completa](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started).

## Características

- Visualización interactiva de la gramática de WebSketch IR.
- Editor JSON con validación de sintaxis.
- Vista de árbol con insignias de rol, sugerencias semánticas e información de cuadro delimitador.
- Renderizado de esquemáticos ASCII.
- Modo de comparación con vistas ASCII y resumen de diferencias lado a lado.
- Exportación de paquete para compartir capturas.
- Visualización de advertencias integradas para capturas truncadas.
- Implementación ligera y rápida en TypeScript puro.
- Diseño adaptable para todos los dispositivos.

## Inicio rápido

### Para desarrolladores

#### Requisitos previos

- Node.js 20+
- npm o yarn

#### Instalación

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-demo.git
cd websketch-demo

npm ci
npm run dev
```

La aplicación se abrirá en `http://localhost:3000`.

#### Scripts disponibles

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

## Estructura del proyecto

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

## Pila tecnológica

- **Framework**: TypeScript puro (sin sobrecarga de framework)
- **Herramienta de compilación**: Vite
- **Pruebas**: Vitest
- **Análisis estático**: ESLint + TypeScript ESLint
- **Formato**: Prettier
- **CI/CD**: GitHub Actions

## Enlaces

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Problemas**: [github.com/mcp-tool-shop-org/websketch-demo/issues](https://github.com/mcp-tool-shop-org/websketch-demo/issues)

## Licencia

MIT — consulte [LICENSE](LICENSE).

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
