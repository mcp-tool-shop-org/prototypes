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

**Um motor de rastreabilidade (provenance) minimalista para Node.js, sem dependências externas, que implementa o padrão prov-spec.**

---

## Visão Geral

- **Sem dependências** -- utiliza apenas módulos nativos do Node.js (`node:fs`, `node:crypto`, `node:process`)
- **Motor em um único arquivo** -- toda a implementação está contida em `prov-engine.js`
- **CLI + Programático** -- pode ser executado a partir da linha de comando ou importado para o seu próprio código
- **Conforme ao prov-spec Nível 1** -- passa em todos os vetores de teste de Nível 1 (Integridade)
- **Normalização canônica JCS-subset** -- serialização JSON determinística conforme a Seção 6 do prov-spec

---

## Instalação

```bash
# Add to your project
pnpm add @mcptoolshop/prov-engine-js

# Or run directly without installing
npx @mcptoolshop/prov-engine-js describe
```

Você também pode clonar o repositório e executar o motor diretamente:

```bash
git clone https://github.com/mcp-tool-shop-org/prov-engine-js.git
cd prov-engine-js
node prov-engine.js describe
```

---

## Comandos da Linha de Comando (CLI)

O motor expõe cinco comandos. Toda a saída é em formato JSON e é escrita para a saída padrão (stdout).

### `describe` -- Imprime o manifesto de capacidades

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

### `digest <input.json>` -- Calcula a forma canônica e o digest SHA-256

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

### `wrap <payload.json>` -- Envolve o payload em um envelope MCP

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

Se a entrada já for um envelope (`schema_version` igual a `mcp.envelope.v0.1`), ela é passada sem alterações (sem encapsulamento duplo).

### `verify-digest <artifact.json>` -- Verifica uma declaração de digest

O arquivo de entrada deve conter um campo `content` e um campo `digest` com os campos `alg` e `value`:

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

### `check-vector <vector-dir>` -- Executa um vetor de teste do prov-spec

```bash
npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/integrity.digest.sha256
# PASS: integrity.digest.sha256 vector

npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/adapter.wrap.envelope_v0_1
# PASS: adapter.wrap.envelope_v0_1 vector
```

O diretório do vetor deve conter `input.json` e `expected.json`. O motor detecta automaticamente o tipo do vetor a partir da forma esperada da saída.

---

## Uso Programático

O motor é um módulo ES. Você pode importar seus componentes internos para usar em seu próprio código:

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

> **Dica:** Em uma futura versão, `canonicalize`, `computeDigest` e `wrapEnvelope` serão exportados como exportações nomeadas, para que você possa importar diretamente, por exemplo, `import { canonicalize } from "@mcptoolshop/prov-engine-js"`.

---

## Métodos

| Método | Descrição |
| -------- | ------------- |
| `integrity.digest.sha256` | Normaliza o JSON conforme a Seção 6 do prov-spec e, em seguida, calcula o digest SHA-256 sobre os bytes UTF-8. Retorna `{ alg: "sha256", value: "<hex>" }`. |
| `adapter.wrap.envelope_v0_1` | Envolve qualquer payload JSON em `{ schema_version: "mcp.envelope.v0.1", result: <payload> }`. Envelopes já encapsulados são passados sem alterações. |

---

## Como a Normalização Funciona

O prov-spec exige a serialização JSON determinística para que o mesmo objeto lógico sempre produza a mesma sequência de bytes (e, portanto, o mesmo digest). Este motor implementa uma normalização JCS-subset conforme a Seção 6 do prov-spec:

1. **Chaves ordenadas** -- As chaves do objeto são ordenadas lexicograficamente pela ordem do código Unicode.
2. **Sem espaços em branco** -- Não há espaços ou novas linhas entre os tokens. Os separadores são apenas `,` e `:`.
3. **Normalização de números** -- Sem zeros à esquerda, sem zeros à direita após o ponto decimal, sem sinal positivo, `-0` se torna `0`.
4. **Escape mínimo de strings** -- Apenas as sequências de escape necessárias são emitidas.
5. **Codificação UTF-8** -- A string canônica é codificada como UTF-8 antes de ser utilizada para o cálculo do hash.

Exemplo: `{"b": 2, "a": 1}` é normalizado para `{"a":1,"b":2}`.

---

## Conformidade

Este motor declara um status de **conformidade total** para o **Nível 1 (Integridade)** do padrão prov-spec.

- Passa em todos os vetores de teste `integrity.digest.sha256`
- Passa em todos os vetores de teste `adapter.wrap.envelope_v0_1`
- Zero desvios conhecidos

Consulte `prov-capabilities.json` para ver o manifesto de capacidades completo.

---

## Documentação

| Documento | Descrição |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | Guia detalhado: conceitos de rastreabilidade, mecânicas do prov-spec, padrões de integração, arquitetura, perguntas frequentes. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Como contribuir, fluxo de trabalho de desenvolvimento, princípios de design. |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Normas da comunidade. |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de lançamentos (formato "Keep a Changelog"). |

---

## Licença

[MIT](LICENSE)
