<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/file-compass/readme.png" alt="File Compass" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/file-compass/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/file-compass/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/file-compass/"><img src="https://img.shields.io/pypi/v/file-compass" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/file-compass/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**HNSWベクトルインデックスを使用したAIワークステーション向けのセマンティックファイル検索**

*ファイル名だけでなく、探している内容を記述してファイルを見つけましょう*

---

## File Compassとは？

| 問題点 | 解決策 |
| --------- | ---------- |
| 「あのデータベース接続ファイルはどこにある？」 | `file-compass search "database connection handling"` |
| キーワード検索では意味のある一致が見つからない | ベクトル埋め込みは意味を理解する |
| 大規模なコードベースでの検索が遅い | HNSWインデックス：10,000件以上のファイルでも100ms未満 |
| AIアシスタントとの連携が必要 | Claude Code用のMCPサーバー |

## クイックスタート

```bash
# Install
git clone https://github.com/mcp-tool-shop-org/file-compass.git
cd file-compass && pip install -e .

# Pull embedding model
ollama pull nomic-embed-text

# Index your code
file-compass index -d "C:/Projects"

# Search semantically
file-compass search "authentication middleware"
```

## 機能

- **セマンティック検索**：探している内容を記述してファイルを見つけます
- **クイック検索**：ファイル名/シンボルの即時検索（埋め込み不要）
- **マルチ言語AST**：Python、JS、TS、Rust、GoのTree-sitterサポート
- **検索結果の説明**：各結果が一致した理由を理解できます
- **ローカル埋め込み**：Ollamaを使用（APIキーは不要）
- **高速検索**：サブ秒のクエリのためのHNSWインデックス
- **Git対応**：オプションでGitで管理されているファイルのみをフィルタリング
- **MCPサーバー**：Claude Codeやその他のMCPクライアントとの連携
- **セキュリティ強化**：入力検証、パストラバーサル保護

## インストール

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/file-compass.git
cd file-compass

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -e .

# Pull the embedding model
ollama pull nomic-embed-text
```

### 要件

- Python 3.10+
- [Ollama](https://ollama.com/) と `nomic-embed-text` モデル

## 使い方

### インデックスのビルド

```bash
# Index a directory
file-compass index -d "C:/Projects"

# Index multiple directories
file-compass index -d "C:/Projects" "D:/Code"
```

### ファイルの検索

```bash
# Semantic search
file-compass search "database connection handling"

# Filter by file type
file-compass search "training loop" --types python

# Git-tracked files only
file-compass search "API endpoints" --git-only
```

### クイック検索（埋め込みなし）

```bash
# Search by filename or symbol name
file-compass scan -d "C:/Projects"  # Build quick index
```

### ステータスの確認

```bash
file-compass status
```

## MCPサーバー

File Compassには、Claude Codeやその他のAIアシスタントとの連携のためのMCPサーバーが含まれています。

### 利用可能なツール

| Tool | 説明 |
| ------ | ------------- |
| `file_search` | セマンティック検索（説明付き） |
| `file_preview` | 構文ハイライト付きのコードプレビュー |
| `file_quick_search` | 高速なファイル名/シンボル検索 |
| `file_quick_index_build` | クイック検索インデックスのビルド |
| `file_actions` | コンテキスト、使用例、関連、履歴、シンボル |
| `file_index_status` | インデックスの統計情報の確認 |
| `file_index_scan` | フルインデックスのビルドまたは再構築 |

### Claude Codeとの連携

`claude_desktop_config.json` に追加します：

```json
{
  "mcpServers": {
    "file-compass": {
      "command": "python",
      "args": ["-m", "file_compass.gateway"],
      "cwd": "C:/path/to/file-compass"
    }
  }
}
```

## 設定

| 変数 | デフォルト値 | 説明 |
| ---------- | --------- | ------------- |
| `FILE_COMPASS_DIRECTORIES` | `F:/AI` | カンマ区切りのディレクトリ |
| `FILE_COMPASS_OLLAMA_URL` | `http://localhost:11434` | OllamaサーバーのURL |
| `FILE_COMPASS_EMBEDDING_MODEL` | `nomic-embed-text` | 埋め込みモデル |

