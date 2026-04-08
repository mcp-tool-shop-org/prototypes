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

**ThrottleAI é um controlador sem dependências para gerenciamento de concorrência, limites de taxa e orçamentos de tokens, com adaptadores para fetch / OpenAI / ferramentas / Express / Hono.**

---

## Início rápido em 60 segundos

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

Isso é tudo. O controlador impõe a concorrência, os limites de taxa e a justiça. As licenças expiram automaticamente se você esquecer de liberá-las.

## Por que usar?

As aplicações de IA atingem limites de taxa, excedem orçamentos e causam sobrecarga. O ThrottleAI fica entre seu código e a chamada do modelo, aplicando:

- **Concorrência** — limita o número de chamadas simultâneas com slots ponderados e reserva interativa.
- **Taxa** — solicitações/minuto e tokens/minuto com janelas deslizantes.
- **Justiça** — nenhum ator monopoliza a capacidade.
- **Licenças** — adquirir antes, liberar depois, expiração automática em caso de timeout.
- **Observabilidade** — `snapshot()`, `onEvent` e `formatEvent()` para depuração.

Sem dependências. Node.js 18+. Pode ser usado em árvores de dependência.

## Escolha seu limitador

| Limitador | O que ele limita | Quando usar |
| --------- | ------------- | ------------- |
| **Concurrency** | Chamadas simultâneas em andamento | Sempre — este é o parâmetro mais importante. |
| **Rate** | Solicitações por minuto | Quando a API de destino tem um limite de taxa documentado. |
| **Token rate** | Tokens por minuto | Quando você tem um orçamento de tokens por minuto. |
| **Fairness** | Participação de cada ator na capacidade total. | Aplicações multi-tenant onde um único usuário não deve consumir todos os recursos. |
| **Adaptive** | Limite de concorrência ajustado automaticamente. | Quando a latência da API de destino é imprevisível. |

Comece com a concorrência. Adicione o limite de taxa apenas se necessário. Consulte a [guia de ajuste](docs/tuning-cheatsheet.md) para obter orientações baseadas em cenários.

## Configurações predefinidas

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

## Padrões comuns

### Ponto final do servidor: 429 vs fila

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

### Interface do usuário interativa vs tarefas em segundo plano

```ts
// User-facing chat gets priority
gov.acquire({ actorId: "user", action: "chat", priority: "interactive" });

// Background embedding can wait
gov.acquire({ actorId: "pipeline", action: "embed", priority: "background" });
```

Com `interactiveReserve: 2`, as tarefas em segundo plano são bloqueadas quando restam apenas 2 slots, reservando-os para solicitações interativas.

### Chamadas de streaming

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

Adquira uma vez, libere uma vez — a licença é válida durante toda a duração do stream.

### Observabilidade: veja por que ele está limitando

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

## Configuração

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

Função de fábrica. Retorna uma instância de `Governor`.

### `governor.acquire(request): AcquireDecision`

Solicita uma licença. Retorna:

```ts
// Granted
{ granted: true, leaseId: string, expiresAt: number }

// Denied
{ granted: false, reason, retryAfterMs, recommendation, limitsHint? }
```

Motivos para negação: `"concorrência"`, `"taxa"`, `"orçamento"`, `"política"`.

### `governor.release(leaseId, report?): void`

Libera uma licença. Sempre chame isso — mesmo em caso de erro.

### `withLease(governor, request, fn, options?)`

Executa `fn` sob uma licença com liberação automática.

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

Estado em um determinado momento: concorrência, taxa, tokens, última negação.

### `formatEvent(event): string` / `formatSnapshot(snap): string`

Formatadores de linha única e legíveis.

### Funções para obter o status

```ts
gov.activeLeases         // active lease count
gov.concurrencyActive    // in-flight weight
gov.concurrencyAvailable // remaining capacity
gov.rateCount            // requests in current window
gov.tokenRateCount       // tokens in current window
```

### `governor.dispose(): void`

Interrompe o processo de expiração automática das licenças. Chame ao desligar.

## Adaptadores

Wrappers que podem ser usados em árvores de dependência — importe apenas o que você usa. Sem dependências em tempo de execução.

| Adaptador | Importação | Relatórios automáticos |
| --------- | -------- | ------------- |
| **fetch** | `throttleai/adapters/fetch` | Resultado (do status HTTP) + latência |
| **OpenAI** | `throttleai/adapters/openai` | Resultado + latência + uso de tokens |
| **Tool** | `throttleai/adapters/tools` | Resultado + latência + peso personalizado |
| **Express** | `throttleai/adapters/express` | Resultado (do `res.statusCode`) + latência |
| **Hono** | `throttleai/adapters/hono` | Resultado + latência |

