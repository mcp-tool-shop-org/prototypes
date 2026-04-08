<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/codeteam-suite/readme.png" alt="CodeTeam Suite" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/codeteam-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/codeteam-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/codeteam-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**L'implementazione autorevole di CodeTeam** — un'interfaccia a riga di comando (CLI) e una libreria basate su .NET per la verifica, l'approvazione e la firma dei pacchetti.

## Stato

**Versione v0.2.0 rilasciata** — Ciclo di fiducia crittografica completato. Contratto di interoperabilità definito.

### Cosa è stabile

I seguenti elementi sono stati bloccati e protetti tramite CI (Continuous Integration):

| Artefatto | Posizione | Garanzia |
| ---------- | ---------- | ----------- |
| Schemi JSON | `/schemas/*.v0.1.json` | Solo modifiche incrementali |
| Output della CLI `verify --json` | `codeteam.cli.verify.schema.v0.1.json` | Compatibile con versioni precedenti |
| Codici di errore | `ErrorCode.cs` | Nessuna rimozione o ridenominazione |
| Mappatura della gravità | `severity-map.v0.1.json` | I nuovi codici richiedono una mappatura |

I test di interoperabilità verificano queste garanzie. Le modifiche che le violano fanno fallire il CI.

## Pacchetti NuGet

| Pacchetto | Descrizione |
| --------- | ------------- |
| `CodeTeam` | Strumento globale .NET per la verifica, l'approvazione e la firma dei pacchetti. Installare con `dotnet tool install -g CodeTeam`. |
| `CodeTeam.Core` | Modelli di dominio, logica di verifica, JSON canonico e valutazione delle policy basata su quorum. |
| `CodeTeam.Crypto` | Verifica della firma Ed25519 e calcolo dell'hash SHA-256 tramite NSec.Cryptography. |
| `CodeTeam.Packaging` | Lettura e verifica dei pacchetti con protezione contro l'accesso ricorsivo alle directory e validazione dello schema JSON. |

## Panoramica

CodeTeam Suite è l'implementazione di riferimento a cui tutte le estensioni per editor (VS Code, Visual Studio) fanno riferimento. Le estensioni invocano la CLI e visualizzano i risultati; NON implementano la logica di verifica.

## Architettura

```
CodeTeam.Core       → Domain models, status codes, error types
CodeTeam.Crypto     → Ed25519 signatures, SHA-256 hashing
CodeTeam.Packaging  → Package loading and verification
CodeTeam.Cli        → CLI entry point (codeteam verify/approve/sign)
```

## Utilizzo della CLI

```bash
# Verify a package
codeteam verify <package-path> --json

# Approve a package
codeteam approve <package-path> --key <key-id> --json

# Sign a package
codeteam sign <package-path> --key <key-id> --json
```

## Codici di uscita

| Code | Stato | Significato |
| ------ | -------- | --------- |
| 0 | OK_VERIFIED | Pacchetto verificato con firma valida |
| 1 | OK_UNSIGNED | Pacchetto valido ma non firmato |
| 2 | FAIL_INTEGRITY | File mancante, discrepanza di dimensione/hash |
| 3 | FAIL_SCHEMA | Validazione dello schema fallita |
| 4 | FAIL_SIGNATURE | Verifica della firma fallita |
| 5 | FAIL_THRESHOLD | Soglia di approvazione non raggiunta |
| 6 | FAIL_UNAUTHORIZED | Utente non autorizzato |

## Documentazione

- [CONTRACT.md](CONTRACT.md) — Semantica dei pacchetti di riferimento
- [VERIFICATION.md](VERIFICATION.md) — Regole di verifica normative
- [docs/EDITOR_INTEGRATION.md](docs/EDITOR_INTEGRATION.md) — Contratto per le estensioni dell'editor (VS Code, Visual Studio)
- [docs/PRESS_KIT.md](docs/PRESS_KIT.md) — Materiale di marketing per il rilascio
- [docs/sealing.md](docs/sealing.md) — Progetto di sigillatura (informativo)

## Test di esempio

I test di esempio definiscono i risultati di verifica attesi:

| Test | Stato atteso |
| --------- | ----------------- |
| `fixtures/minimal_unsigned/` | OK_UNSIGNED |
| `fixtures/approved_threshold_met/` | OK_UNSIGNED |
| `fixtures/signed_verified/` | OK_VERIFIED |
| `fixtures/tampered_artifact/` | FAIL_INTEGRITY |
| `fixtures/invalid_manifest/` | FAIL_SCHEMA |
| `fixtures/signed_verified_real/` | OK_VERIFIED |
| `fixtures/signed_invalid_sig/` | FAIL_SIGNATURE |

## Compilazione

```bash
dotnet build
dotnet test
```

## Licenza

MIT
