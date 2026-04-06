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

**ステータス: v0.1.0 — フェーズ1完了、フェーズ2Aリリース済み**

人間とAIの共同作業のための、ローカルファースト、追記専用、暗号学的に検証可能なイベントジャーナルです。

## 今日できること

```bash
# Generate a testimony report
witness testify --format json --emit-artifact ./output

# Verify events cryptographically
witness verify

# Include exact stored JSON for deep audits
witness testify --format json --include-events
```

**Witnessがインストールされていない環境でも、第三者が証言を検証できます**。JSONスキーマと検証ルールは完全に文書化されています。

## なぜ重要なのか

Witnessは、持ち運び可能な証拠の記録を作成します。
- **決定論的**: 同じ入力 → 同じ出力バイト (再現性のために`--generated-at`を使用)。
- **検証可能**: Ed25519署名 + 標準JSONに対するSHA-256ハッシュ。
- **移植可能**: メールで送信したり、チケットに添付したり、リポジトリにチェックインしたりできます。
- **正確**: `--include-events`を使用すると、バイト単位でストアの内容を埋め込むことができます。

## クイックスタート

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

## 信頼モデル

すべての暗号化操作は、**標準JSON** → **SHA-256ハッシュ** → **Ed25519署名**を使用します。

[VERIFICATION.md](VERIFICATION.md)で以下の内容を確認できます。
- 正確なシリアライゼーションルール
- 動作する検証例
- 終了コード (0 = 正常、2 = フラグ、3 = 暗号化エラー)
- `--include-events`に関するプライバシーに関する注意点

## 安定性に関する保証

| 成果物 | 場所 | 契約 |
|----------|----------|----------|
| イベントスキーマ | テスト用データ | `tests/fixtures/golden/*.json` |
| 証言スキーマ | `schemas/testimony.schema.v0.1.json` | JSON出力構造 |
| 終了コード | [VERIFICATION.md](VERIFICATION.md) | 0/2/3の意味 |
| Flags | [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | 4種類のフラグ (情報提供のみ) |

## ドキュメント

> **ここから始めましょう:** [CONTRACT.md](CONTRACT.md) — 法的拘束力のあるものと例の違い

| ドキュメント | 目的 |
|----------|---------|
| [CONTRACT.md](CONTRACT.md) | 規範的な内容と例 |
| [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | 不変の制約 |
| [VERIFICATION.md](VERIFICATION.md) | 暗号化ルールと動作例 |
| [docs/](docs/README.md) | 完全なドキュメントインデックス |

## フェーズ2の状況

| Track | ステータス |
|-------|--------|
| **2A: 証言としての成果物** | ✅ リリース済み |
| **2B: パイプライン** | ⏸️ 一時停止中 ([RFC](docs/RFC_PHASE2_PIPELINES.md)) |
| 2C–2E | 未着手 |

詳細は[docs/PHASE2_STATUS.md](docs/PHASE2_STATUS.md)をご覧ください。

## プロジェクトの構成

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

## 哲学

> Witnessは、判断ではなく、真実性を重視しています。
> 何が起こったかを記録し、後で検証します。それが何を意味するかは、人間が決めるべきです。

## ライセンス

MIT — [LICENSE](LICENSE)を参照。
