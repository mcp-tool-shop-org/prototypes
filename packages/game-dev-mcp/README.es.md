<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/game-dev-mcp/readme.png" alt="Game Dev MCP" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/game-dev-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/game-dev-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/game-dev-mcp"><img src="https://img.shields.io/npm/v/@mcptoolshop/game-dev-mcp" alt="npm version"></a>
  <a href="https://mcp-tool-shop-org.github.io/game-dev-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  Talk to your game engine. Spawn actors, build levels, tweak properties — all through natural conversation with any LLM.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#what-can-it-do">44 Tools</a> &middot;
  <a href="#knowledge-library">Knowledge Library</a> &middot;
  <a href="HANDBOOK.md">Handbook</a>
</p>

---

Actualmente, es compatible con **Unreal Engine 5** a través de la API de control remoto integrada. No requiere plugins de terceros. No se necesita compilación de C++. Simplemente active la API y comience a interactuar.

## ¿Cómo se siente?

> **Usted:** Crea una luz puntual sobre la mesa y haz que emita una luz cálida.

El LLM llama a `ue_spawn_actor`, establece la transformación, ajusta la temperatura del color mediante `ue_set_property`, y la luz aparece en su ventana de vista. Usted sigue hablando, y el sistema sigue construyendo.

## Guía de inicio rápido

### 1. Active la API de control remoto en UE5

1. Abra su proyecto de UE5 (5.4+).
2. **Editar > Plugins** → busque "API de control remoto" → active.
3. Reinicie el editor.

Este plugin ya viene incluido con UE5; simplemente lo está activando.

### 2. Instale y configure

```bash
npx @mcptoolshop/game-dev-mcp
```

Agregue lo siguiente a la configuración de su cliente MCP (por ejemplo, `claude_desktop_config.json` de Claude Desktop):

```json
{
  "mcpServers": {
    "gamedev": {
      "command": "npx",
      "args": ["@mcptoolshop/game-dev-mcp"]
    }
  }
}
```

### 3. Pruebe

Pregúntele a su LLM: **"Ping Unreal Engine"**; llamará a `ue_ping` y confirmará la conexión.

## ¿Qué puede hacer?

### Actores (9 herramientas)
Cree, elimine, duplique, transforme, liste, busque y seleccione actores en el nivel. Funciona con cualquier clase de actor: mallas, luces, cámaras, volúmenes.

### Propiedades (4 herramientas)
Lea y escriba cualquier `UPROPERTY` en cualquier `UObject`. Use `ue_describe_object` para descubrir qué está disponible, y luego obtenga o establezca exactamente lo que necesita.

### Activos (8 herramientas)
Busque en el navegador de contenido, liste directorios, verifique la existencia, duplique, renombre, elimine y guarde activos.

### Niveles (4 herramientas)
Guarde el nivel actual, cargue uno diferente, obtenga información del nivel o guarde todos los paquetes modificados a la vez.

### Blueprints (5 herramientas)
Cree clases de Blueprint desde cero, agregue componentes, configure sus propiedades, compile y cree instancias, todo a través de la conversación.

### Editor (4 herramientas)
Pruebe la conexión, ejecute comandos de la consola, obtenga información del motor y ajuste la ventana de vista a cualquier actor.

### Conocimiento (1 herramienta)
Busque 35 tutoriales integrados de UE5 bajo demanda, para que su LLM pueda buscar cómo funciona Nanite o qué es un Behavior Tree, en medio de la conversación.

### Proyecto (7 herramientas)
Almacene convenciones, notas y contexto específicos del proyecto en `.game-dev-mcp/`, que persiste a través de las sesiones.

### Misión (2 herramientas)
Realice un seguimiento del progreso durante las operaciones de varios pasos. Se integra con [mcp-aside](https://github.com/mcp-tool-shop-org/mcp-aside) para recibir notificaciones en tiempo real.

**Total: 44 herramientas**

## Biblioteca de conocimiento

El servidor incluye 35 tutoriales como recursos MCP. Su LLM los lee bajo demanda; no se desperdicia contexto hasta que realmente necesita la información:

| Categoría | Contenido |
| ---------- | -------- |
| **Getting Started** | Configuración, comandos iniciales, estructura del proyecto |
| **Actors** | Creación, transformaciones, referencia de tipo, componentes |
| **Assets** | Navegador de contenido, patrones de búsqueda, importación |
| **Blueprints** | Conceptos básicos, creación, configuración de componentes |
| **Levels** | Administración, composición de mundos |
| **Materials** | Conceptos básicos, instancias de materiales |
| **Lighting** | Tipos de luz, flujo de trabajo |
| **Physics** | Simulación, colisiones, restricciones |
| **Audio** | Sonidos, atenuación, audio espacial |
| **Animation** | Malla esquelética, AnimBP, montajes |
| **Visual Effects** | Partículas Niagara, simulación en GPU |
| **Rendering** | Nanite, Lumen, mapas de sombras virtuales |
| **AI & Navigation** | NavMesh, árboles de comportamiento, EQS |
| **Cinematics** | Secuenciador, cámaras, renderizado cinematográfico |
| **Virtual Assistant** | Asistentes MetaHuman, integración de LLM |
| **API Reference** | API de control remoto, referencia de subsistema |
| **Patterns** | Flujos de trabajo comunes, manejo de errores, rendimiento. |

## Conocimiento del proyecto

Su modelo de lenguaje puede almacenar y recordar el contexto específico del proyecto:

```
ue_project_init(name: "My Game", ueVersion: "5.4")
ue_project_set_convention(convention: "All Blueprints use BP_ prefix")
ue_project_add_note(title: "Level Layout", content: "Main hall is 2000x1000 cm")
```

Se almacena en la carpeta `.game-dev-mcp/` y persiste entre sesiones, lo que permite que la IA continúe desde donde lo dejó.

## Configuración

| Variable. | Valor predeterminado. | Descripción. |
| ---------- | --------- | ------------- |
| `GAMEDEV_MCP_HOST` | `127.0.0.1` | Nombre de host del editor del motor de juego. |
| `GAMEDEV_MCP_PORT` | `30010` | Puerto de la API remota. |
| `GAMEDEV_MCP_TIMEOUT` | `10000` | Tiempo de espera de la solicitud (ms). |
| `GAMEDEV_MCP_LOG_LEVEL` | `info` | Nivel de registro (error/advertencia/información/depuración). |

## Requisitos

- Node.js 18 o superior.
- Unreal Engine 5.4 o superior con el plugin de API de control remoto habilitado.

## Manual

Para obtener una guía completa: configuración, patrones prácticos, solución de problemas y explicación de cada herramienta, consulte el **[Manual](HANDBOOK.md)**.

## Licencia

MIT — Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.
