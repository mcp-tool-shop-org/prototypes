<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/brain-dev/readme.png" width="400" alt="brain-dev" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/brain-dev/actions/workflows/test.yml"><img src="https://github.com/mcp-tool-shop-org/brain-dev/actions/workflows/test.yml/badge.svg" alt="Tests" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/brain-dev"><img src="https://codecov.io/gh/mcp-tool-shop-org/brain-dev/branch/main/graph/badge.svg" alt="Codecov" /></a>
  <a href="https://pypi.org/project/dev-brain/"><img src="https://img.shields.io/pypi/v/dev-brain" alt="PyPI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/brain-dev/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

**開発者向けインサイトを提供するインテリジェンスレイヤー** — MCPを介した、カバレッジ分析、テスト生成、リファクタリングの提案、セキュリティ監査、およびUXに関する情報提供。

## 機能

- **9つの分析ツール** — カバレッジの不足箇所、動作分析、テスト生成、リファクタリング、UXに関する情報、セキュリティ監査など
- **ASTベースのテスト生成** — 実際にコンパイル可能なpytestテストを自動生成（モックを含む）
- **セキュリティ脆弱性検出** — SQLインジェクション、コマンドインジェクション、ハードコードされた秘密情報などを検出するOWASPスタイルのスキャン
- **ドキュメント分析** — ドキュメント文字列が不足している箇所を検出し、テンプレートを提案
- **MCPネイティブ** — Claudeやその他のMCPクライアントとのシームレスな統合

## インストール

```bash
pip install dev-brain
```

または、開発用として：

```bash
git clone https://github.com/mcp-tool-shop-org/brain-dev.git
cd brain-dev
pip install -e ".[dev]"
```

## クイックスタート

```bash
# Run the MCP server
dev-brain
```

Claude Desktopの設定ファイル (`claude_desktop_config.json`) に以下を追加します。

```json
{
  "mcpServers": {
    "dev-brain": {
      "command": "dev-brain"
    }
  }
}
```

## ツール

### 分析ツール

| ツール | 説明 |
|------|-------------|
| `coverage_analyze` | テストカバレッジと比較して、不足箇所を特定 |
| `behavior_missing` | コードで処理されていないユーザーの行動を特定 |
| `refactor_suggest` | 複雑さ、重複、命名規則に基づいて、リファクタリングを提案 |
| `ux_insights` | ユーザーの行動パターン（離脱、エラー）からUXに関する情報を抽出 |

### 生成ツール

| ツール | 説明 |
|------|-------------|
| `tests_generate` | カバレッジの不足箇所に対するテストの提案を生成 |
| `smart_tests_generate` | 適切なモックとフィクスチャを使用した、ASTベースのpytest生成 |
| `docs_generate` | ドキュメント化されていないコードに対するドキュメントテンプレートを生成 |

### セキュリティツール

| ツール | 説明 |
|------|-------------|
| `security_audit` | 脆弱性（SQLインジェクション、コマンドインジェクション、秘密情報など）をスキャン |

### ユーティリティツール

| ツール | 説明 |
|------|-------------|
| `brain_stats` | サーバーの統計情報と設定を取得 |

## 使用例

### セキュリティ監査

```python
# Via MCP client
result = await client.call_tool("security_audit", {
    "symbols": [
        {
            "name": "execute_query",
            "file_path": "db.py",
            "line": 10,
            "source_code": "cursor.execute(f\"SELECT * FROM users WHERE id = {user_id}\")"
        }
    ],
    "severity_threshold": "medium"
})
# Returns: SQL injection vulnerability detected (CWE-89)
```

### スマートテスト生成

```python
result = await client.call_tool("smart_tests_generate", {
    "file_path": "/path/to/your/module.py"
})
# Returns complete pytest file with fixtures and mocks
```

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                      DEV BRAIN MCP SERVER                    │
├─────────────────────────────────────────────────────────────┤
│  Analyzers                                                   │
│  ├─ CoverageAnalyzer    (test gaps)                         │
│  ├─ BehaviorAnalyzer    (unhandled flows)                   │
│  ├─ RefactorAnalyzer    (complexity, naming)                │
│  ├─ UXAnalyzer          (dropoff, errors)                   │
│  ├─ DocsAnalyzer        (missing docs)                      │
│  └─ SecurityAnalyzer    (vulnerabilities)                   │
├─────────────────────────────────────────────────────────────┤
│  Generators                                                  │
│  ├─ TestGenerator       (skeleton tests)                    │
│  └─ SmartTestGenerator  (AST-based pytest)                  │
└─────────────────────────────────────────────────────────────┘
```

## 検出されたセキュリティパターン

| カテゴリ | 深刻度 | CWE |
|----------|----------|-----|
| SQLインジェクション | 重大 | CWE-89 |
| コマンドインジェクション | 重大 | CWE-78 |
| 不安全なデシリアライゼーション | 重大 | CWE-502 |
| ハードコードされた秘密情報 | 高 | CWE-798 |
| パスのトラバーサル | 高 | CWE-22 |
| 不安全な暗号化 | 中 | CWE-327 |

## 開発

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=dev_brain --cov-report=html

# Type checking (optional)
mypy dev_brain
```

## セキュリティとデータ範囲

- **アクセスするデータ:** 分析のために、安全な `ast.parse()` を使用してPythonソースファイルを読み込みます。カバレッジの不足箇所、テストの提案、セキュリティに関する検出結果を含むJSON形式の結果を返します。コードの実行は行いません。
- **アクセスしないデータ:** ファイルの書き込み、ネットワークリクエスト、データの永続化、データベース、外部サービスは使用しません。読み取り専用の分析のみを行います。
- **必要な権限:** プロジェクトディレクトリ内のPythonソースファイルへの読み取りアクセス権。

脆弱性に関する報告については、[SECURITY.md](SECURITY.md) を参照してください。

## スコアカード

| カテゴリ | スコア |
|----------|-------|
| A. セキュリティ | 10/10 |
| B. エラー処理 | 10/10 |
| C. 開発者向けドキュメント | 10/10 |
| D. ソフトウェアの品質 | 10/10 |
| E. 識別情報（ソフト） | 10/10 |
| **Overall** | **50/50** |

> [`@mcptoolshop/shipcheck`](https://github.com/mcp-tool-shop-org/shipcheck) を使用して評価

## ライセンス

MITライセンス — 詳細については、[LICENSE](LICENSE) を参照してください。

---

[MCP Tool Shop](https://mcp-tool-shop.github.io/) が作成
