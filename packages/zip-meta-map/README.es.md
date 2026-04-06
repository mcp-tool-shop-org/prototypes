<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/zip-meta-map/readme.png" width="400" />
</p>

<p align="center">
  Turn a ZIP or folder into a guided, LLM-friendly metadata bundle.<br>
  <strong>Map + Route + Guardrails</strong> — inside the archive itself.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://pypi.org/project/zip-meta-map/"><img src="https://img.shields.io/pypi/v/zip-meta-map" alt="PyPI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/zip-meta-map" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/zip-meta-map/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## Qué hace

zip-meta-map genera una capa de metadatos determinista que responde a tres preguntas para los agentes de IA:

- **¿Qué hay aquí?** — Inventario de archivos clasificados por función con puntajes de confianza.
- **¿Qué es lo más importante?** — Lista ordenada de "empezar aquí" con extractos.
- **¿Cómo puedo navegar sin perderme en el contexto?** — Planes de navegación con límites de tamaño.

## Demostración rápida

```bash
$ zip-meta-map build my-project/ -o output/ --summary

Wrote META_ZIP_FRONT.md and META_ZIP_INDEX.json to output/
  Profile:  python_cli
  Files:    47
  Modules:  8
  Flagged:  2 file(s) with risk flags
```

```bash
$ zip-meta-map explain my-project/

Profile:  python_cli
Files:    47

Top files to read first:
  README.md                     [doc]        conf=0.95  README is primary documentation
  src/app/main.py               [entrypoint] conf=0.95  matches profile entrypoint pattern
  pyproject.toml                [config]     conf=0.95  Python project configuration

Overview plan:
  Quick orientation — what is this tool and how is it structured?
  1. READ README.md for project purpose and usage
  2. READ pyproject.toml for dependencies and entry points
  3. READ entrypoint file to understand CLI structure
  Budget: ~32 KB
```

Consulte la [salida de la demostración](examples/tiny_python_cli/) para obtener un ejemplo completo.

## Instalación

```bash
pip install zip-meta-map
```

