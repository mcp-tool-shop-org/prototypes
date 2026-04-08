<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/ThrottleAI/main/logo.jpg" alt="ThrottleAI" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ThrottleAI/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ThrottleAI/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/throttleai"><img src="https://img.shields.io/npm/v/throttleai" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/ThrottleAI/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <em>A token-based lease governor for AI calls — small enough to embed anywhere, strict enough to prevent stampedes.</em>
</p>

**ThrottleAI es un controlador sin dependencias para la concurrencia, los límites de velocidad y los presupuestos de tokens, con adaptadores para fetch / OpenAI / herramientas / Express / Hono.**

---

## Guía de inicio rápido en 60 segundos

```bash
pnpm add throttleai
```

```ts
import { createGovernor, withLease, presets } from "throttleai";

const gov = createGovernor(presets.balanced());

const result = await withLease(
  gov,
  { actorId: "user-1", action: "chat" },
  async () => await callMyModel(),
);

if (result.granted) {
  console.log(result.result);
} else {
  console.log("Throttled:", result.decision.recommendation);
}
```

Eso es todo. El controlador aplica la concurrencia, los límites de velocidad y la equidad. Las concesiones caducan automáticamente si olvidas liberarlas.

## ¿Por qué?

Las aplicaciones de IA alcanzan los límites de velocidad, exceden los presupuestos y causan sobrecargas. ThrottleAI se encuentra entre tu código y la llamada al modelo, aplicando:

- **Concurrencia:** Limita el número de llamadas simultáneas con espacios asignados y una reserva interactiva.
- **Velocidad:** Solicitudes/minuto y tokens/minuto con ventanas deslizantes.
- **Equidad:** Ningún componente monopoliza la capacidad.
- **Concesiones:** Se obtienen antes, se liberan después y caducan automáticamente en caso de tiempo de espera.
- **Observabilidad:** `snapshot()`, `onEvent` y `formatEvent` para la depuración.

Sin dependencias. Node.js 18+. Se puede eliminar código no utilizado.

## Elige tu limitador

| Limitador. | ¿Qué limita? | ¿Cuándo usarlo? |
| --------- | ------------- | ------------- |
| **Concurrency** | Llamadas simultáneas en curso. | Siempre: este es el parámetro más importante. |
| **Rate** | Solicitudes por minuto. | Cuando la API de origen tiene un límite de velocidad documentado. |
| **Token rate** | Tokens por minuto. | Cuando tienes un presupuesto de tokens por minuto. |
| **Fairness** | Porcentaje de la capacidad asignado a cada componente. | Aplicaciones multi-inquilino donde un usuario no debe consumir todos los recursos. |
| **Adaptive** | Límite de concurrencia ajustado automáticamente. | Cuando la latencia de la API de origen es impredecible. |

Comienza con la concurrencia. Agrega el límite de velocidad solo si es necesario. Consulta la [guía de ajuste](docs/tuning-cheatsheet.md) para obtener recomendaciones basadas en escenarios.

## Configuraciones predefinidas

```ts
import { presets } from "throttleai";

// Single user, CLI tools — 1 call at a time, 10 req/min
createGovernor(presets.quiet());

// SaaS backend — 5 concurrent (2 interactive reserve), 60 req/min, fairness
createGovernor(presets.balanced());

// Batch processing — 20 concurrent, 300 req/min, fairness + adaptive tuning
createGovernor(presets.aggressive());

// Override any field
createGovernor({ ...presets.balanced(), leaseTtlMs: 30_000 });
```

## Patrones comunes

### Punto final del servidor: 429 vs cola

```ts
// Option A: immediate deny with 429
const result = await withLease(gov, request, fn);
// result.granted === false → respond with 429

// Option B: wait with bounded retries
const result = await withLease(gov, request, fn, {
  strategy: "wait-then-deny",
  maxAttempts: 3,
  maxWaitMs: 5_000,
});
```

### Interfaz de usuario interactiva vs tareas en segundo plano

```ts
// User-facing chat gets priority
gov.acquire({ actorId: "user", action: "chat", priority: "interactive" });

// Background embedding can wait
gov.acquire({ actorId: "pipeline", action: "embed", priority: "background" });
```

Con `interactiveReserve: 2`, las tareas en segundo plano se bloquean cuando solo quedan 2 espacios, reservándolos para las solicitudes interactivas.

### Llamadas de transmisión

