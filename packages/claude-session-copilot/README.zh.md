<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-session-copilot/readme.png" width="400" />
</p>

<p align="center">
  <strong>Session memory for Claude Code.</strong><br>
  Captures decisions, timelines, and patterns across sessions. Makes context recoverable after <code>/compact</code>.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-session-copilot"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-session-copilot" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/claude-session-copilot" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-session-copilot/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## 为什么？

Claude Code 会话是临时的。当您使用 `/compact` 命令或重新开始时，您的思考过程、决策和进度都会消失。Session Copilot 可以捕获所有这些信息，并使其可以恢复。

**此插件仅适用于 Claude Code**——它依赖于 PostToolUse 钩子、技能、资源通知以及 CLAUDE.md 上下文注入，而其他 MCP 客户端都没有这些功能。

## 快速入门

```bash
npx @mcptoolshop/claude-session-copilot
```

### Claude Code 插件

将以下内容添加到您的项目的 `.mcp.json` 文件中：

```json
{
  "mcpServers": {
    "session-copilot": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/claude-session-copilot"]
    }
  }
}
```

## 它能做什么

### 7 个工具

| 工具 | 用途 |
| ------ | --------- |
| `copilot.decision` | 记录决策（内容、原因、已拒绝的选项） |
| `copilot.snapshot` | 保存会话状态，以便后续继续 |
| `copilot.resume` | 加载最新的快照和决策，以开始新的会话 |
| `copilot.timeline_event` | 记录时间线事件 |
| `copilot.query` | 搜索决策/时间线/快照 |
| `copilot.pulse` | 项目健康仪表板 |
| `copilot.forget` | 清理旧数据 |

### 4 个技能（仅适用于 Claude Code）

| 技能 | 作用 |
| ------- | ------------- |
| `/copilot:resume` | 从上次会话中断的地方继续 |
| `/copilot:snapshot` | 在 `/compact` 之前保存全面的状态 |
| `/copilot:decisions` | 查看决策日志 |
| `/copilot:pulse` | 项目健康仪表板 |

### 4 个 PostToolUse 钩子（仅适用于 Claude Code）

自动记录以下事件到时间线：
- **Bash** — 检测构建/测试结果（通过/失败）
- **Write** — 记录文件创建
- **Edit** — 记录文件修改
- **TodoWrite** — 记录任务状态更改

### 模式检测

当检测到以下情况时，会显示警报：
- **重复失败** — 相同的命令失败 3 次或更多
- **频繁修改** — 相同的文件在一个会话中被修改 5 次或更多
- **长时间会话** — 100 次或更多事件，但没有创建快照

### 4 个资源

| URI | 显示内容 |
| ----- | --------------- |
| `copilot://pulse` | 实时项目健康状况 |
| `copilot://timeline` | 当前会话事件 |
| `copilot://decisions` | 最近的决策日志 |
| `copilot://snapshot/latest` | 最近的交接说明 |

## 会话生命周期

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Session Start│ ──► │  /copilot:resume  │ ──► │   Work normally  │
└─────────────┘     └──────────────────┘     │  (hooks auto-    │
                                              │   track events)  │
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │ copilot.decision │
                                              │ (log key choices)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │/copilot:snapshot │
                                              │ (before /compact)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  Next session    │
                                              │  /copilot:resume │
                                              └─────────────────┘
```

## 存储

数据存储在 `.claude/copilot/store.json` 文件中（项目本地），或者 `~/.claude/copilot/store.json` 文件中（全局备份）。

可以使用 `COPILOT_STORE_PATH` 环境变量进行覆盖。

## 为什么仅适用于 Claude Code？

此服务器在架构上依赖于 Claude Code 的底层功能：

| 功能 | Claude Code 底层功能 | 其他 MCP 客户端 |
| --------- | ---------------------- | ------------------- |
| 自动时间线 | PostToolUse 钩子 | 没有钩子系统 |
| 斜杠命令 | 技能 (SKILL.md) | 没有技能 |
| 上下文注入 | CLAUDE.md | 没有等效功能 |
| 实时仪表板 | 资源通知 | 不轮询资源 |
| 任务协调 | TodoWrite 钩子 | 没有 TodoWrite |

如果没有这些，服务器就只是一个 JSON 文件，并且没有自动填充它的方法。

## 许可证

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
