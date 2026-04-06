<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" alt="receipt-factory">
</p>

<p align="center">
  Receipts are how we prove work happened — without trusting vibes.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/receipt-factory/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

Un recibo es un registro firmado, con fecha y hora, y reproducible de **lo que ocurrió**:

- **Qué se hizo** — acciones, entradas, salidas
- **Por qué se hizo** — intención, política, contexto
- **Quién/qué lo hizo** — actor, ejecutor, versiones de herramientas
- **Prueba de que ocurrió** — hashes, enlaces, sumas de comprobación, registros
- **Cómo verificarlo** — comandos, instrucciones para volver a ejecutar

Puede leer un recibo en 30 segundos y verificarlo en 2 minutos. Todo es reproducible. Si no lo es, no es un recibo.

## Paquetes

| Paquete | Descripción |
|---------|-------------|
| [`@receipt-factory/core`](packages/core) | Esquema de recibo, normalización, hashing SHA-256, API de constructor fluido |
| [`@receipt-factory/render`](packages/render) | Renderizadores Markdown + HTML independientes |
| [`@receipt-factory/verify`](packages/verify) | Validación de esquema, integridad de hash, verificación de enlaces, aplicación de políticas |
| [`@receipt-factory/sign`](packages/sign) | Firma basada en Cosign — recibos, políticas, paquetes (complementos separados) |
| [`@receipt-factory/evidence`](packages/evidence) | Paquetes de evidencia — paquetes de evidencia portátiles y direccionados por contenido |
| [`@receipt-factory/index`](packages/index) | Índice de recibos — escanear, buscar y filtrar directorios de recibos |
| [`@receipt-factory/policy`](packages/policy) | Paquetes de políticas — configuración de lint portátiles y con versiones |
| [`@receipt-factory/bundle`](packages/bundle) | Paquetes de recibos — cápsulas de verdad auto-verificables (zip) |
| [`@receipt-factory/adapter-github`](packages/adapters/github) | Obtención de datos de GitHub Actions a través de la CLI `gh` |
| [`@receipt-factory/cli`](apps/factory-cli) | El comando `rf` — crear, recopilar, renderizar, verificar y firmar recibos |

## Canales

| Canal | Tipo de recibo | Lo que demuestra |
|----------|-------------|----------------|
| [`ci-receipts`](pipelines/ci-receipts) | `ci_run` | Se realizó una compilación/prueba de CI con entradas y resultados específicos |
| [`release-receipts`](pipelines/release-receipts) | `release` | Se publicó una versión con activos y commits específicos |
| [`registry-sync`](pipelines/registry-sync) | `registry_sync` | Lo que se publica frente a lo que está en el repositorio — clasificación de desviación |
| [`security-audit`](pipelines/security-audit) | `audit` | Qué se escaneó, con qué herramienta, qué vulnerabilidades se encontraron |
| [`sbom`](pipelines/sbom) | `sbom` | Se generó y verificó la lista de materiales de software |

## Cómo empezar

```bash
# Install the CLI
npm install -g @receipt-factory/cli

# Create a receipt from a GitHub Actions run
rf make ci --from github --run 12345678

# Render it
rf render receipts/ci/2026-03-03/12345678.json --format html

# Verify it
rf verify receipts/ci/2026-03-03/12345678.json

# Verify with strict lint + policy
rf verify receipts/ci/2026-03-03/12345678.json --strict --policy policy.json

# Bundle receipts into a portable capsule
rf bundle create receipts/ci/2026-03-03/12345678.json --follow --policy policy.json

# Sign the bundle
rf bundle sign bundles/abc123.bundle.zip --keyless
```

## Capas de confianza

receipt-factory proporciona cuatro capas de confianza apilables:

1. **Integridad del recibo** — recibos direccionados por contenido SHA-256 (detectan manipulaciones)
2. **Integridad de la gobernanza** — reglas de lint basadas en políticas con archivos de políticas firmados
3. **Integridad del paquete** — paquetes zip auto-verificables con manifiestos de hash
4. **Autoridad del paquete** — firmas Cosign separadas en los paquetes (a prueba de manipulaciones)

Orden de verificación: firma → integridad del archivo → integridad semántica → gobernanza.

## Lo que esto demuestra

- Se realizó una compilación, prueba, publicación, auditoría o generación de SBOM en un momento específico
- Las entradas y salidas están direccionadas por contenido y detectan manipulaciones
- Puede volver a verificar el recibo en cualquier momento con `rf verify`
- La cadena completa de procedencia se puede rastrear con `rf graph`

## Lo que esto NO demuestra

- Que el código subyacente es correcto (los recibos demuestran el proceso, no la calidad)
- Que el entorno de CI en sí mismo no se ha visto comprometido (ese es un problema de la cadena de suministro)
- Que los artefactos no se han modificado después de la creación del recibo (use la firma para eso)

## Seguridad

Consulte [SECURITY.md](SECURITY.md) para obtener información sobre el modelo de amenazas y la notificación de problemas.

**Sin telemetría.** receipt-factory nunca envía datos, rastrea el uso o recopila análisis.

## Licencia

MIT

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
