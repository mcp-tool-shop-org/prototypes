<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-app-builder/readme.png" alt="MCP App Builder" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder"><img src="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder/branch/main/graph/badge.svg" alt="codecov" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-1.0-green" alt="MCP" /></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-app-builder/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

> Cree servidores MCP con componentes de interfaz de usuario interactivos, directamente desde VS Code.

## Descripción general

**MCP App Builder** ayuda a los desarrolladores a crear, probar y desplegar rápidamente servidores MCP (Model Context Protocol). Admite el nuevo estándar **MCP Apps** (enero de 2026), lo que permite componentes de interfaz de usuario interactivos directamente en las conversaciones de IA.

## Características

### Estructura básica
- **Asistente para crear un nuevo servidor**: Cree servidores MCP con una configuración guiada.
- **Plantillas**: Configuraciones básicas, con interfaz de usuario y completas para el servidor.
- **Configuración automática**: TypeScript, MCP SDK y estructura del proyecto.

### Desarrollo
- **Validación de esquema**: Validación en tiempo real de `mcp.json` y `mcp-tools.json`.
- **Validación automática al guardar**: Los esquemas se comprueban automáticamente al guardar (configurable).
- **Generación de tipos**: Genere tipos de TypeScript a partir de las definiciones de las herramientas.
- **IntelliSense**: Soporte para esquemas JSON en los archivos de configuración.

### Pruebas
- **Entorno de pruebas**: Ejecute pruebas contra sus herramientas MCP.
- **Pruebas generadas automáticamente**: Pruebas creadas a partir de las definiciones de las herramientas y ejemplos.
- **Canal de salida**: Resultados de las pruebas formateados con el estado de aprobación/fallo.

### Panel de control
- **Interfaz visual**: Acceso rápido a todos los comandos.
- **Integración con el espacio de trabajo**: Detecta automáticamente los proyectos MCP.
- **Barra de estado**: Indicador de MCP cuando se encuentra en un proyecto MCP.

## Cómo empezar

1. **Instale la extensión** desde el Marketplace de VS Code (próximamente).
2. **Cree un nuevo servidor**: `Cmd+Shift+P` → "MCP: Nuevo servidor".
3. **Elija una plantilla**:
- `básico` - Servidor simple de "hola mundo".
- `con-ui` - Servidor con componentes de interfaz de usuario de tabla y gráfico.
- `completo` - Servidor completo con herramientas, recursos y indicaciones.

## Atajos de teclado

| Atajo | Comando |
|----------|---------|
| `Ctrl+Alt+N` (`Cmd+Alt+N` en Mac) | Nuevo servidor |
| `Ctrl+Alt+V` (`Cmd+Alt+V` en Mac) | Validar esquema |

## Comandos

| Comando | Descripción |
|---------|-------------|
| `MCP: New Server` | Crea un nuevo proyecto de servidor MCP. |
| `MCP: Validate Schema` | Valida el archivo `mcp.json` o `mcp-tools.json` actual. |
| `MCP: Generate Types` | Genera tipos de TypeScript a partir de las definiciones de las herramientas. |
| `MCP: Test Server` | Ejecuta pruebas contra tus herramientas MCP. |
| `MCP: Open Dashboard` | Abre el panel de control visual. |

## Configuración

| Configuración | Valor predeterminado | Descripción |
|---------|---------|-------------|
| `mcp-app-builder.defaultTemplate` | `basic` | Plantilla predeterminada para nuevos servidores (básico/con-ui/completo). |
| `mcp-app-builder.autoValidate` | `true` | Validar automáticamente los esquemas al guardar. |
| `mcp-app-builder.testPort` | `3000` | Puerto para el servidor de pruebas MCP. |

## Componentes de interfaz de usuario de MCP Apps

La extensión proporciona herramientas para los componentes de interfaz de usuario de MCP Apps:

```typescript
import { table, chart, form, card } from '@mcp-app-builder/ui-components';

// Create a search results table
const results = table(
  [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status' },
  ],
  data,
  { pageSize: 10 }
);

// Create a dashboard with metrics
const dashboard = dashboard({
  title: 'Analytics',
  metrics: [
    { label: 'Users', value: 1234, change: 12 },
    { label: 'Revenue', value: '$5,678', change: -3 },
  ],
  chart: lineChart,
});
```

## Estructura de archivos

Los proyectos de servidor MCP generados siguen esta estructura:

```
my-mcp-server/
├── mcp.json           # Server configuration
├── mcp-tools.json     # Tool definitions
├── package.json       # Node.js dependencies
├── tsconfig.json      # TypeScript configuration
└── src/
    ├── index.ts       # Server entry point
    ├── resources.ts   # Resource handlers (full template)
    └── prompts.ts     # Prompt handlers (full template)
```

## Desarrollo

### Requisitos previos

- Node.js 18+
- VS Code 1.85+

### Configuración

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-app-builder
cd mcp-app-builder
npm install
npm run compile
```

### Ejecución

Presione `F5` en VS Code para iniciar el entorno de desarrollo de la extensión.

### Pruebas

```bash
npm test
```

## Hoja de ruta

### Fase 1 (Actual) - Base determinista
- [x] Estructura básica del proyecto con plantillas.
- [x] Sistema de validación de esquemas.
- [x] Generación de tipos a partir de esquemas.
- [x] Primitivos de componentes de interfaz de usuario.
- [x] Base del entorno de pruebas.
- [x] Vista web del panel de control.

### Fase 2 - Desarrollo asistido por IA
- [ ] Generación de herramientas de IA a partir de lenguaje natural.
- [ ] Autocompletado inteligente para controladores de herramientas.
- [ ] Generación automatizada de documentación.

### Fase 3 - Publicación y distribución
- [ ] Publicación con un solo clic en los registros de MCP.
- [ ] Gestión de versiones.
- [ ] Resolución de dependencias.

### Fase 4 - Constructor visual
- [ ] Constructor de componentes de interfaz de usuario de arrastrar y soltar.
- [ ] Vista previa en vivo de las aplicaciones MCP.
- [ ] Editor de flujo visual.

## Contribuciones

¡Las contribuciones son bienvenidas! Por favor, lea nuestras directrices de contribución (próximamente).

## Seguridad y privacidad

**Datos a los que se accede:** archivos del espacio de trabajo (mcp.json, mcp-tools.json, TypeScript generado), configuraciones de VS Code, canales de salida de la extensión.

**Datos a los que NO se accede:** código fuente más allá de las configuraciones de MCP, historial de Git, red (excepto el entorno de pruebas local), credenciales, variables de entorno. No se recopilan ni se envían datos de telemetría.

**Permisos:** lectura/escritura del sistema de archivos para la generación de plantillas y tipos (solo del espacio de trabajo), red local para el entorno de pruebas. Consulte [SECURITY.md](SECURITY.md) para obtener la política completa.

## Licencia

MIT

## Enlaces

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP Apps Specification](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [Organización de GitHub](https://github.com/mcp-tool-shop-org)

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
