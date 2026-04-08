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

**La implementación autorizada de CodeTeam** — una CLI y biblioteca basada en .NET para la verificación, aprobación y firma de paquetes.

## Estado

**Versión v0.2.0 publicada** — Ciclo de confianza criptográfico completo. Contrato de interoperabilidad bloqueado.

### Lo que es estable

Los siguientes elementos están congelados y protegidos por CI:

| Artefacto | Ubicación | Garantía |
| ---------- | ---------- | ----------- |
| Esquemas JSON | `/schemas/*.v0.1.json` | Solo se permiten cambios incrementales |
| Salida de la CLI `verify --json` | `codeteam.cli.verify.schema.v0.1.json` | Compatible con versiones anteriores |
| Códigos de error | `ErrorCode.cs` | No se eliminan ni se renombran elementos |
| Mapeo de severidad | `severity-map.v0.1.json` | Los nuevos códigos requieren un mapeo |

Las pruebas de interoperabilidad garantizan estos aspectos. Los cambios que rompen la compatibilidad fallan en la integración continua (CI).

## Paquetes NuGet

| Paquete | Descripción |
| --------- | ------------- |
| `CodeTeam` | Herramienta global de .NET para la verificación, aprobación y firma de paquetes. Instale con `dotnet tool install -g CodeTeam`. |
| `CodeTeam.Core` | Modelos de dominio, lógica de verificación, JSON canónico y evaluación de políticas basada en quórum. |
| `CodeTeam.Crypto` | Verificación de firmas Ed25519 y cálculo de resumen SHA-256 a través de NSec.Cryptography. |
| `CodeTeam.Packaging` | Lectura y verificación de paquetes con protección contra recorrido de directorios y validación de esquemas JSON. |

## Descripción general

CodeTeam Suite es la implementación de referencia a la que todas las extensiones del editor (VS Code, Visual Studio) hacen referencia. Las extensiones invocan la CLI y muestran los resultados; NO implementan la lógica de verificación.

## Arquitectura

```
CodeTeam.Core       → Domain models, status codes, error types
CodeTeam.Crypto     → Ed25519 signatures, SHA-256 hashing
CodeTeam.Packaging  → Package loading and verification
CodeTeam.Cli        → CLI entry point (codeteam verify/approve/sign)
```

## Uso de la CLI

```bash
# Verify a package
codeteam verify <package-path> --json

# Approve a package
codeteam approve <package-path> --key <key-id> --json

# Sign a package
codeteam sign <package-path> --key <key-id> --json
```

## Códigos de salida

| Code | Estado | Significado |
| ------ | -------- | --------- |
| 0 | OK_VERIFIED | Paquete verificado con firma válida |
| 1 | OK_UNSIGNED | Paquete válido pero sin firmar |
| 2 | FAIL_INTEGRITY | Archivo faltante, discrepancia de tamaño/resumen |
| 3 | FAIL_SCHEMA | La validación del esquema falló |
| 4 | FAIL_SIGNATURE | La verificación de la firma falló |
| 5 | FAIL_THRESHOLD | No se alcanzó el umbral de aprobación |
| 6 | FAIL_UNAUTHORIZED | Actor no autorizado |

## Documentación

- [CONTRACT.md](CONTRACT.md) — Semántica autorizada de paquetes
- [VERIFICATION.md](VERIFICATION.md) — Reglas normativas de verificación
- [docs/EDITOR_INTEGRATION.md](docs/EDITOR_INTEGRATION.md) — Contrato de extensión del editor (VS Code, Visual Studio)
- [docs/PRESS_KIT.md](docs/PRESS_KIT.md) — Material de marketing para el lanzamiento
- [docs/sealing.md](docs/sealing.md) — Diseño de sellado (informativo)

## Pruebas de referencia

Las pruebas de referencia definen los resultados de verificación esperados:

| Prueba | Estado esperado |
| --------- | ----------------- |
| `fixtures/minimal_unsigned/` | OK_UNSIGNED |
| `fixtures/approved_threshold_met/` | OK_UNSIGNED |
| `fixtures/signed_verified/` | OK_VERIFIED |
| `fixtures/tampered_artifact/` | FAIL_INTEGRITY |
| `fixtures/invalid_manifest/` | FAIL_SCHEMA |
| `fixtures/signed_verified_real/` | OK_VERIFIED |
| `fixtures/signed_invalid_sig/` | FAIL_SIGNATURE |

## Construcción

```bash
dotnet build
dotnet test
```

## Licencia

MIT
