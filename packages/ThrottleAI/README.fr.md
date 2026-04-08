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

**ThrottleAI est un régulateur sans dépendances pour la gestion de la concurrence, des limites de débit et des budgets de jetons, avec des adaptateurs pour fetch / OpenAI / tools / Express / Hono.**

---

## Démarrage rapide en 60 secondes

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

C'est tout. Le régulateur applique la gestion de la concurrence, les limites de débit et l'équité. Les licences expirent automatiquement si vous oubliez de les libérer.

## Pourquoi ?

Les applications d'IA atteignent les limites de débit, dépassent les budgets et créent des engorgements. ThrottleAI se situe entre votre code et l'appel au modèle, et applique les règles suivantes :

- **Concurrence** : limite le nombre d'appels simultanés avec des emplacements pondérés et une réserve interactive.
- **Débit** : nombre de requêtes/minute et de jetons/minute avec des fenêtres glissantes.
- **Équité** : aucun acteur ne monopolise la capacité.
- **Licences** : acquérir avant, libérer après, expiration automatique en cas de délai d'attente.
- **Observabilité** : `snapshot()`, `onEvent` et `formatEvent()` pour le débogage.

Sans dépendances. Node.js 18+. Peut être utilisé par arbres de dépendances.

## Choisissez votre limiteur

| Limiteur | Ce qu'il limite | Quand l'utiliser |
| --------- | ------------- | ------------- |
| **Concurrency** | Nombre d'appels simultanés en cours | Toujours – c'est le paramètre le plus important. |
| **Rate** | Requêtes par minute | Lorsque l'API distante a une limite de débit documentée. |
| **Token rate** | Jetons par minute | Lorsque vous avez un budget de jetons par minute. |
| **Fairness** | Part de la capacité allouée à chaque acteur. | Applications multi-locataires où un utilisateur ne doit pas monopoliser les ressources. |
| **Adaptive** | Limite de concurrence ajustée automatiquement. | Lorsque la latence de l'API distante est imprévisible. |

Commencez par la concurrence. Ajoutez une limite de débit uniquement si nécessaire. Consultez la [fiche de réglage](docs/tuning-cheatsheet.md) pour obtenir des conseils basés sur des scénarios.

## Préconfigurations

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

## Motifs courants

### Point de terminaison de serveur : 429 vs file d'attente

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

### Interface utilisateur interactive vs tâches en arrière-plan

```ts
// User-facing chat gets priority
gov.acquire({ actorId: "user", action: "chat", priority: "interactive" });

// Background embedding can wait
gov.acquire({ actorId: "pipeline", action: "embed", priority: "background" });
```

Avec `interactiveReserve: 2`, les tâches en arrière-plan sont bloquées lorsque seulement 2 emplacements restent, ce qui réserve ces emplacements pour les requêtes interactives.

### Appels en streaming

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

Acquérir une fois, libérer une fois – la licence est valide pendant toute la durée du flux.

### Observabilité : voir pourquoi il limite

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

## Configuration

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

Fonction de création. Renvoie une instance de `Governor`.

### `governor.acquire(request): AcquireDecision`

Demande une licence. Renvoie :

```ts
// Granted
{ granted: true, leaseId: string, expiresAt: number }

// Denied
{ granted: false, reason, retryAfterMs, recommendation, limitsHint? }
```

Raisons du refus : `"concurrence"`, `"débit"`, `"budget"`, `"politique"`.

### `governor.release(leaseId, report?): void`

Libère une licence. Appelez toujours cette fonction, même en cas d'erreur.

### `withLease(governor, request, fn, options?)`

Exécute `fn` sous une licence avec libération automatique.

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

État à un instant donné : concurrence, débit, jetons, dernier refus.

### `formatEvent(event): string` / `formatSnapshot(snap): string`

Formatteurs lisibles par l'homme en une seule ligne.

### Fonctions de statut

```ts
gov.activeLeases         // active lease count
gov.concurrencyActive    // in-flight weight
gov.concurrencyAvailable // remaining capacity
gov.rateCount            // requests in current window
gov.tokenRateCount       // tokens in current window
```

### `governor.dispose(): void`

Arrête le processus de suppression des licences expirées. À appeler lors de l'arrêt.

## Adaptateurs

Enveloppements utilisables par arbres de dépendances – importez uniquement ce dont vous avez besoin. Aucune dépendance d'exécution.

