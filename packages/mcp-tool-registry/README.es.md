<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-tool-registry/readme.png" alt="MCP Tool Registry" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-tool-registry"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-tool-registry" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-tool-registry/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**El registro, que contiene solo metadatos, es la única fuente de información confiable para todas las herramientas de MCP Tool Shop.**

El esquema se valida en cada confirmación. Los paquetes se crean según reglas predefinidas. El índice de búsqueda precompilado se incluye en el paquete. Fije una versión y obtenga metadatos deterministas cada vez.

## Inicio rápido

```bash
npm install @mcptoolshop/mcp-tool-registry
```

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }

console.log(`${registry.tools.length} tools registered`)
```

## Resumen

- **Solo datos:** no hay código ejecutable, solo metadatos JSON para cada herramienta del ecosistema.
- **Validación de esquema:** cada entrada se verifica contra el esquema JSON al confirmar y en el entorno de integración continua (CI).
- **Sistema de paquetes:** las herramientas se agrupan en paquetes predefinidos (`core`, `agents`, `ops`, `evaluation`) según reglas, no mediante curación manual.
- **Descubrimiento rápido:** el índice de búsqueda precompilado, con palabras clave y filtros, se incluye en el paquete.
- **Privilegios mínimos:** las herramientas tienen, por defecto, capacidades nulas; los efectos secundarios son opcionales y se declaran explícitamente.
- **Reproducible:** fije una versión del registro y obtenga metadatos deterministas cada vez.

## Usuarios

### Registro completo

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }
```

### Paquetes

```javascript
import coreBundle from "@mcptoolshop/mcp-tool-registry/bundles/core.json" with { type: "json" }
import agents from "@mcptoolshop/mcp-tool-registry/bundles/agents.json" with { type: "json" }
```

Paquetes disponibles: `core`, `agents`, `ops`, `evaluation`.

### Índice de búsqueda

```javascript
import toolIndex from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }

const hits = toolIndex.filter(t => t.keywords.includes("accessibility"))
```

### Contexto para modelos de lenguaje (LLM)

```javascript
// Plain-text context file for LLM RAG pipelines
import llmContext from "@mcptoolshop/mcp-tool-registry/dist/registry.llms.txt"
```

## Paquetes

| Paquete        | Descripción                                    | Lógica de selección                             |
| -------------- | ---------------------------------------------- | ----------------------------------------------- |
| **core**       | Utilidades esenciales                          | Lista de ID explícitos                          |
| **agents**     | Orquestación, navegación y contexto de agentes | ID explícitos + etiqueta `agents`               |
| **ops**        | DevOps, infraestructura, despliegue            | Etiquetas: `automation`, `packaging`, `release` |
| **evaluation** | Pruebas, evaluación comparativa, cobertura     | Etiquetas: `testing`, `evaluation`, `benchmark` |

## Estructura

```
mcp-tool-registry/
├── registry.json              # Canonical source of truth
├── schema/registry.schema.json
├── bundles/                   # Rules-generated subsets
├── dist/                      # Derived artifacts (generated at publish)
│   ├── registry.index.json    # Search index
│   ├── capabilities.json      # Capability reverse map
│   ├── derived.meta.json      # Build metadata + registry hash
│   └── registry.llms.txt      # LLM-native context
└── curation/featured.json     # Featured tools and collections
```

## Añadir una herramienta

1. Lea [docs/registry-guidelines.md](docs/registry-guidelines.md)
2. Añada una entrada a `registry.json` (mantenga el orden por `id`)
3. Ejecute `npm run validate` y `npm run policy`
4. Envíe una solicitud de extracción (Pull Request)

## Versionado

El contrato de la versión 1 es estable. Se pueden añadir nuevos campos opcionales en versiones menores; los campos obligatorios y la estructura de los campos existentes no cambiarán dentro de una versión mayor.

## Ecosistema

- **[mcpt CLI](https://github.com/mcp-tool-shop-org/mcpt)**: descubre, instala y ejecuta herramientas.
- **[Enviar una herramienta](https://github.com/mcp-tool-shop-org/mcp-tool-registry/issues/new/choose)**: añada su herramienta al ecosistema.

## Licencia

MIT: consulte [LICENSE](LICENSE) para obtener más detalles.
