<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/stresskit-mcp/readme.png" width="400" alt="StressKit-MCP">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/stresskit-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

MCP（モデルコンテキストプロトコル）サーバー向けの、ヘルスチェックとセキュリティテストを行うためのツールキットです。ストレステスト、セキュリティ検証、パフォーマンスプロファイリングを通じて、MCPサーバーの稼働状況に関する信頼性の高い情報を提供します。

## 機能

- **負荷テスト:** 大量のツール呼び出しをシミュレートし、ボトルネックを特定します。
- **セキュリティスキャン:** 入力データの検証、認証フロー、エラー処理などを検証します。
- **パフォーマンスプロファイリング:** レイテンシ、スループット、リソース使用量を測定します。
- **コンプライアンスチェック:** MCPプロトコルへの準拠状況を確認します。
- **証拠生成:** 信頼できるテストレポートを作成し、その信頼性を証明します。

## クイックスタート

```bash
# Install
pip install stresskit-mcp

# Run basic health check
stresskit check http://localhost:3000

# Run full stress test suite
stresskit stress http://localhost:3000 --profile default

# Generate security report
stresskit security http://localhost:3000 --output report.json
```

## 設定

StressKitは、設定可能なテストシナリオのためにプロファイルを使用します。

```json
{
  "profile": "production",
  "duration": 300,
  "concurrency": 50,
  "tools": ["*"],
  "checks": {
    "latency_p99_ms": 500,
    "error_rate_max": 0.01,
    "memory_mb_max": 512
  }
}
```

## プロジェクト構成

```
stresskit-mcp/
├── engines/        # Test execution engines
├── profiles/       # Pre-built test profiles
├── schemas/        # JSON schemas for configuration
├── tests/          # Unit and integration tests
└── stresskit.targets.json  # Default target configuration
```

## 関連プロジェクト

- [tool-scan](https://github.com/mcp-tool-shop-org/tool-scan) — MCPツール向けのセキュリティスキャナ
- [mcp-stress-test](https://github.com/mcp-tool-shop-org/mcp-stress-test) — スキャナの検証のためのレッドチームツールキット

## ライセンス

MITライセンス — 詳細については、[LICENSE](LICENSE) を参照してください。

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> が作成しました。
