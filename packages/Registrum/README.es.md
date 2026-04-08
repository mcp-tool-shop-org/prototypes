<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Registrum/readme.png" width="400" alt="Registrum">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcp-tool-shop/registrum"><img src="https://img.shields.io/npm/v/@mcp-tool-shop/registrum" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/Registrum/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/Registrum/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center"><strong>Un registro determinista con doble verificación, gobernado y con un historial reproducible, y con una opción de certificación externa.</strong></p>

---

## ¿Qué es Registrum?

Registrum es un **registro estructural** — una biblioteca que registra, valida y ordena las transiciones de estado bajo restricciones explícitas, de modo que la estructura permanezca interpretable a medida que aumenta la entropía.

| Propiedad | Significado |
|----------|---------|
| **Structural** | Opera sobre la forma, no sobre el significado. |
| **Deterministic** | Las mismas entradas → los mismos resultados, siempre. |
| **Fail-closed** | Una entrada inválida causa un fallo total, no una recuperación parcial. |
| **Replayable** | Las decisiones históricas se pueden volver a ejecutar con resultados idénticos. |
| **Non-agentic** | Nunca actúa, decide ni optimiza. |

**Registrum garantiza que el cambio siga siendo legible.**

---

## ¿Por qué Registrum?

Los sistemas evolucionan. La entropía aumenta. La estructura se deteriora.

La mayoría de las herramientas responden a esto agregando inteligencia: optimizadores, agentes, capas de auto-reparación. Registrum adopta un enfoque opuesto: **agrega restricciones**.

- **Para los autores de bibliotecas**: Incorpore garantías estructurales en la gestión del estado para que los usuarios hereden la legibilidad de forma gratuita.
- **Para los sistemas críticos para la auditoría**: Cada transición de estado es determinista, reproducible y verificable de forma independiente.
- **Para los equipos que resisten la complejidad**: Registrum rechaza las transiciones inválidas con veredictos estructurados en lugar de degradarse silenciosamente.

El resultado: un sistema en el que la identidad, el linaje y el orden permanecen inspectables, independientemente de cuántos cambios hayan ocurrido.

---

## Principio fundamental

> **Se permite la entropía. La ilegibilidad no.**

Registrum no reduce la entropía globalmente.
Restringe dónde puede existir la entropía para que la identidad, el linaje y la estructura permanezcan inspectables con el tiempo.

---

## Qué no es Registrum

Registrum **no es explícitamente**:

- Un optimizador, agente o tomador de decisiones.
- Un controlador, recomendador o inteligencia.
- Adaptativo, de aprendizaje o de auto-reparación.

Nunca responde a la pregunta de *qué es importante*.
Solo preserva las condiciones bajo las cuales esa pregunta sigue siendo respondible.

---

## Descripción general de la arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                  StructuralRegistrar                     │
│                                                         │
│  ┌───────────────┐         ┌──────────────────────┐     │
│  │  Registry      │  parity │  Legacy              │     │
│  │  (RPEG v1 DSL) │◄──────►│  (TS predicates)     │     │
│  │  [primary]     │         │  [secondary witness] │     │
│  └───────┬───────┘         └──────────┬───────────┘     │
│          │         agree?             │                  │
│          └────────────┬───────────────┘                  │
│                       ▼                                  │
│              11 Structural Invariants                    │
│         ┌──────────┬──────────┬──────────┐              │
│         │ Identity │ Lineage  │ Ordering │              │
│         │  (3)     │  (4)     │  (4)     │              │
│         └──────────┴──────────┴──────────┘              │
│                       │                                  │
│          ┌────────────┴────────────┐                     │
│          ▼                         ▼                     │
│     ✅ Accepted                ❌ Refused                │
│     (stateId, orderIndex)      (violations[])            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Persistence: Snapshot · Replay · Rehydrate      │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Attestation (optional): XRPL witness ledger     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Cómo funciona Registrum

### Registro estructural

El registro es la única autoridad constitucional:

- Valida todas las transiciones de estado contra **11 invariantes estructurales**.
- Aplica restricciones de identidad, linaje y orden.
- Garantiza el determinismo y la trazabilidad.
- Detecta violaciones sin resolverlas (falla segura).

Todo se registra a través de él. Nada lo evita.

### Los 11 invariantes

| Clase | Conteo | Propósito |
|-------|-------|---------|
| **Identity** | 3 | Único, inmutable, con dirección de contenido. |
| **Lineage** | 4 | Parentesco válido, sin ciclos, trazable. |
| **Ordering** | 4 | Monotónico, sin lagunas, determinista. |

Estos invariantes son constitucionales. Cambiarlos requiere una gobernanza formal.

---

## Doble autoridad constitucional

Registrum mantiene **dos motores de invariantes independientes**:

| Autoridad | Rol | Implementación |
|---------|------|----------------|
| **Registry** | Autoridad principal | DSL compilado (RPEG v1) |
| **Legacy** | Autoridad secundaria | Predicados de TypeScript |

