<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/portlight/readme.png" width="600" alt="Portlight">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/actions"><img src="https://github.com/mcp-tool-shop-org/npm-portlight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/portlight"><img src="https://img.shields.io/npm/v/@mcptoolshop/portlight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/npm-portlight/"><img src="https://img.shields.io/badge/docs-handbook-blue" alt="Handbook"></a>
</p>

Juego de estrategia marítima centrado en el comercio. Construye una carrera como comerciante en cinco regiones a través de la optimización de rutas, contratos, infraestructura, finanzas y reputación, todo desde la terminal. No se requiere Python.

## Instalación

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
```

O instala globalmente:

```bash
npm install -g @mcptoolshop/portlight
portlight new "Captain Hawk" --type merchant
```

También disponible a través de pip: `pip install portlight`

## ¿Por qué Portlight?

La mayoría de los juegos de comercio simplifican el comercio a un número que simplemente aumenta. Portlight trata el comercio como una disciplina comercial:

- **Los precios reaccionan a tus transacciones.** Si vendes grano en un puerto, el precio se desploma. Cada venta altera el mercado local.
- **Los puertos tienen identidades económicas reales.** Porto Novo produce grano a bajo costo. Silk Haven exporta seda en grandes cantidades. Estas son características estructurales, no aleatorias.
- **Los viajes implican riesgos.** Tormentas, piratas, inspecciones, peligros estacionales. Tus provisiones, el casco y la tripulación son importantes.
- **Los contratos requieren pruebas.** Entrega los productos correctos al puerto correcto antes de la fecha límite. Se rastrea el origen de los productos.
- **La infraestructura cambia la forma en que operas.** Los almacenes almacenan la carga. Los corredores mejoran los contratos. Las licencias desbloquean acceso premium.
- **La reputación abre y cierra puertas.** Confianza comercial, escrutinio aduanero, posición regional y conexiones con el mundo criminal: cuatro factores que influyen en lo que puedes hacer y dónde.
- **El juego analiza lo que has construido.** Tu historial comercial, infraestructura, reputación y rutas forman un perfil de carrera. Cuatro caminos distintos hacia la victoria, basados en el tipo de comerciante que realmente te has convertido.

## El Mundo

Cinco regiones. Veinte puertos. Cuarenta y tres rutas. Una economía dinámica.

| Región | Puertos | Personaje |
|--------|-------|-----------|
| **Mediterranean** | Porto Novo, Al-Manar, Silva Bay, Corsair's Rest | Granos, madera, mercados de especias. Aguas de inicio seguras. |
| **North Atlantic** | Ironhaven, Stormwall, Thornport | Hierro, armas, comercio militar. Inspecciones estrictas. |
| **West Africa** | Sun Harbor, Palm Cove, Iron Point, Pearl Shallows | Algodón, ron, perlas. Provisiones más baratas. |
| **East Indies** | Jade Port, Monsoon Reach, Silk Haven, Crosswind Isle, Dragon's Gate, Spice Narrows | Seda, especias, porcelana, té. Mayores márgenes de beneficio. Riesgo de monzones. |
| **South Seas** | Ember Isle, Typhoon Anchorage, Coral Throne | Perlas, medicinas. Aguas remotas para la fase final del juego. |

134 personajes no jugables (PNJ) con nombre en cada puerto. Cuatro facciones piratas que controlan diferentes áreas. Clima estacional que altera el peligro y la demanda. Una capa cultural con festivales, supersticiones y moral de la tripulación.

## Nueve Capitanes

| Capitán | Hogar | Ventaja | Compromiso |
|---------|------|------|-----------|
| **Merchant** | Porto Novo | Mejores precios, la confianza crece rápidamente | Penalizaciones por "calor" duplicadas |
| **Smuggler** | Corsair's Rest | Mercado negro, comercio de contrabando | Mayor "calor", más inspecciones |
| **Navigator** | Monsoon Reach | Barcos más rápidos, mayor alcance | Posición inicial más débil |
| **Privateer** | Ironhaven | Combate naval, ventaja en abordajes | Mala reputación comercial |
| **Corsair** | Corsair's Rest | Combate equilibrado + comercio | Maestro de nada |
| **Scholar** | Jade Port | Ventaja de información, mejores contratos | Poco capital, frágil |
| **Merchant Prince** | Porto Novo | Alto capital inicial, acceso premium | Tarifas más altas, objetivo de piratas |
| **Dockhand** | Crosswind Isle | Tripulación más barata, ingeniosa | Menor capital inicial |
| **Bounty Hunter** | Stormwall | Dominio del combate, posición de facción | Precios bajos, desconfianza |

## Inicio rápido

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
npx @mcptoolshop/portlight market
npx @mcptoolshop/portlight buy grain 10
npx @mcptoolshop/portlight routes
npx @mcptoolshop/portlight sail al_manar
npx @mcptoolshop/portlight advance
npx @mcptoolshop/portlight sell grain 10
npx @mcptoolshop/portlight milestones
```

