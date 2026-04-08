<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-file-forge/readme.png" alt="MCP File Forge" width="400"></p>

<p align="center">
  Secure file operations and project scaffolding for AI agents.
  <br />
  Part of <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/file-forge"><img alt="npm version" src="https://img.shields.io/npm/v/@mcptoolshop/file-forge"></a>
  <a href="https://github.com/mcp-tool-shop-org/mcp-file-forge/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-file-forge/"><img alt="Landing Page" src="https://img.shields.io/badge/Landing_Page-live-blue"></a>
</p>

---

## At a Glance

MCP File Forge es un servidor de [Protocolo de Contexto de Modelo](https://modelcontextprotocol.io) (MCP) que proporciona a los agentes de IA acceso controlado y seguro al sistema de archivos local. Incluye **17 herramientas** en cinco categorías:

| Categoría | Herramientas | Descripción |
| ---------- | ------- | ------------- |
| **Reading** | `read_file`, `read_directory`, `read_multiple` | Leer archivos y listados de directorios |
| **Writing** | `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file` | Crear, modificar, copiar, mover y eliminar |
| **Search** | `glob_search`, `grep_search`, `find_by_content` | Encontrar archivos por patrón de nombre o contenido |
| **Metadata** | `file_stat`, `file_exists`, `get_disk_usage`, `compare_files` | Inspeccionar tamaño, marcas de tiempo, existencia |
| **Scaffolding** | `scaffold_project`, `list_templates` | Crear proyectos a partir de plantillas con sustitución de variables |

Propiedades clave:

- **Aislamiento (Sandboxed)**: las operaciones están restringidas a los directorios explícitamente permitidos.
- **Modo de solo lectura**: activar una variable de entorno para desactivar todas las herramientas de escritura.
- **Seguro con enlaces simbólicos**: el seguimiento de enlaces simbólicos está desactivado de forma predeterminada para evitar escapes del entorno aislado.
- **Diseñado para Windows**: optimizado para rutas y convenciones de Windows, pero funciona en cualquier sistema.
- **Motor de plantillas**: sustitución de variables con `{{var}}` / `${var}` y renombrado a nivel de ruta con `__var__`.

---

## Instalación

```bash
npm install -g @mcptoolshop/file-forge
```

O ejecútelo directamente con npx:

```bash
npx @mcptoolshop/file-forge
```

---

## Configuración de Claude Desktop

Agregue lo siguiente a su `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/file-forge"],
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects,C:/Users/you/Documents"
      }
    }
  }
}
```

Si lo instaló globalmente, puede apuntar directamente al ejecutable:

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "mcp-file-forge",
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects"
      }
    }
  }
}
```

---

## Referencia de herramientas

### Lectura

| Herramienta | Descripción | Parámetros clave |
| ------ | ------------- | ---------------- |
| `read_file` | Leer el contenido de un archivo | `path`, `encoding?`, `start_line?`, `end_line?`, `max_size_kb?` |
| `read_directory` | Listar las entradas de un directorio | `path`, `recursive?`, `max_depth?`, `include_hidden?`, `pattern?` |
| `read_multiple` | Leer varios archivos en lote | `paths`, `encoding?`, `fail_on_error?` |

### Escritura

| Herramienta | Descripción | Parámetros clave |
| ------ | ------------- | ---------------- |
| `write_file` | Escribir o sobrescribir un archivo | `path`, `content`, `encoding?`, `create_dirs?`, `overwrite?`, `backup?` |
| `create_directory` | Crear un directorio | `path`, `recursive?` |
| `copy_file` | Copiar un archivo o directorio | `source`, `destination`, `overwrite?`, `recursive?` |
| `move_file` | Mover o renombrar | `source`, `destination`, `overwrite?` |
| `delete_file` | Eliminar un archivo o directorio | `path`, `recursive?`, `force?` |

### Búsqueda

| Herramienta | Descripción | Parámetros clave |
| ------ | ------------- | ---------------- |
| `glob_search` | Encontrar archivos por patrón glob | `pattern`, `base_path?`, `max_results?`, `include_dirs?` |
| `grep_search` | Buscar contenido de archivos con expresión regular | `pattern`, `path?`, `glob?`, `case_sensitive?`, `max_results?`, `context_lines?` |
| `find_by_content` | Búsqueda de texto literal (sin expresión regular) | `text`, `path?`, `file_pattern?`, `max_results?` |

### Metadatos

| Herramienta | Descripción | Parámetros clave |
| ------ | ------------- | ---------------- |
| `file_stat` | Estadísticas de archivos/directorios | `path` |
| `file_exists` | Comprobar existencia y tipo | `path`, `type?` (`file` / `directory` / `any`) |
| `get_disk_usage` | Desglose del tamaño del directorio | `path`, `max_depth?` |
| `compare_files` | Comparar dos rutas | `path1`, `path2` |

### Creación de plantillas

| Herramienta | Descripción | Parámetros clave |
| ------ | ------------- | ---------------- |
| `scaffold_project` | Crear proyecto a partir de una plantilla | `template`, `destination`, `variables?`, `overwrite?` |
| `list_templates` | Listar plantillas disponibles | `category?` |

La documentación completa de los parámetros, ejemplos y códigos de error se encuentran en el [MANUAL.md](MANUAL.md).

---

## Variables de entorno

| Variable | Descripción | Valor predeterminado |
| ---------- | ------------- | --------- |
| `MCP_FILE_FORGE_ALLOWED_PATHS` | Lista separada por comas de directorios raíz permitidos | `.` (directorio actual) |
| `MCP_FILE_FORGE_DENIED_PATHS` | Lista separada por comas de patrones de ruta denegados | `**/node_modules/**`, `**/.git/**` |
| `MCP_FILE_FORGE_READ_ONLY` | Desactivar todas las operaciones de escritura | `false` |
| `MCP_FILE_FORGE_MAX_FILE_SIZE` | Tamaño máximo de archivo en bytes | `104857600` (100 MB) |
| `MCP_FILE_FORGE_MAX_DEPTH` | Profundidad máxima de recursión | `20` |
| `MCP_FILE_FORGE_FOLLOW_SYMLINKS` | Permitir el seguimiento de enlaces simbólicos fuera del entorno de pruebas. | `false` |
| `MCP_FILE_FORGE_TEMPLATE_PATHS` | Directorios de plantillas separados por comas. | `./templates` |
| `MCP_FILE_FORGE_LOG_LEVEL` | Nivel de detalle del registro (`error`, `warn`, `info`, `debug`). | `info` |
| `MCP_FILE_FORGE_LOG_FILE` | Ruta a un archivo de registro (además de stderr). | _ninguno_ |

---

## Archivo de configuración

Cree el archivo `mcp-file-forge.json` (o `.mcp-file-forge.json`) en o por encima de su directorio de trabajo:

```json
{
  "sandbox": {
    "allowed_paths": ["C:/Projects", "C:/Users/you/Documents"],
    "denied_paths": ["**/secrets/**", "**/.env"],
    "follow_symlinks": false,
    "max_file_size": 52428800,
    "max_depth": 20
  },
  "templates": {
    "paths": ["./templates", "~/.mcp-file-forge/templates"]
  },
  "logging": {
    "level": "info",
    "file": "./logs/mcp-file-forge.log"
  },
  "read_only": false
}
```

Prioridad de configuración (la más alta tiene prioridad):

1. Variables de entorno
2. Archivo de configuración
3. Valores predeterminados integrados

---

## Seguridad

MCP File Forge implementa varias capas de protección para evitar que los agentes de IA accedan a áreas fuera de su espacio de trabajo designado:

- **Aislamiento de rutas:** Cada ruta se resuelve a una ruta absoluta y se verifica contra la lista `allowed_paths` antes de que se realice cualquier operación de entrada/salida.
- **Rutas bloqueadas:** Patrones glob que están bloqueados incluso dentro de los directorios permitidos (por ejemplo, `**/secrets/**`).
- **Protección de enlaces simbólicos:** Los enlaces simbólicos no se siguen de forma predeterminada; si el destino de un enlace simbólico se encuentra fuera del entorno de pruebas, la operación se deniega.
- **Detección de recorrido de rutas:** Las secuencias `..` que podrían escapar del entorno de pruebas se rechazan.
- **Límites de tamaño:** Los archivos que superan el tamaño `max_file_size` se rechazan para evitar el agotamiento de la memoria.
- **Límites de profundidad:** Las operaciones recursivas se limitan a `max_depth` niveles.
- **Modo de solo lectura:** Establezca `MCP_FILE_FORGE_READ_ONLY=true` para deshabilitar `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file` y `scaffold_project`.
- **Rechazo de bytes nulos:** Las rutas que contienen `\0` se rechazan.
- **Protección contra rutas largas en Windows:** Las rutas que superan los 32.767 caracteres se rechazan.

---

## Documentación

| Documento | Descripción |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | Análisis profundo: modelo de seguridad, referencia de herramientas, plantillas, arquitectura, preguntas frecuentes. |
| [CHANGELOG.md](CHANGELOG.md) | Historial de versiones (formato Keep a Changelog) |
| [docs/PLANNING.md](docs/PLANNING.md) | Notas internas de planificación e investigación. |

---

## Desarrollo

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

---

## Licencia

[MIT](LICENSE)

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
