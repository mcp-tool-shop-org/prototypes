<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <strong>English</strong> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.ja.md">日本語</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.zh.md">中文</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.es.md">Español</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.fr.md">Français</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.hi.md">हिन्दी</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.it.md">Italiano</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-vscode/readme.png" alt="WebSketch" width="400"></p>

<p align="center"><strong>Turn any web page into a structured tree that LLMs can actually understand.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.websketch-vscode.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode"><img src="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> &middot;
  <a href="#the-solution">The Solution</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-reads">How It Reads</a> &middot;
  <a href="#use-cases">Use Cases</a> &middot;
  <a href="#ecosystem">Ecosystem</a>
</p>

---

## El Problema

Quieres que un modelo de lenguaje (LLM) analice una página web, incluyendo su diseño, navegación, elementos interactivos y jerarquía de contenido. Las opciones actuales no son suficientes:

| Enfoque | Tokens | Lo que se pierde |
|----------|--------|---------------|
| **Screenshot** | 1,000+ (visión) | No puede leer texto pequeño, adivina el diseño, información de interactividad nula. |
| **Raw HTML** | 50,000–500,000 | Se ve abrumado por el "sopa" de `div`, estilos en línea, scripts y ruido de SVG. |
| **Readability extract** | 2,000–10,000 | Elimina toda la estructura: no hay navegación, ni botones, ni formularios. |
| **DOM dump** | 10,000–100,000 | Nombres de clase, atributos de datos y artefactos de frameworks por todas partes. |

El problema central: **ninguna de estas opciones "habla" el lenguaje de la interfaz de usuario (UI)**. Los LLM no necesitan `<div class="sc-bdnxRM jJFqsI">`; necesitan `NAV`, `BUTTON`, `CARD`, `LIST`.

## La Solución

WebSketch captura la página en un **árbol semántico** utilizando 23 elementos primitivos de la UI. Con un solo clic en VS Code, puedes copiarlo y pegarlo en cualquier LLM:

```
PAGE
├─ HEADER {sticky}
│  ├─ *LINK "Home"
│  ├─ *LINK "Products"
│  ├─ *LINK "Pricing"
│  └─ *INPUT <search> "Search..."
├─ SECTION <main>
│  ├─ TEXT <h1> "Welcome to Acme"
│  ├─ TEXT "Build faster with our platform..."
│  └─ *BUTTON "Get Started"
├─ LIST (3 items)
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "Real-time sync across devices"
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "99.9% uptime guarantee"
│  └─ CARD
│     ├─ IMAGE "Feature icon"
│     └─ TEXT "Enterprise-grade security"
└─ FOOTER
   ├─ NAV
   │  ├─ *LINK "Terms"
   │  ├─ *LINK "Privacy"
   │  └─ *LINK "Contact"
   └─ TEXT "© 2026 Acme Inc."
```

**200–800 tokens**. No 50,000. No una cuadrícula de píxeles. Un árbol limpio que cualquier modelo de texto puede analizar.

### Comparativa

| Métrica | WebSketch | HTML sin procesar | Captura de pantalla |
|--------|-----------|----------|------------|
| **Tokens** | 200–800 | 50,000+ | 1,000+ (visión) |
| **Structure** | Árbol semántico completo | Caos de `div` anidados | Cuadrícula de píxeles |
| **Text content** | Citado y etiquetado | Oculto en el código | Dependiente de OCR |
| **Interactive elements** | Marcado con `*` | Oculto en atributos | Invisible |
| **Heading hierarchy** | `<h1>` a `<h6>` | Perdido en nombres de clase | Adivinado por tamaño |
| **Landmarks** | `<main>`, `<nav>`, `<search>` | Requiere experiencia en DOM | No disponible |
| **Works with** | Cualquier LLM de texto | Nada útil | Modelos de visión únicamente |

## Cómo empezar