## Sistemas

**Economía** — Precios determinados por la escasez en 20 puertos, 18 productos, 43 rutas. Las penalizaciones por inundaciones castigan la venta a precios bajos. Los modificadores de demanda regionales hacen que cada puerto tenga una identidad clara de importación/exportación.

**Viajes** — Viajes de varios días con clima, encuentros con piratas e inspecciones. Las provisiones se consumen diariamente. El casco sufre daños. Las zonas de peligro estacionales cambian qué rutas son seguras.

**Contratos** — Seis familias, reguladas por la confianza y la reputación. Adquisiciones, alivio de la escasez, productos de lujo discretos, transporte de carga de retorno, rutas fijas y comisiones de facciones. Plazos reales, consecuencias reales.

**Reputación** — Cuatro ejes: reputación regional, confianza comercial, atención de las aduanas y conexiones con el mundo criminal. Diferentes capitanes operan con diferentes sistemas morales.

**Combate** — Combate personal (triángulo de posturas) con 7 armas de cuerpo a cuerpo, 7 armas de largo alcance y estilos de lucha regionales. Combate naval con abordajes y cañones.

**Facciones Piratas** — Crimson Tide, Iron Wolves, Deep Reef Brotherhood, Monsoon Syndicate. Cada una con su territorio, capitanes nombrados y actitud hacia usted.

**Infraestructura** — Almacenes, oficinas de intermediarios, licencias. Mantenimiento real. Cada uno modifica el momento, la escala o el acceso al comercio.

**Finanzas** — Seguros y crédito. Apalancamiento con condiciones.

**Compañeros** — Cinco roles de oficiales con personalidad, moral y desencadenantes de partida.

**Carrera** — 27 hitos. 13 etiquetas de perfil. Cuatro caminos hacia la victoria: Casa de Comercio Legal, Red de la Sombra, Alcance Oceánico, Imperio Comercial.

## Caminos hacia la Victoria

- **Casa de Comercio Legal** — Alta confianza, contratos premium, reputación intachable, amplia infraestructura.
- **Red de la Sombra** — Márgenes de lujo bajo escrutinio, gestión del riesgo, operaciones resilientes.
- **Alcance Oceánico** — Acceso a las Indias Orientales, infraestructura distante, dominio de las rutas.
- **Imperio Comercial** — Infraestructura en todas partes, diversificación de ingresos, apalancamiento financiero.

## Cómo Funciona este Paquete

Este paquete npm descarga el binario precompilado de Portlight para su plataforma desde GitHub Releases y lo almacena localmente. No se requiere instalación de Python.

| Preocupaciones | Detalles |
|---------|--------|
| **Network** | Solo HTTPS a la CDN de `github.com` |
| **Filesystem** | Caché de usuario únicamente (`~/.cache/mcptoolshop/portlight/`) |
| **Verification** | Suma de comprobación SHA256 en cada descarga |
| **Telemetry** | Ninguna |
| **Platforms** | Windows (x64), macOS (x64/arm64), Linux (x64) |

## Seguridad

- Descarga binarios exclusivamente de `github.com` a través de HTTPS.
- Verificación de la suma de comprobación SHA256 en cada descarga.
- Escribe solo en el caché del usuario, nunca toca directorios del sistema.
- Sin telemetría, sin secretos, sin credenciales almacenadas.
- Sin acceso a la red más allá de la descarga inicial del binario.

Consulte [SECURITY.md](SECURITY.md) para obtener la política completa.

## Licencia

MIT

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
