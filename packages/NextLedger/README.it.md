<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# NextLedger

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/NextLedger/readme.png" alt="NextLedger" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/NextLedger/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/NextLedger/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/NextLedger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Budgeting per "bustoni" per Windows: dai a ogni euro una funzione.**

Un'applicazione per la gestione delle finanze personali per Windows che utilizza la metodologia del budgeting per "bustoni". I tuoi dati rimangono memorizzati localmente, senza la necessità di un servizio cloud. È stata progettata come un **registro del futuro**: un sistema autorevole di verità finanziarie con un controllo umano esplicito in ogni fase.

## Download

📦 **[Ultima versione](https://github.com/mcp-tool-shop-org/NextLedger/releases/latest)**

Scarica il file ZIP, estrailo ed esegui `NextLedger.App.exe`. Non è richiesta alcuna installazione.

## Cos'è il budgeting per "bustoni"?

Il budgeting per "bustoni" è un metodo semplice e collaudato in cui si distribuisce il proprio reddito in "bustoni" virtuali per diverse categorie di spesa. Si può spendere solo ciò che è presente in ogni "bustone", rendendo impossibile spendere più del dovuto.

## Funzionalità

- **Funzionamento offline**: i tuoi dati rimangono sul tuo computer. Non è necessario un servizio cloud.
- **Budgeting per "bustoni"**: assegna una funzione a ogni euro.
- **Conti multipli**: monitora conti correnti, risparmi, carte di credito e contanti.
- **Monitoraggio delle transazioni**: categorizza e cerca le tue spese.
- **Importazione CSV**: importa facilmente gli estratti conto bancari.
- **Riconciliazione**: confronta i tuoi registri con gli estratti conto bancari.
- **Nativo per Windows**: sviluppato con WinUI 3 per un'esperienza moderna su Windows.

## Screenshot

*In arrivo*

## Documentazione

- [Registro delle modifiche](CHANGELOG.md)
- [Codici di errore del motore](ENGINE_ERROR_CODES.md)
- [Processo di rilascio](docs/RELEASE_PROCESS.md)
- [Visione del registro del futuro](docs/FUTURE_LEDGER_VISION.md)
- [Checklist per l'esecuzione del registro](docs/LEDGER_EXECUTION_CHECKLIST.md)

## Tecnologie

- **Interfaccia utente**: WinUI 3 / Windows App SDK
- **Linguaggio**: C# / .NET 9
- **Database**: SQLite (locale)
- **Architettura**: Architettura pulita con MVVM

## Stato del progetto

✅ **v1.0.0** - Pronto per il rilascio

Funzionalità principali completate:
- Gestione del budget con allocazioni mensili
- Monitoraggio delle transazioni con supporto per le suddivisioni
- Importazione CSV dagli estratti conto bancari
- Riconciliazione dei conti
- Analisi delle spese per "bustone"
- Guida e suggerimenti integrati nell'applicazione

Consulta [DESIGN.md](DESIGN.md) per una descrizione dettagliata dell'architettura.

## Roadmap (Piano di sviluppo)

NextLedger si sta evolvendo verso un **registro del futuro**: consulta [Visione del registro del futuro](docs/FUTURE_LEDGER_VISION.md) per l'architettura completa.

| Layer | Stato | Descrizione |
| ------- | -------- | ------------- |
| Osservazione | ✅ Completato | Saldi, transazioni, conti locali |
| Interpretazione | ✅ Completato | Budgeting per "bustoni", analisi delle spese |
| Dichiarazione di intenti | 🔜 Previsto | Obiettivi di budget, regole di allocazione |
| Applicazione dei vincoli | 🔜 Previsto | Limiti di budget, protezione da eccessive spese |
| Esecuzione approvata dall'utente | 🔮 Futuro | Integrazione con Web3 (non custodiale) |

## Sviluppo

### Prerequisiti

- Windows 10 (1809+) o Windows 11
- Visual Studio (2022 17.8+ o versione successiva) con:
- Carico di lavoro per lo sviluppo di applicazioni desktop .NET
- Modelli Windows App SDK C#
- Windows SDK / MSIX (strumenti di build Appx/PRI)
- SDK .NET 9

**Nota sulle build da riga di comando (WinUI):** Il progetto WinUI (`NextLedger.App`) esegue passaggi di build del Windows App SDK che richiedono le assembly di attività MSBuild Appx/MSIX + PRI. Se si verifica un errore simile a `MSB4062` che fa riferimento alla mancanza di `Microsoft.Build.AppxPackage.dll` o `Microsoft.Build.Packaging.Pri.Tasks.dll`, installare i componenti Windows SDK / MSIX tramite l'installatore di Visual Studio (o creare l'applicazione direttamente all'interno di Visual Studio).

### Compilazione

```bash
dotnet restore
dotnet build
```

### Come eseguire l'applicazione

**Visual Studio (consigliato)**

1. Aprire `NextLedger.sln` in Visual Studio 2022.
2. Impostare `NextLedger.App` come progetto di avvio.
3. Eseguire con **F5**.

**Riga di comando (compilazione + avvio)**

```bash
dotnet build .\src\NextLedger.App\NextLedger.App.csproj -c Debug
```

Se questa operazione fallisce con `MSB4062`, consultare la nota nella sezione **Prerequisiti**.

Quindi, eseguire il file eseguibile generato dalla cartella di output della compilazione, che si trova in:

- `.\src\NextLedger.App\bin\Debug\net9.0-windows10.0.19041.0\`

**Posizione dei dati locali**

L'applicazione crea un database SQLite locale in:

- `%LOCALAPPDATA%\NextLedger\NextLedger.db`

### Esecuzione dei test

```bash
dotnet test
```

## Licenza

Licenza MIT - vedere il file LICENSE per i dettagli.

## Autore

Creato da [mcp-tool-shop](https://github.com/mcp-tool-shop-org)
