<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/sovereignty/readme.png" width="400" alt="sovereignty" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/sovereignty"><img src="https://img.shields.io/npm/v/@mcptoolshop/sovereignty" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-sovereignty/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/sovereignty/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Un juego de estrategia sobre gobernanza, confianza y comercio: juego de mesa sin conexión + verificación en línea a través de XRPL.

**No se requiere Python.** Este paquete descarga un binario precompilado y lo ejecuta localmente.

## Instalación y ejecución

```bash
npx @mcptoolshop/sovereignty tutorial
```

Eso es todo. No se necesita Python, ni pip, ni entornos virtuales.

## Qué sucede

1. La primera ejecución descarga un binario específico para la plataforma (aproximadamente 25 MB) desde [GitHub Releases](https://github.com/mcp-tool-shop-org/sovereignty/releases).
2. Verifica la suma de comprobación SHA256.
3. Se almacena localmente (`~/.cache/mcptoolshop/sovereignty/`).
4. Se ejecuta con la transmisión completa de argumentos.

Las ejecuciones posteriores se inician instantáneamente desde la caché.

## Comandos

```bash
npx @mcptoolshop/sovereignty tutorial    # learn the rules
npx @mcptoolshop/sovereignty new         # start a new game
npx @mcptoolshop/sovereignty status      # check game state
npx @mcptoolshop/sovereignty --help      # see all commands
```

## Plataformas compatibles

- Linux x64
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Windows x64

## Seguridad

Todos los binarios se verifican con sumas de comprobación SHA256 antes de la ejecución. No hay telemetría. No hay acceso a la red más allá de la descarga inicial desde GitHub.

Desarrollado por [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).

## Alternativa: Instalación mediante Python

Si prefiere usar Python:

```bash
pipx install sovereignty-game
sov tutorial
```

---

Desarrollado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
