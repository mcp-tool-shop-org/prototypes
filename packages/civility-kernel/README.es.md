<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<div align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/civility-kernel/readme.png" alt="civility-kernel logo" width="360" />
</div>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/civility-kernel/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/civility-kernel"><img src="https://img.shields.io/npm/v/%40mcptoolshop%2Fcivility-kernel" alt="npm version"></a>
</p>

Una capa de políticas que hace que el comportamiento del agente esté **regido por preferencias**, en lugar de simplemente maximizar la eficiencia.

Su agente genera planes candidatos. El núcleo decide qué sucede a continuación:

**generar → filtrar (restricciones estrictas) → puntuar (pesos) → elegir O preguntar**

Las restricciones estrictas son innegociables. Las preferencias suaves guían los compromisos. La incertidumbre puede forzar la opción de "preguntar al humano".

---

## Instalar

```bash
npm i @mcptoolshop/civility-kernel
```

## Comienzo rápido

```typescript
import { createKernel, PolicyBuilder } from '@mcptoolshop/civility-kernel';

const policy = new PolicyBuilder()
  .setWeight('efficiency', 0.6)
  .setWeight('low_risk', 0.4)
  .addConstraint('no_irreversible_changes')
  .setUncertaintyThreshold(0.5)
  .build();

const kernel = createKernel({ policy });
const trace = kernel.decide('default', [plan1, plan2]);
// trace.outcome: 'EXECUTE' | 'ASK_USER' | 'NO_VALID_PLAN'
```

El núcleo conecta las restricciones, los evaluadores y el motor de decisión en una sola llamada. Use `decideAsync()` para las comprobaciones de restricciones que requieren operaciones de entrada/salida.

## El ciclo de gobernanza humana

Siempre puede ver lo que hace su política.
El agente debe mostrar los cambios antes de que se apliquen.
Puede deshacer los cambios.
Nada se actualiza silenciosamente.

Previsualice el contrato de la política:
```bash
npm run policy:explain
```

Proponga una actualización (muestra las diferencias, solicita aprobación):
```bash
npm run policy:propose
```

Canonice el archivo de política actual (normalización de formato únicamente):
```bash
npm run policy:canonicalize
```

### Reversión automática segura

Al aplicar cambios, `policy-check` puede primero hacer una copia de seguridad de la política anterior:

```bash
npx tsx scripts/policy-check.ts policies/default.json --propose policies/proposed.json --write-prev policies/previous.json
```

## Archivos de políticas

Convención recomendada:

- `policies/default.json` — política activa
- `policies/previous.json` — objetivo de reversión automática
- `policies/profiles/*.json` — perfiles con nombre (trabajo / bajo costo / modo seguro)

## Opciones de la línea de comandos (policy-check)

- `--explain` — imprime un resumen de la política legible por humanos
- `--propose <file>` — análisis + muestra la diferencia canonizada + solicita aprobación
- `--apply` — reescribe el archivo de política en forma canonizada
- `--write-prev <file>` — hace una copia de seguridad de la política canonizada anterior antes de sobrescribirla
- `--diff short|full` — "short" muestra los cambios principales; "full" muestra todo
- `--prev <file>` — modo de diferencia determinista para CI

## API pública

**Kernel (punto de entrada recomendado):**

- `createKernel({ policy, constraints?, scorers?, onDecision? })` — fachada preconfigurada con decide, lint, explain, diff y aprendizaje
- `PolicyBuilder` — API fluida y encadenable para construir políticas validadas

**Operaciones de política:**

- `lintPolicy(policy, { registry, scorers })` — valida una política para detectar errores y advertencias
- `canonicalizePolicy(policy, registry)` — normaliza una política a su forma canónica
- `diffPolicy(a, b, registry?)` — diferencia estructurada entre dos políticas
- `explainPolicy(policy, registry, opts?)` — resumen de la política legible por humanos

**Persistencia:**

- `loadPolicy(json)` — carga de políticas con validación Zod a partir de una entrada desconocida
- `dumpPolicy(policy)` — serialización JSON determinista (claves ordenadas)
- `PreferencePolicySchema` — esquema Zod exportado para la validación en tiempo de ejecución

**Motor de decisión:**

- `DecisionEngine` — evalúa los planes candidatos según una política (filtrar → puntuar → elegir o preguntar)
- `decideAsync()` — variante asíncrona para las comprobaciones de restricciones que requieren operaciones de entrada/salida
- `compileEffectivePolicy(base, context, plans)` — aplica reglas de contexto (admite patrones glob como `tool:*`)
- `onDecision` hook — función de devolución de llamada opcional para el registro/las métricas en cada decisión

**Registros:**

- `ConstraintRegistry` — registra y evalúa restricciones estrictas (con esquemas de parámetros Zod opcionales + soporte asíncrono)
- `ScorerRegistry` — registra funciones de puntuación para las claves de peso
- `registerDefaultConstraints(registry)` — carga restricciones integradas (`no_irreversible_changes`, `max_spend_without_confirm`, `require_confirm_if`)
- `registerDefaultScorers(registry)` — carga evaluadores integrados (`efficiency`, `low_risk`, `concise`)

**Ciclo de aprendizaje:**

- `proposePolicyUpdates(policy, events)`: sugiere ajustes a la política a partir de eventos de retroalimentación del usuario.
- `applyPolicyProposal(policy, proposal)`: integra una propuesta de nuevo en la política (cierra el ciclo).
- Retroalimentación extendida: `CONSTRAINT_RELAXED`, `PLAN_EDITED`, `TIMEOUT`, `ABORT`.

**Integración con MCP:**

- `planFromMcpToolCall(call, meta?)`: convierte una llamada a una herramienta MCP en un Plan.
- `feedbackFromMcpResult(result, planId)`: convierte un resultado de MCP en un evento de retroalimentación.

**Utilidades:**

- `extractTags(plan)` / `annotatePlanWithTags(plan)`: etiqueta automáticamente los planes en función del contenido de los pasos.
- `matchesContext(pattern, context)`: coincidencia de patrones de contexto, con soporte para comodines.

## CI

Ejecuciones de CI:
- pruebas (143 pruebas en 17 archivos)
- compilación
- `policy-check --strict` contra archivos de configuración (`policies/default.json` vs `policies/previous.json`)

Esto evita la distribución de políticas defectuosas o diferencias engañosas.

## Desarrollo

```bash
npm test
npm run build
npm run example:basic
npm run policy:check
```

## Seguridad y alcance de datos

El kernel de Civility es una **biblioteca pura**: no realiza solicitudes de red, no recopila datos de telemetría, no tiene efectos secundarios.

- **Datos accedidos:** Lee archivos de política JSON del sistema de archivos local. Valida, normaliza y compara documentos de política en memoria. Todas las operaciones son deterministas.
- **Datos NO accedidos:** No realiza solicitudes de red. No recopila datos de telemetría. No almacena credenciales. El kernel evalúa las restricciones de la política; no observa ni registra las acciones del agente.
- **Permisos requeridos:** Permiso de lectura del sistema de archivos para los archivos JSON de la política. Permiso de escritura solo cuando se solicita explícitamente a través de `--apply`.

Consulte [SECURITY.md](SECURITY.md) para informar sobre vulnerabilidades.

---

## Evaluación

| Categoría | Puntuación |
|----------|-------|
| Seguridad | 10/10 |
| Manejo de errores | 10/10 |
| Documentación para operadores | 10/10 |
| Calidad del producto | 10/10 |
| Identidad | 10/10 |
| **Overall** | **50/50** |

---

## Licencia

MIT (consulte LICENSE)

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
