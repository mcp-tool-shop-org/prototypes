<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/InControl-Desktop/readme.png" alt="InControl Desktop" width="400"></p>

<h1 align="center">InControl Desktop</h1>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/InControl-Desktop/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/InControl-Desktop/ci.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="https://www.nuget.org/packages/InControl.Core"><img src="https://img.shields.io/nuget/v/InControl.Core?style=flat-square&label=InControl.Core" alt="InControl.Core NuGet"></a>
  <a href="https://www.nuget.org/packages/InControl.Inference"><img src="https://img.shields.io/nuget/v/InControl.Inference?style=flat-square&label=InControl.Inference" alt="InControl.Inference NuGet"></a>
  <img src="https://img.shields.io/badge/.NET-9-purple?style=flat-square&logo=dotnet" alt=".NET 9">
  <img src="https://img.shields.io/badge/WinUI-3-blue?style=flat-square" alt="WinUI 3">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/InControl-Desktop?style=flat-square" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/InControl-Desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

**Assistente di chat AI locale per Windows**

Un'applicazione di chat orientata alla privacy e accelerata tramite GPU, che esegue modelli linguistici di grandi dimensioni interamente sulla tua macchina. Non è necessaria alcuna connessione al cloud.

## Perché InControl?

- **Privacy predefinita:** Le tue conversazioni non lasciano mai il tuo computer.
- **Ottimizzato per RTX:** Progettato per GPU NVIDIA con accelerazione CUDA.
- **Esperienza nativa di Windows:** WinUI 3 con Fluent Design.
- **Supporto per più backend:** Ollama, llama.cpp, o il tuo backend personalizzato.
- **Rendering Markdown:** Supporto per testo ricco, blocchi di codice e evidenziazione della sintassi.

## Pacchetti NuGet

Le librerie principali sono disponibili come pacchetti NuGet autonomi per creare le tue integrazioni AI locali:

