<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/runforge-desktop/readme.png" alt="RunForge Desktop" width="400"></p>

<h1 align="center">RunForge Desktop</h1>

<p align="center">
  <a href="https://www.nuget.org/packages/RunForgeDesktop.Core"><img src="https://img.shields.io/nuget/v/RunForgeDesktop.Core?label=RunForgeDesktop.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/mcp-tool-shop-org/runforge-desktop/releases"><img src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?logo=windows" alt="Platform"></a>
  <a href="https://mcp-tool-shop-org.github.io/runforge-desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**RunForge Desktop** è un'applicazione desktop nativa per Windows, progettata per creare, monitorare e analizzare le esecuzioni di training di modelli di machine learning.

Fornisce un'interfaccia visiva per la gestione degli esperimenti di machine learning: permette di creare esecuzioni, monitorare l'avanzamento del training in tempo reale con grafici, e visualizzare le esecuzioni completate con la possibilità di analizzare tutti i risultati.

> **Codice sorgente ufficiale (artefatti, schemi, garanzie):**
> https://github.com/mcp-tool-shop-org/runforge-vscode

---

## Perché

La maggior parte degli strumenti per il monitoraggio degli esperimenti di machine learning sono piattaforme SaaS basate sul cloud, che richiedono account, raccolgono dati di telemetria e aggiungono complessità. RunForge Desktop adotta un approccio diverso: **tutto funziona localmente sulla tua macchina**.

Con RunForge Desktop puoi:

- **Creare** esecuzioni di training con configurazioni predefinite
- **Monitorare** il training in tempo reale con grafici e log
- **Visualizzare** le esecuzioni completate e i loro risultati
- **Analizzare** metriche, log e artefatti
- **Gestire** le esecuzioni (annullare, visualizzare i risultati, copiare i comandi)

Tutte le esecuzioni di training vengono eseguite localmente sulla tua macchina utilizzando Python. Nessun cloud. Nessuna telemetria. Nessun account.

---

## Pacchetti NuGet

