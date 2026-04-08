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

**ThrottleAI è un sistema di controllo per la gestione della concorrenza, dei limiti di velocità e delle risorse, con adattatori per fetch, OpenAI, strumenti, Express e Hono.**

---

## Guida rapida (60 secondi)

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

Questo è tutto. Il sistema di controllo applica la concorrenza, i limiti di velocità e l'equità. Le licenze scadono automaticamente se si dimentica di rilasciarle.

## Perché

Le applicazioni di intelligenza artificiale raggiungono i limiti di velocità, superano i budget e causano picchi di traffico. ThrottleAI si posiziona tra il codice e la chiamata al modello, applicando:

- **Concorrenza** — limita il numero di chiamate simultanee con slot ponderati e una riserva interattiva.
- **Velocità** — richieste/minuto e token/minuto con finestre scorrevoli.
- **Equità** — nessun utente monopolizza le risorse.
- **Licenze** — acquisire prima, rilasciare dopo, scadono automaticamente in caso di timeout.
- **Monitoraggio** — `snapshot()`, `onEvent` e `formatEvent()` per il debug.

Nessuna dipendenza. Node.js 18+. Ottimizzato per l'eliminazione del codice inutilizzato.

## Scegli il tuo limitatore

| Limitatore | Cosa limita | Quando utilizzarlo |
| --------- | ------------- | ------------- |
| **Concurrency** | Chiamate simultanee in corso | Sempre — questa è l'impostazione più importante. |
| **Rate** | Richieste al minuto | Quando l'API esterna ha un limite di velocità documentato. |
| **Token rate** | Token al minuto | Quando si dispone di un budget di token al minuto. |
| **Fairness** | Quota di risorse per utente | Applicazioni multi-tenant in cui un singolo utente non dovrebbe monopolizzare le risorse. |
| **Adaptive** | Limite di concorrenza ottimizzato automaticamente | Quando la latenza dell'API esterna è imprevedibile. |

Inizia con la concorrenza. Aggiungi il limite di velocità solo se necessario. Consulta la [guida alla configurazione](docs/tuning-cheatsheet.md) per indicazioni specifiche per diversi scenari.

## Impostazioni predefinite

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

## Modelli comuni

### Endpoint del server: 429 vs coda

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

### Interfaccia utente interattiva vs attività in background

```ts
// User-facing chat gets priority
gov.acquire({ actorId: "user", action: "chat", priority: "interactive" });

// Background embedding can wait
gov.acquire({ actorId: "pipeline", action: "embed", priority: "background" });
```

Con `interactiveReserve: 2`, le attività in background vengono bloccate quando rimangono solo 2 slot, riservandoli per le richieste interattive.

### Chiamate in streaming

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

Acquisire una volta, rilasciare una volta: la licenza è valida per l'intera durata dello stream.

### Monitoraggio: scopri perché viene applicato il limite

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

## Configurazione

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

Funzione di fabbrica. Restituisce un'istanza di `Governor`.

### `governor.acquire(request): AcquireDecision`

Richiedi una licenza. Restituisce:

```ts
// Granted
{ granted: true, leaseId: string, expiresAt: number }

// Denied
{ granted: false, reason, retryAfterMs, recommendation, limitsHint? }
```

Motivi di rifiuto: `"concorrenza"`, `"velocità"`, `"budget"`, `"policy"`.

### `governor.release(leaseId, report?): void`

Rilascia una licenza. Chiama sempre questa funzione, anche in caso di errori.

### `withLease(governor, request, fn, options?)`

Esegui `fn` sotto una licenza con rilascio automatico.

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

Stato in un determinato momento: concorrenza, velocità, token, ultimo rifiuto.

### `formatEvent(event): string` / `formatSnapshot(snap): string`

Formattatori leggibili in una sola riga.

### Funzioni per ottenere lo stato

```ts
gov.activeLeases         // active lease count
gov.concurrencyActive    // in-flight weight
gov.concurrencyAvailable // remaining capacity
gov.rateCount            // requests in current window
gov.tokenRateCount       // tokens in current window
```

### `governor.dispose(): void`

Interrompi il meccanismo di scadenza delle licenze. Chiama durante l'arresto.

## Adattatori

Wrapper ottimizzati per l'eliminazione del codice inutilizzato — importa solo ciò che utilizzi. Nessuna dipendenza a runtime.

