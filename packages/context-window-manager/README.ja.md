<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/context-window-manager/readme.png" alt="Context Window Manager" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/context-window-manager/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/context-window-manager/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/cwm-mcp/"><img src="https://img.shields.io/pypi/v/cwm-mcp" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/context-window-manager/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**LLMセッションにおける、KVキャッシュ永続化による損失のないコンテキスト復元**

---

## これは何ですか？

Context Window Manager (CWM) は、LLMアプリケーションにおける**コンテキスト枯渇問題**を解決するMCPサーバーです。コンテキストが上限に達して会話履歴が失われる代わりに、CWMを使用すると、以下のことが可能になります。

- 現在のコンテキストを永続ストレージに**保存**
- 後で、情報損失なしに**復元**
- 異なる会話の**ブランチ**を試すために、コンテキストを複製
- 最後に中断した場所から**再開**

要約やRAGアプローチとは異なり、CWMは実際のKVキャッシュテンソルを保持するため、**真に損失のない復元**を実現します。

---

## 仕組み

```
Traditional Approach (Lossy):
┌─────────────────────────────────────────────┐
│ Context fills up → Summarize → Lose details │
└─────────────────────────────────────────────┘

CWM Approach (Lossless):
┌──────────────────────────────────────────────────────────────┐
│ Context fills up → Freeze KV cache → Store tensors → Thaw   │
│                                                    ↓        │
│                              Exact restoration, zero loss   │
└──────────────────────────────────────────────────────────────┘
```

CWMは、以下の技術を活用します。
- セッション分離のための、**vLLMのプレフィックスキャッシュ**（`cache_salt`を使用）
- 階層型KVキャッシュストレージのための**LMCache**（GPU → CPU → ディスク → Redis）
- Claude Codeやその他のMCPクライアントとのシームレスな統合のための**MCPプロトコル**

---

## クイックスタート

### 前提条件

- Python 3.11+
- プレフィックスキャッシュが有効になっているvLLMサーバー
- vLLMと連携するように構成されたLMCache

### インストール

```bash
pip install cwm-mcp
```

### 設定

Claude Codeの設定ファイル（`.claude/settings.json`）に追加します。

```json
{
  "mcpServers": {
    "context-window-manager": {
      "command": "python",
      "args": ["-m", "context_window_manager"],
      "env": {
        "CWM_VLLM_URL": "http://localhost:8000"
      }
    }
  }
}
```

### 使い方

```
# Freeze your current session
> window_freeze session_abc123 my-coding-project

# Later, restore it
> window_thaw my-coding-project

# List all saved windows
> window_list

# Check status
> window_status my-coding-project
```

---

## 機能

### 主要な操作

| Tool | 説明 |
| ------ | ------------- |
| `window_freeze` | セッションのコンテキストをストレージに保存 |
| `window_thaw` | 保存されたコンテキストを復元 |
| `window_list` | 利用可能なコンテキストウィンドウの一覧表示 |
| `window_status` | セッション/ウィンドウの詳細情報を取得 |
| `window_clone` | コンテキストを複製して、異なる会話の展開を試す |
| `window_delete` | 保存されたコンテキストウィンドウを削除 |

### ストレージの階層

CWMは、ストレージを自動的に階層間で管理します。

1. **CPUメモリ** - 高速だが、容量が限られている
2. **ディスク** - 大容量で、圧縮されている
3. **Redis** - 分散型で、インスタンス間で共有される

### セッションの分離

各セッションには、一意の`cache_salt`が割り当てられ、以下のことが保証されます。
- セッション間のデータ漏洩がない
- タイミング攻撃からの保護
- コンテキストの明確な分離

---

## ドキュメント

| ドキュメント | 説明 |
| ---------- | ------------- |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | 開始方法とワークフロー |
| [API.md](docs/API.md) | 完全なAPIリファレンス |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | アーキテクチャの詳細 |
| [SECURITY.md](docs/SECURITY.md) | セキュリティに関する考慮事項 |
| [ERROR_HANDLING.md](docs/ERROR_HANDLING.md) | エラーの種類と対処方法 |
| [ROADMAP.md](docs/ROADMAP.md) | 開発段階とマイルストーン |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | 開発ガイドライン |

---

## 要件

### vLLMサーバーの設定

```bash
vllm serve "meta-llama/Llama-3.1-8B-Instruct" \
  --enable-prefix-caching \
  --kv-transfer-config '{"kv_connector":"LMCacheConnectorV1","kv_role":"kv_both"}'
```

### LMCache環境

```bash
export LMCACHE_USE_EXPERIMENTAL=True
export LMCACHE_LOCAL_CPU=True
export LMCACHE_MAX_LOCAL_CPU_SIZE=8.0
```

---

## 開発

```bash
# Clone and setup
git clone https://github.com/mcp-tool-shop-org/context-window-manager.git
cd context-window-manager
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -e ".[dev]"

# Run tests
pytest tests/unit/

# Run with coverage
pytest tests/unit/ --cov=src/context_window_manager
```

詳細なガイドラインについては、[CONTRIBUTING.md](docs/CONTRIBUTING.md) を参照してください。

---

## ロードマップ

- [x] 段階0：ドキュメントとアーキテクチャ
- [x] 段階1：コアインフラストラクチャ
- [x] 段階2：MCPサーバーシェル
- [x] 段階3：保存機能の実装
- [x] 段階4：復元機能の実装
- [x] 段階5：高度な機能（複製、自動保存）
- [x] 段階6：本番環境での安定化
- [x] 段階7：統合と改善

詳細は、[ROADMAP.md](docs/ROADMAP.md) を参照してください。

---

## ライセンス

MITライセンス - 詳細については、[LICENSE](LICENSE) を参照してください。

---

## 謝辞

- [vLLM](https://github.com/vllm-project/vllm) - 高スループットLLMサーバー
- [LMCache](https://github.com/LMCache/LMCache) - KVキャッシュ永続化レイヤー
- [Model Context Protocol](https://modelcontextprotocol.io/) - 統合標準
- [Recursive Language Models](https://arxiv.org/abs/2512.24601) - コンテキスト管理のインスピレーション

---

## ステータス

**ベータ版 (v0.6.4)** - 本番環境での利用を想定した改善が完了しました。CI環境を統合し、ワークフローを2つにまとめました。366個のテストが正常に完了しました。
