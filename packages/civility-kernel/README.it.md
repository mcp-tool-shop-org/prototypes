<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<div align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/civility-kernel/readme.png" alt="civility-kernel logo" width="360" />
</div>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/civility-kernel/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/civility-kernel"><img src="https://img.shields.io/npm/v/%40mcptoolshop%2Fcivility-kernel" alt="npm version"></a>
</p>

Un livello di policy che determina il comportamento dell'agente in base a **preferenze**, anziché esclusivamente alla massimizzazione dell'efficienza.

Il vostro agente genera piani candidati. Il kernel decide cosa succede successivamente:

**genera → filtra (vincoli rigidi) → assegna punteggio (pesi) → scegli OPPURE chiedi**

I vincoli rigidi sono non negoziabili. Le preferenze, invece, guidano le scelte. L'incertezza può portare a richiedere l'intervento umano.

---

## Installazione

```bash
npm i @mcptoolshop/civility-kernel
```

## Guida rapida

```typescript
import { createKernel, PolicyBuilder } from '@mcptoolshop/civility-kernel';

const policy = new PolicyBuilder()
  .setWeight('efficiency', 0.6)
  .setWeight('low_risk', 0.4)
  .addConstraint('no_irreversible_changes')
  .setUncertaintyThreshold(0.5)
  .build();

const kernel = createKernel({ policy });
const trace = kernel.decide('default', [plan1, plan2]);
// trace.outcome: 'EXECUTE' | 'ASK_USER' | 'NO_VALID_PLAN'
```

Il kernel collega vincoli, valutatori e il motore decisionale in un'unica chiamata. Utilizzare `decideAsync()` per i controlli dei vincoli che richiedono operazioni di I/O.

## Il ciclo di governance umana

Potete sempre vedere cosa fa la vostra policy.
L'agente deve mostrare le modifiche prima che vengano applicate.
Potete annullare le modifiche.
Nessuna modifica viene applicata silenziosamente.

Visualizzare il contratto della policy:
```bash
npm run policy:explain
```

