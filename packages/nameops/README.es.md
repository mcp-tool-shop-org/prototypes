<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nameops/readme.png" alt="NameOps" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml"><img src="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nameops/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

Orquestador de verificación de nombres para el [motor de análisis de nombres](https://github.com/mcp-tool-shop-org/clearance-opinion-engine).

Convierte una lista de nombres canónicos en ejecuciones de verificación por lotes, artefactos publicados y resúmenes de solicitudes de extracción (PR) legibles por humanos.

## Cómo funciona

1. `data/names.txt` contiene la lista canónica de nombres a verificar.
2. `data/profile.json` contiene las opciones predeterminadas de la interfaz de línea de comandos (CLI) del motor de análisis de nombres (canales, riesgo, concurrencia, etc.).
3. `src/run.mjs` orquesta: verificación por lotes, publicación, validación.
4. `src/build-pr-body.mjs` genera el cuerpo de una solicitud de extracción (PR) en formato Markdown, con resúmenes de niveles, tarjetas de colisiones y estadísticas de costos.
5. El flujo de trabajo programado del repositorio de marketing llama a esta lógica y abre solicitudes de extracción con los artefactos incluidos.

## Uso

```bash
# Install the clearance engine
npm install -g @mcptoolshop/clearance-opinion-engine

# Run the pipeline
node src/run.mjs --out artifacts --profile data/profile.json --names data/names.txt

# Build a PR body from the output
node src/build-pr-body.mjs artifacts
```

## Configuración

### `data/names.txt`

Un nombre por línea. Las líneas que comienzan con `#` son comentarios. Máximo 500 nombres.

### `data/profile.json`

| Field | Opción del motor de análisis de nombres | Valor predeterminado |
| ------- | ---------- | --------- |
| `channels` | `--channels` | `all` |
| `org` | `--org` | `mcp-tool-shop-org` |
| `dockerNamespace` | `--dockerNamespace` | `mcptoolshop` |
| `hfOwner` | `--hfOwner` | `mcptoolshop` |
| `risk` | `--risk` | `conservative` |
| `radar` | `--radar` | `true` |
| `concurrency` | `--concurrency` | `3` |
| `maxAgeHours` | `--max-age-hours` | `168` (7 días) |
| `variantBudget` | `--variantBudget` | `12` |
| `fuzzyQueryMode` | `--fuzzyQueryMode` | `registries` |
| `cacheDir` | `--cache-dir` | `.coe-cache` |
| `maxRuntimeMinutes` | tiempo de espera del flujo de trabajo | `15` |

## Salida

```
artifacts/
  metadata.json           # Run metadata (date, duration, counts)
  pr-body.md              # Markdown PR body
  batch/                  # Raw COE batch output
  published/              # Published artifacts (for marketing site)
    runs.json             # Index of all runs
    <slug>/
      report.html
      summary.json
      clearance-index.json
      run.json
```

## Arquitectura

NameOps es un orquestador, no un servicio. No posee ningún modelo de datos y no tiene dependencias de tiempo de ejecución más allá de la CLI del motor de análisis de nombres. El repositorio de marketing es responsable del programa (según las reglas de CLAUDE.md); NameOps es responsable de la lógica.

## Pruebas

```bash
npm test
```

## Licencia

MIT
