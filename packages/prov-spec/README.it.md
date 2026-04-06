> ⚠️ **Questo repository è stato spostato a [accessibility-suite](https://github.com/mcp-tool-shop-org/accessibility-suite)**
> Il codice sorgente si trova ora in: `docs/prov-spec/`

---

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/prov-spec/readme.png" alt="Prov-Spec — Provenance Specification Framework" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/prov-spec/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/prov-spec/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="spec/PROV_METHODS_SPEC.md"><img src="https://img.shields.io/badge/spec-v0.1.0-blue" alt="Spec Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/prov-spec/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Una specifica formale e versionata, insieme a una suite di test, per gli identificativi, i record e la convalida dei metodi di provenienza.**

---

## Cos'è questo?

Una specifica normativa che definisce:
- **Identificativi dei metodi** — identificatori stabili e con namespace per le operazioni di provenienza
- **Record di provenienza** — documenti JSON strutturati che descrivono le invocazioni degli strumenti
- **Livelli di conformità** — livelli di conformità verificabili tramite test
- **Vettori di test** — input/output canonici per l'interoperabilità

## Cosa non è questo?

- Non è un framework
- Non è un SDK
- Non è specifico per MCP
- Non è specifico per Python

## A chi è rivolto?

- **Sviluppatori di motori** — per implementare la provenienza in qualsiasi linguaggio
- **Integratori di strumenti** — per integrare strumenti esistenti con la funzionalità di provenienza
- **Auditor** — per verificare le dichiarazioni di provenienza
- **Costruttori di infrastrutture** — per creare sistemi con consapevolezza della provenienza

---

## Garanzia di stabilità

> **Gli identificativi dei metodi contrassegnati come `stable` sono modificabili solo in append e non cambieranno mai la loro semantica.**
> **La compatibilità è garantita all'interno di una versione principale.**

---

## Guida rapida

### Verifica in 10 secondi

```bash
# Clone and run a test vector
git clone https://github.com/mcp-tool-shop-org/prov-spec
cd prov-spec
python tools/python/prov_validator.py check-vector integrity.digest.sha256
```

Output previsto: `INFO: Test vector integrity.digest.sha256 passed`

---

### 1. Comprendere la specifica

Leggi [`spec/PROV_METHODS_SPEC.md`](spec/PROV_METHODS_SPEC.md) — la specifica normativa.

### 2. Controlla il catalogo

Esplora [`spec/methods.json`](spec/methods.json) — registro dei metodi leggibile dalle macchine.

### 3. Dichiara la conformità

Includi un file `prov-capabilities.json` nel tuo progetto:

```json
{
  "schema": "prov-capabilities@v0.1",
  "engine": {
    "name": "your-engine",
    "version": "1.0.0"
  },
  "implements": [
    "adapter.wrap.envelope_v0_1",
    "integrity.digest.sha256"
  ],
  "conformance_level": "fully-conformant"
}
```

### 4. Convalida (opzionale)

Utilizza il convalidatore di riferimento:

```bash
# List known methods
python -m prov_validator list-methods

# Validate a provenance record
python -m prov_validator validate-methods record.json --strict

# Run test vectors
python -m prov_validator check-vector integrity.digest.sha256
```

---

## Struttura del repository

```
prov-spec/
├── spec/                    # Normative specification
│   ├── PROV_METHODS_SPEC.md # Main specification document
│   ├── methods.json         # Machine-readable method catalog
│   ├── schemas/             # JSON Schemas
│   │   ├── prov.record.schema.v0.1.json
│   │   ├── artifact.schema.v0.1.json
│   │   ├── evidence.schema.v0.1.json
│   │   ├── mcp.envelope.schema.v0.1.json
│   │   └── prov-capabilities.schema.json
│   └── vectors/             # Test vectors
│       ├── integrity.digest.sha256/
│       ├── adapter.wrap.envelope_v0_1/
│       └── ...
├── tools/                   # Reference implementations (optional)
│   └── python/              # Python reference validator
├── examples/                # Example files
├── CONFORMANCE_LEVELS.md    # Conformance tiers
└── CHANGELOG.md             # Version history
```

**Nota:** Gli strumenti di riferimento sono forniti a scopo di comodità e non sono necessari per la conformità.

---

## Livelli di conformità

| Level | Name | Requisiti |
| ------- | ------ | -------------- |
| **1** | Integrità | Metodi `integrity.digest.*` |
| **2** | Motore | Livello 1 + metodi `engine.*` |
| **3** | Provenienza | Livello 2 + metodi `lineage.*` |

Consulta [`CONFORMANCE_LEVELS.md`](CONFORMANCE_LEVELS.md) per i dettagli.

---

## Namespace dei metodi

| Namespace | Scopo |
| ----------- | --------- |
| `adapter.*` | Involucro, trasporto |
| `engine.*` | Estrazione di prove, costruzione della provenienza |
| `integrity.*` | Hashing, firme, verifica |
| `lineage.*` | Collegamento ai genitori, operazioni sui grafi |

Riservato per usi futuri: `policy.*`, `attestation.*`, `execution.*`, `audit.*`

---

## Versioning

- **Versione della specifica:** `v0.1.0`
- **Catalogo dei metodi:** modificabile solo in append all'interno della versione principale
- **Schemi:** `additionalProperties: false` — compatibile con le versioni successive all'interno della patch

---

## Contributi

1. Nuovi identificativi dei metodi: apri un issue con il caso d'uso
2. Chiarimenti sulla specifica: invia una pull request a `spec/`
3. Strumenti di riferimento: invia una pull request a `tools/`

Gli identificativi dei metodi richiedono una giustificazione basata su casi reali. Non aggiungiamo identificativi in modo speculativo.

---

## Licenza

MIT — vedi [LICENSE](LICENSE)

---

## Riferimenti

- [PROV_METHODS_SPEC.md](spec/PROV_METHODS_SPEC.md) — Specifica normativa
- [PROV_METHODS_CATALOG.md](spec/PROV_METHODS_CATALOG.md) — Catalogo leggibile dagli umani
- [CONFORMANCE_LEVELS.md](CONFORMANCE_LEVELS.md) — Livelli di conformità
- [MCP_COMPATIBILITY.md](spec/MCP_COMPATIBILITY.md) — Compatibilità con l'involucro MCP
