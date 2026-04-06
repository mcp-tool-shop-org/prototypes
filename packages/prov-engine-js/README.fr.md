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

**Un moteur de traçabilité minimaliste pour Node.js, sans dépendances externes, implémentant la norme prov-spec.**

---

## Aperçu

- **Aucune dépendance** -- utilise uniquement les modules intégrés de Node.js (`node:fs`, `node:crypto`, `node:process`)
- **Moteur en un seul fichier** -- toute l'implémentation se trouve dans `prov-engine.js`
- **CLI + programmatique** -- exécution depuis la ligne de commande ou importation dans votre propre code
- **Conforme à la norme prov-spec L1** -- passe tous les vecteurs de test de niveau 1 (intégrité)
- **Normalisation canonique JCS-subset** -- sérialisation JSON déterministe selon la section 6 de la norme prov-spec

---

## Installation

```bash
# Add to your project
pnpm add @mcptoolshop/prov-engine-js

# Or run directly without installing
npx @mcptoolshop/prov-engine-js describe
```

Vous pouvez également cloner le dépôt et exécuter le moteur directement :

```bash
git clone https://github.com/mcp-tool-shop-org/prov-engine-js.git
cd prov-engine-js
node prov-engine.js describe
```

---

## Commandes CLI

Le moteur expose cinq commandes. Toute la sortie est au format JSON et est écrite vers la sortie standard (stdout).

### `describe` -- Affiche le manifeste des capacités

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

### `digest <input.json>` -- Calcule la forme canonique et le hachage SHA-256

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

### `wrap <payload.json>` -- Enveloppe la charge utile dans une enveloppe MCP

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

Si l'entrée est déjà une enveloppe (la valeur de `schema_version` est `mcp.envelope.v0.1`), elle est transmise sans modification (pas d'enveloppement double).

### `verify-digest <artifact.json>` -- Vérifie une affirmation de hachage

Le fichier d'entrée doit contenir un champ `content` et un champ `digest` avec les attributs `alg` et `value` :

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

### `check-vector <vector-dir>` -- Exécute un vecteur de test prov-spec

```bash
npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/integrity.digest.sha256
# PASS: integrity.digest.sha256 vector

npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/adapter.wrap.envelope_v0_1
# PASS: adapter.wrap.envelope_v0_1 vector
```

Le répertoire du vecteur doit contenir `input.json` et `expected.json`. Le moteur détecte automatiquement le type de vecteur à partir de la forme de la sortie attendue.

---

## Utilisation programmatique

Le moteur est un module ES. Vous pouvez importer ses éléments internes pour les utiliser dans votre propre code :

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

> **Conseil :** Une version future exportera `canonicalize`, `computeDigest` et `wrapEnvelope` en tant qu'exports nommés, afin que vous puissiez importer directement `canonicalize` depuis `@mcptoolshop/prov-engine-js`.

---

## Méthodes

| Méthode | Description |
| -------- | ------------- |
| `integrity.digest.sha256` | Normalise le JSON selon la section 6 de la norme prov-spec, puis calcule le hachage SHA-256 sur les octets UTF-8. Renvoie `{ alg: "sha256", value: "<hex>" }`. |
| `adapter.wrap.envelope_v0_1` | Enveloppe n'importe quelle charge utile JSON dans `{ schema_version: "mcp.envelope.v0.1", result: <payload> }`. Les enveloppes déjà enveloppées sont transmises sans modification. |

---

## Fonctionnement de la normalisation

La norme prov-spec exige une sérialisation JSON déterministe afin que le même objet logique produise toujours la même séquence d'octets (et donc le même hachage). Ce moteur implémente une normalisation canonique JCS-subset selon la section 6 de la norme prov-spec :

1. **Clés triées** -- Les clés des objets sont triées lexicographiquement selon l'ordre du code Unicode.
2. **Pas d'espaces blancs** -- Pas d'espaces ou de sauts de ligne entre les jetons. Les séparateurs sont uniquement les virgules (`,`) et les deux-points (`:`).
3. **Normalisation des nombres** -- Pas de zéros non significatifs, pas de zéros après la virgule, pas de signe positif, `-0` devient `0`.
4. **Échappement minimal des chaînes de caractères** -- Seules les séquences d'échappement requises sont émises.
5. **Encodage UTF-8** -- La chaîne de caractères canonique est encodée en UTF-8 avant le hachage.

Exemple : `{"b": 2, "a": 1}` est normalisé en `{"a":1,"b":2}`.

---

## Conformité

Ce moteur déclare un statut de **conformité totale** pour le **niveau 1 (intégrité)** de la norme prov-spec.

- Passe tous les vecteurs de test `integrity.digest.sha256`
- Passe tous les vecteurs de test `adapter.wrap.envelope_v0_1`
- Zéro écart connu

Consultez `prov-capabilities.json` pour le manifeste complet des capacités.

---

## Documentation

| Document | Description |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | Guide détaillé : concepts de traçabilité, mécanismes de la norme prov-spec, modèles d'intégration, architecture, FAQ. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Comment contribuer, flux de développement, principes de conception. |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Normes de la communauté. |
| [CHANGELOG.md](CHANGELOG.md) | Historique des versions (format Changelog). |

---

## Licence

[MIT](LICENSE)
