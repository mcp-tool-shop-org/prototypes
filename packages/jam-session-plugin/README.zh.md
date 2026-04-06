<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/jam-session-plugin/readme.png" alt="Jam Session Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/jam-session-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

一款人工智能钢琴伴奏软件，拥有包含100首歌曲的库，提供结构化的教学和即兴演奏功能。通过您的扬声器播放，无需安装任何外部软件。

此插件封装了[AI Jam Session](https://github.com/mcp-tool-shop-org/ai_jam_session) MCP服务器，增加了斜杠命令、智能体个性以及用于学习和即兴演奏的结构化工作流程。

## 安装

```bash
claude plugin add ai-jam-session
```

MCP服务器 (`@mcptoolshop/ai-jam-session`) 将通过npx自动下载。需要Node.js 18或更高版本。

## 您将获得

### 技能（斜杠命令）

| 命令 | 描述 |
| --------- | ------------- |
| `/ai-jam-session:teach <song>` | 启动结构化教学环节 |
| `/ai-jam-session:practice <song> [level]` | 获取个性化的练习计划 |
| `/ai-jam-session:explore [query]` | 按流派、难度或关键词浏览包含100首歌曲的库 |
| `/ai-jam-session:jam <song or genre>` | 开始即兴演奏——Claude会根据情况进行创作 |

### 智能体

| Agent | 描述 |
| ------- | ------------- |
| `piano-teacher` | 一位耐心、有教育意义的老师，会根据学生的水平进行指导 |
| `jam-musician` | 一位轻松的即兴乐队成员，注重节奏，鼓励实验 |

### MCP工具（15个）

浏览、播放、教学、即兴演奏和管理歌曲。插件的技能会自动协调这些工具，但也可以直接使用。

## 使用方法

使用斜杠命令：

```
/ai-jam-session:explore jazz
/ai-jam-session:teach moonlight-sonata-mvt1
/ai-jam-session:practice let-it-be beginner
/ai-jam-session:jam autumn-leaves as blues
/ai-jam-session:jam jazz
```

或者，您可以自然地进行对话——智能体会根据上下文自动激活：

```
I want to learn a beginner jazz song on piano.
Help me practice Fur Elise at half speed.
Let's jam on some blues.
```

## 歌曲库

包含100首歌曲，涵盖10个流派（古典、爵士、流行、布鲁斯、摇滚、R&B、拉丁、电影配乐、ragtime、新世纪），难度分为初级、中级和高级。

## 要求

- Node.js 18或更高版本
- 扬声器（钢琴声音通过系统音频播放）

## 链接

- MCP服务器: [@mcptoolshop/ai-jam-session](https://www.npmjs.com/package/@mcptoolshop/ai-jam-session)
- 源代码: [mcp-tool-shop-org/ai_jam_session](https://github.com/mcp-tool-shop-org/ai_jam_session)

## 许可证

MIT
