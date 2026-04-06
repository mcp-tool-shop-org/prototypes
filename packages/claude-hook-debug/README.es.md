<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/">
    <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-hook-debug/readme.png" width="400" alt="claude-hook-debug" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug/branch/main/graph/badge.svg" alt="Coverage" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-hook-debug"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-hook-debug" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

Herramienta de línea de comandos para diagnosticar problemas con el complemento Claude Code. Detecta complementos inactivos, conflictos de ámbito, configuraciones incorrectas y errores conocidos de Claude Code.

## Instalación

```bash
npm install -g @mcptoolshop/claude-hook-debug
```

O ejecútelo directamente:

```bash
npx @mcptoolshop/claude-hook-debug
```

## Uso

```bash
# Scan current workspace
claude-hook-debug

# Scan a specific project
claude-hook-debug /path/to/project

# JSON output (for piping/scripting)
claude-hook-debug --json
```

Código de salida 1 si se encuentran errores, 0 en caso contrario.

## Qué detecta

| ID | Severidad | Descripción |
|----|----------|-------------|
| `GHOST_HOOK_PREVIEW` | error | El complemento "claude-preview" está deshabilitado, pero el "hook" de detención sigue activándose ([#19893](https://github.com/anthropics/claude-code/issues/19893)). |
| `GHOST_HOOK_GENERIC` | warning | Cualquier complemento deshabilitado que aún pueda tener "hooks" activos. |
| `LOCAL_ONLY_PLUGINS` | error | La configuración `enabledPlugins` en la configuración local solo anula silenciosamente la configuración predeterminada ([#25086](https://github.com/anthropics/claude-code/issues/25086)). |
| `SCOPE_CONFLICT` | warning | Un complemento está habilitado en un ámbito y deshabilitado en otro. |
| `STOP_CONTINUE_LOOP` | error | El "hook" de detención produce `continue:true`, lo que causa un bucle infinito ([#1288](https://github.com/anthropics/claude-code/issues/1288)). |
| `DISABLE_ALL_HOOKS_ACTIVE` | warning/error | `disableAllHooks: true` suprime todos los "hooks" (se eleva a error si existen configuraciones gestionadas). |
| `BROKEN_SETTINGS_JSON` | error | Un JSON inválido deshabilita silenciosamente todas las configuraciones de ese archivo. |
| `LARGE_SETTINGS_FILE` | warning | Archivo de configuración > 100 KB (puede causar un inicio lento). |
| `PLUGIN_HOOKS_INVISIBLE` | info | No hay "hooks" de usuario, pero los complementos están habilitados: los "hooks" de los complementos no son visibles para la inspección. |

## Ámbitos de configuración

La herramienta lee los cuatro ámbitos de configuración en el orden de carga de Claude Code:

| Ámbito | Ruta | Precedencia |
|-------|------|------------|
| gestionado | `~/.claude/managed-settings.json` | Más alta |
| usuario | `~/.claude/settings.json` | |
| proyecto | `.claude/settings.json` | |
| local | `.claude/settings.local.json` | Más baja (la última escritura tiene prioridad) |

## Uso de bibliotecas

```typescript
import { debug } from '@mcptoolshop/claude-hook-debug';

const report = debug({ projectRoot: '/path/to/project' });

console.log(report.diagnostics);
// [{ id: 'GHOST_HOOK_PREVIEW', severity: 'error', title: '...', ... }]

console.log(report.plugins);
// [{ pluginId: 'claude-preview@...', mergedEnabled: false, scopes: [...] }]
```

## Seguridad y modelo de amenazas

**Qué archivos toca:** Archivos de configuración de Claude Code (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/managed-settings.json`). Todas las lecturas son de solo lectura; la herramienta nunca modifica ningún archivo.

**Qué NO toca:** No se leen ni se registran claves de API, tokens, valores de variables de entorno ni credenciales. El bloque `env` en la configuración se ignora por completo. No se accede a ningún archivo fuera de las rutas de configuración de Claude Code.

**Permisos requeridos:** Acceso de lectura al sistema de archivos a `~/.claude/` y al directorio `.claude/` del proyecto. No se requieren permisos elevados, ni acceso a la red, ni ejecución de comandos.

**Sin telemetría.** Sin análisis. Sin "conexión a casa". Sin recopilación de datos de ningún tipo. Cero dependencias de producción.

---

Creado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
