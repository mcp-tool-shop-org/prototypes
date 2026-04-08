<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Registrum/readme.png" width="400" alt="Registrum">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcp-tool-shop/registrum"><img src="https://img.shields.io/npm/v/@mcp-tool-shop/registrum" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/Registrum/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/Registrum/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center"><strong>Un registro deterministico con doppia verifica, controllato e con una cronologia riproducibile e, opzionalmente, con attestazioni esterne.</strong></p>

---

## Cos'è Registrum

Registrum è un **registro strutturale**: una libreria che registra, convalida e ordina le transizioni di stato secondo vincoli espliciti, in modo che la struttura rimanga interpretabile anche quando l'entropia aumenta.

| Proprietà | Significato |
|----------|---------|
| **Structural** | Opera sulla forma, non sul significato |
| **Deterministic** | Stessi input → stessi output, sempre |
| **Fail-closed** | Un input non valido causa un errore irreversibile, non un recupero parziale |
| **Replayable** | Le decisioni prese in passato possono essere rieseguite con risultati identici |
| **Non-agentic** | Non agisce, non decide e non ottimizza |

**Registrum garantisce che le modifiche rimangano comprensibili.**

---

## Perché Registrum?

I sistemi evolvono. L'entropia aumenta. La struttura si deteriora.

Molti strumenti rispondono a questo problema aggiungendo intelligenza: ottimizzatori, agenti, livelli di auto-riparazione. Registrum adotta un approccio opposto: **aggiunge vincoli**.

- **Per gli autori di librerie**: Incorpora garanzie strutturali nella gestione dello stato, in modo che i consumatori ereditino la leggibilità senza sforzo.
- **Per i sistemi critici per l'audit**: Ogni transizione di stato è deterministica, riproducibile e verificabile in modo indipendente.
- **Per i team che resistono alla complessità**: Registrum rifiuta le transizioni non valide con verdetto strutturato, invece di degradare silenziosamente il sistema.

Il risultato: un sistema in cui l'identità, la provenienza e l'ordine rimangono verificabili, indipendentemente dal numero di modifiche apportate.

---

## Principio Fondamentale

> **L'entropia è consentita. L'illegibilità non lo è.**

Registrum non riduce globalmente l'entropia.
Impone dei limiti su dove l'entropia può esistere, in modo che l'identità, la provenienza e la struttura rimangano verificabili nel tempo.

---

## Cosa Registrum Non È

Registrum **non è esplicitamente**:

- Un ottimizzatore, un agente o un decisore
- Un controllore, un raccomandatore o un'intelligenza
- Adattivo, in grado di apprendere o di auto-ripararsi

Non risponde mai a *ciò che conta*.
Preserva solo le condizioni in cui quella domanda possa ancora essere posta.

---

## Panoramica dell'Architettura

