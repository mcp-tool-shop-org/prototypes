<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/escape-the-valley/readme.png" width="400" alt="Escape the Valley">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/escape-the-valley"><img src="https://img.shields.io/npm/v/@mcptoolshop/escape-the-valley" alt="npm version"></a>
  <a href="https://pypi.org/project/escape-the-valley/"><img src="https://img.shields.io/pypi/v/escape-the-valley" alt="PyPI"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-escape-the-valley/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/escape-the-valley/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Un juego de supervivencia al estilo de Oregon Trail, con narración por inteligencia artificial y una mochila opcional que utiliza el registro de XRPL.

**No se requiere Python.** Este paquete descarga un binario precompilado y lo ejecuta localmente.

## Instalación y Ejecución

```bash
npx @mcptoolshop/escape-the-valley tui --seed 42
```

Eso es todo. No se necesita Python, ni pip, ni entornos virtuales.

### Continuar una partida guardada

```bash
npx @mcptoolshop/escape-the-valley tui --continue
```

Se retoma justo donde lo dejaste; el juego guarda automáticamente en cada punto de control.

## Qué sucede

1. La primera ejecución descarga un binario específico para la plataforma (aproximadamente 15 MB) desde [GitHub Releases](https://github.com/mcp-tool-shop-org/escape-the-valley/releases).
2. Verifica la suma de comprobación SHA256.
3. Se guarda localmente (`~/.cache/mcptoolshop/escape-the-valley/`).
4. Se ejecuta con la transmisión completa de argumentos.

Las ejecuciones posteriores se inician instantáneamente desde la caché.

## El Juego

Guía a un grupo de colonos a través de una naturaleza salvaje generada proceduralmente. Administra alimentos, agua, el estado del carro y la moral, mientras navegas por eventos, peligros y decisiones difíciles. El valle es implacable pero justo; un jugador habilidoso gana aproximadamente 1 de cada 3 partidas.

Un **Maestro de Juego con IA** opcional (impulsado por Ollama) narra tu viaje con tres voces narrativas. Una **mochila opcional de registro de la red de pruebas XRPL** rastrea cada cambio de suministro como recibos en la cadena de bloques.

### Acciones en el Campamento

| Acción | Qué hace |
|--------|-------------|
| **Travel** | Moverse hacia la salida: cada turno que no te mueves consume suministros innecesariamente. |
| **Rest** | Recuperar salud y moral, con posibilidad de curar condiciones. |
| **Hunt** | Buscar comida (mejor en bosques y llanuras). |
| **Repair** | Reparar los daños del carro antes de que te deje varado. |
| **Ration** | Reducir las raciones a la mitad cuando la comida escasea (afecta la moral). |
| **Abandon** | Reducir el peso de la carga para aumentar la velocidad (último recurso). |

### Perfiles del Maestro de Juego

| Perfil | Voz |
|---------|-------|
| **Chronicler** | Tono seco, factual e histórico. |
| **Fireside** | Narrador cálido y cercano. |
| **Lantern-Bearer** | Tono inquietante, atmosférico y presagioso. |

## Comandos

```bash
npx @mcptoolshop/escape-the-valley tui                    # start a new game
npx @mcptoolshop/escape-the-valley tui --seed 42          # seeded world gen
npx @mcptoolshop/escape-the-valley tui --continue         # resume saved game
npx @mcptoolshop/escape-the-valley tui --gm chronicler    # choose GM voice
npx @mcptoolshop/escape-the-valley tui --callouts minimal # fewer warnings
npx @mcptoolshop/escape-the-valley ledger                 # print trail ledger
npx @mcptoolshop/escape-the-valley --help                 # see all commands
```

## Plataformas Compatibles

- Linux x64
- macOS ARM64 (Apple Silicon)
- Windows x64

## Solución de Problemas

```bash
npx @mcptoolshop/escape-the-valley --print-cache-path  # show cached binary location
npx @mcptoolshop/escape-the-valley --clear-cache       # force fresh re-download
```

**Fijar a una versión específica** si la última versión tiene errores:

```bash
npx @mcptoolshop/escape-the-valley@1.0.0 tui --seed 42
```

## Seguridad

Todos los binarios se verifican contra las sumas de comprobación SHA256 antes de la ejecución. No hay telemetría. No hay acceso a la red más allá de la descarga inicial desde GitHub.

Impulsado por [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).

## Alternativa: Instalar mediante Python

Si prefieres Python:

```bash
pip install escape-the-valley
trail tui --seed 42
```

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
