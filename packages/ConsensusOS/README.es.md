<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ConsensusOS/readme.png" width="400" alt="ConsensusOS">
</p>

# ConsensusOS

> Parte de [MCP Tool Shop](https://mcptoolshop.com)

**Plata de control modular y sin dependencias para la gobernanza de consenso en múltiples cadenas de bloques.**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ConsensusOS/actions"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/ConsensusOS/npm.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/ConsensusOS?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/ConsensusOS/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/consensus-os"><img src="https://img.shields.io/npm/v/@mcptoolshop/consensus-os?style=flat-square&color=cb3837" alt="npm version"></a>
  <img src="https://img.shields.io/badge/dependencies-0-blue?style=flat-square" alt="Dependencies: 0">
</p>

---

## ¿Por qué ConsensusOS?

Gestionar una infraestructura de múltiples cadenas de bloques implica confiar en nodos que no controlas completamente, implementar versiones que no deben divergir y gestionar cambios de configuración en redes que nunca se detienen. La mayoría de los equipos resuelven esto con scripts improvisados y esperando lo mejor.

ConsensusOS reemplaza esa esperanza con una **plata de control basada en plugins**, donde cada módulo se comunica a través de un bus de eventos compartido, cada transición de estado está protegida por invariantes de "falla segura" y todo el historial del sistema se puede reproducir de forma determinista.

- **Cero dependencias en producción** — nada en tu cadena de suministro que no hayas creado tú mismo.
- **API de plugin v1 congelada** — un contrato estable que no romperá tus integraciones.
- **Invariantes de "falla segura"** — las transiciones inválidas siempre se rechazan, nunca se aplican parcialmente.
- **Reproducción determinista** — reproduce cualquier estado del sistema a partir del historial de eventos.
- **Ejecución con límites de recursos** — límites de CPU, memoria y tiempo impuestos mediante tokens.
- **Adaptadores para múltiples cadenas** — XRPL, Ethereum y Cosmos de forma nativa.

---

## Instalación

```bash
npm install @mcptoolshop/consensus-os
```

Requiere **Node.js 18+**. Cero dependencias en tiempo de ejecución.

---

## Primeros pasos

### Uso programático

```ts
import {
  CoreLoader,
  createHealthSentinel,
  createReleaseVerifier,
  createConfigGuardian,
  createXrplAdapter,
} from "@mcptoolshop/consensus-os";

// Create the loader (orchestrates plugin lifecycle)
const loader = new CoreLoader({
  configs: {
    "health-sentinel": { intervalMs: 10_000 },
  },
});

// Register plugins
loader.register(createHealthSentinel());
loader.register(createReleaseVerifier());
loader.register(createConfigGuardian());
loader.register(createXrplAdapter());

// Boot resolves dependencies, inits, and starts all plugins
await loader.boot();

// Subscribe to events
loader.events.subscribe("health.*", (event) => {
  console.log(`[${event.topic}] from ${event.source}:`, event.data);
});

// Check invariants before a state transition
const verdict = await loader.invariants.check({ action: "deploy" });
console.log("Transition allowed:", verdict.allowed);

// Graceful shutdown (reverse boot order)
await loader.shutdown();
```

### Crear un plugin personalizado

```ts
import { BasePlugin, ManifestBuilder } from "@mcptoolshop/consensus-os/plugin";

class MyMonitor extends BasePlugin {
  readonly manifest = ManifestBuilder.create("my-monitor")
    .name("My Monitor")
    .version("1.0.0")
    .capability("sentinel")
    .build();

  protected async onStart() {
    this.on("health.check.completed", (event) => {
      this.log.info("Health check result", event.data as Record<string, unknown>);
    });
    this.emit("my-monitor.ready", { status: "online" });
  }
}
```

### Interfaz de línea de comandos (CLI)

```bash
npx consensusos doctor     # Run health checks
npx consensusos verify     # Verify release artifact integrity
npx consensusos config     # Config validation / diff / migration
npx consensusos status     # System status overview
npx consensusos plugins    # List loaded plugins
npx consensusos adapters   # List and query chain adapters
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│                   CLI (entry)                   │
├─────────────────────────────────────────────────┤
│              Plugin SDK / Attestation           │
├──────────┬──────────┬──────────┬────────────────┤
│  Health  │ Verifier │  Config  │    Sandbox     │
│ Sentinel │ (Release)│ Guardian │ (Replay/Amend) │
├──────────┴──────────┴──────────┼────────────────┤
│           Governor Layer       │   Adapters     │
│  (Token · Policy · Queue)     │ (XRPL/ETH/ATOM)│
├────────────────────────────────┴────────────────┤
│                 Core Layer                      │
│    EventBus · InvariantEngine · Loader · Logger │
├─────────────────────────────────────────────────┤
│              Plugin API v1 (frozen)             │
└─────────────────────────────────────────────────┘
```

Consulta [ARCHITECTURE.md](ARCHITECTURE.md) para la especificación completa.

---

## API

### Núcleo

| Exportación | Descripción |
| -------- | ------------- |
| `CoreLoader` | Orquestador del ciclo de vida de los plugins — registro, inicio, apagado. |
| `CoreEventBus` | Bus de eventos ordenado, tipado y reproducible con suscripciones de comodín. |
| `CoreInvariantEngine` | Motor de invariantes de "falla segura" con registro de solo escritura. |
| `createLogger(scope)` | Registro estructurado específico para un módulo. |

### Módulos

| Fábrica | Propósito |
| --------- | --------- |
| `createHealthSentinel()` | Monitoreo de la salud de los nodos mediante señales de vida. |
| `createReleaseVerifier()` | Verificación del hash de las versiones de software. |
| `createConfigGuardian()` | Validación y migración del esquema de configuración. |
| `createSandboxPlugin()` | Motor de simulación, reproducción y corrección aislado. |
| `createGovernorPlugin()` | Ejecución basada en tokens, aplicación de políticas, cola de compilación. |

### Adaptadores

| Fábrica | Chain | Estado |
| --------- | ------- | -------- |
| `createXrplAdapter()` | XRPL | Implementado |
| `createEthereumAdapter()` | Ethereum | Implementado |
| `createCosmosAdapter()` | Cosmos | Implementado |

### SDK para plugins

| Exportación | Descripción |
| -------- | ------------- |
| `BasePlugin` | Clase base abstracta con valores predeterminados del ciclo de vida y métodos de conveniencia. |
| `ManifestBuilder` | Constructor fluido para manifiestos de plugins con seguridad de tipos. |
| `validatePlugin()` | Validación previa al registro con errores y advertencias. |
| `AttestationPipeline` | Atestación de versiones y procedencia de la compilación. |

### Exportaciones de subdirectorios

```ts
import { ... } from "@mcptoolshop/consensus-os";          // Full API
import { ... } from "@mcptoolshop/consensus-os/plugin";   // Plugin SDK + types
import { ... } from "@mcptoolshop/consensus-os/cli";      // CLI dispatch
```

---

## Pruebas

```bash
npm test         # Full suite (295 tests)
npx vitest       # Watch mode
```

Categorías de pruebas:
- **Arquitectura** (16 pruebas) — aplicación de invariantes estructurales.
- **Seguridad** (27 pruebas) — resistencia a abusos y determinismo.
- **Carga** (22 pruebas) — casos límite y rendimiento.
- **Unitarias** (230 pruebas) — cobertura a nivel de componente.

---

## Documentación

| Documento | Propósito |
| ---------- | --------- |
| [QUICKSTART.md](QUICKSTART.md) | Poner en marcha en 3 minutos |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Especificación de arquitectura v1.0 congelada |
| [PLUGIN_GUIDE.md](PLUGIN_GUIDE.md) | Cómo escribir un plugin |
| [ADAPTER_GUIDE.md](ADAPTER_GUIDE.md) | Cómo crear un adaptador de cadena |
| [SANDBOX_GUIDE.md](SANDBOX_GUIDE.md) | Simulación, reproducción y revisión de modificaciones. |
| [GOVERNOR_GUIDE.md](GOVERNOR_GUIDE.md) | Ejecución de tokens, políticas y cola de compilación. |
| [SECURITY.md](SECURITY.md) | Política de seguridad e informes de vulnerabilidades. |
| [THREAT_MODEL.md](THREAT_MODEL.md) | Análisis de amenazas STRIDE. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Flujo de trabajo de desarrollo y lista de verificación de solicitudes de extracción (PR). |
| [BUILD.md](BUILD.md) | Compilación y verificación reproducibles. |

---

## Soporte

- **Preguntas / ayuda:** [Discusiones](https://github.com/mcp-tool-shop-org/ConsensusOS/discussions)
- **Informes de errores:** [Problemas](https://github.com/mcp-tool-shop-org/ConsensusOS/issues)

---

## Licencia

[MIT](LICENSE)
