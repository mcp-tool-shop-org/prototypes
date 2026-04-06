<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/code-bearings/readme.png" width="400" alt="Code Bearings">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/actions"><img src="https://github.com/mcp-tool-shop-org/code-bearings/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@code-bearings/cli"><img src="https://img.shields.io/npm/v/@code-bearings/cli" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/code-bearings/"><img src="https://img.shields.io/badge/Landing_Page-blue" alt="Landing Page"></a>
</p>

**Recupera el control de tu código.**

Code Bearings es una herramienta que analiza el código fuente y proporciona información contextualizada para proyectos modernos. Indexa tu proyecto TypeScript en un grafo de archivos, símbolos, módulos y dependencias, y luego proyecta esa información en todas las áreas donde la necesitas: línea de comandos, VS Code, CI.

La información siempre es precisa y consistente. La inteligencia artificial ayuda a explicar, enseñar y presentar la información. El usuario siempre tiene el control.

## ¿Qué hace?

| Interfaz | Lo que obtienes |
|---------|-------------|
| **CLI** | `code-bearings analyze` indexa tu proyecto. `code-bearings review` genera un resumen de los cambios a partir de cualquier diff de Git, con una evaluación de riesgos, evidencia que lo respalda y sugerencias para el revisor. |
| **VS Code** | Árboles de la barra de actividad, paneles de revisión interactivos, información al pasar el cursor, anotaciones de CodeLens, decoraciones en el margen, contexto de la barra de estado: todo se alimenta de la misma fuente de información precisa. |
| **CI** | `code-bearings ci` genera informes de revisión (Markdown, JSON, HTML) y, opcionalmente, puede fallar si se superan los umbrales de riesgo. |

## Instalación

```bash
# CLI (global)
npm install -g @code-bearings/cli

# Or run directly
npx @code-bearings/cli analyze

# VS Code extension (from marketplace or local)
# Search "Code Bearings" in the VS Code extensions panel
```

## Guía rápida

```bash
# 1. Index your project
code-bearings analyze

# 2. Review your changes
code-bearings review

# 3. Explore the graph
code-bearings modules
code-bearings module store
code-bearings function generateChangeBrief

# 4. Compare branches
code-bearings compare main feature-branch

# 5. Generate CI artifacts
code-bearings ci --fail-on-risk high
```

## Arquitectura

Code Bearings es un monorepositorio con tres paquetes que comparten un contrato de capas estrictas:

```
@code-bearings/core    ← Shared product logic (extraction, graph, review, rendering)
@code-bearings/cli     ← Thin CLI consuming core
@code-bearings/vscode  ← Thin editor surface consuming core
```

**El núcleo gestiona la información precisa.** La interfaz de línea de comandos es sencilla. La extensión es sencilla. No hay productos derivados.

### Tres capas de información

| Capa | Qué | Ejemplo |
|-------|------|---------|
| **A. Extracted Truth** | Datos extraídos del código fuente | "La función X llama a la función Y" |
| **B. Derived Structure** | Calculado a partir de la Capa A | "El módulo M tiene 7 dependencias, con una puntuación de riesgo de 25" |
| **C. Human Narration** | Explicaciones basadas en la información de la Capa A | "Este cambio elimina el manejo de errores de una ruta de alto tráfico" |

### Cinco modos de uso

La revisión general muestra la información precisa. Otros modos ayudan a que los usuarios comprendan esa información.

| Modo | Función |
|------|------|
| **General** | Resumen de cambios canónico: qué cambió, riesgo, evidencia |
| **Bug Hunter** | Hipótesis de fallos, puntos ciegos, sugerencias de inspección |
| **Learning** | Traducciones de sintaxis, explicaciones de antes/después |
| **Architecture** | Roles de los módulos, estado de los límites, posición en el sistema |
| **Exploration** | Preguntas guiadas para bases de código desconocidas |

## Paquetes

| Paquete | Descripción | npm |
|---------|-------------|-----|
| [`@code-bearings/core`](packages/core/) | Lógica compartida de extracción, grafo, revisión y renderizado | [![npm](https://img.shields.io/npm/v/@code-bearings/core)](https://www.npmjs.com/package/@code-bearings/core) |
| [`@code-bearings/cli`](packages/cli/) | Interfaz de línea de comandos | [![npm](https://img.shields.io/npm/v/@code-bearings/cli)](https://www.npmjs.com/package/@code-bearings/cli) |
| [`@code-bearings/vscode`](packages/vscode/) | Extensión de VS Code | — |

## Requisitos

- Node.js >= 20
- Proyecto TypeScript con un archivo `tsconfig.json`
- Git (para los comandos de revisión/comparación)

## Seguridad y Confianza

- **Sin acceso a la red.** Sin telemetría. Sin análisis. Sin envío de datos.
- **Acceso de solo lectura al código fuente.** Code Bearings lee tus archivos de código a través del análisis de AST. Nunca los modifica.
- **Base de datos local únicamente.** El archivo SQLite `.code-bearings/bearings.db` permanece en tu proyecto.
- **Sin ejecución de código.** Solo análisis estático.

Consulta [SECURITY.md](SECURITY.md) para obtener el modelo de amenazas completo.

## Licencia

[MIT](LICENSE)

---

Desarrollado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