Proporre un aggiornamento (mostra le differenze, richiede l'approvazione):
```bash
npm run policy:propose
```

Normalizzare il file della policy corrente (solo formattazione):
```bash
npm run policy:canonicalize
```

### Ripristino automatico sicuro

Quando si applicano le modifiche, `policy-check` può prima eseguire il backup della policy precedente:

```bash
npx tsx scripts/policy-check.ts policies/default.json --propose policies/proposed.json --write-prev policies/previous.json
```

## File di policy

Convenzione consigliata:

- `policies/default.json` — policy attiva
- `policies/previous.json` — destinazione per il ripristino automatico
- `policies/profiles/*.json` — profili denominati (lavoro / bassa complessità / modalità sicura)

## Opzioni della CLI (policy-check)

- `--explain` — stampa un riepilogo della policy in formato leggibile
- `--propose <file>` — esegue il controllo della sintassi e mostra le differenze normalizzate, quindi richiede l'approvazione
- `--apply` — riscrive il file della policy nella forma normalizzata
- `--write-prev <file>` — esegue il backup della policy normalizzata precedente prima di sovrascriverla
- `--diff short|full` — `short` mostra le modifiche principali; `full` mostra tutto
- `--prev <file>` — modalità diff deterministica per CI

## API pubblica

**Kernel (punto di accesso consigliato):**

- `createKernel({ policy, constraints?, scorers?, onDecision? })` — interfaccia preconfigurata con `decide`, `lint`, `explain`, `diff` e funzionalità di apprendimento
- `PolicyBuilder` — API fluida e concatenabile per la creazione di policy validate

**Operazioni sulla policy:**

- `lintPolicy(policy, { registry, scorers })` — convalida una policy per errori e avvisi
- `canonicalizePolicy(policy, registry)` — normalizza una policy nella forma canonica
- `diffPolicy(a, b, registry?)` — differenza strutturata tra due policy
- `explainPolicy(policy, registry, opts?)` — riepilogo della policy in formato leggibile

**Persistenza:**

- `loadPolicy(json)` — caricamento della policy con convalida Zod da input sconosciuto
- `dumpPolicy(policy)` — serializzazione JSON deterministica (chiavi ordinate)
- `PreferencePolicySchema` — schema Zod esportato per la convalida a runtime

**Motore decisionale:**

- `DecisionEngine` — valuta i piani candidati rispetto a una policy (filtra → assegna punteggio → scegli o chiedi)
- `decideAsync()` — variante asincrona per i controlli dei vincoli che richiedono operazioni di I/O
- `compileEffectivePolicy(base, context, plans)` — applica le regole del contesto (supporta i modelli glob come `tool:*`)
- `onDecision` hook — callback opzionale per la registrazione/le metriche per ogni decisione

**Registri:**

- `ConstraintRegistry` — registra e valuta i vincoli rigidi (con schemi di parametri Zod opzionali e supporto asincrono)
- `ScorerRegistry` — registra le funzioni di valutazione per le chiavi dei pesi
- `registerDefaultConstraints(registry)` — carica i vincoli predefiniti (`no_irreversible_changes`, `max_spend_without_confirm`, `require_confirm_if`)
- `registerDefaultScorers(registry)` — carica i valutatori predefiniti (`efficiency`, `low_risk`, `concise`)

**Ciclo di apprendimento:**

- `proposePolicyUpdates(policy, events)` — suggerisce modifiche alla policy in base agli eventi di feedback degli utenti.
- `applyPolicyProposal(policy, proposal)` — integra una proposta nella policy (chiude il ciclo).
- Feedback esteso: `CONSTRAINT_RELAXED`, `PLAN_EDITED`, `TIMEOUT`, `ABORT`.

**Integrazione con MCP:**

- `planFromMcpToolCall(call, meta?)` — converte una chiamata a uno strumento MCP in un piano.
- `feedbackFromMcpResult(result, planId)` — converte un risultato di uno strumento MCP in un evento di feedback.

**Utilità:**

- `extractTags(plan)` / `annotatePlanWithTags(plan)` — assegna automaticamente tag ai piani in base al contenuto delle singole fasi.
- `matchesContext(pattern, context)` — corrispondenza di modelli di contesto, con supporto per caratteri jolly.

## CI

Esecuzioni CI:
- test (143 test in 17 file)
- build
- `policy-check --strict` rispetto ai file di esempio (`policies/default.json` vs `policies/previous.json`)

Questo impedisce la distribuzione di policy errate o di differenze fuorvianti.

## Sviluppo

```bash
npm test
npm run build
npm run example:basic
npm run policy:check
```

## Sicurezza e ambito dei dati

Il kernel di Civility è una **libreria pura**: non effettua richieste di rete, non raccoglie dati telemetrici e non ha effetti collaterali.

- **Dati accessibili:** Legge file di policy in formato JSON dal file system locale. Valida, normalizza e confronta i documenti di policy in memoria. Tutte le operazioni sono deterministiche.
- **Dati NON accessibili:** Nessuna richiesta di rete. Nessuna raccolta di dati telemetrici. Nessun archivio di credenziali. Il kernel valuta i vincoli delle policy, ma non osserva né registra le azioni dell'agente.
- **Permessi richiesti:** Accesso in lettura al file system per i file di policy in formato JSON. Scrittura solo quando esplicitamente richiesta tramite l'opzione `--apply`.

Consultare [SECURITY.md](SECURITY.md) per la segnalazione di vulnerabilità.

---

## Scorecard

| Categoria | Punteggio |
|----------|-------|
| Sicurezza | 10/10 |
| Gestione degli errori | 10/10 |
| Documentazione per gli operatori | 10/10 |
| Qualità del codice | 10/10 |
| Identità | 10/10 |
| **Overall** | **50/50** |

---

## Licenza

MIT (vedere LICENSE)

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
