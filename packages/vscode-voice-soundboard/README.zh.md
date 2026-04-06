<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/vscode-voice-soundboard/readme.png" alt="Voice Soundboard" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.vscode-voice-soundboard"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.vscode-voice-soundboard.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/vscode-voice-soundboard"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/vscode-voice-soundboard" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/vscode-voice-soundboard/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

文本转语音扩展，包含48种声音、预设选项和多说话人对话功能，由[MCP Voice Soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) 提供支持。

## 功能

- **侧边栏面板**，包含“朗读”、“声音”和“对话”选项卡。
- **48种声音**，涵盖9种语言（英语、日语、普通话、西班牙语、法语、印地语、意大利语、葡萄牙语）。
- **5个预设**：助手、旁白、播报员、故事讲述者、低语。
- **多说话人对话**：编写剧本，分配声音，播放所有内容。
- **朗读选择**：高亮代码或文本，然后按 `Ctrl+Shift+S`。
- **跨平台**音频播放（Windows、macOS、Linux）。

## 入门

1. 安装扩展。
2. MCP Voice Soundboard 服务器将自动启动。
3. 点击活动栏中的麦克风图标。
4. 输入文本并点击“朗读”。

## 命令

| 命令 | 快捷键 | 描述 |
|---------|----------|-------------|
| Voice Soundboard: 朗读文本... | — | 输入要朗读的文本。 |
| Voice Soundboard: 朗读选择 | `Ctrl+Shift+S` | 朗读所选编辑器中的文本。 |
| Voice Soundboard: 停止朗读 | — | 停止当前播放。 |
| Voice Soundboard: 更改声音 | — | 快速选择声音。 |
| Voice Soundboard: 切换面板 | — | 显示/隐藏侧边栏。 |
| Voice Soundboard: 导出对话为 WebVTT | — | 将对话剧本导出为 `.vtt` 字幕文件。 |

## 对话导出

在“对话”选项卡中编写多说话人剧本，分配声音，然后点击“导出 VTT”。该扩展会合成每一行，根据音频时长计算累计时间码，并保存一个 [WebVTT](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API) 字幕文件。

导出的 `.vtt` 文件使用声音标签 (`<v Speaker>`)，可与视频播放器、字幕编辑器或辅助工具一起使用。

## 设置

| 设置 | 默认值 | 描述 |
|---------|---------|-------------|
| `voiceSoundboard.defaultVoice` | `bm_george` | 默认声音 ID |
| `voiceSoundboard.speed` | `1.0` | 语速（0.5–2.0） |
| `voiceSoundboard.backend` | `python` | TTS 后端（python/http/mock） |
| `voiceSoundboard.autoStart` | `true` | 激活时自动启动服务器 |
| `voiceSoundboard.format` | `wav` | 音频输出格式 |

## 安全与数据范围

- **本地后端（默认）：** Python/Kokoro TTS 完全在您的机器上运行，无需网络连接。
- **云后端（可选）：** 将文本发送到用户配置的 TTS API（OpenAI/ElevenLabs），需要明确的 API 密钥。
- **音频播放：** 使用 `spawn` 配合参数数组，而不是 shell，详情请参见 [SECURITY.md](SECURITY.md)。
- **不收集或发送任何遥测数据。**

## 许可证

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
