<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/terminal-tutor/readme.png" width="400" alt="Terminal Tutor" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/terminal-tutor/actions"><img src="https://github.com/mcp-tool-shop-org/terminal-tutor/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/terminal-tutor/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page" /></a>
</p>

Aprenda habilidades de la terminal mediante la práctica: dentro de la terminal, donde realmente se realiza el trabajo.

Terminal Tutor es un sistema de tutoría contextualizada. Crea un espacio de práctica seguro, le asigna una tarea real, observa lo que escribe y le explica qué ha ocurrido y por qué. No hay entornos de prueba, ni cuestionarios, ni vídeos: solo un tutor en vivo en su terminal.

## Inicio rápido

```bash
npx @mcptoolshop/terminal-tutor doctor    # Check what's ready
npx @mcptoolshop/terminal-tutor tracks    # See skill tracks
npx @mcptoolshop/terminal-tutor next      # Get your first lesson
npx @mcptoolshop/terminal-tutor start files-and-navigation
```

## Cómo funciona

1. **Elige una lección.** Cada una tiene un objetivo concreto: no "aprender grep", sino "encontrar todas las referencias a TODO dispersas en este código fuente".

2. **El tutor crea un espacio de práctica.** Archivos reales, directorios reales, repositorios git reales. Trabaja en una copia de seguridad, no en tus proyectos reales.

3. **Ejecutas comandos reales.** No simulados, no en un entorno de prueba. Comandos reales de `grep`, `git`, `sed`, `pip`: todo lo que la lección requiera.

4. **El tutor evalúa el resultado.** ¿Han aparecido los archivos correctos? ¿Contiene la salida los datos esperados? Comprueba lo que ha ocurrido, no qué comando específico has escrito.

5. **Si te atas, te ayuda.** Las pistas comienzan con una sugerencia ("intenta buscar de forma recursiva") y gradualmente se vuelven más específicas ("intenta `grep -r 'TODO' src/`"). Si cometes un error común, diagnostica el error específico.

6. **Tu progreso se guarda.** Vuelve más tarde y retoma donde lo dejaste.

## Rutas de aprendizaje

| Ruta | Lecciones | Entorno de ejecución | Lo que aprenderás |
|-------|---------|---------|-------------------|
| **Shell Fundamentals** | 3 | shell | ls, cat, grep, find, sed, awk, diff, pipes |
| **Shell Triage** | 1 | shell | ps, procesos en segundo plano, análisis de registros |
| **Git Survival** | 1 | shell | init, commit, branch, switch |
| **Python Debugging** | 2 | venv | pytest, tracebacks, pip, imports, dependencias |
| **Service Debugging** | 1 | docker | logs, procesos, configuración, endpoints |

## Entornos de ejecución

Terminal Tutor utiliza tres entornos de ejecución, cada uno elegido por una razón:

- **shell** — Tu shell del sistema. Para la navegación por archivos, el procesamiento de texto y git. Inicio instantáneo.
- **venv** — Un entorno virtual de Python real. Para pip, pytest y la depuración de importaciones. Crea un entorno virtual real con paquetes reales.
- **docker** — Un contenedor. Para la resolución de problemas de servicios, la inspección de procesos y cualquier cosa que requiera un aislamiento completo. La red está desactivada de forma predeterminada.

Ejecuta `terminal-tutor doctor` para ver qué entornos de ejecución están disponibles en tu sistema.

## Referencia de la CLI

```
terminal-tutor list                    Show available lessons
terminal-tutor start <lesson-id>       Start or resume a lesson
terminal-tutor tracks                  Show skill tracks and progress
terminal-tutor track <track-id>        Show detailed track progress
terminal-tutor next                    Suggest next lesson
terminal-tutor mastery <lesson-id>     Show fluency signal for completed lesson
terminal-tutor progress                Show all lesson progress
terminal-tutor doctor                  Check system readiness
terminal-tutor runtimes                Show runtime availability
terminal-tutor reset <lesson-id>       Reset a lesson
terminal-tutor help                    Show help
```

## Para usuarios de Claude Code

Terminal Tutor está diseñado para funcionar con Claude Code como la capa de conversación. Claude puede:
- Iniciar lecciones y presentar los pasos de forma natural.
- Ejecutar comandos y evaluar los resultados a través del motor del tutor.
- Explicar los errores en contexto, más allá de lo que proporcionan las pistas predefinidas.
- Adaptarse a preguntas o enfoques inesperados.

La CLI genera JSON estructurado, lo que facilita que Claude analice el estado de la lección, evalúe los resultados y guíe al alumno.

## Seguridad

Terminal Tutor opera **únicamente de forma local**, sin telemetría, sin llamadas de red y sin manejo de credenciales.

- **Datos accedidos:** Directorios de trabajo temporales (directorio temporal del sistema operativo), progreso de la lección (`~/.terminal-tutor/progress.json`).
- **Datos NO accedidos:** Tus proyectos, directorio de inicio, configuraciones del sistema, datos del navegador, credenciales.
- **No se recopila ni se envía** telemetría.
- **Aislamiento del espacio de trabajo:** Los archivos de práctica se crean en directorios temporales aislados. El indicador de seguridad `workspace_only` evita que los comandos escapen del área de práctica. Las lecciones de Docker se ejecutan con la red desactivada de forma predeterminada.
- **Permisos:** Solo lectura/escritura en el directorio temporal del sistema operativo y `~/.terminal-tutor/`. No se requieren ni se solicitan privilegios elevados.

Consulta [SECURITY.md](SECURITY.md) para obtener la política de notificación de vulnerabilidades.

## Creación de lecciones

Consulte el archivo [AUTHORING.md](AUTHORING.md) para conocer las directrices de creación de lecciones. Reglas clave:

- Un archivo YAML por lección.
- Comprobaciones basadas en resultados (verificar qué sucedió, no qué comando se ejecutó).
- Sistemas de pistas que guían desde la instrucción hasta la solución.
- Utilice el entorno de ejecución más ligero que satisfaga las necesidades de la lección.
- Cada lección debe tener un "flavor" (un escenario humano) que establezca el contexto.

## Licencia

MIT

---

Creado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