```ts
const decision = gov.acquire({ actorId: "user", action: "stream" });
if (!decision.granted) return;

try {
  const stream = await openai.chat.completions.create({ stream: true, ... });
  for await (const chunk of stream) {
    // process chunk
  }
  gov.release(decision.leaseId, { outcome: "success" });
} catch (err) {
  gov.release(decision.leaseId, { outcome: "error" });
  throw err;
}
```

Obtén una concesión una vez, libérala una vez: la concesión se mantiene durante toda la duración de la transmisión.

### Observabilidad: descubre por qué se está limitando

```ts
import { createGovernor, formatEvent, formatSnapshot } from "throttleai";

const gov = createGovernor({
  ...presets.balanced(),
  onEvent: (e) => console.log(formatEvent(e)),
  // [deny] actor=user-1 action=chat reason=concurrency retryAfterMs=500 — All 5 slots in use...
});

// Point-in-time view
console.log(formatSnapshot(gov.snapshot()));
// concurrency=3/5 rate=12/60 leases=3
```

## Configuración

```ts
createGovernor({
  // Concurrency (optional)
  concurrency: {
    maxInFlight: 5,          // max simultaneous weight
    interactiveReserve: 1,   // slots reserved for interactive priority
  },

  // Rate limiting (optional)
  rate: {
    requestsPerMinute: 60,   // request-rate cap
    tokensPerMinute: 100_000, // token-rate cap
    windowMs: 60_000,         // rolling window (default 60s)
  },

  // Advanced (optional)
  fairness: true,             // prevent actor monopolization
  adaptive: true,             // auto-tune concurrency from deny rate + latency
  strict: true,               // throw on double release / unknown ID (dev mode)

  // Lease settings
  leaseTtlMs: 60_000,         // auto-expire (default 60s)
  reaperIntervalMs: 5_000,    // sweep interval (default 5s)

  // Observability
  onEvent: (e) => { /* acquire, deny, release, expire, warn */ },
});
```

## API

### `createGovernor(config): Governor`

Función de fábrica. Devuelve una instancia de `Governor`.

### `governor.acquire(request): AcquireDecision`

Solicita una concesión. Devuelve:

```ts
// Granted
{ granted: true, leaseId: string, expiresAt: number }

// Denied
{ granted: false, reason, retryAfterMs, recommendation, limitsHint? }
```

Razones de denegación: `"concurrencia"`, `"velocidad"`, `"presupuesto"`, `"política"`.

### `governor.release(leaseId, report?): void`

Libera una concesión. Llama a esto siempre, incluso en caso de errores.

### `withLease(governor, request, fn, options?)`

Ejecuta `fn` bajo una concesión con liberación automática.

```ts
withLease(gov, request, fn, {
  strategy: "deny",           // default — fail immediately
  strategy: "wait",           // retry with backoff until maxWaitMs
  strategy: "wait-then-deny", // retry up to maxAttempts
  maxWaitMs: 10_000,          // max total wait (default 10s)
  maxAttempts: 3,             // for "wait-then-deny" (default 3)
  initialBackoffMs: 250,      // starting backoff (default 250ms)
});
```

### `governor.snapshot(): GovernorSnapshot`

Estado en un momento dado: concurrencia, velocidad, tokens, último denegación.

### `formatEvent(event): string` / `formatSnapshot(snap): string`

Formatos de una sola línea y fáciles de leer.

### Métodos para obtener el estado

```ts
gov.activeLeases         // active lease count
gov.concurrencyActive    // in-flight weight
gov.concurrencyAvailable // remaining capacity
gov.rateCount            // requests in current window
gov.tokenRateCount       // tokens in current window
```

### `governor.dispose(): void`

Detiene el recolector de TTL. Llama al apagar el sistema.

## Adaptadores

Wrappers que se pueden eliminar código no utilizado. Importa solo lo que necesitas. Sin dependencias en tiempo de ejecución.

| Adaptador. | Importación. | Informes automáticos. |
| --------- | -------- | ------------- |
| **fetch** | `throttleai/adapters/fetch` | Resultado (a partir del código de estado HTTP) + latencia. |
| **OpenAI** | `throttleai/adapters/openai` | Resultado + latencia + uso de tokens. |
| **Tool** | `throttleai/adapters/tools` | Resultado + latencia + peso personalizado. |
| **Express** | `throttleai/adapters/express` | Resultado (a partir de `res.statusCode`) + latencia. |
| **Hono** | `throttleai/adapters/hono` | Resultado + latencia. |

Todos los adaptadores devuelven `{ ok: true, result, latencyMs }` cuando se concede el acceso, y `{ ok: false, decision }` cuando se deniega.

### obtener