Todos os adaptadores retornam `{ ok: true, result, latencyMs }` quando a solicitação é permitida, e `{ ok: false, decision }` quando é negada.

### Buscar

```ts
import { wrapFetch } from "throttleai/adapters/fetch";
const throttledFetch = wrapFetch(fetch, { governor: gov });
const r = await throttledFetch("https://api.example.com/v1/chat");
if (r.ok) console.log(r.response.status);
```

### Compatível com OpenAI

```ts
import { wrapChatCompletions } from "throttleai/adapters/openai";
const chat = wrapChatCompletions(openai.chat.completions.create, { governor: gov });
const r = await chat({ model: "gpt-4", messages });
if (r.ok) console.log(r.result.choices[0].message.content);
```

### Chamada de ferramenta

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

Consulte [`examples/express-adaptive/`](examples/express-adaptive/) para um servidor completo e funcional com ajuste adaptativo.

### Hono

```ts
import { throttle } from "throttleai/adapters/hono";
app.use("/ai/*", throttle({ governor: gov }));
// 429 JSON on deny, leaseId stored on context
```

## Documentação

| Documento | O que este documento cobre |
| ---------- | --------------- |
| [Tuning cheatsheet](docs/tuning-cheatsheet.md) | Guia de configuração baseado em cenários, árvore de decisão, referência de parâmetros. |
| [Troubleshooting](docs/troubleshooting.md) | Problemas comuns: negação constante, lentidão, oscilação adaptativa. |
| [Release manifest](docs/release-manifest.md) | Processo de lançamento e detalhes dos artefatos. |
| [Repo hygiene](docs/repo-hygiene.md) | Política de recursos e registro de reescrita de histórico. |

## Referência rápida de ajuste

| Você vê isso | Ajuste isso |
|---|---|
| `reason: "concurrency"` | Aumente `maxInFlight` ou diminua a duração da chamada. |
| `reason: "rate"` | Aumente `requestsPerMinute` / `tokensPerMinute`. |
| `reason: "policy"` (equidade) | Diminua `softCapRatio` ou aumente `maxInFlight`. |
| `retryAfterMs` alto. | Diminua `leaseTtlMs` para que os leases expirados sejam liberados mais rapidamente. |
| Tarefas em segundo plano ficam sem recursos. | Aumente `maxInFlight` ou diminua `interactiveReserve`. |
| Latência interativa alta. | Aumente `interactiveReserve`. |
| Ajuste adaptativo diminui muito rapidamente. | Diminua `alpha` ou aumente `targetDenyRate`. |

Para obter orientações mais detalhadas, consulte a [referência rápida de ajuste](docs/tuning-cheatsheet.md).

## Exemplos

Consulte [`examples/`](examples/) para demonstrações funcionais:

- **[express-adaptive/](examples/express-adaptive/)** — servidor Express completo com ajuste adaptativo + gerador de carga.
- **[node-basic.ts](examples/node-basic.ts)** — simulação de picos com impressão de snapshots.
- **[express-middleware.ts](examples/express-middleware.ts)** — endpoint 429 + retry-after.
- **[cookbook-adapters.ts](examples/cookbook-adapters.ts)** — todos os cinco adaptadores em ação.
- **[cookbook-burst-snapshot.ts](examples/cookbook-burst-snapshot.ts)** — carga de pico com snapshots do governador.
- **[cookbook-interactive-reserve.ts](examples/cookbook-interactive-reserve.ts)** — prioridade entre tarefas interativas e em segundo plano.
- **[cookbook-express-429.ts](examples/cookbook-express-429.ts)** — 429 vs padrão de repetição em fila.

```bash
npx tsx examples/node-basic.ts
```

## Estabilidade

ThrottleAI segue o [Semantic Versioning](https://semver.org/). A API pública — tudo o que é exportado de `throttleai` e `throttleai/adapters/*` — é **estável** a partir da versão 1.0.0. Alterações que quebram a compatibilidade exigem um aumento na versão principal.

Para obter detalhes sobre o que é considerado público versus interno, consulte [estabilidade da API](docs/api-stability.md). Para relatórios de segurança, consulte [SECURITY.md](.github/SECURITY.md).

## Licença

MIT