O con [pipx](https://pipx.pypa.io/):

```bash
pipx install zip-meta-map
```

Desde el código fuente:

```bash
git clone https://github.com/mcp-tool-shop-org/zip-meta-map
cd zip-meta-map
pip install -e ".[dev]"
```

## Acción de GitHub

Utilice zip-meta-map en CI con la acción compuesta:

```yaml
- name: Generate metadata map
  uses: mcp-tool-shop-org/zip-meta-map@v0
  with:
    path: .
```

Esto instala la herramienta, genera metadatos y escribe un resumen de la ejecución. Las salidas incluyen `index-path`, `front-path`, `profile`, `file-count` y `warnings-count`. Establezca `pr-comment: 'true'` para publicar el resumen como un comentario en una solicitud de extracción.

Consulte [examples/github-action/](examples/github-action/) para obtener un flujo de trabajo completo.

## Qué genera

| Archivo | Propósito |
| ------ | --------- |
| `META_ZIP_FRONT.md` | Página de orientación legible por humanos |
| `META_ZIP_INDEX.json` | Índice legible por máquinas (roles, confianza, planes, fragmentos, extractos, indicadores de riesgo) |
| `META_ZIP_REPORT.md` | Informe detallado y navegable (con `--report md`) |

## Referencia de la línea de comandos

```bash
# Build metadata for a folder or ZIP
zip-meta-map build path/to/repo -o output/
zip-meta-map build archive.zip -o output/

# Build with step summary and report
zip-meta-map build . -o output/ --summary --report md

# Output formats for piping
zip-meta-map build . --format json          # JSON to stdout
zip-meta-map build . --format ndjson        # one JSON line per file
zip-meta-map build . --manifest-only        # skip FRONT.md

# Explain what the tool detected
zip-meta-map explain path/to/repo
zip-meta-map explain path/to/repo --json

# Compare two indices (CI-friendly)
zip-meta-map diff old.json new.json             # human-readable
zip-meta-map diff old.json new.json --json       # JSON output
zip-meta-map diff old.json new.json --exit-code  # exit 1 if changes

# Validate an existing index
zip-meta-map validate META_ZIP_INDEX.json

# Policy overrides
zip-meta-map build . --policy META_ZIP_POLICY.json -o output/
```

## Perfiles

Detectados automáticamente según la estructura del repositorio. Perfiles integrados actuales:

| Perfil | Detectado por | Planes |
| --------- | ------------ | ------- |
| `python_cli` | `pyproject.toml`, `setup.py` | visión general, depuración, agregar_función, revisión_de_seguridad, análisis_profundo |
| `node_ts_tool` | `package.json`, `tsconfig.json` | visión general, depuración, agregar_función, revisión_de_seguridad, análisis_profundo |
| `monorepo` | `pnpm-workspace.yaml`, `lerna.json` | visión general, depuración, agregar_función, revisión_de_seguridad, análisis_profundo |

Consulte [docs/PROFILES.md](docs/PROFILES.md).

## Roles y confianza

Cada entrada de archivo incluye un **rol** (vocabulario limitado), **confianza** (0.0–1.0) y una **razón**.

| Banda | Rango | Significado |
| ------ | ------- | --------- |
| Alta | >= 0.9 | Fuerte señal estructural (coincidencia de nombres de archivo, punto de entrada del perfil) |
| Buena | >= 0.7 | Coincidencia de patrones (convención de directorios, extensión + ubicación) |
| Regular | >= 0.5 | Solo extensión o señal posicional débil |
| Baja | < 0.5 | Asignado como "desconocido"; la razón explica la ambigüedad |

## Divulgación progresiva (v0.2)

- **Mapas de fragmentos** para archivos > 32 KB: ID estables, rangos de línea, encabezados.
- **Resúmenes de módulos**: distribución de roles a nivel de directorio y archivos clave.
- **Extractos**: las primeras líneas de archivos de alto valor.
- **Indicadores de riesgo**: `exec_shell`, `secrets_like`, `network_io`, `path_traversal`, `binary_masquerade`, `binary_executable`.
- **Capacidades**: `capabilities[]` anuncia qué funciones opcionales están disponibles.

## Estabilidad

- La versión de la especificación sigue reglas similares a semver: los incrementos menores agregan campos, los incrementos mayores rompen la compatibilidad con versiones anteriores.
- `capabilities[]` es el mecanismo oficial de negociación de funciones.
- Los consumidores más antiguos que ignoran los campos desconocidos seguirán funcionando con incrementos menores.
- Consulte [docs/SPEC.md](docs/SPEC.md) para obtener el contrato completo.

## Estructura del repositorio

```
src/zip_meta_map/
  cli.py        # argparse CLI (build, explain, diff, validate)
  builder.py    # scan -> index -> validate -> write
  diff.py       # index comparison (diff command)
  report.py     # GitHub step summary + detailed report
  scanner.py    # directory + ZIP scanning with SHA-256
  roles.py      # role assignment heuristics + confidence
  profiles.py   # built-in profiles + traversal plans
  chunker.py    # deterministic text chunking
  modules.py    # folder-level module summaries
  safety.py     # risk flag detection + warning generation
  schema/       # JSON Schemas and loaders
docs/
  SPEC.md       # v0.2 contract (format semantics)
  PROFILES.md   # profile behaviors + plans
examples/
  tiny_python_cli/   # golden demo output
  github-action/     # consumer workflow example
tests/
  fixtures/     # tiny fixture repos
```

## Contribución

Este proyecto es pequeño a propósito. Si contribuye:

- Mantener las heurísticas deterministas.
- Mantener los roles definidos, y trasladar los matices a las etiquetas.
- Agregar pruebas para cualquier nueva heurística.
- No modificar los esquemas sin actualizar la documentación y el archivo SPEC.md, así como los ejemplos de referencia.

```bash
pytest
```

## Documentación

- [Especificación (v0.2)](docs/SPEC.md) — el contrato para todos los archivos generados.
- [Perfiles](docs/PROFILES.md) — perfiles de tipos de proyectos integrados.
- [Seguridad](SECURITY.md) — reporte de vulnerabilidades.

## Licencia

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
