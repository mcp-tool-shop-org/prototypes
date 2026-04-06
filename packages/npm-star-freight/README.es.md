<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/star-freight/readme.png" alt="Star Freight -- Trade. Decide. Survive." width="400">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/star-freight"><img src="https://img.shields.io/npm/v/@mcptoolshop/star-freight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

# @mcptoolshop/star-freight

> RPG de línea de comandos para comerciantes espaciales. Instalación con npx sin requisitos previos.

```bash
npx @mcptoolshop/star-freight
```

O instálalo globalmente:

```bash
npm i -g @mcptoolshop/star-freight
star-freight
```

No se requiere Python, pip ni herramientas de compilación. Se descargan binarios precompilados, se verifica su integridad con SHA256 y se almacenan localmente.

---

## El juego

Eras un piloto militar. Luego, fuiste un deshonrado. Ahora eres el capitán de una nave vieja, sin reputación y en un sistema estelar que ya estaba en movimiento cuando llegaste.

**Star Freight** es un RPG táctico de comerciantes basado en texto, donde transportas mercancías a través de un sistema estelar políticamente dividido. Cinco civilizaciones. Una economía. Cuatro verdades que no te permitirán vivir la misma vida dos veces.

Aterrizas en estaciones donde la cultura influye en cómo negocias. Eliges rutas donde el terreno afecta cómo luchas. Contratas a la tripulación que cambia lo que puedes hacer, a lo que puedes acceder y lo que debes. Aceptas contratos que parecen sencillos hasta que la burocracia se complica, la escasez cambia el precio o la carga resulta ser evidencia.

## Por qué se siente diferente

**La tripulación es ley vinculante.** Thal no es un bono del +10% en reparaciones. Thal es *por qué* puedes aterrizar en las estaciones de Keth, *por qué* tu nave tiene una capacidad de reparación de emergencia y *por qué* notaste que la carga médica no coincidía con la temporada. Pierde a Thal, y tres sistemas pierden capacidad al mismo tiempo.

**El combate es un evento de campaña.** La victoria te da créditos de rescate y "calor" de facción. La retirada cuesta carga abandonada y una reputación de ser alguien que huye. La derrota significa carga confiscada, tripulación herida y una nave que se dirige a la estación más cercana a un precio elevado.

**La cultura es lógica social.** Los Keth no solo tienen precios diferentes. Tienen un calendario biológico estacional que cambia lo que significa dar regalos y cuándo hacer una oferta es una ofensa. Los Veshan desafían, y negarse es peor que perder.

**La investigación emerge de la vida.** Notas que la carga médica no coincide con la temporada porque la has estado transportando. La conspiración no se anuncia. Te topas con ella al hacer tu trabajo.

## El mundo

Cinco civilizaciones comparten un sistema estelar llamado el Umbral.

**El Compacto Terrano** -- Gobierno humano burocrático. Te deshonraron. Recuperar tu posición implica permisos, paciencia y humildad.

**La Comunión Keth** -- Colectivo artrópodo con un calendario biológico. Los mejores márgenes del sistema si entiendes las estaciones. El colapso de reputación más rápido si no.

**Los Principados Veshan** -- Casas feudales reptilianas obsesionadas con el honor y la deuda. El Libro de Deudas no es solo un detalle. Es un punto de palanca.

**La Deriva Orryn** -- Civilización de intermediarios móviles. Comercian con todos, saben todo y cobran por ello.

**El Alcance Sombío** -- Facciones piratas, recuperadores de tecnología ancestral y personas que el Compacto preferiría olvidar. No hay leyes. No hay aduanas. No hay reembolsos.

## Tres tipos de capitán

**Capitán de relevo.** Disciplina de convoy, acceso basado en la confianza, consecuencias públicas. Mantienes a la gente alimentada y te atrapas en la legitimidad.

**Corredor gris.** Palanca basada en documentos, abuso del tiempo, riesgo institucional. Ganas dinero siendo difícil de descifrar.

**Capitán de honor.** Confrontación directa, política interna, volatilidad de la reputación. Resuelves problemas cara a cara.

Estos no son clases. Son lo que tus elecciones te han convertido.

## Cómo funciona este paquete

Este paquete de npm utiliza [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) para:

1. Descargue el archivo binario precompilado de Star Freight desde [GitHub Releases](https://github.com/mcp-tool-shop-org/star-freight/releases).
2. Verifique las sumas de verificación SHA256.
3. Almacene en caché localmente (`~/.cache/mcptoolshop/star-freight/`).
4. Ejecute con sus argumentos.

### Administración de la caché

```bash
star-freight --print-cache-path
star-freight --clear-cache
```

### Soporte de plataformas

| Plataforma. | Binario. |
|----------|--------|
| Linux x64. | `star-freight-<version>-linux-x64` |
| macOS ARM64. | `star-freight-<version>-darwin-arm64` |
| Windows x64. | `star-freight-<version>-win-x64.exe` |

## Seguridad

**Modelo de amenazas:** Este paquete descarga archivos binarios precompilados desde GitHub Releases a través de HTTPS y verifica las sumas de verificación SHA256 antes de la ejecución. NO recopila datos de telemetría, almacena credenciales, realiza solicitudes de red más allá de `github.com`, ni escribe fuera del directorio de caché del usuario (`~/.cache/mcptoolshop/star-freight/`). El archivo binario ejecutado se ejecuta con los permisos del usuario que lo invoca y escribe los datos de guardado del juego únicamente en el directorio de trabajo actual. Consulte [SECURITY.md](SECURITY.md) para obtener la política completa.

## Repositorio de código fuente

El código fuente del juego se encuentra en [mcp-tool-shop-org/star-freight](https://github.com/mcp-tool-shop-org/star-freight).

## Licencia

MIT.

---

*Star Freight es un juego sobre moverse a través de sistemas de poder sin pertenecer completamente a ellos.*

Desarrollado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.