A partir de la Fase H, **el registro es el motor constitucional predeterminado**.
Legacy permanece como una autoridad secundaria independiente.

### ¿Por qué dos autoridades?

- **Se requiere acuerdo**: Ambos deben aceptar para que una transición sea válida.
- **El desacuerdo detiene**: La divergencia de paridad detiene el sistema (falla segura).
- **La independencia es intencional**: Ninguno puede anular al otro.

Esta es una característica de seguridad y legibilidad, no una deuda técnica.
El modo dual es indefinido. No hay planes de eliminar ninguna de las funciones de verificación.

### Evidencia de Paridad

274 pruebas demuestran la equivalencia de comportamiento:
- 58 pruebas de paridad en todas las clases invariantes.
- 12 pruebas de paridad de persistencia (estabilidad temporal).
- Paridad de repetición: ejecución en vivo ≡ ejecución repetida.

---

## Historial, Repetición y Auditabilidad

| Capacidad | Descripción |
|------------|-------------|
| **Snapshot** | Esquema versionado (`RegistrarSnapshotV1`), hashes con direccionamiento de contenido, serialización determinista. |
| **Replay** | Reejecución en modo de solo lectura contra un registrador nuevo: demuestra el determinismo temporal. |
| **Audit** | Cada juicio estructural es reproducible, independiente del contexto y verificable por cualquier parte que tenga la instantánea. |

---

## Atestación Externa (Opcional)

Registrum puede emitir opcionalmente atestaciones criptográficas a un registro inmutable externo (como XRPL) para la verificación pública.

| Propiedad | Valor |
|----------|-------|
| Predeterminado | Deshabilitado |
| Autoridad | No autoritativo (solo verificación) |
| Efecto en el comportamiento | Ninguno |

Las atestaciones registran *qué* decidió Registrum.
Registrum decide *qué* es válido.

**La autoridad fluye hacia adentro. La verificación fluye hacia afuera.**

Ver:
- [`docs/WHY_XRPL.md`](docs/WHY_XRPL.md) — Justificación
- [`docs/ATTESTATION_SPEC.md`](docs/ATTESTATION_SPEC.md) — Especificación

---

## Cómo empezar

### Instalación

```bash
npm install @mcp-tool-shop/registrum
```

### Guía rápida

```typescript
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";

const registrar = new StructuralRegistrar({ mode: "legacy" });

// Register a root state
const result = registrar.register({
  from: null,
  to: { id: "state-1", structure: { version: 1 }, data: {} },
});

if (result.kind === "accepted") {
  console.log(`Registered at index ${result.orderIndex}`);
} else {
  // Structured refusal — the violations name which invariants failed
  console.log(`Refused: ${result.violations.map((v) => v.invariantId)}`);
}
```

### Modos

| Modo | Motor | Cuándo usar |
|------|--------|-------------|
| `"legacy"` | Predicados de TypeScript | Prototipado rápido, sin dependencias externas. |
| `"registry"` (predeterminado) | DSL de RPEG v1 compilado | Uso en producción con doble verificación completa. |

```typescript
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";
import { loadCompiledRegistry } from "@mcp-tool-shop/registrum/registry";

// Registry mode (default) — compiled DSL + legacy as dual witnesses
const compiledRegistry = loadCompiledRegistry();
const registrar = new StructuralRegistrar({ compiledRegistry });
```

### Ejemplos