| Adattatore | Importazione | Report automatici |
| --------- | -------- | ------------- |
| **fetch** | `throttleai/adapters/fetch` | Esito (dallo stato HTTP) + latenza |
| **OpenAI** | `throttleai/adapters/openai` | Esito + latenza + utilizzo dei token |
| **Tool** | `throttleai/adapters/tools` | Esito + latenza + peso personalizzato |
| **Express** | `throttleai/adapters/express` | Esito (dallo `res.statusCode`) + latenza |
| **Hono** | `throttleai/adapters/hono` | Esito + latenza |

Tutti gli adattatori restituiscono `{ ok: true, result, latencyMs }` in caso di concessione, e `{ ok: false, decision }` in caso di rifiuto.

### fetch

```ts
import { wrapFetch } from "throttleai/adapters/fetch";
const throttledFetch = wrapFetch(fetch, { governor: gov });
const r = await throttledFetch("https://api.example.com/v1/chat");
if (r.ok) console.log(r.response.status);
```

### Compatibile con OpenAI

```ts
import { wrapChatCompletions } from "throttleai/adapters/openai";
const chat = wrapChatCompletions(openai.chat.completions.create, { governor: gov });
const r = await chat({ model: "gpt-4", messages });
if (r.ok) console.log(r.result.choices[0].message.content);
```

### Chiamata a uno strumento

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

Consultare [`examples/express-adaptive/`](examples/express-adaptive/) per un server completo e funzionante con ottimizzazione adattiva.

### Hono

```ts
import { throttle } from "throttleai/adapters/hono";
app.use("/ai/*", throttle({ governor: gov }));
// 429 JSON on deny, leaseId stored on context
```

## Documentazione

| Documento | Cosa è incluso |
| ---------- | --------------- |
| [Tuning cheatsheet](docs/tuning-cheatsheet.md) | Guida alla configurazione basata su scenari, albero decisionale, riferimento ai parametri. |
| [Troubleshooting](docs/troubleshooting.md) | Problemi comuni: sempre rifiutato, rallentamenti, oscillazione adattiva. |
| [Release manifest](docs/release-manifest.md) | Processo di rilascio e dettagli sugli artefatti. |
| [Repo hygiene](docs/repo-hygiene.md) | Politica delle risorse e log di riscrittura della cronologia. |

## Riferimento rapido per l'ottimizzazione

| Vedete questo | Modificate questo |
|---|---|
| `reason: "concurrency"` | Aumentate `maxInFlight` o diminuite la durata della chiamata. |
| `reason: "rate"` | Aumentate `requestsPerMinute` / `tokensPerMinute`. |
| `reason: "policy"` (equità) | Diminuate `softCapRatio` o aumentate `maxInFlight`. |
| Valore elevato di `retryAfterMs`. | Riducete `leaseTtlMs` in modo che le licenze scadute vengano liberate più rapidamente. |
| Processi in background "affamati" (privati di risorse). | Aumentate `maxInFlight` o riducete `interactiveReserve`. |
| Latenza elevata per le operazioni interattive. | Aumentate `interactiveReserve`. |
| L'ottimizzazione adattiva si riduce troppo rapidamente. | Diminuate `alpha` o aumentate `targetDenyRate`. |

Per una guida più dettagliata, consultare la [guida rapida per l'ottimizzazione](docs/tuning-cheatsheet.md).

## Esempi

Consultare [`examples/`](examples/) per demo funzionanti:

- **[express-adaptive/](examples/express-adaptive/)** — server Express completo con ottimizzazione adattiva + generatore di carico
- **[node-basic.ts](examples/node-basic.ts)** — simulazione di burst con stampa di snapshot
- **[express-middleware.ts](examples/express-middleware.ts)** — endpoint 429 + retry-after
- **[cookbook-adapters.ts](examples/cookbook-adapters.ts)** — tutti e cinque gli adattatori in azione
- **[cookbook-burst-snapshot.ts](examples/cookbook-burst-snapshot.ts)** — carico di burst con snapshot del governor
- **[cookbook-interactive-reserve.ts](examples/cookbook-interactive-reserve.ts)** — priorità tra operazioni interattive e in background
- **[cookbook-express-429.ts](examples/cookbook-express-429.ts)** — 429 vs schema di retry della coda

```bash
npx tsx examples/node-basic.ts
```

## Stabilità

ThrottleAI segue [Semantic Versioning](https://semver.org/). L'API pubblica — tutto ciò che viene esportato da `throttleai` e `throttleai/adapters/*` — è **stabile** a partire dalla versione 1.0.0. Le modifiche che causano interruzioni richiedono un aumento della versione principale.

Per i dettagli su cosa è considerato pubblico rispetto a cosa è interno, consultare [stabilità dell'API](docs/api-stability.md). Per la segnalazione di problemi di sicurezza, consultare [SECURITY.md](.github/SECURITY.md).

## Licenza

MIT
