<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/pocket-ledger/readme.png" width="400" alt="Pocket Ledger">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/pocket-ledger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Un'applicazione per Windows per la gestione personale delle finanze e il monitoraggio del budget, progettata per funzionare principalmente in locale. È pulita, semplice e incentrata sulla privacy.

## Filosofia

- **Priorità alla località (local-first)**: I tuoi dati finanziari rimangono sul tuo dispositivo. Non è necessaria la sincronizzazione con il cloud.
- **Privacy by design**: Assenza di telemetria, assenza di connessioni esterne a meno che tu non le abiliti esplicitamente.
- **Budgeting per "buste" (envelope budgeting)**: Metodologia collaudata che assegna una funzione a ogni euro.
- **Orientata agli obiettivi**: Concentrati su ciò per cui stai risparmiando, non solo su ciò che stai spendendo.

## Funzionalità (previste)

- [ ] Monitoraggio delle transazioni con categorie
- [ ] Sistema di budgeting basato su "buste"
- [ ] Obiettivi di risparmio con visualizzazione dei progressi
- [ ] Gestione delle transazioni ricorrenti
- [ ] Analisi visiva delle spese e report
- [ ] Supporto per più account
- [ ] Importazione/esportazione in formato CSV
- [ ] Supporto per temi chiari/scuri

## Tecnologie utilizzate

- **.NET 8** - Ambiente di esecuzione moderno e performante
- **WinUI 3 / Windows App SDK** - Esperienza nativa per Windows 11
- **SQLite** - Database locale e portatile
- **Clean Architecture** - Struttura modulare, manutenibile e testabile

## Struttura del progetto

```
src/
├── PocketLedger.Domain/        # Core entities and business rules
├── PocketLedger.Application/   # Use cases and application logic
├── PocketLedger.Infrastructure/# Data persistence, external services
└── PocketLedger.Desktop/       # WinUI 3 presentation layer
tests/
├── PocketLedger.Domain.Tests/
├── PocketLedger.Application.Tests/
└── PocketLedger.Infrastructure.Tests/
```

## Sviluppo

### Prerequisiti

- Windows 10/11
- Visual Studio 2022 (17.8+) o VS Code con C# Dev Kit
- .NET 8 SDK
- Windows App SDK

### Compilazione

```bash
dotnet build
```

### Esecuzione dei test

```bash
dotnet test
```

## Licenza

Licenza MIT - Consulta [LICENSE](LICENSE) per i dettagli.

## Contributi

I contributi sono benvenuti! Si prega di leggere le nostre linee guida per i contributi prima di inviare richieste di pull.

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