El directorio [`examples/`](examples/) contiene demostraciones ilustrativas (no API estable).
Requieren [`tsx`](https://github.com/esbuild-kit/tsx):

```bash
npm run example:refusal        # Refusal-as-success demo
npx tsx examples/refusal-as-success.ts   # Or run directly
```

---

## Referencia rápida de la API

### Exportaciones principales

```typescript
// Implementation
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";

// Types
import type {
  State,          // { id, structure, data }
  Transition,     // { from, to, metadata? }
  RegistrationResult,   // { kind: "accepted" | "refused", ... }
  Invariant,      // { id, scope, check }
  InvariantViolation,   // { invariantId, classification, message }
} from "@mcp-tool-shop/registrum";

// Invariants
import {
  INITIAL_INVARIANTS,     // All 11 invariants
  getInvariantsByScope,   // Filter by "identity" | "lineage" | "ordering"
  getInvariantById,       // Lookup by invariant ID
} from "@mcp-tool-shop/registrum";

// Version
import { REGISTRUM_VERSION } from "@mcp-tool-shop/registrum";
```

### `StructuralRegistrar`

| Método | Retorna | Descripción |
|--------|---------|-------------|
| `register(transition)` | `RegistrationResult` | Valida y registra una transición de estado. |
| `getState(id)` | `State \ | indefinido` | Recupera un estado registrado por ID. |
| `getHistory()` | `Transition[]` | Historial completo y ordenado de transiciones aceptadas. |
| `snapshot()` | `RegistrarSnapshotV1` | Instantánea determinista con direccionamiento de contenido. |

---

## Gobernanza

Registrum se rige bajo un **modelo constitucional**.

| Principio | Significado |
|-----------|---------|
| Garantías de comportamiento > velocidad de desarrollo de funciones. | La corrección tiene prioridad. |
| Solo se aceptan cambios basados en evidencia. | No se permiten cambios sin prueba. |
| Se requiere un proceso formal. | Propuestas, artefactos, decisiones. |

### Estado actual

- **Fase H**: Completada (registro predeterminado, verificación habilitada).
- **Gobernanza**: Activa y aplicada.
- **Todos los cambios**: Requieren un proceso de gobernanza formal.

Todos los cambios futuros son decisiones de gobernanza, no tareas de ingeniería.

Ver:
- [`docs/governance/PHILOSOPHY.md`](docs/governance/PHILOSOPHY.md) — Por qué existe la gobernanza.
- [`docs/governance/SCOPE.md`](docs/governance/SCOPE.md) — Qué está sujeto a gobernanza.
- [`docs/GOVERNANCE_HANDOFF.md`](docs/GOVERNANCE_HANDOFF.md) — Transición a la gobernanza.

---

## Estado del proyecto

**Registrum ha alcanzado un estado final estable.**

| Fase | Estado | Evidencia |
|-------|--------|----------|
| A–C | Completada | Registrador principal, entorno de pruebas de paridad. |
| E | Completada | Persistencia, repetición, estabilidad temporal. |
| G | Completada | Marco de gobernanza |
| H | Completada | Registro predeterminado, con verificación habilitada. |

**Cobertura de pruebas**: 279 pruebas superadas en 14 conjuntos de pruebas.

El desarrollo ha pasado a la fase de mantenimiento. Los cambios futuros requieren gobernanza.

Ver: [`docs/STEWARD_CLOSING_NOTE.md`](docs/STEWARD_CLOSING_NOTE.md)

---

## Documentación

| Documento | Propósito |
|----------|---------|
| [`WHAT_REGISTRUM_IS.md`](docs/WHAT_REGISTRUM_IS.md) | Definición de identidad |
| [`PROVABLE_GUARANTEES.md`](docs/PROVABLE_GUARANTEES.md) | Declaraciones formales con evidencia. |
| [`INVARIANTS.md`](docs/INVARIANTS.md) | Referencia completa de invariantes. |
| [`FAILURE_BOUNDARIES.md`](docs/FAILURE_BOUNDARIES.md) | Condiciones de fallo crítico. |
| [`HISTORY_AND_REPLAY.md`](docs/HISTORY_AND_REPLAY.md) | Garantías temporales. |
| [`TUTORIAL_DUAL_WITNESS.md`](docs/TUTORIAL_DUAL_WITNESS.md) | Tutorial de arquitectura de doble testigo. |
| [`CANONICAL_SERIALIZATION.md`](docs/CANONICAL_SERIALIZATION.md) | Formato de instantánea (constitucional). |
| [`governance/DUAL_WITNESS_POLICY.md`](docs/governance/DUAL_WITNESS_POLICY.md) | Política de doble testigo. |

---

## Principios de diseño

- **Restricción** sobre el poder.
- **Legibilidad** sobre el rendimiento.
- **Limitaciones** sobre las heurísticas.
- **Inspección** sobre la intervención.
- **Detención** sobre la extensión interminable.

Registrum tiene éxito cuando se vuelve aburrido, confiable e inesperado.

---

## Seguridad y alcance de los datos

| Aspecto | Detalle |
|--------|--------|
| **Data touched** | Transiciones de estado en memoria, instantáneas JSON opcionales al sistema de archivos local. |
| **Data NOT touched** | Sin solicitudes de red, sin API externas, sin bases de datos, sin credenciales de usuario. |
| **Permissions** | Solo lectura/escritura en las rutas de instantáneas especificadas por el usuario (cuando se utiliza la persistencia). |
| **Network** | Ninguna: biblioteca completamente offline (la verificación de XRPL está deshabilitada de forma predeterminada). |
| **Telemetry** | Ninguna recopilada ni enviada. |

Ver [SECURITY.md](SECURITY.md) para informar sobre vulnerabilidades.

---

## Contribuciones

Registrum sigue un modelo de contribución basado en la gobernanza. Todos los cambios requieren propuestas formales con evidencia.

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para obtener la filosofía y el proceso de contribución completos.

---

## Cuadro de evaluación

| Categoría | Puntuación |
|----------|-------|
| A. Seguridad | 10 |
| B. Manejo de errores | 10 |
| C. Documentación para operadores | 10 |
| D. Higiene en el lanzamiento | 10 |
| E. Identidad (suave) | 10 |
| **Overall** | **50/50** |

> Auditoría completa: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

---

## Licencia

MIT

---

Desarrollado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
