<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/prov-engine-js/readme.png" alt="prov-engine-js" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/prov-engine-js/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/prov-engine-js/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/prov-engine-js"><img src="https://img.shields.io/npm/v/@mcptoolshop/prov-engine-js" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/prov-engine-js/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Un motor de trazabilidad minimalista y sin dependencias para Node.js que implementa el estándar prov-spec.**

---

## Descripción general

- **Sin dependencias** -- utiliza solo módulos integrados de Node.js (`node:fs`, `node:crypto`, `node:process`)
- **Motor de un solo archivo** -- toda la implementación se encuentra en `prov-engine.js`
- **CLI + programático** -- se puede ejecutar desde la línea de comandos o importar en su propio código
- **Cumple con el nivel 1 (Integridad) de prov-spec** -- pasa todos los vectores de prueba de nivel 1
- **Canonicalización de subconjunto JCS** -- serialización JSON determinista según la sección 6 de prov-spec

---

## Instalación

```bash
# Add to your project
pnpm add @mcptoolshop/prov-engine-js

# Or run directly without installing
npx @mcptoolshop/prov-engine-js describe
```

También puede clonar el repositorio y ejecutar el motor directamente:

```bash
git clone https://github.com/mcp-tool-shop-org/prov-engine-js.git
cd prov-engine-js
node prov-engine.js describe
```

---

## Comandos de la CLI

El motor expone cinco comandos. Toda la salida es JSON y se escribe en la salida estándar.

### `describe` -- Imprime el manifiesto de capacidades

```bash
npx @mcptoolshop/prov-engine-js describe
```

```json
{
  "schema": "prov-capabilities@v0.1",
  "engine": {
    "name": "prov-engine-js",
    "version": "0.1.0",
    "vendor": "prov-spec",
    "repo": "https://github.com/mcp-tool-shop-org/prov-engine-js",
    "license": "MIT"
  },
  "implements": [
    "adapter.wrap.envelope_v0_1",
    "integrity.digest.sha256"
  ],
  "conformance_level": "fully-conformant"
}
```

### `digest <input.json>` -- Calcula la forma canónica y el resumen SHA-256

```bash
echo '{"b":2,"a":1}' > input.json
npx @mcptoolshop/prov-engine-js digest input.json
```

```json
{
  "canonical_form": "{\"a\":1,\"b\":2}",
  "digest": {
    "alg": "sha256",
    "value": "abd8d7fa4bab05cdd8da39bee28237e3b2c9cb08ccfc73e0af3e5a6f17eaee5a"
  }
}
```

### `wrap <payload.json>` -- Envuelve la carga útil en un sobre MCP

```bash
echo '{"tool":"example","result":"ok"}' > payload.json
npx @mcptoolshop/prov-engine-js wrap payload.json
```

```json
{
  "schema_version": "mcp.envelope.v0.1",
  "result": {
    "tool": "example",
    "result": "ok"
  }
}
```

Si la entrada ya es un sobre (el `schema_version` es igual a `mcp.envelope.v0.1`), se pasa sin cambios (sin doble envoltorio).

### `verify-digest <artifact.json>` -- Verifica una reclamación de resumen

El archivo de entrada debe contener un campo `content` y un campo `digest` con `alg` y `value`:

```bash
cat > artifact.json << 'EOF'
{
  "content": {"a": 1, "b": 2},
  "digest": {
    "alg": "sha256",
    "value": "abd8d7fa4bab05cdd8da39bee28237e3b2c9cb08ccfc73e0af3e5a6f17eaee5a"
  }
}
EOF
npx @mcptoolshop/prov-engine-js verify-digest artifact.json
# Exit code 0 = valid, exit code 1 = mismatch
echo $?  # 0
```

### `check-vector <vector-dir>` -- Ejecuta un vector de prueba de prov-spec

```bash
npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/integrity.digest.sha256
# PASS: integrity.digest.sha256 vector

npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/adapter.wrap.envelope_v0_1
# PASS: adapter.wrap.envelope_v0_1 vector
```

El directorio del vector debe contener `input.json` y `expected.json`. El motor detecta automáticamente el tipo de vector a partir de la forma de salida esperada.

---

## Uso programático

El motor es un módulo ES. Puede importar sus componentes internos para usarlos en su propio código:

```js
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

// -- Canonicalization (inline, since not exported yet) --
function canonicalize(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite numbers not allowed");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
  }
  throw new Error(`Non-JSON value type: ${typeof value}`);
}

// Compute a digest
const payload = { tool: "demo", version: 1 };
const canonical = canonicalize(payload);
const hash = createHash("sha256").update(canonical, "utf8").digest("hex");

console.log("Canonical:", canonical);
console.log("SHA-256:  ", hash);

// Wrap in an MCP envelope
const envelope = {
  schema_version: "mcp.envelope.v0.1",
  result: payload,
};
console.log("Envelope: ", JSON.stringify(envelope, null, 2));
```

> **Consejo:** En una futura versión, se exportarán `canonicalize`, `computeDigest` y `wrapEnvelope` como exportaciones con nombre para que pueda importar directamente `import { canonicalize } from "@mcptoolshop/prov-engine-js"`.

---

## Métodos

| Método | Descripción |
| -------- | ------------- |
| `integrity.digest.sha256` | Canonicaliza JSON según la sección 6 de prov-spec, y luego calcula el resumen SHA-256 sobre los bytes UTF-8. Devuelve `{ alg: "sha256", value: "<hex>" }`. |
| `adapter.wrap.envelope_v0_1` | Envuelve cualquier carga útil JSON en `{ schema_version: "mcp.envelope.v0.1", result: <payload> }`. Los sobres ya envueltos se pasan sin cambios. |

---

## Cómo funciona la canonicalización

prov-spec requiere una serialización JSON determinista para que el mismo objeto lógico siempre produzca la misma secuencia de bytes (y, por lo tanto, el mismo resumen). Este motor implementa una canonicalización de subconjunto JCS según la sección 6 de prov-spec:

1. **Claves ordenadas** -- Las claves del objeto se ordenan lexicográficamente según el orden del código Unicode.
2. **Sin espacios en blanco** -- No hay espacios ni saltos de línea entre los tokens. Los separadores son solo `,` y `:`.
3. **Normalización de números** -- No hay ceros iniciales, no hay ceros finales después del punto decimal, no hay signo positivo, `-0` se convierte en `0`.
4. **Escape mínimo de cadenas** -- Solo se emiten las secuencias de escape necesarias.
5. **Codificación UTF-8** -- La cadena canónica se codifica como UTF-8 antes de calcular el hash.

Ejemplo: `{"b": 2, "a": 1}` se canonicaliza a `{"a":1,"b":2}`.

---

## Cumplimiento

Este motor declara un estado de **cumplimiento total** para el **nivel 1 (Integridad)** del estándar prov-spec.

- Pasa todos los vectores de prueba `integrity.digest.sha256`
- Pasa todos los vectores de prueba `adapter.wrap.envelope_v0_1`
- Cero desviaciones conocidas

Consulte `prov-capabilities.json` para ver el manifiesto de capacidades completo.

---

## Documentación

| Documento | Descripción |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | Guía detallada: conceptos de trazabilidad, mecánica de prov-spec, patrones de integración, arquitectura, preguntas frecuentes. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Cómo contribuir, flujo de trabajo de desarrollo, principios de diseño. |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Normas de la comunidad. |
| [CHANGELOG.md](CHANGELOG.md) | Historial de versiones (en formato Changelog). |

---

## Licencia

[MIT](LICENSE)
