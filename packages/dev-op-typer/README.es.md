<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# Dev-Op-Typer

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/dev-op-typer/readme.png" alt="Dev-Op-Typer" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml/badge.svg" alt="Build"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/dev-op-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Una aplicación de práctica de mecanografía centrada en desarrolladores para Windows: cada prueba consiste en código real.**

> También disponible para Linux/macOS: [linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) (Avalonia UI)

## Características

### Práctica con Código Real
- Escribe fragmentos de código reales en **Python, JavaScript, C#, Java, SQL y Bash**.
- Seguimiento de la precisión carácter por carácter con resaltado de diferencias.
- Coincidencia exacta de símbolos: `{ } [ ] ( ) < > ; : , . " ' \`.
- Las nuevas líneas y la sangría son importantes.

### Aprendizaje Adaptativo
- Selección inteligente de fragmentos basada en tu nivel de habilidad.
- Sistema de clasificación tipo Elo por lenguaje.
- Planificador de sesiones: mezcla de objetivos (50%) / revisión (30%) / desafío (20%).
- Mapa de calor de errores por carácter con trayectorias de debilidades.
- Modo de guía: selección opcional basada en debilidades con ejercicios de práctica.
- Escalado de dificultad (D1–D7) con detección de la zona de confort.

### Estadísticas en Tiempo Real
- Palabras por minuto (WPM), precisión y número de errores en tiempo real.
- Finalización de la sesión con información retrospectiva.
- Seguimiento de tendencias: WPM y precisión por lenguaje.
- Detección de fatiga con sugerencias de descanso.
- Panel de puntos débiles con análisis a nivel de carácter.

### Enseñanza y Comunidad
- Pistas contextuales progresivas con capas de "Más contexto".
- Demostraciones: implementaciones alternativas mostradas como opciones equivalentes.
- Señales de la comunidad: consejos y calificaciones de dificultad (solo de visualización).
- Notas de guía de contenido compartido.
- Panel de capas de habilidades para una comprensión estructural.

### Sistema de Contenido
- Más de 168 fragmentos de calibración en 6 idiomas.
- Paquetes de fragmentos de usuario: coloca archivos JSON en la carpeta de paquetes.
- Pegar código: pega cualquier código desde el portapapeles como contenido de práctica.
- Importar archivo/carpeta: indexa archivos de origen con detección automática del idioma.
- Exportar/importar paquetes `.ldtpack` para compartir contenido.
- Identificadores basados en el contenido (desduplicación SHA-256).

### Audio
- Paisajes sonoros ambientales con múltiples temas.
- Sonidos de teclado mecánico (5 temas, 8 variaciones cada uno).
- Controles de volumen por canal (ambiente, teclado, interfaz de usuario).
- Silenciar/activar sonido desde la barra de título.

### Accesibilidad
- Navegación completa con el teclado.
- Soporte para temas de alto contraste.
- Opción de reducir el movimiento.
- Propiedades de automatización en todos los elementos interactivos.

### Persistencia
- Perfil con XP, niveles y calificaciones por idioma.
- Configuración y selección de idioma guardados en cada sesión.
- Historial de sesiones (hasta 500 registros) con compresión mensual.
- Configuraciones de práctica: conjuntos de parámetros con nombre para el ajuste del motor.

## Instalación

### Microsoft Store (recomendado)
Próximamente: pendiente de certificación en la tienda.

### Compilar desde el código fuente

**Requisitos:**
- Windows 10 versión 1809+ o Windows 11.
- .NET 10.0 SDK.
- Visual Studio 2022 (con la carga de trabajo de Windows App SDK) o CLI.

```bash
git clone https://github.com/mcp-tool-shop-org/dev-op-typer.git
cd dev-op-typer
dotnet build DevOpTyper/DevOpTyper.csproj -c Release -p:Platform=x64
```

Ejecuta el ejecutable compilado:
```
DevOpTyper\bin\x64\Release\net10.0-windows10.0.19041.0\DevOpTyper.exe
```

## Estructura del proyecto

```
DevOpTyper/
├── Assets/
│   ├── Icons/         # App icons and Store tile assets
│   ├── Snippets/      # JSON snippet packs by language
│   └── Sounds/        # Ambient and SFX audio files
├── Controls/          # Custom controls (CodeRenderer, TypingPresenter)
├── Models/            # Data models (Profile, Snippet, AppSettings, etc.)
├── Panels/            # UI panels (Typing, Stats, Settings, Explanation, etc.)
├── Services/          # Core services (Audio, Typing, Persistence, Content)
├── Themes/            # Color and high-contrast themes
├── MainWindow.xaml    # Main application window
└── Package.appxmanifest  # MSIX packaging manifest
external/
└── meta-content-system/  # Shared content library (submodule)
```

## Atajos de teclado

| Key | Acción |
|-----| -------- |
| Tab / Shift+Tab | Navegar controles |
| Enter | Iniciar nueva prueba |
| Escape | Restablecer prueba actual |

## Añadir tu propio código

Hay tres formas de practicar con tu propio código:

### Opción 1: Pegar código (la más fácil)

1. Abre el panel de **Configuración** (haz clic en ⚙ en la barra de título).
2. Desplázate hasta **Pegar código**.
3. Pega cualquier fragmento de código en el cuadro de texto.
4. Haz clic en **Añadir**; el idioma se detecta automáticamente.
5. Tu código aparece inmediatamente en la rotación de fragmentos.

### Opción 2: Importar un archivo o carpeta

1. Abra **Configuración** → desplace hacia abajo hasta **Importar**.
2. Haga clic en **Importar archivo** para agregar un solo archivo de origen, o en **Importar carpeta** para analizar un proyecto completo.
3. La aplicación detecta automáticamente el idioma a partir de las extensiones de archivo (`.py`, `.js`, `.cs`, `.java`, `.sql`, `.sh`).
4. El código importado se desduplica mediante un hash de contenido; el mismo código nunca se agrega dos veces.

### Opción 3: Crear un paquete de fragmentos (JSON)

Para conjuntos de fragmentos de práctica seleccionados:

1. Abra la carpeta de fragmentos de usuario:
```
%LocalAppData%\DevOpTyper\UserSnippets\
```
(o haga clic en **Abrir carpeta de fragmentos** en Configuración).

2. Cree un archivo JSON con el nombre del lenguaje (por ejemplo, `python.json`):
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

3. Reinicie la aplicación; sus fragmentos aparecerán junto con los integrados.

**Consejos:**
- `id` debe ser único en todos los paquetes.
- `difficulty` varía de 1 (fácil) a 7 (difícil).
- `code` debe terminar con `\n`.
- Puede organizar los paquetes en subdirectorios de un nivel de profundidad.

### Compartir contenido

Exporte sus fragmentos personalizados como un paquete portátil `.ldtpack`:

1. Abra **Configuración** → haga clic en **Exportar paquete**.
2. Comparta el archivo `.ldtpack` con otros.
3. Ellos lo importan a través de **Configuración** → **Importar paquete**.

Solo el contenido creado por el usuario se transfiere; nunca el historial de práctica ni la configuración.

## Privacidad

Dev-Op-Typer funciona completamente sin conexión. No se recopilan, transmiten ni comparten datos. Consulte [PRIVACY.md](PRIVACY.md).

## Licencia

[MIT](LICENSE)