```ts
import { wrapFetch } from "throttleai/adapters/fetch";
const throttledFetch = wrapFetch(fetch, { governor: gov });
const r = await throttledFetch("https://api.example.com/v1/chat");
if (r.ok) console.log(r.response.status);
```

### Compatible con OpenAI

```ts
import { wrapChatCompletions } from "throttleai/adapters/openai";
const chat = wrapChatCompletions(openai.chat.completions.create, { governor: gov });
const r = await chat({ model: "gpt-4", messages });
if (r.ok) console.log(r.result.choices[0].message.content);
```

### Llamada a la herramienta

```ts
import { wrapTool } from "throttleai/adapters/tools";
const embed = wrapTool(myEmbedFn, { governor: gov, toolId: "embed", costWeight: 2 });
const r = await embed("hello");
if (r.ok) console.log(r.result);
```

### Express

```ts
import { throttleMiddleware } from "throttleai/adapters/express";
app.use("/ai", throttleMiddleware({ governor: gov }));
// 429 + Retry-After header + JSON body on deny
```

Consulte [`examples/express-adaptive/`](examples/express-adaptive/) para obtener un servidor completo y funcional con ajuste adaptativo.

### Hono

```ts
import { throttle } from "throttleai/adapters/hono";
app.use("/ai/*", throttle({ governor: gov }));
// 429 JSON on deny, leaseId stored on context
```

## Documentación

| Documento | Qué cubre |
| ---------- | --------------- |
| [Tuning cheatsheet](docs/tuning-cheatsheet.md) | Guía de configuración basada en escenarios, árbol de decisiones, referencia de parámetros. |
| [Troubleshooting](docs/troubleshooting.md) | Problemas comunes: siempre denegado, bloqueos, oscilación adaptativa. |
| [Release manifest](docs/release-manifest.md) | Proceso de lanzamiento y detalles de los artefactos. |
| [Repo hygiene](docs/repo-hygiene.md) | Política de recursos y registro de reescritura del historial. |

## Referencia rápida de ajuste

| Verá esto | Ajuste esto |
|---|---|
| `reason: "concurrency"` | Aumente `maxInFlight` o disminuya la duración de la llamada. |
| `reason: "rate"` | Aumente `requestsPerMinute` / `tokensPerMinute`. |
| `reason: "policy"` (equidad) | Disminuya `softCapRatio` o aumente `maxInFlight`. |
| Alto `retryAfterMs`. | Reduzca `leaseTtlMs` para que los permisos expirados se liberen más rápidamente. |
| Tareas en segundo plano con falta de recursos. | Aumente `maxInFlight` o reduzca `interactiveReserve`. |
| Alta latencia interactiva. | Aumente `interactiveReserve`. |
| El ajuste adaptativo se reduce demasiado rápido. | Disminuya `alpha` o aumente `targetDenyRate`. |

Para obtener más información, consulte la [guía rápida de ajuste](docs/tuning-cheatsheet.md).

## Ejemplos

Consulte [`examples/`](examples/) para obtener demostraciones funcionales:

- **[express-adaptive/](examples/express-adaptive/)** — servidor Express completo con ajuste adaptativo + generador de carga.
- **[node-basic.ts](examples/node-basic.ts)** — simulación de ráfaga con impresión de instantáneas.
- **[express-middleware.ts](examples/express-middleware.ts)** — punto final 429 + retry-after.
- **[cookbook-adapters.ts](examples/cookbook-adapters.ts)** — todos los cinco adaptadores en acción.
- **[cookbook-burst-snapshot.ts](examples/cookbook-burst-snapshot.ts)** — carga de ráfaga con instantáneas del gobernador.
- **[cookbook-interactive-reserve.ts](examples/cookbook-interactive-reserve.ts)** — prioridad interactiva frente a la de segundo plano.
- **[cookbook-express-429.ts](examples/cookbook-express-429.ts)** — 429 frente al patrón de reintento de la cola.

```bash
npx tsx examples/node-basic.ts
```

## Estabilidad

ThrottleAI sigue [Semantic Versioning](https://semver.org/). La API pública (todo lo exportado de `throttleai` y `throttleai/adapters/*`) es **estable** a partir de la versión 1.0.0. Los cambios que rompen la compatibilidad requieren un aumento de la versión principal.

Para obtener detalles sobre lo que se considera público frente a interno, consulte [estabilidad de la API](docs/api-stability.md). Para informar de problemas de seguridad, consulte [SECURITY.md](.github/SECURITY.md).

## Licencia

MIT
