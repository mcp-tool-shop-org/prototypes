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

**L'implémentation de référence de CodeTeam** — une CLI et une bibliothèque basées sur .NET pour la vérification, l'approbation et la signature de paquets.

## Statut

**Version v0.2.0 publiée** — Boucle de confiance cryptographique complète. Contrat d'interopérabilité verrouillé.

### Ce qui est stable

Les éléments suivants sont figés et protégés par l'intégration continue (CI) :

| Artefact | Emplacement | Garantie |
| ---------- | ---------- | ----------- |
| Schémas JSON | `/schemas/*.v0.1.json` | Modifications additives uniquement |
| Sortie de la CLI `verify --json` | `codeteam.cli.verify.schema.v0.1.json` | Compatible avec les versions antérieures |
| Codes d'erreur | `ErrorCode.cs` | Aucune suppression ni aucun renommage |
| Mappage de la gravité | `severity-map.v0.1.json` | Les nouveaux codes nécessitent un mappage |

Les tests d'interopérabilité vérifient ces garanties. Les modifications incompatibles entraînent un échec de l'intégration continue.

## Paquets NuGet

| Paquet | Description |
| --------- | ------------- |
| `CodeTeam` | Outil global .NET pour la vérification, l'approbation et la signature de paquets. Installez avec `dotnet tool install -g CodeTeam`. |
| `CodeTeam.Core` | Modèles de domaine, logique de vérification, JSON canonique et évaluation de politique basée sur un quorum. |
| `CodeTeam.Crypto` | Vérification de signature Ed25519 et calcul de digest SHA-256 via NSec.Cryptography. |
| `CodeTeam.Packaging` | Lecture et vérification des paquets avec protection contre la traversée de chemins et validation de schéma JSON. |

## Aperçu

CodeTeam Suite est l'implémentation de référence à laquelle toutes les extensions d'éditeur (VS Code, Visual Studio) font référence. Les extensions invoquent la CLI et affichent les résultats ; elles NE mettent PAS en œuvre la logique de vérification.

## Architecture

```
CodeTeam.Core       → Domain models, status codes, error types
CodeTeam.Crypto     → Ed25519 signatures, SHA-256 hashing
CodeTeam.Packaging  → Package loading and verification
CodeTeam.Cli        → CLI entry point (codeteam verify/approve/sign)
```

## Utilisation de la CLI

```bash
# Verify a package
codeteam verify <package-path> --json

# Approve a package
codeteam approve <package-path> --key <key-id> --json

# Sign a package
codeteam sign <package-path> --key <key-id> --json
```

## Codes de sortie

| Code | Statut | Signification |
| ------ | -------- | --------- |
| 0 | OK_VERIFIED | Paquet vérifié avec une signature valide |
| 1 | OK_UNSIGNED | Paquet valide mais non signé |
| 2 | FAIL_INTEGRITY | Fichier manquant, incompatibilité de taille/digest |
| 3 | FAIL_SCHEMA | La validation du schéma a échoué |
| 4 | FAIL_SIGNATURE | La vérification de la signature a échoué |
| 5 | FAIL_THRESHOLD | Le seuil d'approbation n'est pas atteint |
| 6 | FAIL_UNAUTHORIZED | L'acteur n'est pas autorisé |

## Documentation

- [CONTRACT.md](CONTRACT.md) — Sémantique des paquets de référence
- [VERIFICATION.md](VERIFICATION.md) — Règles de vérification normatives
- [docs/EDITOR_INTEGRATION.md](docs/EDITOR_INTEGRATION.md) — Contrat d'extension d'éditeur (VS Code, Visual Studio)
- [docs/PRESS_KIT.md](docs/PRESS_KIT.md) — Matériel de marketing de la version
- [docs/sealing.md](docs/sealing.md) — Conception de scellement (informatif)

## Fixtures de référence

Les fixtures de test définissent les résultats de vérification attendus :

| Fixture | Statut attendu |
| --------- | ----------------- |
| `fixtures/minimal_unsigned/` | OK_UNSIGNED |
| `fixtures/approved_threshold_met/` | OK_UNSIGNED |
| `fixtures/signed_verified/` | OK_VERIFIED |
| `fixtures/tampered_artifact/` | FAIL_INTEGRITY |
| `fixtures/invalid_manifest/` | FAIL_SCHEMA |
| `fixtures/signed_verified_real/` | OK_VERIFIED |
| `fixtures/signed_invalid_sig/` | FAIL_SIGNATURE |

## Construction

```bash
dotnet build
dotnet test
```

## Licence

MIT
