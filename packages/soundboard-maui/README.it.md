<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/soundboard-maui/readme.png" alt="Soundboard MAUI logo" width="400">
</p>

# soundboard-maui

> Parte di [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml/badge.svg" alt="Publish"></a>
  <img src="https://img.shields.io/badge/.NET-8%20%7C%209%20%7C%2010-512BD4" alt=".NET 8 | 9 | 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-maui/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Client desktop multipiattaforma .NET MAUI per il motore vocale Sound Board.**

---

## Perché Soundboard MAUI?

- **Progettazione orientata alle librerie SDK** — `Soundboard.Client` è una libreria .NET 8+ autonoma con zero dipendenze dall'interfaccia utente. Utilizzala in applicazioni console, WPF, ASP.NET, MAUI o in qualsiasi cosa che utilizzi .NET.
- **Streaming in tempo reale** — L'audio arriva a blocchi tramite WebSocket tramite `IProgress<AudioChunk>`. Non è necessario attendere il completamento della sintesi.
- **Motore indipendente** — L'SDK utilizza un [contratto API](docs/api-contract.md) documentato. Sostituisci i motori senza modificare il tuo codice.
- **Multitarget** — Disponibile per `net8.0`, `net9.0` e `net10.0`, quindi puoi utilizzarla in qualsiasi progetto .NET moderno.
- **Logging strutturato** — Supporto integrato per `ILogger` per la diagnostica, senza dover includere un framework di logging.
- **Client di esempio inclusi** — Un'applicazione desktop MAUI e uno strumento CLI mostrano modelli di integrazione reali che puoi copiare.

---

## Pacchetti NuGet

| Pacchetto | Descrizione | Versione |
|---|---|---|
| **[Soundboard.Client](https://www.nuget.org/packages/Soundboard.Client)** | SDK di base — client TTS in streaming per qualsiasi motore vocale compatibile con Soundboard. Puro C#, zero dipendenze dall'interfaccia utente. | 1.2.0 |
| **[Soundboard.Maui.Audio](https://www.nuget.org/packages/Soundboard.Maui.Audio)** | Adattatore di riproduzione PCM16 basato su NAudio per Windows. Fornisce `IAudioPlayer` con buffering, avvio/arresto/pulizia thread-safe e monitoraggio dello stato di riproduzione. | 1.0.0 |

---

## Guida rapida

### Installa l'SDK

```bash
dotnet add package Soundboard.Client
```

### Parla in cinque righe

```csharp
using Soundboard.Client;
using Soundboard.Client.Models;

await using var client = new SoundboardClient();

// Discover what the engine offers
var presets = await client.GetPresetsAsync();
var voices  = await client.GetVoicesAsync();

// Stream speech — chunks arrive as they are synthesized
var progress = new Progress<AudioChunk>(chunk =>
{
    // Feed chunk.PcmData (PCM16, mono) to your audio output
});

await client.SpeakAsync(
    new SpeakRequest("Hello from the SDK.", presets[0], voices[0]),
    progress);
```

Nessuna dipendenza da MAUI. Funziona in applicazioni console, WPF, ASP.NET o in qualsiasi cosa che utilizzi .NET 8+.

### Configurazione

Il client legge `SOUNDBOARD_BASE_URL` dall'ambiente, con valore predefinito `http://localhost:8765`. Sovrascrivila nel codice:

```csharp
var client = new SoundboardClient(new SoundboardClientOptions
{
    BaseUrl = "http://my-engine:9000",
    HttpTimeout = TimeSpan.FromSeconds(15),
    WebSocketConnectTimeout = TimeSpan.FromSeconds(10),
    WebSocketReceiveTimeout = TimeSpan.FromSeconds(60)
});
```

### Interfaccia SDK

| Metodo | Descrizione |
|---|---|
| `GetHealthAsync()` | Controllo dello stato del motore — restituisce informazioni sulla versione e sullo stato di disponibilità. |
| `GetPresetsAsync()` | Elenca gli identificatori di preset disponibili (ad esempio, `narrator`, `conversational`). |
| `GetVoicesAsync()` | Elenca gli identificatori delle voci disponibili. |
| `SpeakAsync(request, progress)` | Esegue lo streaming del discorso sintetizzato; segnala `AudioChunk` tramite `IProgress<T>`. |
| `StopAsync()` | Invia un comando di arresto al motore. |

Tutti i metodi accettano `CancellationToken`. Il client implementa `IAsyncDisposable`.

---

## Architettura

```
This repository
+-------------------------------------------+
|                                           |
|  Soundboard.Client (SDK)     net8.0+      |  <-- The product
|  Soundboard.Maui.Audio       net8.0       |  <-- NAudio adapter (Windows)
|  Soundboard.Maui             net10.0      |  <-- Reference client (MAUI)
|  soundboard-cli              net8.0       |  <-- Reference client (console)
|                                           |
+-------------------------------------------+
            |  HTTP (control) + WebSocket (audio)
            v
+-------------------------------------------+
|  voice-soundboard (engine repo)           |
|  Any engine implementing the API contract |
+-------------------------------------------+
```

**Piano di controllo** (HTTP) — stato, preset, voci, arresto.
**Piano dati** (WebSocket) — bidirezionale: i comandi di sintesi vengono inviati verso l'alto, i blocchi audio PCM16 vengono trasmessi verso il basso.

L'SDK gestisce automaticamente il ciclo di vita della connessione, la formattazione JSON, la decodifica base64, la chiusura corretta di WebSocket e i controlli di compatibilità della versione API.

---

## Installazione dal codice sorgente

### Prerequisiti

- SDK [.NET 10.0](https://dotnet.microsoft.com/) con workload MAUI (per l'applicazione desktop)
- SDK .NET 8.0 (sufficiente per l'SDK e la CLI)
- Windows 10/11 (per l'app MAUI e la riproduzione NAudio)
- Un motore [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) in esecuzione.

### Clona ed esegui

```bash
git clone https://github.com/mcp-tool-shop-org/soundboard-maui.git
cd soundboard-maui

# Run unit + integration tests (no engine required)
dotnet test

# Run the MAUI desktop app
set SOUNDBOARD_BASE_URL=http://localhost:8765
dotnet run --project src/Soundboard.Maui

# Run the CLI client
dotnet run --project src/soundboard-cli -- health
dotnet run --project src/soundboard-cli -- presets
dotnet run --project src/soundboard-cli -- speak "Hello world" --preset narrator
```

---

## Struttura del progetto

```
src/
  Soundboard.Client/         SDK — pure C#, net8.0/9.0/10.0, zero UI deps
  Soundboard.Maui.Audio/     NAudio PCM16 playback adapter (Windows, net8.0)
  Soundboard.Maui/           Reference desktop client (MAUI, net10.0)
  soundboard-cli/            Reference console client (net8.0)

examples/
  Quickstart/                Connect → speak → save WAV in 30 seconds
  AgentTool/                 SDK as a callable tool in an AI agent pipeline

tests/
  Soundboard.Client.Tests/         27 unit tests (no engine required)
  Soundboard.IntegrationTests/     17 integration + contract tests

docs/
  api.md                     SDK API reference (v1.0 stability guarantees)
  api-contract.md            Engine <-> SDK wire protocol
  compatibility.md           SDK-engine compatibility matrix & trust contract
  getting-started-sdk.md     SDK integration guide
  streaming-model.md         How audio streaming works
  error-model.md             Failure modes and handling
  feature-map.md             Feature-to-layer mapping
  known-limitations.md       Current boundaries
  evaluation-guide.md        How to evaluate Soundboard
  publishing.md              NuGet publish runbook
```

---

## Esempi

| Esempio | Cosa mostra |
|---|---|
| [Quickstart](examples/Quickstart/) | Connessione, sintesi vocale, salvataggio WAV — nessuna configurazione. |
| [Agent Tool](examples/AgentTool/) | SDK come strumento utilizzabile in una pipeline di un agente AI. |

---

## Documentazione

- [Come iniziare con l'SDK](docs/getting-started-sdk.md)
- [Modello di streaming](docs/streaming-model.md)
- [Modello di errore](docs/error-model.md)
- [Riferimento API](docs/api.md)
- [Contratto API](docs/api-contract.md)
- [Compatibilità e affidabilità](docs/compatibility.md)
- [Configurazione del motore](docs/engine-setup.md)
- [Guida all'aggiornamento e al rollback](docs/upgrade-playbook.md)
- [Pubblicazione dell'SDK](docs/publishing.md)
- [Verifica dell'installazione iniziale](docs/fresh-install.md)
- [Guida alla valutazione](docs/evaluation-guide.md)
- [Registro delle modifiche](CHANGELOG.md)
- [Come contribuire](CONTRIBUTING.md)

---

## FAQ

**Cos'è l'SDK?**
`Soundboard.Client` è una libreria .NET 8+ autonoma che gestisce tutte le comunicazioni con il motore, inclusi i controlli di stato, la scoperta e lo streaming vocale tramite WebSocket. È possibile utilizzarla in qualsiasi progetto .NET.

**Cos'è l'app MAUI?**
È un client di esempio che dimostra l'utilizzo dell'SDK con un'interfaccia utente desktop. Non è il prodotto vero e proprio, ma mostra un modo per utilizzare l'SDK.

**È pronto per l'uso in produzione?**
L'API dell'SDK (versione 1.0) è stabile. L'app MAUI è di livello dimostrativo. Consultare le [limitazioni note](docs/known-limitations.md).

**Posso creare la mia interfaccia utente?**
Sì, certo. È proprio questo lo scopo. L'SDK non ha dipendenze relative all'interfaccia utente. Implementare `IAudioPlayer` per la propria piattaforma e procedere.

**Dove si trova il motore?**
In un repository separato: [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard). Questo repository non contiene codice del motore.

---

## Licenza

Questo progetto è concesso in licenza secondo i termini della [Licenza MIT](LICENSE).

---

## Link

- [Repository del motore](https://github.com/mcp-tool-shop-org/voice-soundboard)
- [MCP Tool Shop](https://mcptoolshop.com)
- [Soundboard.Client su NuGet](https://www.nuget.org/packages/Soundboard.Client)
- [Soundboard.Maui.Audio su NuGet](https://www.nuget.org/packages/Soundboard.Maui.Audio)
- [Limitazioni note](docs/known-limitations.md)
