<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh.md">中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.it.md">Italiano</a> ·
  <a href="README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-cli/readme.png" alt="WebSketch CLI" width="400"></p>

<p align="center"><strong>CLI for WebSketch IR — render, diff, and fingerprint web UI captures so LLMs and CI pipelines can reason about what users see.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/websketch"><img src="https://img.shields.io/npm/v/@mcptoolshop/websketch.svg" alt="npm version"></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT">
  <a href="https://mcp-tool-shop-org.github.io/websketch-cli/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

## De un vistazo

- **Renderización ASCII:** Convierte cualquier captura de WebSketch en un diseño de diagramas de bloques que se ajuste a una terminal o a la ventana de contexto de un LLM.
- **Huella estructural:** Calcula un hash del diseño de una página para poder detectar cambios sin comparar píxeles.
- **Diferencia semántica:** Compara dos capturas y obtén un informe clasificado de los cambios (añadidos, movidos, redimensionados, texto modificado).
- **Empaquetado en lote:** Combina capturas (y, opcionalmente, la diferencia) en un único archivo `.ws.json` que se pueda compartir.
- **Diseñado para pipelines:** Cada comando admite la salida en formato `--json` y códigos de salida deterministas para la creación de scripts de CI.
- **Modo optimizado para LLM:** La opción `--llm` genera una salida rica en metadatos, diseñada para ser utilizada por agentes.

## Instalación

```bash
pnpm add -g @mcptoolshop/websketch
```

O ejecútelo sin instalar:

```bash
npx @mcptoolshop/websketch render capture.json
```

## Comandos

### validate

Verifica que un archivo de captura cumpla con el esquema de WebSketch IR.

```bash
websketch validate capture.json
```

### render-ascii

Convierte una captura a arte ASCII (legible para LLM).

```bash
# Default 80x24 grid
websketch render-ascii capture.json

# LLM-optimized format with metadata and legend
websketch render-ascii --llm capture.json

# Custom dimensions
websketch render-ascii --width 120 --height 40 capture.json

# Minimal structure-only view
websketch render-ascii --structure capture.json
```

**Ejemplo de salida:**

```
+---------------------------------------------------------------------------+
|[NAV:primary_nav]                                                          |
+---------------------------------------------------------------------------+
|                    +----------------------------------------+             |
|                    |[FRM:login]                             |             |
|                    |  [INP:email]                           |             |
|                    |  [INP:password]                        |             |
|                    |  [BTN:primary_cta]                     |             |
|                    +----------------------------------------+             |
+---------------------------------------------------------------------------+
```

### fingerprint

Calcula una huella estructural para la comparación.

```bash
# Full fingerprint (includes text)
websketch fingerprint capture.json
# Output: e33442b6

# Layout-only fingerprint (ignores text changes)
websketch fingerprint --layout-only capture.json
```

### diff

Compara dos capturas e informa sobre los cambios.

```bash
# Human-readable diff report
websketch diff before.json after.json

# JSON output
websketch diff --json before.json after.json

# Layout-only (ignore text changes)
websketch diff --layout-only before.json after.json

# Custom match threshold
websketch diff --threshold 0.7 before.json after.json
```

### bundle

Empaqueta una o más capturas en un archivo `.ws.json` que se pueda compartir. Cuando se proporcionan exactamente dos capturas, el paquete incluye automáticamente un resumen de la diferencia.

```bash
websketch bundle capture.json -o bundle.ws.json
websketch bundle before.json after.json -o bundle.ws.json
```

## Modo de Pipeline

Añade `--json` antes de cualquier comando para obtener una salida legible por máquinas:

```bash
websketch --json validate capture.json
websketch --json render capture.json
websketch --json fingerprint capture.json
websketch --json diff before.json after.json
```

**Éxito:** `{ "ok": true, ... }`

**Error:** `{ "ok": false, "error": { "code": "WS_...", "message": "..." } }`

Los códigos de salida siguen siendo aplicables en el modo JSON; utiliza `$?` o `set -e` en los scripts.

## Códigos de Salida

| Code | Significado |
| ------ | --------- |
| 0 | Éxito |
| 1 | Error de validación / datos (JSON incorrecto, captura no válida, comando desconocido) |
| 2 | Error del sistema de archivos (archivo no encontrado, permiso denegado, error de E/S) |

## Formato de Captura

Esta CLI funciona con archivos de captura de WebSketch IR (JSON). Crea capturas utilizando:

- [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) -- Extensión de Chrome para la captura de páginas con un solo clic.
- [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) -- Crea capturas de forma programática.

## Documentación

| Documento | Descripción |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | Guía detallada: arquitectura, comandos, patrones de pipeline, integración. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Cómo contribuir, configuración de desarrollo, directrices para PR. |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Normas de la comunidad. |
| [CHANGELOG.md](CHANGELOG.md) | Historial de versiones. |

## Licencia

MIT