1. Instala desde el [Mercado de VS Code](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode) o ejecuta:
```
ext install mcp-tool-shop.websketch-vscode
```
2. Abre la paleta de comandos (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Ejecuta **WebSketch: Capturar URL**
4. Pega una URL y presiona Enter
5. Haz clic en **Copiar para LLM** y pega en tu prompt

La pestaña del LLM es la vista predeterminada. Un solo clic copia el árbol al portapapeles, listo para cualquier modelo.

## Cómo funciona

Cada línea del árbol contiene información densa y es interpretable por máquinas:

```
├─ *BUTTON <search> {sticky} "Find products"
│    │       │         │         │
│    │       │         │         └─ Actual visible text
│    │       │         └─ Flags (sticky, scrollable)
│    │       └─ Semantic hint (search, main, h1, aside...)
│    └─ Interactive (clickable/typeable)
│
└─ Tree structure shows parent-child nesting
```

### La gramática

| Símbolo | Significado | Ejemplo |
|--------|---------|---------|
| Prefijo `*` | El usuario puede interactuar con él. | `*LINK`, `*BUTTON`, `*INPUT` |
| `<semantic>` | Significado de HTML5/ARIA preservado. | `<h1>`, `<main>`, `<search>`, `<aside>` |
| `{flags}` | Comportamiento del diseño. | `{sticky}`, `{scrollable}` |
| `"label"` | Contenido de texto visible. | `"Sign up free"`, `"Search..."` |
| `(N items)` | Número de elementos de la lista. | `LIST (12 items)` |
| Sangría. | Jerarquía padre-hijo. | `HEADER > NAV > LIST > LINK` |

### Los 23 roles

| Categoría | Roles |
|----------|-------|
| **Layout** | `PAGE`, `HEADER`, `FOOTER`, `SECTION`, `NAV` |
| **Content** | `TEXT`, `IMAGE`, `ICON`, `CARD`, `LIST`, `TABLE` |
| **Interactive** | `BUTTON`, `LINK`, `INPUT`, `CHECKBOX`, `RADIO`, `FORM` |
| **Overlays** | `MODAL`, `TOAST`, `DROPDOWN` |
| **Navigation** | `PAGINATION` |
| **Fallback** | `UNKNOWN` |

Estos 23 roles son un vocabulario fijo, el mismo en cada sitio web. Los LLM los aprenden una vez y pueden analizar cualquier página.

## Qué se captura

WebSketch no solo extrae el DOM. Ejecuta un **clasificador de 5 niveles** en cada elemento visible:

| Nivel | Fuente | Ejemplo |
|------|--------|---------|
| 1. **Rol ARIA** | `role="navigation"` | &rarr; `NAV` |
| 2. **Etiqueta HTML** | `<button>`, `<h1>` | &rarr; `BUTTON`, `TEXT <h1>` |
| 3. **Heurísticas de clase** | `.card`, `.modal`, `.toast` | &rarr; `CARD`, `MODAL`, `TOAST` |
| 4. **Análisis estructural** | 3+ elementos del mismo rol. | &rarr; `LIST` |
| 5. **Respaldo** | Elementos solo de texto. | &rarr; `TEXT`, `SECTION`, `UNKNOWN` |

Luego, se realiza una limpieza:

- **Recorrido transparente de la tabla** — Se omiten las etiquetas `TR`/`TD`/`TH`/`LI`, y los elementos secundarios se promueven a la superficie.
- **Eliminación de contenido nulo** — Se eliminan los nodos vacíos, no interactivos e invisibles.
- **Colapso de envoltorios** — Se eliminan los envoltorios `SECTION` innecesarios que solo contienen un elemento secundario.
- **Poda en cascada** — Se eliminan por completo las cadenas de envoltorios vacíos sin contenido.
- **Extracción de etiquetas** — Se extrae el texto visible de enlaces, botones, encabezados, imágenes e inputs.

El resultado: un árbol limpio con el mínimo de nodos necesarios para comprender la página.

## Casos de uso

### Para ingenieros de prompts

**"Describe la estructura de esta página"** — Pega el árbol. El modelo de lenguaje (LLM) ve la estructura exacta, los encabezados y la navegación sin verse abrumado por el HTML. Funciona con ChatGPT, Claude, Gemini, Llama y cualquier otro modelo de texto.

**"¿Qué puede hacer un usuario en esta página?"** — Cada elemento interactivo está marcado con `*`. Enlaces, botones, inputs, casillas de verificación: todos están etiquetados con su texto visible. El LLM puede enumerar cada posible acción del usuario.

**"Compara estas dos páginas"** — Dos árboles uno al lado del otro. El LLM puede comparar la estructura, identificar elementos faltantes y comparar patrones de navegación, todo en unos pocos cientos de tokens.

### Para desarrolladores

**"Genera un plan de pruebas para esta interfaz de usuario"** — El árbol se mapea directamente a los objetivos de las pruebas. `*BUTTON "Enviar"`, `*INPUT <email> "Introduzca el correo electrónico"`, `*LINK "Términos"`: cada uno es una interacción que se puede probar con su etiqueta visible.

**"Crea algo que se vea así"** — El árbol semántico se asemeja a una jerarquía de componentes. `HEADER > NAV > LIST > LINK` se mapea directamente a componentes de React/Vue/Svelte. El LLM puede generar una estructura de diseño similar.

**"Audita esta página para la accesibilidad"** — Se muestran los elementos de referencia faltantes, los inputs sin etiquetas y las inconsistencias en la jerarquía de encabezados. Las pistas semánticas como `<main>`, `<nav>` y `<search>` indican qué roles ARIA están presentes (o ausentes).

### Para agentes de IA

**Integración con MCP** — Utiliza [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) para permitir que tu agente de IA capture y razone sobre cualquier página web como parte de su conjunto de herramientas.

**Monitoreo automatizado** — Utiliza [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) para capturar páginas según un horario, comparar los árboles y detectar cambios estructurales.

## Cuatro vistas

| Pestaña | Lo que muestra | Ideal para |
|-----|---------------|----------|
| **LLM** (default) | Árbol semántico con sangría, etiquetas, semántica y banderas | Pegar en prompts de LLM |
| **ASCII** | Esquema de dibujo de cajas con diseño espacial | Comprensión visual del diseño |
| **Tree** | Árbol de nodos con capacidad de colapso y distintivos de rol con código de color | Depuración de capturas |
| **JSON** | IR completo de `WebSketchCapture` con resaltado de sintaxis | Uso programático y pipelines |

## Comandos

| Comando | Descripción |
|---------|-------------|
| `WebSketch: Capture URL` | Solicita una URL, captura y muestra |
| `WebSketch: Capture URL from Clipboard` | Captura la URL que esté en tu portapapeles |
| `WebSketch: Copy LLM Tree to Clipboard` | Copia el árbol y pégalo directamente en ChatGPT, Claude, etc. |
| `WebSketch: Export LLM Tree` | Guarda como `.md` para bibliotecas de prompts o documentación |
| `WebSketch: Export Capture as JSON` | Captura completa del IR con cuadros delimitadores, hashes y metadatos |
| `WebSketch: Export ASCII Wireframe` | Vista de esquema de dibujo de cajas |

## Configuración

| Configuración | Valor predeterminado | Descripción |
|---------|---------|-------------|
| `websketch.chromePath` | Detección automática | Ruta al ejecutable de Chrome o Edge |
| `websketch.viewportWidth` | `1280` | Ancho del área de visualización en píxeles |
| `websketch.viewportHeight` | `800` | Altura del área de visualización en píxeles |
| `websketch.timeout` | `30000` | Tiempo de espera de navegación (ms) |
| `websketch.waitAfterLoad` | `1000` | Tiempo de espera adicional para la renderización de JavaScript (ms) |

## Ecosistema

WebSketch es una familia de herramientas construidas sobre una gramática común:

| Paquete | ¿Qué hace? |
|---------|-------------|
| [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) | Núcleo: Representación intermedia (IR) — gramática, validación, renderizado, comparación de diferencias, generación de huellas digitales. |
| **websketch-vscode** | Extensión para VS Code — captura páginas desde su editor (este repositorio). |
| [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) | Captura y renderizado desde la línea de comandos. |
| [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) | Extensión para Chrome para la captura dentro del navegador. |
| [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) | Servidor MCP para la integración con agentes de modelos de lenguaje (LLM). |

Todas las herramientas producen la misma representación intermedia `WebSketchCapture`, por lo que las salidas son intercambiables entre los diferentes procesos.

## Requisitos

- VS Code 1.85 o superior.
- Chrome o Edge instalados en su sistema.

No incluye un navegador integrado. No hay una descarga de 200 MB. WebSketch utiliza `puppeteer-core` con el navegador que ya tenga instalado.

## Seguridad y alcance de los datos

**Datos que se utilizan:** URLs ingresadas por el usuario (navegadas a través de puppeteer-core utilizando Chrome/Edge local en modo sin interfaz gráfica), contenido de la página capturada convertido en un árbol de representación intermedia, exportaciones escritas en archivos del espacio de trabajo o en el portapapeles. **Datos que NO se utilizan:** ningún archivo fuera del espacio de trabajo, ninguna credencial del sistema operativo, ninguna sesión de inicio de sesión del navegador (modo sin interfaz gráfica sin perfil). **Red:** solo navega a las URLs especificadas por el usuario; no se realizan otras solicitudes salientes. **No se recopila ni se envía telemetría.**

## Licencia

Licencia MIT — consulte [LICENSE](LICENSE) para obtener más detalles.

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
