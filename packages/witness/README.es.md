<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/witness/readme.png" alt="Witness" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/witness/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/witness/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/xrpl-witness/"><img src="https://img.shields.io/pypi/v/xrpl-witness" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/witness/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Estado: v0.1.0 — Fase 1 completada, Fase 2A implementada**

Un registro de eventos criptográficamente verificable, de solo escritura y centrado en el dispositivo local, para el trabajo entre humanos e IA.

## Lo que puede hacer hoy

```bash
# Generate a testimony report
witness testify --format json --emit-artifact ./output

# Verify events cryptographically
witness verify

# Include exact stored JSON for deep audits
witness testify --format json --include-events
```

**Terceros pueden validar los testimonios sin instalar Witness** — el esquema JSON y las reglas de verificación están completamente documentados.

## Por qué es importante

Witness crea rastros de evidencia portátiles:
- **Determinista**: Las mismas entradas → los mismos bytes de salida (use `--generated-at` para la reproducibilidad)
- **Verificable**: Firmas Ed25519 + resúmenes SHA-256 sobre JSON canónico
- **Portátil**: Envíelo por correo electrónico, adjúntelo a tickets, inclúyalo en un repositorio
- **Exacto**: `--include-events` incrusta el contenido del almacenamiento byte por byte

## Guía de inicio rápido

```bash
# Install
pip install cryptography

# Initialize a store
witness init

# Record an event
witness record --action "example.action" --intent "Demonstrate recording"

# Generate testimony
witness testify --format md

# Verify all events
witness verify
```

## Modelo de confianza

Todas las operaciones criptográficas utilizan **JSON canónico** → **resúmenes SHA-256** → **firmas Ed25519**.

Consulte [VERIFICATION.md](VERIFICATION.md) para:
- Reglas de serialización exactas
- Ejemplos de verificación
- Códigos de salida (0 = correcto, 2 = banderas, 3 = fallo de criptografía)
- Notas de privacidad para `--include-events`

## Garantías estables

| Artefacto | Ubicación | Contrato |
|----------|----------|----------|
| Esquema de eventos | Pruebas de referencia | `tests/fixtures/golden/*.json` |
| Esquema de testimonios | `schemas/testimony.schema.v0.1.json` | Estructura de la salida JSON |
| Códigos de salida | [VERIFICATION.md](VERIFICATION.md) | Semántica de 0/2/3 |
| Flags | [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | 4 tipos de banderas, solo informativas |

## Documentación

> **Comience aquí:** [CONTRACT.md](CONTRACT.md) — ¿Qué es la ley frente a un ejemplo?

| Documento | Propósito |
|----------|---------|
| [CONTRACT.md](CONTRACT.md) | Contenido normativo frente a ejemplos |
| [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | Invariantes bloqueadas |
| [VERIFICATION.md](VERIFICATION.md) | Reglas de criptografía + ejemplos |
| [docs/](docs/README.md) | Índice completo de la documentación |

## Estado de la Fase 2

| Track | Estado |
|-------|--------|
| **2A: Testimonio como artefacto** | ✅ Implementado |
| **2B: Pipelines (Canales)** | ⏸️ En pausa ([RFC](docs/RFC_PHASE2_PIPELINES.md)) |
| 2C–2E | No iniciado |

Consulte [docs/PHASE2_STATUS.md](docs/PHASE2_STATUS.md) para obtener más detalles.

## Estructura del proyecto

```
witness/
├── src/witness/           # Core library
│   ├── canon.py           # Canonical JSON
│   ├── crypto.py          # Ed25519 signing/verification
│   ├── storage.py         # SQLite append-only store
│   ├── timeline.py        # Flag analysis
│   ├── testify.py         # Testimony generation
│   └── cli.py             # Command-line interface
├── schemas/               # JSON schemas
├── tests/                 # Test suite (124 tests)
│   └── fixtures/golden/   # Authoritative fixtures
├── tools/                 # Verification utilities
└── docs/                  # Documentation + ADRs
```

## Filosofía

> Witness se trata de la veracidad, no del juicio.
> Registre lo que sucedió. Verifíquelo más tarde. Deje que los humanos decidan lo que significa.

## Licencia

MIT — consulte [LICENSE](LICENSE).
