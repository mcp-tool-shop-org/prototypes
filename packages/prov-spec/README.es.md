> ⚠️ **Este repositorio se ha trasladado a [accessibility-suite](https://github.com/mcp-tool-shop-org/accessibility-suite)**
> El código fuente ahora se encuentra en: `docs/prov-spec/`

---

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/prov-spec/readme.png" alt="Prov-Spec — Provenance Specification Framework" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/prov-spec/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/prov-spec/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="spec/PROV_METHODS_SPEC.md"><img src="https://img.shields.io/badge/spec-v0.1.0-blue" alt="Spec Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/prov-spec/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Una especificación y conjunto de pruebas formales y versionadas para identificadores, registros y validación de métodos de trazabilidad.**

---

## ¿Qué es esto?

Una especificación normativa que define:
- **Identificadores de métodos** — identificadores estables y con espacio de nombres para operaciones de trazabilidad.
- **Registros de trazabilidad** — documentos JSON estructurados que registran las invocaciones de herramientas.
- **Niveles de conformidad** — niveles de cumplimiento verificables.
- **Vectores de prueba** — entradas/salidas canónicas para la interoperabilidad.

## ¿Qué no es esto?

- No es un framework.
- No es un SDK.
- No es específico de MCP.
- No es específico de Python.

## ¿Para quién es esto?

- **Desarrolladores de motores** — para implementar la trazabilidad en cualquier lenguaje.
- **Integradores de herramientas** — para integrar herramientas existentes con trazabilidad.
- **Auditores** — para verificar las afirmaciones de trazabilidad.
- **Constructores de infraestructura** — para construir sistemas con conocimiento de la trazabilidad.

---

## Garantía de estabilidad

> **Los identificadores de métodos marcados como `estables` son de solo escritura y nunca cambiarán su significado.**
> **Se garantiza la compatibilidad dentro de una versión principal.**

---

## Comienzo rápido

### Verificación en 10 segundos

```bash
# Clone and run a test vector
git clone https://github.com/mcp-tool-shop-org/prov-spec
cd prov-spec
python tools/python/prov_validator.py check-vector integrity.digest.sha256
```

Resultado esperado: `INFO: Test vector integrity.digest.sha256 passed`

---

### 1. Comprender la especificación

Lea [`spec/PROV_METHODS_SPEC.md`](spec/PROV_METHODS_SPEC.md) — la especificación normativa.

### 2. Consultar el catálogo

Explore [`spec/methods.json`](spec/methods.json) — registro de métodos legible por máquina.

### 3. Declarar la conformidad

Incluya un archivo `prov-capabilities.json` en su proyecto:

```json
{
  "schema": "prov-capabilities@v0.1",
  "engine": {
    "name": "your-engine",
    "version": "1.0.0"
  },
  "implements": [
    "adapter.wrap.envelope_v0_1",
    "integrity.digest.sha256"
  ],
  "conformance_level": "fully-conformant"
}
```

### 4. Validar (opcional)

Utilice el validador de referencia:

```bash
# List known methods
python -m prov_validator list-methods

# Validate a provenance record
python -m prov_validator validate-methods record.json --strict

# Run test vectors
python -m prov_validator check-vector integrity.digest.sha256
```

---

## Estructura del repositorio

```
prov-spec/
├── spec/                    # Normative specification
│   ├── PROV_METHODS_SPEC.md # Main specification document
│   ├── methods.json         # Machine-readable method catalog
│   ├── schemas/             # JSON Schemas
│   │   ├── prov.record.schema.v0.1.json
│   │   ├── artifact.schema.v0.1.json
│   │   ├── evidence.schema.v0.1.json
│   │   ├── mcp.envelope.schema.v0.1.json
│   │   └── prov-capabilities.schema.json
│   └── vectors/             # Test vectors
│       ├── integrity.digest.sha256/
│       ├── adapter.wrap.envelope_v0_1/
│       └── ...
├── tools/                   # Reference implementations (optional)
│   └── python/              # Python reference validator
├── examples/                # Example files
├── CONFORMANCE_LEVELS.md    # Conformance tiers
└── CHANGELOG.md             # Version history
```

**Nota:** Se proporcionan herramientas de referencia para mayor comodidad y no son obligatorias para la conformidad.

---

## Niveles de conformidad

| Level | Name | Requisitos |
| ------- | ------ | -------------- |
| **1** | Integridad | Métodos `integrity.digest.*` |
| **2** | Motor | Nivel 1 + métodos `engine.*` |
| **3** | Linaje | Nivel 2 + métodos `lineage.*` |

Consulte [`CONFORMANCE_LEVELS.md`](CONFORMANCE_LEVELS.md) para obtener más detalles.

---

## Espacios de nombres de métodos

| Espacio de nombres | Propósito |
| ----------- | --------- |
| `adapter.*` | Envoltura, transporte |
| `engine.*` | Extracción de evidencia, construcción de trazabilidad |
| `integrity.*` | Hashing, firmas, verificación |
| `lineage.*` | Enlace a elementos padre, operaciones de grafo |

Reservado para uso futuro: `policy.*`, `attestation.*`, `execution.*`, `audit.*`

---

## Versionado

- **Versión de la especificación:** `v0.1.0`
- **Catálogo de métodos:** de solo escritura dentro de la versión principal.
- **Esquemas:** `additionalProperties: false` — compatible con versiones anteriores dentro del parche.

---

## Contribuciones

1. Nuevos identificadores de métodos: abra un problema con el caso de uso.
2. Aclaraciones de la especificación: envíe una solicitud de extracción a `spec/`.
3. Herramientas de referencia: envíe una solicitud de extracción a `tools/`.

Los identificadores de métodos requieren justificación en el mundo real. No agregamos identificadores especulativamente.

---

## Licencia

MIT — consulte [LICENSE](LICENSE)

---

## Referencias

- [PROV_METHODS_SPEC.md](spec/PROV_METHODS_SPEC.md) — Especificación normativa
- [PROV_METHODS_CATALOG.md](spec/PROV_METHODS_CATALOG.md) — Catálogo legible por humanos
- [CONFORMANCE_LEVELS.md](CONFORMANCE_LEVELS.md) — Niveles de conformidad
- [MCP_COMPATIBILITY.md](spec/MCP_COMPATIBILITY.md) — Compatibilidad con MCP