## 動作原理

1. **スキャン**：設定された拡張子に一致するファイルを検索し、`.gitignore` を尊重します。
2. **チャンク分割**：ファイルをセマンティックな単位に分割します。
- Python/JS/TS/Rust/Go：tree-sitterによるAST対応（関数、クラス）
- Markdown：見出しベースのセクション
- JSON/YAML：トップレベルのキー
- その他：オーバーラップのあるスライディングウィンドウ
3. **埋め込み**：Ollamaを使用して768次元のベクトルを生成します。
4. **インデックス作成**：ベクトルをHNSWインデックスに、メタデータをSQLiteに保存します。
5. **検索**：クエリを埋め込み、最も近い近傍を見つけ、ランク付けされた結果を返します。

## パフォーマンス

| 指標 | Value |
| -------- | ------- |
| インデックスサイズ | チャンクあたり約1KB |
| 検索レイテンシ | 10,000件以上のチャンクで100ms未満 |
| クイック検索 | ファイル名/シンボルで10ms未満 |
| 埋め込み速度 | チャンクあたり約3〜4秒（ローカル） |

## アーキテクチャ

```
file-compass/
├── file_compass/
│   ├── __init__.py      # Package init
│   ├── config.py        # Configuration
│   ├── embedder.py      # Ollama client with retry
│   ├── scanner.py       # File discovery
│   ├── chunker.py       # Multi-language AST chunking
│   ├── indexer.py       # HNSW + SQLite index
│   ├── quick_index.py   # Fast filename/symbol search
│   ├── explainer.py     # Result explanations
│   ├── merkle.py        # Incremental updates
│   ├── gateway.py       # MCP server
│   └── cli.py           # CLI
├── tests/               # 298 tests, 91% coverage
├── pyproject.toml
└── LICENSE
```

## セキュリティ

- **入力値の検証**：すべてのMCP入力値が検証されます。
- **パス越え攻撃対策**：許可されたディレクトリ以外のファイルへのアクセスをブロックします。
- **SQLインジェクション対策**：パラメータ化されたクエリのみを使用します。
- **エラーのマスキング**：内部エラーの内容を外部に公開しません。

## 開発

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=file_compass --cov-report=term-missing

# Type checking
mypy file_compass/
```

## 関連プロジェクト

[**MCP Tool Shop**](https://mcp-tool-shop.github.io/) の一部 — AIを活用した開発のためのCompass Suiteです。

- [Tool Compass](https://github.com/mcp-tool-shop-org/tool-compass) - セマンティックなMCPツールの検索機能
- [Integradio](https://github.com/mcp-tool-shop-org/integradio) - ベクトル埋め込みを使用したGradioコンポーネント
- [Backpropagate](https://github.com/mcp-tool-shop-org/backpropagate) - ヘッドレスLLMのファインチューニング
- [Comfy Headless](https://github.com/mcp-tool-shop-org/comfy-headless) - 複雑さを排除したComfyUI

## サポート

- **質問 / ヘルプ:** [ディスカッション](https://github.com/mcp-tool-shop-org/file-compass/discussions)
- **バグ報告:** [イシュー](https://github.com/mcp-tool-shop-org/file-compass/issues)

## ライセンス

MITライセンス - 詳細については、[LICENSE](LICENSE) をご確認ください。

## 謝辞

- [Ollama](https://ollama.com/)：ローカルLLM推論
- [hnswlib](https://github.com/nmslib/hnswlib)：高速なベクトル検索
- [nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)：埋め込み表現
- [tree-sitter](https://tree-sitter.github.io/)：多言語AST解析
