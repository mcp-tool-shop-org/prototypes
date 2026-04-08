<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="media/icon.png" width="400" alt="Polyglot">
</p>

<p><strong>Translate text, files, and READMEs directly in VS Code — powered by your local GPU. 55 languages, zero cloud dependency.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.polyglot-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.polyglot-vscode" alt="VS Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/polyglot-vscode"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/polyglot-vscode" alt="Coverage"></a>
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/polyglot-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## ¿Qué hace?

Polyglot ejecuta [TranslateGemma 12B](https://ai.google.dev/gemma/docs/core/translategemma) a través de [Ollama](https://ollama.com) en tu GPU local. No requiere claves de API, ni servicios en la nube, ni transferencia de datos fuera de tu máquina.

- **Traducir selección** — Selecciona el texto, presiona `Ctrl+Alt+T`, elige un idioma. ¡Listo!
- **Traducir archivo** — Traduce un archivo completo a un nuevo archivo `file.ja.ext` junto con el original.
- **Traducir README** — Traduce por lotes tu archivo README.md a 7 idiomas, conservando bloques de código, tablas y distintivos.
- **Panel lateral** — Icono de globo en la barra de actividad con botones de acción y estado de Ollama en tiempo real.

## Requisitos

- [Ollama](https://ollama.com) instalado y en ejecución.
- Una GPU con suficiente VRAM para el modelo (12 GB para `translategemma:12b`, 2 GB para `translategemma:2b`).
- El modelo se descarga automáticamente la primera vez que se utiliza.

## Cómo empezar

1. Instala la extensión.
2. Haz clic en el icono del globo en la barra de actividad (barra lateral izquierda).
3. Haz clic en **Comprobar estado** — Polyglot iniciará Ollama y descargará el modelo si es necesario.
4. Selecciona algún texto y presiona `Ctrl+Alt+T` (o `Cmd+Alt+T` en Mac).

## Comandos

| Comando | Atajo de teclado | Descripción |
|---------|----------|-------------|
| **Polyglot: Traducir selección** | `Ctrl+Alt+T` | Traduce el texto seleccionado directamente. |
| **Polyglot: Translate File** | — | Traduce el archivo actual a un nuevo archivo. |
| **Polyglot: Traducir README** | — | Traduce por lotes el archivo README.md a múltiples idiomas. |
| **Polyglot: Check Status** | — | Verifica la conexión de Ollama y la disponibilidad del modelo. |
| **Polyglot: Help** | — | Acceso rápido a la configuración, tutorial y enlaces. |

## Puntos de acceso

- **Panel lateral** — Icono de globo en la barra de actividad con botones de acción con estilo.
- **Barra de título del editor** — El icono del globo aparece cuando se selecciona texto.
- **Menú contextual** — "Traducir selección" en el menú contextual del editor.
- **Paleta de comandos** — `Ctrl+Shift+P` → escribe "Polyglot".
- **Atajo de teclado** — `Ctrl+Alt+T` con texto seleccionado.

## Configuración

| Configuración | Valor predeterminado | Descripción |
|---------|---------|-------------|
| `polyglot.ollamaUrl` | `http://localhost:11434` | URL del servidor Ollama |
| `polyglot.model` | `translategemma:12b` | Modelo de traducción (prueba con `2b` para usar menos VRAM). |
| `polyglot.defaultSourceLanguage` | `en` | Idioma de origen para las traducciones. |
| `polyglot.defaultLanguages` | 7 idiomas. | Idiomas de destino para la traducción de README. |

## Idiomas soportados

Árabe, bengalí, búlgaro, catalán, chino (simplificado y tradicional), croata, checo, danés, holandés, inglés, estonio, finlandés, francés, alemán, griego, gujarati, hebreo, hindi, húngaro, indonesio, italiano, japonés, kannada, coreano, letón, lituano, macedonio, malayo, malayalam, marathi, noruego, persa, polaco, portugués, rumano, ruso, serbio, eslovaco, esloveno, español, suajili, sueco, tamil, telugu, tailandés, turco, ucraniano, urdu, vietnamita y galés.

## Cómo funciona

Polyglot utiliza [@mcptoolshop/polyglot-mcp](https://www.npmjs.com/package/@mcptoolshop/polyglot-mcp), un motor de traducción local que:

1. Inicia automáticamente Ollama si no está en ejecución.
2. Descarga automáticamente el modelo TranslateGemma la primera vez que se utiliza.
3. Divide textos largos en párrafos/oraciones.
4. Aplica un glosario de software para términos técnicos precisos.
5. Corrige errores comunes del modelo (alternativas duplicadas, puntos al final).

Para la traducción de README, utiliza una segmentación inteligente: los bloques de código, los distintivos HTML y las URL se conservan sin cambios, mientras que los encabezados, los párrafos y el contenido de las tablas se traducen.

## Seguridad y alcance de los datos

**Datos a los que se accede:** texto en el editor activo (solo lectura para la selección, escritura para el reemplazo), archivos en el espacio de trabajo para "Traducir archivo" / "Traducir README" (crea nuevos archivos junto a los originales). **Datos a los que NO se accede:** ningún archivo fuera del espacio de trabajo, ninguna credencial del sistema operativo, ningún dato del navegador. **Red:** se conecta únicamente a Ollama local (`localhost:11434` por defecto) — **sin conexión a la nube**. **No se recopilan ni se envían datos de telemetría**.

## Licencia

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