| Pacchetto | Descrizione |
| --------- | ------------- |
| [RunForgeDesktop.Core](https://www.nuget.org/packages/RunForgeDesktop.Core) | Modelli e servizi principali per la gestione delle esecuzioni di training di machine learning: ciclo di vita, ottimizzazione degli iperparametri, monitoraggio in tempo reale e analisi degli artefatti. |

```bash
dotnet add package RunForgeDesktop.Core
```

---

## Guida rapida

### Installazione

**Opzione 1: Pacchetto MSIX (consigliata)**
1. Scarica il file `.msix` da [Releases](https://github.com/mcp-tool-shop-org/runforge-desktop/releases)
2. Fai doppio clic per installare
3. Avvia l'applicazione dal menu Start

**Opzione 2: Compilazione dal codice sorgente**
```powershell
git clone https://github.com/mcp-tool-shop-org/runforge-desktop
cd runforge-desktop
dotnet run --project src/RunForgeDesktop/RunForgeDesktop.csproj
```

Consulta [docs/INSTALL.md](docs/INSTALL.md) per le opzioni di installazione dettagliate.

### Utilizzo

1. **Avvia** RunForge Desktop
2. **Seleziona la cartella di lavoro** - Clicca su "Select Workspace" e scegli una cartella per i tuoi esperimenti di machine learning
3. **Avvia il training** - Clicca su "Train" per configurare e avviare un'esecuzione di training
4. **Monitora in tempo reale** - Osserva l'avanzamento del training con grafici e log in tempo reale
5. **Visualizza le esecuzioni** - Visualizza tutte le esecuzioni, filtrandole per stato
6. **Analizza i dettagli** - Clicca su un'esecuzione per visualizzare metriche, artefatti e risultati

---

## Funzionalità

### Creazione di esecuzioni di training
- Configura le esecuzioni di training con impostazioni predefinite per il numero di epoche (Veloce, Standard, Esteso, Personalizzato)
- Selezione del dispositivo GPU/CPU con rilevamento automatico
- Impostazioni avanzate: dimensione del batch, learning rate, ottimizzatore, scheduler
- Possibilità di specificare un percorso personalizzato per il dataset

### Ottimizzazione degli iperparametri (MultiRun)
- Esegui più esperimenti con diverse combinazioni di iperparametri
- Configura learning rate, dimensioni del batch e ottimizzatori come elenchi separati da virgole
- Ricerca automatica della griglia su tutte le combinazioni
- Traccia la configurazione con le prestazioni migliori in base alla perdita finale

### Monitoraggio in tempo reale
- Grafico della perdita in tempo reale con aggiornamenti automatici
- Streaming dei log in tempo reale dal processo di training
- Monitoraggio dei progressi (epoca, step, tempo trascorso)
- Possibilità di interrompere il training in qualsiasi momento

### Visualizzazione delle esecuzioni
- Visualizza le esecuzioni ordinate per data di creazione (le più recenti per prime)
- Filtra per stato: In attesa, In esecuzione, Completata, Fallita, Annullata
- Visualizza i dettagli e i risultati delle esecuzioni

### Analisi delle esecuzioni
- **Metriche** - Curve di perdita, accuratezza, statistiche del training
- **Log** - Output completo di stdout/stderr dal processo di training
- **Artefatti** - Apri la cartella di output, copia il comando di training

### Diagnostica
- Visualizza la versione dell'applicazione, il framework e l'utilizzo della memoria
- Visualizza il percorso della cartella di lavoro e la configurazione di Python
- Copia le informazioni diagnostiche negli appunti per l'assistenza

---

## Principi fondamentali

### Local-first
Tutte le esecuzioni di training vengono effettuate sulla tua macchina. Non è necessaria alcuna connessione al cloud.

### Trasparente
Visualizza esattamente cosa sta accadendo: log in tempo reale, metriche in tempo reale, controllo completo del processo.

### Semplice
Un'unica area di lavoro, impostazioni predefinite chiare, nessun file di configurazione da gestire.

### Verificabile
Tutti i risultati delle esecuzioni vengono salvati su disco per l'ispezione e la riproducibilità.

---

## Come Funziona

```
RunForge Desktop
  │
  ├── Select Workspace (any folder)
  │
  ├── Create Run (preset + device + optional dataset)
  │
  ├── Spawn Python training process
  │
  ▼
.ml/
  └── runs/
      └── 20240101-123456-myrun-abc1/
          ├── run.json       (manifest)
          ├── metrics.jsonl  (live metrics)
          ├── stdout.log     (live logs)
          └── stderr.log     (errors)
```

RunForge Desktop gestisce l'intero ciclo di vita: creazione, esecuzione, monitoraggio e ispezione.

---

## Requisiti di Sistema

| Requisito | Value |
| ------------- | ------- |
| OS | Windows 10 (1809+) o Windows 11 |
| Architettura | x64 |
| Runtime | .NET 10 (incluso nel pacchetto MSIX) |
| Python | 3.10+ (per il training) |
| GPU | Opzionale (CUDA per il training su GPU) |
| Spazio su Disco | ~100 MB |

---

## Piattaforma e Packaging

| Attributo | Value |
| ----------- | ------- |
| Piattaforma | Windows 10/11 |
| Framework dell'interfaccia utente | .NET MAUI |
| Packaging | MSIX (autonomo) |
| Installazione/Disinstallazione | Pulita, isolata, reversibile |

L'applicazione segue i modelli standard di autorizzazione di Windows per l'accesso ai file.

---

## Stato del Progetto

| Attributo | Value |
| ----------- | ------- |
| Versione corrente | v1.0.0 |
| Scope | Training, monitoraggio e ispezione di modelli di machine learning |

Consulta [RELEASE_NOTES_v0.4.0.md](RELEASE_NOTES_v0.4.0.md) per le modifiche recenti.

---

## Sviluppo

### Prerequisiti

- .NET 10 SDK
- Windows 10/11
- Visual Studio 2022 (17.12+) con workload MAUI, oppure VS Code con estensione .NET MAUI

### Compilazione

```powershell
# Debug build
dotnet build

# Run tests
dotnet test

# Release build
.\scripts\build-release.cmd
```

### Struttura del Progetto

```
runforge-desktop/
├── src/
│   ├── RunForgeDesktop/          # MAUI app (UI, ViewModels)
│   └── RunForgeDesktop.Core/     # Core services, models
├── tests/
│   └── RunForgeDesktop.Core.Tests/
├── docs/
│   ├── PHASE-DESKTOP-0.1-ACCEPTANCE.md
│   └── INSTALL.md
└── scripts/
    ├── build-msix.ps1
    └── build-release.cmd
```

---

## Relazione con RunForge Core

Tutti gli schemi, le garanzie e i formati degli artefatti sono definiti e fissati in:

> https://github.com/mcp-tool-shop-org/runforge-vscode

Questo repository contiene:
- Nessuna logica di training
- Nessuna definizione di schema
- Nessuna proprietà contrattuale

RunForge Desktop **utilizza** fedelmente questi artefatti.

---

## Pubblico di Riferimento

- Sviluppatori che addestrano modelli localmente su Windows
- Ricercatori che necessitano di un tracciamento degli esperimenti semplice e verificabile
- Chiunque desideri un'interfaccia utente nativa di Windows per il training di modelli di machine learning
- Team che desiderano flussi di lavoro di machine learning locali, senza cloud

---

## Licenza

Licenza MIT - Consulta [LICENSE](LICENSE) per i dettagli.

---

## Test di Affidabilità

RunForge viene fornito con una suite di test di affidabilità ripetibile che puoi eseguire localmente per validare la gestione delle code, la sospensione/ripresa, la cancellazione, il ripristino da crash, l'equità, la resilienza alla deriva dei dati e il comportamento di riconnessione al desktop.

| Test | Focus |
| ---------- | ------- |
| G1 | Applicazione rigorosa dei limiti di parallelismo |
| G2 | Sospensione/Ripresa |
| G3 | Determinismo della cancellazione |
| G4 | Ripristino da crash |
| G5 | Pianificazione equa |
| G6 | Resilienza alla deriva dei dati |
| G7 | Riconnessione al desktop |
| G8-G10 | Supporto GPU (v0.4.0+) |

Consulta: [`docs/GAUNTLETS.md`](docs/GAUNTLETS.md)

---

## Contributi

I contributi sono benvenuti. Si prega di rispettare i principi fondamentali:

- Mantenere la semplicità e l'approccio locale
- Nessuna dipendenza dal cloud o telemetria
- Messaggi di errore chiari e utili

---

## Supporto

- **Problemi**: [Problemi su GitHub](https://github.com/mcp-tool-shop-org/runforge-desktop/issues)
- **Diagnostica**: Utilizzare la pagina "Diagnostica" per copiare le informazioni sul sistema e includerle nei report di bug.
