<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/linux-dev-typer/readme.png" alt="Linux Dev Typer logo" width="400"></p>

# linux-dev-typer

> Parte de [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/linux-dev-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/linux-dev-typer/actions/workflows/build.yml/badge.svg" alt="CI"></a>
  <a href="https://www.nuget.org/packages/LinuxDevTyper.Core"><img src="https://img.shields.io/nuget/v/LinuxDevTyper.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/linux-dev-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Práctica de escritura de código para desarrolladores: Avalonia UI, dificultad adaptable, seguimiento de tendencias, detección de fatiga.**

> También disponible como una aplicación nativa para Windows: [dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) (WinUI 3, Microsoft Store)

---

## ¿Por qué Linux Dev Typer?

- **Practica con código real, no con texto.** Cada fragmento es un patrón del mundo real de Python, Rust, JavaScript, C# o Java, no "el rápido zorro marrón".
- **Dificultad adaptable.** Un sistema de clasificación inspirado en Elo se adapta a tu nivel de habilidad por lenguaje, con protección contra la repetición y detección de la zona de confort.
- **Conciencia de las debilidades.** Los mapas de calor de errores por carácter y las combinaciones de confusión guían la selección de fragmentos para que practiques lo que realmente te resulta difícil.
- **Conciencia de la fatiga.** El motor detecta el rendimiento decreciente y sugiere descansos antes de que se formen malos hábitos.
- **Multiplataforma.** Construido con Avalonia UI, funciona en Linux, macOS y Windows desde una única base de código.
- **Totalmente offline.** Sin telemetría, sin cuentas, sin llamadas a la red. Tus datos de escritura permanecen en tu máquina.
- **Extensible.** El motor principal se distribuye como un paquete NuGet independiente con cero dependencias de la interfaz de usuario.

---

## Paquetes NuGet

| Paquete | Descripción |
| --------- | ------------- |
| [`LinuxDevTyper.Core`](https://www.nuget.org/packages/LinuxDevTyper.Core) | Motor de práctica de escritura portátil con clasificación Elo, dificultad adaptable, mapas de calor de debilidades, detección de fatiga, planificación de sesiones y micro-ejercicios. Cero dependencias de la interfaz de usuario. |

El motor principal es una biblioteca independiente sin dependencias de Avalonia ni de la plataforma. Implementa `IStorage`, `IAudioService` y `IAssetProvider` para tu plataforma y tendrás un entrenador de escritura completo.

---

## Características

### Motor de Escritura Principal
- Retroalimentación por carácter: correcto (verde azulado), errores (rojo + subrayado), no escrito (apagado)
- Estadísticas en tiempo real: palabras por minuto (WPM), precisión, número de errores, puntos de experiencia (XP)
- Sistema de clasificación por lenguaje inspirado en Elo
- Progresión de nivel con XP y aumento de dificultad
- Tarjetas de finalización con explicaciones de los fragmentos
- Configurable: tamaño de fuente, reglas de espacios en blanco, normalización de saltos de línea

### Aprendizaje Adaptativo
- Seguimiento de errores por carácter con clasificación de símbolos (10 categorías)
- Perfilado de debilidades entre sesiones con selección adaptativa de fragmentos
- Seguimiento de tendencias: tendencias de palabras por minuto (WPM) y precisión por lenguaje
- Dificultad adaptable con detección de la zona de confort y protección contra la repetición
- Información post-sesión: mejores resultados personales, hitos, señales de tendencia
- Detección de fatiga con sugerencias de descanso
- Modo hardcore: corrige cada error antes de avanzar

### Agencia y Reflexión
- Selector de intención de práctica: etiqueta las sesiones como Calentamiento, Ejercicio, Exploración o Desafío
- Notas de sesión y navegador de sesiones con búsqueda/filtro
- Detección de bienvenida con saludos contextuales y envejecimiento automático de la dificultad
- Anula las sugerencias del sistema: ignora los bloqueos de repetición, los tipos de información y las alertas de fatiga
- Compresión mensual de historial para sesiones que superan las 200
- Pistas de orientación: sugerencias suaves antes de la sesión basadas en el contenido
- Detección de estancamiento con palabras de ánimo
- Controles de personalización: congela el aprendizaje, restablece las preferencias

### Sistema de Contenido
- Paquetes de fragmentos de usuario: coloca archivos JSON en `~/.config/linux-dev-typer/packs/`
- Perfiles de práctica: conjuntos de parámetros con nombre que ajustan el comportamiento del motor
- Importa/exporta paquetes `.ldtpack` para compartir contenido
- Pega código, importa archivo, importa carpeta con detección automática del lenguaje
- Identificadores basados en contenido (desduplicación SHA-256)
- Canalización canónica unificada: todo el contenido se importa como `CodeItem` con dificultad basada en métricas (D1–D7)

### Enseñanza y Comunidad
- Estructuras de aprendizaje: contexto de aprendizaje progresivo con capas más profundas opcionales.
- Variantes: implementaciones alternativas que se muestran como opciones equivalentes.
- Notas de la comunidad: consejos y perspectivas opcionales en paquetes `.ldtpack`.
- Dificultad de la comunidad: indicador visible para la dificultad determinada por la comunidad.
- Diseño anónimo: el contenido importado es indistinguible del contenido local.
- Todas las funciones de enseñanza y comunidad son opcionales y solo se muestran.

### Práctica estructurada
- 168 fragmentos de calibración en 5 idiomas (cubre los niveles D1 a D7).
- Planificador de sesiones: mezcla de objetivos (50%) / revisión (30%) / desafío (20%).
- Detección de debilidades con un sistema de ventana de tiempo decreciente.
- Transparencia en la selección: "Por qué este fragmento" explica cada elección.
- Mapa de calor de errores por carácter con pares de confusión.
- Trayectorias de debilidades: capturas diarias que rastrean la mejora.

### Práctica guiada
- Modo guiado: interruptor opcional que permite que las señales de debilidad influyan en la selección.
- Sesgo de debilidad: sesgo limitado a nivel de categoría (+0 a +3, nunca cambia la banda de dificultad).
- Micro-ejercicios: sesiones de práctica enfocadas con 5 elementos que se dirigen a la principal debilidad.
- Política de señales: arquitectura de "feature flag" con un interruptor principal y sub-interruptores para cada función.
- Higiene del almacenamiento: el mapa de calor está limitado a 200 caracteres, los pares de confusión a 20 y las capturas a 90.
- Predeterminado: desactivado. Se conserva el comportamiento anterior a menos que se active explícitamente.

### Audio
- 5 temas de sonido para el teclado (8 variaciones cada uno).
- 4 categorías de paisajes sonoros ambientales (15 pistas en total).
- Controles de volumen y silencio por canal.

### Accesibilidad
- Experiencia de usuario centrada en el teclado con contornos de enfoque visibles.
- Modo de baja sensibilidad (reduce los volúmenes de audio).
- Tema oscuro de alto contraste.

---

## Inicio rápido

**Requisitos:** [.NET SDK 8.x](https://dotnet.microsoft.com/download/dotnet/8.0)

```bash
git clone https://github.com/mcp-tool-shop-org/linux-dev-typer.git
cd linux-dev-typer
dotnet restore
dotnet build -c Release
dotnet run --project src/LinuxDevTyper.App/LinuxDevTyper.App.csproj
```

---

## Ejecutar pruebas

```bash
dotnet test
```

817 pruebas que cubren todos los módulos principales del motor.

---

## Estructura del proyecto

| Path | Propósito |
| ------ | --------- |
| `src/LinuxDevTyper.Core` | Motor portátil: escritura, calificación, tendencias, dificultad, perfiles, comunidad, pedagogía, calibración, planificador, debilidades, mapa de calor, modo guiado. |
| `src/LinuxDevTyper.Core.Tests` | Pruebas xUnit (817 pruebas) |
| `src/LinuxDevTyper.App` | Capa de escritorio Avalonia: interfaz de usuario, servicios de plataforma, importación/exportación. |
| `assets/snippets` | Paquetes de fragmentos JSON integrados. |
| `assets/sounds` | Archivos WAV (sonidos ambientales + efectos de sonido del teclado). |
| `lib/meta-content-system` | Biblioteca de contenido compartida. |
| `docs/` | Documentación de arquitectura y esquema, planes de fases, guías de extensión. |

---

## Persistencia

Archivo de estado: `~/.config/linux-dev-typer/state.json` (esquema v12)

Para restablecer: `rm -rf ~/.config/linux-dev-typer`

---

## Añadir tu propio código

Hay tres formas de practicar con tu propio código:

### Opción 1: Pegar código (la más fácil)

1. Abre la barra lateral (haz clic en el icono de la herramienta).
2. Busca la sección **Pegar código**.
3. Pega cualquier fragmento de código en el cuadro de texto.
4. Haz clic en **Añadir**: el idioma se detecta automáticamente.
5. Tu código aparece inmediatamente en la rotación de fragmentos.

### Opción 2: Importar un archivo o carpeta

1. Abre la barra lateral → busca **Importar**.
2. Haz clic en **Importar archivo** para añadir un archivo fuente único, o en **Importar carpeta** para escanear todo un proyecto.
3. La aplicación detecta automáticamente el idioma a partir de las extensiones de archivo (`.py`, `.rs`, `.js`, `.cs`, `.java`, `.sh`).
4. El código importado se desduplica mediante un hash de contenido: el mismo código nunca se añade dos veces.

### Opción 3: Crear un paquete de fragmentos (JSON)

Para conjuntos curados de fragmentos de práctica:

1. Crea un archivo JSON en tu carpeta de paquetes:
```
~/.config/linux-dev-typer/packs/
```

2. Asigna un nombre al archivo que haga referencia al lenguaje (por ejemplo, `python.json`):
```json
{
"language": "python",
"snippets": [
{
"id": "my_list_comp",
"title": "Comprensión de listas",
"difficulty": 3,
"topics": ["listas", "comprensión"],
"code": "squares = [x**2 for x in range(10)]\n"
},
{
"id": "my_dict_comp",
"title": "Comprensión de diccionarios",
"difficulty": 4,
"topics": ["diccionarios", "comprensión"],
"code": "counts = {word: len(word) for word in words}\n"
}
]
}
```

3. Reinicia la aplicación. Los fragmentos se combinarán con los predeterminados y se podrán activar/desactivar desde la barra lateral.

**Consejos:**
- El atributo `id` debe ser único en todos los paquetes.
- El atributo `difficulty` varía de 1 (fácil) a 7 (difícil).
- El atributo `code` debe terminar con `\n`.
- Los paquetes de usuario se pueden activar/desactivar sin eliminar el archivo.

### Compartir contenido

Exporte sus fragmentos personalizados como un paquete portátil `.ldtpack`:

1. Abra la barra lateral → haga clic en **Exportar**.
2. Comparta el archivo `.ldtpack` con otros.
3. Ellos lo importarán a través de la barra lateral → **Importar**.

Solo el contenido creado por el usuario se transfiere; nunca se guarda el historial ni la configuración.

---

## Privacidad

linux-dev-typer funciona completamente sin conexión. No se recopilan, transmiten ni comparten datos.

## Licencia

[MIT](LICENSE)