```
┌─────────────────────────────────────────────────────────┐
│                  StructuralRegistrar                     │
│                                                         │
│  ┌───────────────┐         ┌──────────────────────┐     │
│  │  Registry      │  parity │  Legacy              │     │
│  │  (RPEG v1 DSL) │◄──────►│  (TS predicates)     │     │
│  │  [primary]     │         │  [secondary witness] │     │
│  └───────┬───────┘         └──────────┬───────────┘     │
│          │         agree?             │                  │
│          └────────────┬───────────────┘                  │
│                       ▼                                  │
│              11 Structural Invariants                    │
│         ┌──────────┬──────────┬──────────┐              │
│         │ Identity │ Lineage  │ Ordering │              │
│         │  (3)     │  (4)     │  (4)     │              │
│         └──────────┴──────────┴──────────┘              │
│                       │                                  │
│          ┌────────────┴────────────┐                     │
│          ▼                         ▼                     │
│     ✅ Accepted                ❌ Refused                │
│     (stateId, orderIndex)      (violations[])            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Persistence: Snapshot · Replay · Rehydrate      │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Attestation (optional): XRPL witness ledger     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Come Funziona Registrum

### Registro Strutturale

Il registro è l'unica autorità costituzionale:

- Convalida tutte le transizioni di stato rispetto a **11 invarianti strutturali**
- Applica vincoli di identità, provenienza e ordine
- Garantisce il determinismo e la tracciabilità
- Segnala le violazioni senza risolverle (fail-closed)

Tutto passa attraverso di esso. Nulla lo aggira.

### I 11 Invarianti

| Classe | Conteggio | Scopo |
|-------|-------|---------|
| **Identity** | 3 | Unico, immutabile, indirizzabile tramite contenuto |
| **Lineage** | 4 | Provenienza valida, senza cicli, tracciabile |
| **Ordering** | 4 | Monotono, senza lacune, deterministico |

Questi invarianti sono costituzionali. Modificarli richiede una governance formale.

---

## Doppie Autorità Costituzionali

Registrum mantiene **due motori di invarianti indipendenti**:

| Autorità | Ruolo | Implementazione |
|---------|------|----------------|
| **Registry** | Autorità primaria | DSL compilato (RPEG v1) |
| **Legacy** | Autorità secondaria | Predicati TypeScript |

A partire dalla Fase H, **il registro è il motore costituzionale predefinito**.
Legacy rimane come autorità secondaria indipendente.

### Perché Due Autorità?

- **È richiesto l'accordo**: Entrambe devono accettare affinché una transizione sia valida
- **La divergenza interrompe**: Una discrepanza tra le due autorità interrompe il sistema (fail-closed)
- **L'indipendenza è intenzionale**: Nessuna può sovrascrivere l'altra

Questa è una funzionalità di sicurezza e leggibilità, non un debito tecnico.
La modalità duale è indefinita. Non ci sono piani per rimuovere nessuno dei due elementi di verifica.

### Prova di parità

274 test dimostrano l'equivalenza comportamentale:
- 58 test di parità su tutte le classi invarianti
- 12 test di parità di persistenza (stabilità temporale)
- Parità di replay: esecuzione in tempo reale ≡ esecuzione riprodotta

---

## Storia, replay e verificabilità

| Capacità | Descrizione |
|------------|-------------|
| **Snapshot** | Schema versionato (`RegistrarSnapshotV1`), hash indirizzati al contenuto, serializzazione deterministica |
| **Replay** | Riesecuzione in sola lettura rispetto a un registro nuovo, che dimostra il determinismo temporale |
| **Audit** | Ogni giudizio strutturale è riproducibile, indipendente dal contesto e verificabile da qualsiasi parte con lo snapshot |

---

## Attestazione esterna (opzionale)

Registrum può opzionalmente emettere attestazioni crittografiche a un registro immutabile esterno (come XRPL) per la verifica pubblica.

| Proprietà | Valore |
|----------|-------|
| Predefinito | Disabilitato |
| Autorità | Non autoritativa (solo verifica) |
| Effetto sul comportamento | Nessuno |

Le attestazioni registrano *cosa* ha deciso Registrum.
Registrum decide *cosa* è valido.

**L'autorità fluisce verso l'interno. La verifica fluisce verso l'esterno.**

Vedere:
- [`docs/WHY_XRPL.md`](docs/WHY_XRPL.md) — Motivazioni
- [`docs/ATTESTATION_SPEC.md`](docs/ATTESTATION_SPEC.md) — Specifiche

---

## Come iniziare

### Installazione

```bash
npm install @mcp-tool-shop/registrum
```

### Guida rapida

```typescript
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";

const registrar = new StructuralRegistrar({ mode: "legacy" });

// Register a root state
const result = registrar.register({
  from: null,
  to: { id: "state-1", structure: { version: 1 }, data: {} },
});

if (result.kind === "accepted") {
  console.log(`Registered at index ${result.orderIndex}`);
} else {
  // Structured refusal — the violations name which invariants failed
  console.log(`Refused: ${result.violations.map((v) => v.invariantId)}`);
}
```

### Modalità

| Modalità | Motore | Quando utilizzare |
|------|--------|-------------|
| `"legacy"` | Predicati TypeScript | Prototipazione rapida, senza dipendenze esterne |
| `"registry"` (predefinito) | DSL RPEG v1 compilato | Utilizzo in produzione con doppia verifica completa |

```typescript
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";
import { loadCompiledRegistry } from "@mcp-tool-shop/registrum/registry";

// Registry mode (default) — compiled DSL + legacy as dual witnesses
const compiledRegistry = loadCompiledRegistry();
const registrar = new StructuralRegistrar({ compiledRegistry });
```

### Esempi

La directory [`examples/`](examples/) contiene dimostrazioni illustrative (non API stabili).
Richiedono [`tsx`](https://github.com/esbuild-kit/tsx):

```bash
npm run example:refusal        # Refusal-as-success demo
npx tsx examples/refusal-as-success.ts   # Or run directly
```

---

## Riferimento rapido dell'API

### Esportazioni principali

```typescript
// Implementation
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";

// Types
import type {
  State,          // { id, structure, data }
  Transition,     // { from, to, metadata? }
  RegistrationResult,   // { kind: "accepted" | "refused", ... }
  Invariant,      // { id, scope, check }
  InvariantViolation,   // { invariantId, classification, message }
} from "@mcp-tool-shop/registrum";

// Invariants
import {
  INITIAL_INVARIANTS,     // All 11 invariants
  getInvariantsByScope,   // Filter by "identity" | "lineage" | "ordering"
  getInvariantById,       // Lookup by invariant ID
} from "@mcp-tool-shop/registrum";

