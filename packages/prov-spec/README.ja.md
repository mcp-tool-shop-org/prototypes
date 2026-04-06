> ⚠️ **このリポジトリは、[accessibility-suite](https://github.com/mcp-tool-shop-org/accessibility-suite) に移動しました。**
> ソースコードは `docs/prov-spec/` にあります。

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

**プロヴェナンスメソッドID、レコード、および検証のための、正式なバージョン管理された仕様と適合スイートです。**

---

## これは何ですか？

以下の内容を定義する規範的な仕様です。
- **メソッドID**：プロヴェナンス操作のための安定した、名前空間付きの識別子
- **プロヴェナンスレコード**：ツールの実行を記述した構造化されたJSONデータ
- **適合レベル**：テスト可能な適合段階
- **テストベクトル**：相互運用性のための標準的な入力/出力

## これは何ではありませんか？

- フレームワーク
- SDK
- MCP固有のもの
- Python固有のもの

## これは誰のためのものですか？

- **エンジン開発者**：あらゆる言語でプロヴェナンスを実装する
- **ツール統合者**：既存のツールにプロヴェナンス機能を追加する
- **監査者**：プロヴェナンスの主張を検証する
- **インフラストラクチャ構築者**：プロヴェナンスを考慮したシステムを構築する

---

## 安定性保証

> **`stable` とマークされたメソッドIDは、追記のみを許可し、セマンティクスは決して変更されません。**
> **メジャーバージョン内での互換性は保証されます。**

---

## クイックスタート

### 10秒で検証

```bash
# Clone and run a test vector
git clone https://github.com/mcp-tool-shop-org/prov-spec
cd prov-spec
python tools/python/prov_validator.py check-vector integrity.digest.sha256
```

期待される出力：`INFO: Test vector integrity.digest.sha256 passed`

---

### 1. 仕様を理解する

[`spec/PROV_METHODS_SPEC.md`](spec/PROV_METHODS_SPEC.md) を読んでください。これは規範的な仕様です。

### 2. カタログを確認する

[`spec/methods.json`](spec/methods.json) を参照してください。これは機械可読なメソッドレジストリです。

### 3. 適合を宣言する

プロジェクトに `prov-capabilities.json` を追加します。

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

### 4. 検証する（オプション）

参照検証ツールを使用します。

```bash
# List known methods
python -m prov_validator list-methods

# Validate a provenance record
python -m prov_validator validate-methods record.json --strict

# Run test vectors
python -m prov_validator check-vector integrity.digest.sha256
```

---

## リポジトリの構成

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

**注意:** 参照ツールは利便性のために提供されており、適合には必須ではありません。

---

## 適合レベル

| Level | Name | 要件 |
| ------- | ------ | -------------- |
| **1** | 整合性 | `integrity.digest.*` メソッド |
| **2** | エンジン | レベル1 + `engine.*` メソッド |
| **3** | 系統 | レベル2 + `lineage.*` メソッド |

詳細は [`CONFORMANCE_LEVELS.md`](CONFORMANCE_LEVELS.md) を参照してください。

---

## メソッド名前空間

| 名前空間 | 目的 |
| ----------- | --------- |
| `adapter.*` | エンベロープラッピング、トランスポート |
| `engine.*` | エビデンス抽出、プロヴェナンス構築 |
| `integrity.*` | ハッシュ、署名、検証 |
| `lineage.*` | 親のリンク、グラフ操作 |

将来の使用のために予約されています：`policy.*`, `attestation.*`, `execution.*`, `audit.*`

---

## バージョン管理

- **仕様バージョン:** `v0.1.0`
- **メソッドカタログ:** メジャーバージョン内で追記のみ
- **スキーマ:** `additionalProperties: false` — パッチ内でフォワード互換性

---

## 貢献

1. 新しいメソッドID：ユースケースを記載したIssueを作成する
2. 仕様の明確化：`spec/` へのプルリクエストを送信する
3. 参照ツール：`tools/` へのプルリクエストを送信する

メソッドIDには、現実世界の正当性が必要です。私たちは、推測的にIDを追加することはありません。

---

## ライセンス

MIT — [LICENSE](LICENSE) を参照してください。

---

## 参照

- [PROV_METHODS_SPEC.md](spec/PROV_METHODS_SPEC.md) — 規範的な仕様
- [PROV_METHODS_CATALOG.md](spec/PROV_METHODS_CATALOG.md) — 人間が読めるカタログ
- [CONFORMANCE_LEVELS.md](CONFORMANCE_LEVELS.md) — 適合段階
- [MCP_COMPATIBILITY.md](spec/MCP_COMPATIBILITY.md) — MCPエンベロープの互換性
