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

*人工智能与人类创造力的交汇点*

Claude Collaborate 是一个统一的沙箱环境，用于实现实时的人工智能与人类协作。它将交互式工作空间、无缝通信和创意工具整合到一个美观的界面中。

## ✨ 愿景

想象一个工作空间，您可以在其中：
- **在共享白板上进行绘画和头脑风暴**
- **与即时预览一起编写代码**
- **下棋并讨论策略**
- **使用可以直接发布到 GitHub 的工具创建内容**
- **通过 WebSocket 桥进行实时通信**

所有功能都集成在一个地方，并且设计精美。

## 🚀 快速开始

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

## 🎨 环境

| 环境 | 描述 |
| ------------- | ------------- |
| **Whiteboard** | 视觉化地进行绘画、草图和头脑风暴 |
| **Code Workshop** | 带有实时预览的 HTML/CSS/JS 编辑器 |
| **Chess Workshop** | 策略和战术练习区 |
| **Capture Viewer** | 屏幕截图和录像查看器 |
| **GitHub Toolkit** | README 和营销文案生成器 |
| **Creative Lab** | 交互式实验 |
| **Template** | 创建新环境的模板 |

## 🏗️ 架构

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

## 🔌 WebSocket 协议

Claude Collaborate 包含一个 WebSocket 桥，用于与 Claude Code 进行实时通信：

```javascript
// Browser sends to Claude
{ "type": "user_message", "content": "Hello!" }

// Claude responds
{ "type": "claude_response", "content": "Hi there!" }

// Connection status
{ "type": "connected", "message": "Connected to Claude Collaborate Bridge" }
```

## 🔗 API 接口

| 接口 | 方法 | 描述 |
| ---------- | -------- | ------------- |
| `/` | GET | Claude Collaborate 主界面 |
| `/{file}` | GET | 静态文件（白板等） |
| `/ws` | WS | WebSocket 桥 |
| `/api/ws/messages` | GET | 读取待处理的用户消息 |
| `/api/ws/respond` | POST | 向浏览器发送响应 |
| `/api/ws/status` | GET | WebSocket 桥状态 |
| `/health` | GET | 服务器健康检查 |

## 💬 针对 Claude Code 用户

通过 WebSocket 桥与 Claude Collaborate 集成：

```bash
# Read messages from the UI
curl http://localhost:8877/api/ws/messages

# Send a response back
curl -X POST http://localhost:8877/api/ws/respond \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from Claude!"}'
```

## 🎭 可选：语音集成

Claude Collaborate 与 [Voice Soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) 配合使用，支持文本转语音：

```bash
# In another terminal, start Voice Soundboard
cd voice-soundboard
python -m voice_soundboard.web_server

# Voice Studio will be available at http://localhost:8080/studio
```

## 🛠️ 创建新环境

1. 将 `template.html` 复制到 `your-environment.html`
2. 在 `index.html` 中将其添加到侧边栏：
```html
<div class="env-item" data-url="/your-environment.html" data-name="Your Environment">
    <div class="env-icon" style="background: linear-gradient(...);">🎯</div>
    <div class="env-info">
        <h3>Your Environment</h3>
        <p>Description</p>
    </div>
</div>
```
3. 刷新并开始构建！

## 📋 需求

- Python 3.10+
- aiohttp
- 具有 WebSocket 支持的现代浏览器

## 🤝 贡献

我们欢迎贡献！无论是：
- 新的环境模板
- UI/UX 改进
- 错误修复
- 文档

请提出问题或提交拉取请求。

## 📄 许可证

MIT 许可证 - 详情请参阅 [LICENSE](LICENSE)。

## 🙏 致谢

- **Anthropic** - 感谢他们提供的 Claude 以及对有益人工智能的愿景
- **社区** - 感谢他们不断突破人类与人工智能协作的界限

---

<p align="center">
  <i>Built with ❤️ for the future of collaboration</i><br>
  <a href="https://github.com/mcp-tool-shop-org">MCP Tool Shop</a>
</p>
