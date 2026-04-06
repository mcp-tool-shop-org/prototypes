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

**Un motore di provenienza Node.js minimalista, senza dipendenze, che implementa lo standard prov-spec.**

---

## Panoramica

- **Nessuna dipendenza** -- utilizza solo i moduli integrati di Node.js (`node:fs`, `node:crypto`, `node:process`)
- **Motore in un unico file** -- l'intera implementazione è contenuta in `prov-engine.js`
- **CLI + programmazione** -- può essere eseguito dalla riga di comando o importato nel proprio codice
- **Conforme a prov-spec L1** -- supera tutti i vettori di test di Livello 1 (Integrità)
- **Canonicalizzazione JCS-subset** -- serializzazione JSON deterministica secondo la sezione 6 dello standard prov-spec

---

## Installazione

```bash
# Add to your project
pnpm add @mcptoolshop/prov-engine-js

# Or run directly without installing
npx @mcptoolshop/prov-engine-js describe
```

È possibile clonare il repository ed eseguire il motore direttamente:

```bash
git clone https://github.com/mcp-tool-shop-org/prov-engine-js.git
cd prov-engine-js
node prov-engine.js describe
```

---

## Comandi CLI

Il motore espone cinque comandi. Tutto l'output è in formato JSON e viene scritto su stdout.

### `describe` -- Stampa il manifest delle funzionalità

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

### `digest <input.json>` -- Calcola la forma canonica e l'hash SHA-256

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

### `wrap <payload.json>` -- Incapsula il payload in una busta MCP

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

Se l'input è già una busta (`schema_version` è uguale a `mcp.envelope.v0.1`), viene passato invariato (senza doppia incapsulazione).

### `verify-digest <artifact.json>` -- Verifica una dichiarazione di hash

Il file di input deve contenere un campo `content` e un campo `digest` con i campi `alg` e `value`:

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

### `check-vector <vector-dir>` -- Esegue un vettore di test prov-spec

```bash
npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/integrity.digest.sha256
# PASS: integrity.digest.sha256 vector

npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/adapter.wrap.envelope_v0_1
# PASS: adapter.wrap.envelope_v0_1 vector
```

La directory del vettore deve contenere `input.json` e `expected.json`. Il motore rileva automaticamente il tipo di vettore in base alla forma dell'output previsto.

---

## Utilizzo programmatico

Il motore è un modulo ES. È possibile importare i suoi componenti interni per utilizzarli nel proprio codice:

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

> **Suggerimento:** In una versione futura, `canonicalize`, `computeDigest` e `wrapEnvelope` saranno esportati come esportazioni denominate, in modo da poter importare direttamente `canonicalize` da "@mcptoolshop/prov-engine-js".

---

## Metodi

| Metodo | Descrizione |
| -------- | ------------- |
| `integrity.digest.sha256` | Canonicalizza il JSON secondo la sezione 6 dello standard prov-spec, quindi calcola l'hash SHA-256 sui byte UTF-8. Restituisce `{ alg: "sha256", value: "<hex>" }`. |
| `adapter.wrap.envelope_v0_1` | Incapsula qualsiasi payload JSON in `{ schema_version: "mcp.envelope.v0.1", result: <payload> }`. Le buste già incapsulate vengono passate invariate. |

---

## Come funziona la canonicalizzazione

Lo standard prov-spec richiede una serializzazione JSON deterministica in modo che lo stesso oggetto logico produca sempre la stessa sequenza di byte (e quindi lo stesso hash). Questo motore implementa una canonicalizzazione JCS-subset secondo la sezione 6 dello standard prov-spec:

1. **Chiavi ordinate** -- Le chiavi degli oggetti vengono ordinate lessicograficamente in base all'ordine del codice Unicode.
2. **Nessuno spazio bianco** -- Nessuno spazio o nuova riga tra i token. I separatori sono solo `,` e `:`.
3. **Normalizzazione dei numeri** -- Nessun zero iniziale, nessun zero finale dopo il punto decimale, nessun segno positivo, `-0` diventa `0`.
4. **Escape minimo delle stringhe** -- Vengono emesse solo le sequenze di escape richieste.
5. **Codifica UTF-8** -- La stringa canonica viene codificata come UTF-8 prima dell'hashing.

Esempio: `{"b": 2, "a": 1}` viene canonizzato in `{"a":1,"b":2}`.

---

## Conformità

Questo motore dichiara uno stato di **conformità completa** per il **Livello 1 (Integrità)** dello standard prov-spec.

- Supera tutti i vettori di test `integrity.digest.sha256`
- Supera tutti i vettori di test `adapter.wrap.envelope_v0_1`
- Nessuna deviazione nota

Consultare `prov-capabilities.json` per il manifest completo delle funzionalità.

---

## Documentazione

| Documento | Descrizione |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | Guida approfondita: concetti di provenienza, meccanismi prov-spec, modelli di integrazione, architettura, FAQ |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Come contribuire, flusso di lavoro di sviluppo, principi di progettazione. |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Standard della comunità. |
| [CHANGELOG.md](CHANGELOG.md) | Cronologia delle versioni (in formato Changelog). |

---

## Licenza

[MIT](LICENSE)
