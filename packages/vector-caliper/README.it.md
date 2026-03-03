<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/VectorCaliper/readme.png" alt="VectorCaliper" width="400"></p>

<p align="center"><strong>Scientific instrument for faithful model-state visualization — turns vector graphics into calibrated representations.</strong></p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcp-tool-shop/vector-caliper"><img src="https://img.shields.io/npm/v/@mcp-tool-shop/vector-caliper.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-18%2B-brightgreen.svg" alt="node 18+"></a>
  <a href="https://mcp-tool-shop-org.github.io/VectorCaliper/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

VectorCaliper visualizza le traiettorie dello stato del modello durante l'addestramento. Ogni elemento visivo è collegato a una variabile misurata. Non vengono fatte inferenze, non vengono applicate smussature e non vengono fornite raccomandazioni.

> "Un microscopio, non un cruscotto."

VectorCaliper mostra ciò che è successo. Non vi dice mai cosa significhi.

---

## Cos'è VectorCaliper

- Uno strumento di misurazione per l'analisi della dinamica dell'apprendimento.
- Un debugger geometrico per le traiettorie di ottimizzazione.
- Uno strumento di controllo per l'evoluzione dello stato durante l'addestramento.
- Una mappatura deterministica dallo stato a una rappresentazione visiva.

## Cosa VectorCaliper non è

- Un cruscotto per l'addestramento.
- Un sistema di ottimizzazione o di raccomandazione.
- Un monitor di stato o un rilevatore di anomalie.
- Uno strumento di ricerca di iperparametri.

Per maggiori dettagli, consultare [docs/WHAT-VECTORCALIPER-IS-NOT.md](docs/WHAT-VECTORCALIPER-IS-NOT.md).

---

## Garanzie fondamentali (v1)

VectorCaliper v1.x fornisce semantica fissa:

1. **Determinismo** — Lo stesso input produce lo stesso output.
2. **Nessuna interpretazione** — Le codifiche visive non implicano un significato.
3. **Degradazione veritiera** — I sottoinsiemi sono esatti, mai approssimazioni.
4. **Limiti espliciti** — Le violazioni del budget causano un rifiuto, non una degradazione silenziosa.

Specifiche complete: [VECTORCALIPER_V1_GUARANTEES.md](VECTORCALIPER_V1_GUARANTEES.md)

---

## Esempio minimo

```typescript
import {
  createModelState,
  SemanticMapper,
  ProjectionEngine,
  SceneBuilder,
  SVGRenderer,
} from '@mcp-tool-shop/vector-caliper';

// Create state from measured values
const state = createModelState({
  time: 0,
  geometry: { effectiveDimension: 3.0, anisotropy: 1.5, spread: 5.0, density: 0.7 },
  uncertainty: { entropy: 1.2, margin: 0.6, calibration: 0.08 },
  performance: { accuracy: 0.92, loss: 0.08 },
});

// Project, build scene, render
const projector = new ProjectionEngine();
projector.fit([state]);
const builder = new SceneBuilder(new SemanticMapper());
builder.addState(state, projector.project(state));
const svg = new SVGRenderer({ width: 800, height: 600 }).render(builder.getScene());
```

---

## Demo canonica

La directory [demo/](demo/) contiene un generatore di demo deterministico:

```bash
npx ts-node demo/canonical-demo.ts
```

Output:
- `demo/output/canonical-trajectory.json` — 500 stati
- `demo/output/canonical-trajectory.svg` — Visualizzazione
- `demo/output/canonical-manifest.json` — Controlli di checksum SHA256

Eseguire due volte e confrontare i checksum per verificare il determinismo.

---

## A chi è rivolto

**Ricercatori** che eseguono il debug della dinamica dell'addestramento e che necessitano di:
- Una visualizzazione fedele senza interpretazione.
- Output riproducibili per articoli scientifici.
- Garanzie esplicite su ciò che viene mostrato.

**Ingegneri** che ispezionano l'evoluzione dello stato del modello e che necessitano di:
- Una visualizzazione consapevole della scala (fino a 1 milione di stati).
- Acquisizione dello stato indipendente dal framework.
- Artefatti CI deterministici.

Non adatto per: monitoraggio della produzione, avvisi automatici o ottimizzazione degli iperparametri.

---

## Installazione

```bash
npm install @mcp-tool-shop/vector-caliper
```

Richiede Node.js 18+.

---

## Limiti di scala

VectorCaliper impone limiti espliciti. Il superamento di questi limiti comporta un **rifiuto**, non una degradazione silenziosa.

| Classe di scala | Numero massimo di stati | Limite di memoria | Budget di rendering |
|-------------|------------|--------------|---------------|
| piccolo | 1,000      | 50 MB | 16ms/frame |
| medio | 10,000     | 200 MB | 33ms/frame |
| grande | 100,000    | 500 MB | 66ms/frame |
| estremamente grande | 1,000,000  | 1 GB | 100ms/frame |

---

## Documentazione

- [docs/README.md](docs/README.md) — Indice della documentazione
- [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) — Integrazione con i framework
- [docs/HOW-STATE-BECOMES-VECTOR.md](docs/HOW-STATE-BECOMES-VECTOR.md) — Pipeline di mappatura

---

## Come citare

Se si utilizza VectorCaliper in un lavoro accademico:

**APA:**
> mcp-tool-shop. (2026). *VectorCaliper: A Geometrical Debugger for Learning Dynamics* (Version 1.0.0) [Software]. https://github.com/mcp-tool-shop-org/VectorCaliper

**BibTeX:**
```bibtex
@software{vectorcaliper2026,
  author = {mcp-tool-shop},
  title = {VectorCaliper: A Geometrical Debugger for Learning Dynamics},
  year = {2026},
  version = {1.0.0},
  url = {https://github.com/mcp-tool-shop-org/VectorCaliper}
}
```

Consultare [CITATION.cff](CITATION.cff) per i metadati leggibili dalle macchine.

---

## Licenza

MIT. Consultare [LICENSE](LICENSE).

---

## Stato

**v1.0.0** — Funzionalità fisse fino al 7 marzo 2026. Consultare [STOP.md](STOP.md).

Creato da [MCP Tool Shop](https://mcp-tool-shop.github.io/).
