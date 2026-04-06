<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# Training Studio

[![CI](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/mcp-tool-shop-org/training-studio)](LICENSE)
[![Landing Page](https://img.shields.io/badge/Landing_Page-live-blue)](https://mcp-tool-shop-org.github.io/training-studio/)

**Addestrare modelli di machine learning direttamente nel tuo browser. Nessuna soluzione cloud. Nessun caricamento di dati. Nessuna configurazione di Python.**

Training Studio è un'applicazione di training ML basata su TensorFlow.js che funziona interamente localmente. I tuoi dati non lasciano mai il tuo dispositivo.

## Perché scegliere Training Studio?

| Problema | Soluzione |
| --------- | ---------- |
| Problemi con l'ambiente Python | **Nessuna configurazione** - basta aprire e iniziare ad addestrare |
| Preoccupazioni sulla privacy con il ML basato su cloud | **Completamente locale** - i dati non lasciano mai il tuo dispositivo |
| Strumenti ML complessi | **Flusso di lavoro semplice** - importazione di file CSV, esportazione del modello addestrato |
| Cicli di iterazione lenti | **Feedback in tempo reale** - grafici e metriche live |

## Funzionalità

### Training di base
- **Caricamento di dataset CSV** - Rilevamento automatico di feature/etichette
- **Configurazione di modelli MLP** - Livelli nascosti, funzioni di attivazione, dropout
- **Grafici di training in tempo reale** - Visualizzazione di perdita e accuratezza
- **Arresto anticipato** - Rilevamento automatico della convergenza
- **Accelerazione GPU** - WebGPU/WebGL per un training più veloce

### Valutazione e previsione
- **Matrice di confusione** - Visualizzazione delle prestazioni di classificazione
- **Metriche per classe** - Precisione, richiamo, punteggio F1
- **Previsioni singole** - Test di singoli esempi
- **Inferenza batch** - Previsioni su file CSV
- **Esportazione dei risultati** - Download delle previsioni come file CSV

### Strumenti per i dati
- **Pre-elaborazione** - Normalizzazione, gestione dei valori mancanti
- **One-hot encoding** - Conversione automatica delle categorie
- **Divisione train/test** - Percentuale di validazione configurabile
- **Cronologia del training** - Confronto delle esecuzioni, ricerca dei modelli migliori

### Pronto per la produzione
- **283 test** - Copertura completa dei test
- **Accessibile** - Conformità a WCAG 2.1 AA
- **Responsive** - Funziona su tablet e dispositivi mobili
- **Funziona offline** - Non è necessaria una connessione internet dopo l'installazione

## Installazione

### Dal codice sorgente

```bash
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web
npm install
npm run build
```

## Guida rapida

### Validare un bundle (30 secondi)

```bash
# From source
npm run validate ./src/tests/fixtures/golden-v1

# JSON output
training-studio validate --json ./my-bundle
```

### Output JSON

```json
{
  "ok": true,
  "exit_code": 0,
  "bundle_id": "00000000-0000-4000-8000-000000000001",
  "bundle_digest": "719823b86e10fe388aa8a9b14cb135624e73c253dc69f5065f78871403c3df3f",
  "version": "0.1",
  "schema_uri": "https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json",
  "schema_version": "0.1",
  "errors": [],
  "warnings": [],
  "stats": {
    "files_total": 7,
    "artifacts_listed": 6,
    "artifacts_verified": 6
  }
}
```

### Codici di uscita

| Code | Significato |
| ------ | --------- |
| 0 | Bundle valido |
| 2 | Bundle valido con avvisi |
| 3 | Bundle non valido |

## Formato del bundle

Consulta [SPEC.md](SPEC.md) per la specifica completa del bundle.

### Struttura delle directory

```
bundle/
├── bundle.json           # Manifest
├── model/
│   ├── model.json        # TF.js topology
│   └── weights.bin       # Model weights
├── metrics/
│   ├── metrics.jsonl     # Per-epoch metrics
│   └── summary.json      # Training summary
├── config/
│   └── run_config.json   # Hyperparameters
└── data/
    └── schema.json       # Feature/label schema
```

## Guida rapida (Web App)

```bash
cd TrainingStudio.Web
npm install
npm run dev
```

Quindi apri http://localhost:5173 nel tuo browser.

### Prova con dati di esempio

1. Clicca sulla scheda **Dataset**
2. Carica `sample_data/iris.csv`
3. Seleziona le feature: sepal_length, sepal_width, petal_length, petal_width
4. Seleziona l'etichetta: species
5. Vai alla scheda **Model**, usa i valori predefiniti (64, 32 livelli nascosti)
6. Vai alla scheda **Train**, clicca su **Start Training**
7. Osserva i grafici aggiornarsi in tempo reale!

## App desktop (Windows)

```bash
cd TrainingStudio.Web && npm run build
cd ../TrainingStudio.App
dotnet build -c Release
dotnet run
```

Richiede Windows 10 1809+, 4 GB di RAM (8 GB consigliati), GPU con WebGL 2.0 o WebGPU (opzionale, fallback su CPU).

## Sviluppo

```bash
cd TrainingStudio.Web

# Run all 283 tests
npm test

# Watch mode
npm test -- --watch

# Build production web app
npm run build
```

## Documentazione

| Documento | Descrizione |
| ---------- | ------------- |
| [SPEC.md](SPEC.md) | Specifiche del formato del bundle |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Problemi comuni e soluzioni |
| [CHANGELOG.md](CHANGELOG.md) | Cronologia delle versioni |
| [ROADMAP.md](ROADMAP.md) | Roadmap di sviluppo |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Come contribuire |

## Set di dati di esempio

| File | Task | Funzionalità | Classi |
| ------ | ------ | ---------- | --------- |
| `sample_data/iris.csv` | Classificazione multiclasse | 4 | 3 |
| `sample_data/binary_classification.csv` | Classificazione binaria | 2 | 2 |

## Privacy e sicurezza

- **Nessuna raccolta di dati** - I tuoi dati rimangono sul tuo dispositivo.
- **Nessuna telemetria** - Non tracciamo l'utilizzo.
- **Funziona offline** - Funziona anche senza connessione a Internet.
- **Open source** - Puoi controllare il codice direttamente.

Consultare i file [PRIVACY.md](PRIVACY.md) e [SECURITY.md](SECURITY.md) per maggiori dettagli.

## Licenza

MIT - Consultare il file [LICENSE](LICENSE) per maggiori dettagli.

---

Creato da [MCP Tool Shop](https://mcp-tool-shop.github.io/)
