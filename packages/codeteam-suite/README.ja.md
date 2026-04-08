<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/codeteam-suite/readme.png" alt="CodeTeam Suite" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/codeteam-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/codeteam-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/codeteam-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**CodeTeamによる公式な実装** - パッケージの検証、承認、署名を行うための、.NETベースのCLI（コマンドラインインターフェース）およびライブラリ。

## ステータス

**v0.2.0 リリース** - 暗号化された信頼の仕組みが完了。相互運用契約が確定。

### 安定版の内容

以下の項目は固定されており、CI（継続的インテグレーション）によって保護されています。

| 成果物 | 場所 | 保証 |
| ---------- | ---------- | ----------- |
| JSONスキーマ | `/schemas/*.v0.1.json` | 追加変更のみ |
| CLI `verify --json` の出力 | `codeteam.cli.verify.schema.v0.1.json` | 後方互換性 |
| エラーコード | `ErrorCode.cs` | 削除や名前変更なし |
| 重要度マッピング | `severity-map.v0.1.json` | 新しいコードにはマッピングが必要 |

相互運用性のテストがこれらの保証事項を検証します。変更によりCIが失敗します。

## NuGetパッケージ

| パッケージ | 説明 |
| --------- | ------------- |
| `CodeTeam` | パッケージの検証、承認、署名を行うための.NETグローバルツールです。`dotnet tool install -g CodeTeam`でインストールできます。 |
| `CodeTeam.Core` | ドメインモデル、検証ロジック、標準JSON、および過半数ベースのポリシー評価。 |
| `CodeTeam.Crypto` | NSec.CryptographyによるEd25519署名検証とSHA-256ハッシュ計算。 |
| `CodeTeam.Packaging` | パスのトラバーサル保護とJSONスキーマ検証によるパッケージの読み込みと検証。 |

## 概要

CodeTeam Suiteは、すべてのエディタ拡張機能（VS Code、Visual Studio）が依存する「唯一の真実」の実装です。拡張機能はCLIを呼び出し、結果を表示します。検証ロジックを実装するものではありません。

## アーキテクチャ

```
CodeTeam.Core       → Domain models, status codes, error types
CodeTeam.Crypto     → Ed25519 signatures, SHA-256 hashing
CodeTeam.Packaging  → Package loading and verification
CodeTeam.Cli        → CLI entry point (codeteam verify/approve/sign)
```

## CLIの使用方法

```bash
# Verify a package
codeteam verify <package-path> --json

# Approve a package
codeteam approve <package-path> --key <key-id> --json

# Sign a package
codeteam sign <package-path> --key <key-id> --json
```

## 終了コード

| Code | ステータス | 意味 |
| ------ | -------- | --------- |
| 0 | OK_VERIFIED | 有効な署名によるパッケージの検証成功 |
| 1 | OK_UNSIGNED | パッケージは有効だが、署名されていない |
| 2 | FAIL_INTEGRITY | ファイルが見つからない、またはサイズ/ハッシュ値が一致しない |
| 3 | FAIL_SCHEMA | スキーマ検証に失敗 |
| 4 | FAIL_SIGNATURE | 署名検証に失敗 |
| 5 | FAIL_THRESHOLD | 承認の閾値に達していない |
| 6 | FAIL_UNAUTHORIZED | 認証されていないユーザー |

## ドキュメント

- [CONTRACT.md](CONTRACT.md) - 公式なパッケージの仕様
- [VERIFICATION.md](VERIFICATION.md) - 標準的な検証ルール
- [docs/EDITOR_INTEGRATION.md](docs/EDITOR_INTEGRATION.md) - エディタ拡張機能の契約（VS Code、Visual Studio）
- [docs/PRESS_KIT.md](docs/PRESS_KIT.md) - リリースのマーケティング資料
- [docs/sealing.md](docs/sealing.md) - シーリング設計（情報提供）

## テスト用データ

テストデータは、期待される検証結果を定義します。

| データ | 期待されるステータス |
| --------- | ----------------- |
| `fixtures/minimal_unsigned/` | OK_UNSIGNED |
| `fixtures/approved_threshold_met/` | OK_UNSIGNED |
| `fixtures/signed_verified/` | OK_VERIFIED |
| `fixtures/tampered_artifact/` | FAIL_INTEGRITY |
| `fixtures/invalid_manifest/` | FAIL_SCHEMA |
| `fixtures/signed_verified_real/` | OK_VERIFIED |
| `fixtures/signed_invalid_sig/` | FAIL_SIGNATURE |

## ビルド

```bash
dotnet build
dotnet test
```

## ライセンス

MIT