// Version
import { REGISTRUM_VERSION } from "@mcp-tool-shop/registrum";
```

### `StructuralRegistrar`

| Metodo | Restituisce | Descrizione |
|--------|---------|-------------|
| `register(transition)` | `RegistrationResult` | Valida e registra una transizione di stato |
| `getState(id)` | `State \ | undefined` | Recupera uno stato registrato tramite ID |
| `getHistory()` | `Transition[]` | Storia completa e ordinata delle transizioni accettate |
| `snapshot()` | `RegistrarSnapshotV1` | Snapshot deterministico indirizzato al contenuto |

---

## Governance

Registrum è governato da un **modello costituzionale**.

| Principio | Significato |
|-----------|---------|
| Garanzie comportamentali > velocità di implementazione delle funzionalità | La correttezza ha la priorità |
| Solo modifiche basate su prove | Nessuna modifica senza prova |
| Processo formale richiesto | Proposte, artefatti, decisioni |

### Stato attuale

- **Fase H**: Completata (registro predefinito, attestazione abilitata)
- **Governance**: Attiva e applicata
- **Tutte le modifiche**: Richiedono un processo di governance formale

Tutte le modifiche future sono decisioni di governance, non attività di ingegneria.

Vedere:
- [`docs/governance/PHILOSOPHY.md`](docs/governance/PHILOSOPHY.md) — Perché esiste la governance
- [`docs/governance/SCOPE.md`](docs/governance/SCOPE.md) — Cosa è governato
- [`docs/GOVERNANCE_HANDOFF.md`](docs/GOVERNANCE_HANDOFF.md) — Transizione alla governance

---

## Stato del progetto

**Registrum ha raggiunto uno stato finale stabile.**

| Fase | Stato | Prova |
|-------|--------|----------|
| A–C | Completata | Registro principale, strumento di verifica della parità |
| E | Completata | Persistenza, replay, stabilità temporale |
| G | Completata | Framework di governance |
| H | Completata | Configurazione predefinita del registro, attestazione abilitata. |

**Copertura dei test:** 279 test superati in 14 suite di test.

Lo sviluppo è passato alla fase di gestione. Le modifiche future richiedono un processo di governance.

Consultare: [`docs/STEWARD_CLOSING_NOTE.md`](docs/STEWARD_CLOSING_NOTE.md)

---

## Documentazione

| Documento | Scopo |
|----------|---------|
| [`WHAT_REGISTRUM_IS.md`](docs/WHAT_REGISTRUM_IS.md) | Definizione dell'identità |
| [`PROVABLE_GUARANTEES.md`](docs/PROVABLE_GUARANTEES.md) | Dichiarazioni formali con prove |
| [`INVARIANTS.md`](docs/INVARIANTS.md) | Riferimento completo degli invarianti |
| [`FAILURE_BOUNDARIES.md`](docs/FAILURE_BOUNDARIES.md) | Condizioni di errore irreversibile |
| [`HISTORY_AND_REPLAY.md`](docs/HISTORY_AND_REPLAY.md) | Garanzie temporali |
| [`TUTORIAL_DUAL_WITNESS.md`](docs/TUTORIAL_DUAL_WITNESS.md) | Tutorial sull'architettura a doppia testimonianza |
| [`CANONICAL_SERIALIZATION.md`](docs/CANONICAL_SERIALIZATION.md) | Formato dello snapshot (costituzionale) |
| [`governance/DUAL_WITNESS_POLICY.md`](docs/governance/DUAL_WITNESS_POLICY.md) | Politica a doppia testimonianza |

---

## Principi di progettazione

- **Moderazione** invece di potere
- **Leggibilità** invece di prestazioni
- **Vincoli** invece di euristiche
- **Ispezione** invece di intervento
- **Arresto** invece di estensione infinita

Registrum ha successo quando diventa prevedibile, affidabile e non sorprendente.

---

## Sicurezza e ambito dei dati

| Aspetto | Dettaglio |
|--------|--------|
| **Data touched** | Transizioni di stato in memoria, snapshot JSON opzionali salvati nel file system locale. |
| **Data NOT touched** | Nessuna richiesta di rete, nessuna API esterna, nessun database, nessuna credenziale utente. |
| **Permissions** | Lettura/scrittura solo sui percorsi di snapshot specificati dall'utente (quando viene utilizzata la persistenza). |
| **Network** | Nessuno: libreria completamente offline (l'attestazione XRPL è disabilitata per impostazione predefinita). |
| **Telemetry** | Nessun dato raccolto o trasmesso. |

Consultare [SECURITY.md](SECURITY.md) per la segnalazione di vulnerabilità.

---

## Contributi

Registrum segue un modello di contributo basato sulla governance. Tutte le modifiche richiedono proposte formali con prove.

Consultare [CONTRIBUTING.md](CONTRIBUTING.md) per la filosofia e il processo di contributo completo.

---

## Tabella di valutazione

| Categoria | Punteggio |
|----------|-------|
| A. Sicurezza | 10 |
| B. Gestione degli errori | 10 |
| C. Documentazione per gli operatori | 10 |
| D. Qualità del codice | 10 |
| E. Identità (soft) | 10 |
| **Overall** | **50/50** |

> Audit completo: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

---

## Licenza

MIT

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