| Pacchetto | Versione | Descrizione |
| --------- | --------- | ------------- |
| [InControl.Core](https://www.nuget.org/packages/InControl.Core) | [![NuGet](https://img.shields.io/nuget/v/InControl.Core?style=flat-square)](https://www.nuget.org/packages/InControl.Core) | Modelli di dominio, tipi di conversazione e astrazioni condivise per applicazioni di chat AI locali. |
| [InControl.Inference](https://www.nuget.org/packages/InControl.Inference) | [![NuGet](https://img.shields.io/nuget/v/InControl.Inference?style=flat-square)](https://www.nuget.org/packages/InControl.Inference) | Livello di astrazione del backend LLM con chat in streaming, gestione dei modelli e controlli di stato. Include l'implementazione di Ollama. |

```bash
dotnet add package InControl.Core
dotnet add package InControl.Inference
```

```csharp
// Example: use InControl.Inference in your own app
var client = inferenceClientFactory.Create("ollama");
await foreach (var token in client.StreamChatAsync(messages))
{
    Console.Write(token);
}
```

## Hardware supportato

| Componente | Minimo | Raccomandato |
| ----------- | --------- | ------------- |
| GPU | RTX 3060 (8GB) | RTX 4080/5080 (16GB) |
| RAM | 16GB | 32GB |
| OS | Windows 10 1809+ | Windows 11 |
| .NET | 9.0 | 9.0 |

## Installazione

### Dalla versione rilasciata (consigliato)

1. Scarica il pacchetto MSIX più recente da [Releases](https://github.com/mcp-tool-shop-org/InControl-Desktop/releases)
2. Fai doppio clic per installare.
3. Avvia dal menu Start.

### Dal codice sorgente

```bash
# Clone and build
git clone https://github.com/mcp-tool-shop-org/InControl-Desktop.git
cd InControl-Desktop
dotnet restore
dotnet build

# Run (requires Ollama running locally)
dotnet run --project src/InControl.App
```

## Prerequisiti

InControl richiede un backend LLM locale. Si consiglia [Ollama](https://ollama.ai/):

```bash
# Install Ollama from https://ollama.ai/download

# Pull a model
ollama pull llama3.2

# Start the server (runs on http://localhost:11434)
ollama serve
```

## Compilazione

### Verifica dell'ambiente di compilazione

```powershell
# Run verification script
./scripts/verify.ps1
```

### Compilazione di sviluppo

```bash
dotnet build
```

### Compilazione di rilascio

```powershell
# Creates release artifacts in artifacts/
./scripts/release.ps1
```

### Esecuzione dei test

```bash
dotnet test
```

## Architettura

InControl segue un'architettura pulita e a livelli:

```
+-------------------------------------------+
|         InControl.App (WinUI 3)           |  UI Layer
+-------------------------------------------+
|         InControl.ViewModels              |  Presentation
+-------------------------------------------+
|         InControl.Services                |  Business Logic
+-------------------------------------------+
|         InControl.Inference               |  LLM Backends
+-------------------------------------------+
|         InControl.Core                    |  Shared Types
+-------------------------------------------+
```

Consulta [ARCHITECTURE.md](./docs/ARCHITECTURE.md) per la documentazione dettagliata del design.

## Archiviazione dei dati

Tutti i dati sono archiviati localmente:

| Data | Posizione |
| ------ | ---------- |
| Sessioni | `%LOCALAPPDATA%\InControl\sessions\` |
| Logs | `%LOCALAPPDATA%\InControl\logs\` |
| Cache | `%LOCALAPPDATA%\InControl\cache\` |
| Esportazioni | `%USERPROFILE%\Documents\InControl\exports\` |

Consulta [PRIVACY.md](./docs/PRIVACY.md) per la documentazione completa sulla gestione dei dati.

## Risoluzione dei problemi

I problemi comuni e le soluzioni sono documentati in [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md).

### Soluzioni rapide

**L'applicazione non si avvia:**
- Verifica che sia installato il runtime .NET 9.0
- Esegui `dotnet --list-runtimes` per verificarlo.

**Nessun modello disponibile:**
- Assicurati che Ollama sia in esecuzione: `ollama serve`
- Scarica un modello: `ollama pull llama3.2`

**GPU non rilevata:**
- Aggiorna i driver NVIDIA all'ultima versione.
- Verifica l'installazione del toolkit CUDA.

## Contributi

I contributi sono benvenuti! Si prega di:

1. Fork del repository.
2. Crea un branch per la nuova funzionalità.
3. Scrivi dei test per la nuova funzionalità.
4. Invia una pull request.

## Segnalazione di problemi

1. Controlla prima [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md).
2. Utilizza la funzione "Copia diagnostica" nell'applicazione.
3. Apri un issue con le informazioni diagnostiche allegate.

## Tecnologie utilizzate

| Layer | Tecnologia |
| ------- | ------------ |
| Framework dell'interfaccia utente | WinUI 3 (Windows App SDK 1.6) |
| Architettura | MVVM con CommunityToolkit.Mvvm |
| Integrazione LLM | OllamaSharp, Microsoft.Extensions.AI |
| Container di dipendenze | Microsoft.Extensions.DependencyInjection |
| Configurazione | Microsoft.Extensions.Configuration |
| Logging | Microsoft.Extensions.Logging + Serilog |

## Versione

Versione corrente: **0.4.0-alpha**

Consultare il file [CHANGELOG.md](./CHANGELOG.md) per la cronologia delle versioni.

## Supporto

- **Domande / assistenza:** [Discussioni](https://github.com/mcp-tool-shop-org/InControl-Desktop/discussions)
- **Segnalazione di bug:** [Problemi](https://github.com/mcp-tool-shop-org/InControl-Desktop/issues)
- **Sicurezza:** [SECURITY.md](SECURITY.md)

## Licenza

[MIT](LICENSE) -- consultare [LICENSE](LICENSE) per il testo completo.

---

*Prodotto per Windows. Alimentato da intelligenza artificiale locale.*
