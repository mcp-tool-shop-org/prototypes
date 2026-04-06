<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/vscode-voice-soundboard/readme.png" alt="Voice Soundboard" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.vscode-voice-soundboard"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.vscode-voice-soundboard.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/vscode-voice-soundboard"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/vscode-voice-soundboard" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/vscode-voice-soundboard/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Extensión de texto a voz con 48 voces, preajustes y diálogo multivoz, impulsada por [MCP Voice Soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard).

## Características

- **Panel lateral** con pestañas de "Hablar", "Voces" y "Diálogo".
- **48 voces** en 9 idiomas (inglés, japonés, mandarín, español, francés, hindi, italiano, portugués).
- **5 preajustes:** Asistente, Narrador, Locutor, Cuentacuentos, Susurro.
- **Diálogo multivoz:** escriba guiones, asigne voces y reproduzca todo.
- **Selección de voz:** resalte código o texto y presione `Ctrl+Shift+S`.
- Reproducción de audio multiplataforma (Windows, macOS, Linux).

## Cómo empezar

1. Instale la extensión.
2. El servidor de MCP Voice Soundboard se inicia automáticamente.
3. Haga clic en el icono del micrófono en la barra de actividad.
4. Escriba texto y haga clic en **Hablar**.

## Comandos

| Comando | Atajo | Descripción |
|---------|----------|-------------|
| Voice Soundboard: Hablar texto... | — | Ingrese el texto que desea que se lea. |
| Voice Soundboard: Hablar selección | `Ctrl+Shift+S` | Reproduce el texto seleccionado en el editor. |
| Voice Soundboard: Detener reproducción | — | Detiene la reproducción actual. |
| Voice Soundboard: Cambiar voz | — | Selector rápido de voz. |
| Voice Soundboard: Alternar panel | — | Muestra u oculta el panel lateral. |
| Voice Soundboard: Exportar diálogo como WebVTT | — | Exporta el guion del diálogo como un archivo de subtítulos `.vtt`. |

## Exportación de diálogo

Escriba un guion multivoz en la pestaña de "Diálogo", asigne voces y luego haga clic en **Exportar VTT**. La extensión sintetiza cada línea, calcula los códigos de tiempo acumulativos a partir de las duraciones de audio y guarda un archivo de subtítulos [WebVTT](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API).

El archivo `.vtt` exportado utiliza etiquetas de voz (`<v Speaker>`) y se puede utilizar con reproductores de video, editores de subtítulos o herramientas de accesibilidad.

## Configuración

| Configuración | Valor predeterminado | Descripción |
|---------|---------|-------------|
| `voiceSoundboard.defaultVoice` | `bm_george` | ID de voz predeterminado |
| `voiceSoundboard.speed` | `1.0` | Velocidad de habla (0.5–2.0) |
| `voiceSoundboard.backend` | `python` | Backend de TTS (python/http/mock) |
| `voiceSoundboard.autoStart` | `true` | Iniciar automáticamente el servidor al activar |
| `voiceSoundboard.format` | `wav` | Formato de salida de audio |

## Seguridad y alcance de datos

- **Backend local (predeterminado):** Python/Kokoro TTS se ejecuta completamente en su máquina; no hay salida de red.
- **Backend en la nube (opcional):** envía texto a una API de TTS configurada por el usuario (OpenAI/ElevenLabs); requiere una clave de API explícita.
- **Reproducción de audio:** utiliza `spawn` con un array de argumentos, no con la shell; consulte [SECURITY.md](SECURITY.md) para obtener más detalles.
- No se recopila ni se envía ninguna información de telemetría.

## Licencia

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
