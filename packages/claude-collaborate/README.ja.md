<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-collaborate/readme.png" alt="Claude Collaborate" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-collaborate/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-collaborate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-collaborate/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

> *人間の創造性とAIの知性が融合する場所*

Claude Collaborateは、リアルタイムでの人間とAIの協力を実現する統合的なサンドボックス環境です。インタラクティブなワークスペース、シームレスなコミュニケーション、そして創造的なツールを、美しいインターフェースで提供します。

## ✨ ビジョン

次のようなことができるワークスペースを想像してみてください。
- **共有のホワイトボードで、アイデアを出し合い、ブレインストーミングを行う**
- **リアルタイムプレビュー付きのコードエディタで、一緒にコードを書く**
- **チェスをプレイし、戦略について議論する**
- **GitHubに対応したツールを使って、コンテンツを作成する**
- **WebSocketブリッジを通じて、リアルタイムでコミュニケーションをとる**

すべてが、一つの場所に。そして、美しく統合されています。

## 🚀 簡単な始め方

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/claude-collaborate.git
cd claude-collaborate

# Install dependencies
pip install aiohttp

# Start the server
python server.py

# Open in browser
# http://localhost:8877
```

## 🎨 環境

| 環境 | 説明 |
| ------------- | ------------- |
| **Whiteboard** | 視覚的に描画、スケッチ、ブレインストーミング |
| **Code Workshop** | HTML/CSS/JSエディタ（リアルタイムプレビュー付き） |
| **Chess Workshop** | 戦略と戦術の実験場 |
| **Capture Viewer** | スクリーンショットと録画の閲覧機能 |
| **GitHub Toolkit** | READMEとマーケティング資料の自動生成ツール |
| **Creative Lab** | インタラクティブな実験 |
| **Template** | 新しい環境を作成するためのテンプレート |

## 🏗️ アーキテクチャ

```
claude-collaborate/
├── index.html           # Main UI with environment switcher
├── server.py            # aiohttp server
├── ws_bridge.py         # WebSocket bridge for Claude Code
├── whiteboard.html      # Drawing and brainstorming
├── code-playground.html # Live HTML/CSS/JS editor
├── chess.html           # Chess analysis board
├── capture-viewer.html  # Screenshot/recording viewer
├── github-toolkit.html  # README and marketing tools
├── template.html        # Starter for new environments
└── adventures/          # Creative Lab experiments
    └── index.html
```

## 🔌 WebSocketプロトコル

Claude Collaborateには、Claude Codeとのリアルタイム通信のためのWebSocketブリッジが含まれています。

```javascript
// Browser sends to Claude
{ "type": "user_message", "content": "Hello!" }

// Claude responds
{ "type": "claude_response", "content": "Hi there!" }

// Connection status
{ "type": "connected", "message": "Connected to Claude Collaborate Bridge" }
```

## 🔗 APIエンドポイント

| エンドポイント | メソッド | 説明 |
| ---------- | -------- | ------------- |
| `/` | GET | Claude CollaborateのメインUI |
| `/{file}` | GET | 静的ファイル（ホワイトボードなど） |
| `/ws` | WS | WebSocketブリッジ |
| `/api/ws/messages` | GET | 未読のユーザーメッセージの読み込み |
| `/api/ws/respond` | POST | ブラウザへの応答送信 |
| `/api/ws/status` | GET | WebSocketブリッジの状態 |
| `/health` | GET | サーバーのヘルスチェック |

## 💬 Claude Codeユーザーの皆様へ

WebSocketブリッジを通じて、Claude Collaborateと連携してください。

```bash
# Read messages from the UI
curl http://localhost:8877/api/ws/messages

# Send a response back
curl -X POST http://localhost:8877/api/ws/respond \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from Claude!"}'
```

## 🎭 オプション：音声統合

Claude Collaborateは、[Voice Soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard)と連携することで、テキスト読み上げ（TTS）機能を強化できます。

```bash
# In another terminal, start Voice Soundboard
cd voice-soundboard
python -m voice_soundboard.web_server

# Voice Studio will be available at http://localhost:8080/studio
```

## 🛠️ 新しい環境の作成

1. `template.html`を`your-environment.html`にコピーします。
2. `index.html`のサイドバーに追加します。
```html
<div class="env-item" data-url="/your-environment.html" data-name="Your Environment">
    <div class="env-icon" style="background: linear-gradient(...);">🎯</div>
    <div class="env-info">
        <h3>Your Environment</h3>
        <p>Description</p>
    </div>
</div>
```
3. リフレッシュして、ビルドを開始します！

## 📋 必要なもの

- Python 3.10以上
- aiohttp
- WebSocketをサポートする最新のブラウザ

## 🤝 貢献について

貢献を歓迎します！以下のようなものが含まれます。
- 新しい環境テンプレート
- UI/UXの改善
- バグ修正
- ドキュメント

問題の報告やプルリクエストの送信をお願いします。

## 📄 ライセンス

MITライセンス - 詳細については、[LICENSE](LICENSE)をご覧ください。

## 🙏 謝辞

- **Anthropic** - Claudeと、役に立つAIというビジョンに対して
- **コミュニティ** - 人間とAIの協力を発展させている皆様

---

<p align="center">
  <i>Built with ❤️ for the future of collaboration</i><br>
  <a href="https://github.com/mcp-tool-shop-org">MCP Tool Shop</a>
</p>