| Adaptateur | Importation | Rapports automatiques |
| --------- | -------- | ------------- |
| **fetch** | `throttleai/adapters/fetch` | Résultat (à partir du code de statut HTTP) + latence |
| **OpenAI** | `throttleai/adapters/openai` | Résultat + latence + utilisation des jetons |
| **Tool** | `throttleai/adapters/tools` | Résultat + latence + poids personnalisé |
| **Express** | `throttleai/adapters/express` | Résultat (à partir de `res.statusCode`) + latence |
| **Hono** | `throttleai/adapters/hono` | Résultat + latence |

Tous les adaptateurs renvoient `{ ok: true, result, latencyMs }` en cas d'autorisation, et `{ ok: false, decision }` en cas de refus.

### Récupérer

```ts
import { wrapFetch } from "throttleai/adapters/fetch";
const throttledFetch = wrapFetch(fetch, { governor: gov });
const r = await throttledFetch("https://api.example.com/v1/chat");
if (r.ok) console.log(r.response.status);
```

### Compatible avec OpenAI

```ts
import { wrapChatCompletions } from "throttleai/adapters/openai";
const chat = wrapChatCompletions(openai.chat.completions.create, { governor: gov });
const r = await chat({ model: "gpt-4", messages });
if (r.ok) console.log(r.result.choices[0].message.content);
```

### Appel de fonction

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

Consultez [`examples/express-adaptive/`](examples/express-adaptive/) pour un serveur complet et fonctionnel avec réglage adaptatif.

### Hono

```ts
import { throttle } from "throttleai/adapters/hono";
app.use("/ai/*", throttle({ governor: gov }));
// 429 JSON on deny, leaseId stored on context
```

## Documentation

| Document | Ce que cela couvre |
| ---------- | --------------- |
| [Tuning cheatsheet](docs/tuning-cheatsheet.md) | Guide de configuration basé sur des scénarios, arbre de décision, référence des paramètres. |
| [Troubleshooting](docs/troubleshooting.md) | Problèmes courants : refus systématiques, blocages, oscillations adaptatives. |
| [Release manifest](docs/release-manifest.md) | Processus de publication et détails des artefacts. |
| [Repo hygiene](docs/repo-hygiene.md) | Politique des ressources et journal de réécriture de l'historique. |

## Guide rapide de réglage

| Vous voyez ceci | Ajustez ceci |
|---|---|
| `reason: "concurrency"` | Augmentez `maxInFlight` ou diminuez la durée de l'appel. |
| `reason: "rate"` | Augmentez `requestsPerMinute` / `tokensPerMinute`. |
| `reason: "policy"` (équité) | Diminuez `softCapRatio` ou augmentez `maxInFlight`. |
| `retryAfterMs` élevé. | Réduisez `leaseTtlMs` pour que les locations expirées soient libérées plus rapidement. |
| Tâches en arrière-plan privées de ressources. | Augmentez `maxInFlight` ou réduisez `interactiveReserve`. |
| Latence interactive élevée. | Augmentez `interactiveReserve`. |
| Réglage adaptatif trop rapide. | Diminuez `alpha` ou augmentez `targetDenyRate`. |

Pour obtenir des conseils plus approfondis, consultez la [fiche de triche de réglage](docs/tuning-cheatsheet.md).

## Exemples

Consultez [`examples/`](examples/) pour des démonstrations fonctionnelles :

- **[express-adaptive/](examples/express-adaptive/)** — serveur Express complet avec réglage adaptatif + générateur de charge.
- **[node-basic.ts](examples/node-basic.ts)** — simulation de pics avec affichage des instantanés.
- **[express-middleware.ts](examples/express-middleware.ts)** — point de terminaison 429 + retry-after.
- **[cookbook-adapters.ts](examples/cookbook-adapters.ts)** — tous les cinq adaptateurs en action.
- **[cookbook-burst-snapshot.ts](examples/cookbook-burst-snapshot.ts)** — charge de pics avec instantanés du régulateur.
- **[cookbook-interactive-reserve.ts](examples/cookbook-interactive-reserve.ts)** — priorité interactive par rapport aux tâches en arrière-plan.
- **[cookbook-express-429.ts](examples/cookbook-express-429.ts)** — 429 par rapport au modèle de nouvelle tentative de file d'attente.

```bash
npx tsx examples/node-basic.ts
```

## Stabilité

ThrottleAI suit la [version sémantique](https://semver.org/). L'API publique — tout ce qui est exporté de `throttleai` et `throttleai/adapters/*` — est **stable** à partir de la version 1.0.0. Les modifications incompatibles nécessitent une augmentation de la version majeure.

Pour plus de détails sur ce qui est considéré comme public par rapport à ce qui est interne, consultez [stabilité de l'API](docs/api-stability.md). Pour les signalements de sécurité, consultez [SECURITY.md](.github/SECURITY.md).

## Licence

MIT
