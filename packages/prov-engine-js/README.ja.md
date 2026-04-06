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

**prov-spec標準を実装した、依存関係のない最小限のNode.jsプロビナンスエンジン。**

---

## 概要

- **依存関係なし**：Node.jsの組み込み機能のみを使用 (`node:fs`, `node:crypto`, `node:process`)
- **単一ファイルエンジン**：実装全体が`prov-engine.js`に格納されています。
- **CLI + プログラミング**：コマンドラインから実行するか、独自のコードにインポートして使用できます。
- **prov-spec L1準拠**：レベル1（整合性）のすべてのテストベクトルに合格しています。
- **JCSサブセットによる正規化**：prov-specのセクション6に従って、決定論的なJSONシリアライゼーションを行います。

---

## インストール

```bash
# Add to your project
pnpm add @mcptoolshop/prov-engine-js

# Or run directly without installing
npx @mcptoolshop/prov-engine-js describe
```

リポジトリをクローンして、エンジンを直接実行することもできます。

```bash
git clone https://github.com/mcp-tool-shop-org/prov-engine-js.git
cd prov-engine-js
node prov-engine.js describe
```

---

## CLIコマンド

このエンジンは、5つのコマンドを提供します。すべての出力はJSON形式で標準出力に出力されます。

### `describe`：機能マニフェストを表示します

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

### `digest <input.json>`：正規化された形式とSHA-256ハッシュ値を計算します

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

### `wrap <payload.json>`：ペイロードをMCPエンベロープでラップします

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

入力がすでにエンベロープの場合（`schema_version`が`mcp.envelope.v0.1`の場合）、変更せずにそのまま出力されます（二重ラップは行われません）。

### `verify-digest <artifact.json>`：ハッシュ値の主張を検証します

入力ファイルには、`content`フィールドと、`alg`および`value`フィールドを持つ`digest`フィールドが含まれている必要があります。

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

### `check-vector <vector-dir>`：prov-specのテストベクトルを実行します

```bash
npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/integrity.digest.sha256
# PASS: integrity.digest.sha256 vector

npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/adapter.wrap.envelope_v0_1
# PASS: adapter.wrap.envelope_v0_1 vector
```

ベクトルディレクトリには、`input.json`と`expected.json`が含まれている必要があります。エンジンは、期待される出力の形式からベクトルタイプを自動的に検出します。

---

## プログラミングでの使用方法

このエンジンはESモジュールです。内部関数をインポートして、独自のコードで使用できます。

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

**ヒント:** 将来のリリースでは、`canonicalize`、`computeDigest`、および`wrapEnvelope`が名前付きエクスポートとして提供されるため、`import { canonicalize } from "@mcptoolshop/prov-engine-js"`のように直接インポートできるようになります。

---

## メソッド

| メソッド | 説明 |
| -------- | ------------- |
| `integrity.digest.sha256` | prov-specのセクション6に従ってJSONを正規化し、その後、UTF-8バイトに対してSHA-256ハッシュを計算します。`{ alg: "sha256", value: "<hex>" }`を返します。 |
| `adapter.wrap.envelope_v0_1` | 任意のJSONペイロードを`{ schema_version: "mcp.envelope.v0.1", result: <payload> }`でラップします。すでにラップされたエンベロープは、変更せずにそのまま出力されます。 |

---

## 正規化の仕組み

prov-specでは、同じ論理オブジェクトが常に同じバイトシーケンス（したがって、同じハッシュ値）を生成するように、決定論的なJSONシリアライゼーションが必要です。このエンジンは、prov-specのセクション6に従って、JCSサブセットによる正規化を実装しています。

1. **ソートされたキー**：オブジェクトのキーを、Unicodeコードポイントの順序で辞書順にソートします。
2. **空白なし**：トークン間のスペースや改行はありません。区切り文字は`,`と`:`のみです。
3. **数値の正規化**：先頭のゼロ、小数点後の末尾のゼロ、正の符号を削除します。`-0`は`0`に変換されます。
4. **最小限のエスケープ**：必要なエスケープシーケンスのみを出力します。
5. **UTF-8エンコーディング**：正規化された文字列は、ハッシュ化する前にUTF-8でエンコードされます。

例：`{"b": 2, "a": 1}`は、`{"a":1,"b":2}`に正規化されます。

---

## 準拠性

このエンジンは、prov-spec標準の**レベル1（整合性）**について、**完全に準拠**であることを宣言しています。

- `integrity.digest.sha256`のすべてのテストベクトルに合格しています。
- `adapter.wrap.envelope_v0_1`のすべてのテストベクトルに合格しています。
- 既知の逸脱はゼロです。

完全な機能マニフェストについては、`prov-capabilities.json`を参照してください。

---

## ドキュメント

| ドキュメント | 説明 |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | 詳細ガイド：プロビナンスの概念、prov-specの仕組み、統合パターン、アーキテクチャ、FAQ |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 貢献方法、開発プロセス、設計原則 |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | コミュニティの規約 |
| [CHANGELOG.md](CHANGELOG.md) | リリース履歴（変更履歴形式） |

---

## ライセンス

[MIT](LICENSE)
