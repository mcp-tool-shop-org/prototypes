<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/">
    <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-hook-debug/readme.png" width="400" alt="claude-hook-debug" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug/branch/main/graph/badge.svg" alt="Coverage" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-hook-debug"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-hook-debug" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

用于诊断 Claude Code 插件问题的命令行工具。它可以检测到由于禁用插件、作用域冲突、配置错误以及 Claude Code 已知 bug 导致的“幽灵”插件。

## 安装

```bash
npm install -g @mcptoolshop/claude-hook-debug
```

或者直接运行：

```bash
npx @mcptoolshop/claude-hook-debug
```

## 用法

```bash
# Scan current workspace
claude-hook-debug

# Scan a specific project
claude-hook-debug /path/to/project

# JSON output (for piping/scripting)
claude-hook-debug --json
```

如果检测到任何错误，退出码为 1，否则为 0。

## 检测内容

| ID | 严重程度 | 描述 |
|----|----------|-------------|
| `GHOST_HOOK_PREVIEW` | error | `claude-preview` 插件已禁用，但 Stop 钩子仍然生效 ([#19893](https://github.com/anthropics/claude-code/issues/19893)) |
| `GHOST_HOOK_GENERIC` | warning | 任何已禁用的插件可能仍然存在活动钩子。 |
| `LOCAL_ONLY_PLUGINS` | error | `enabledPlugins` 在本地设置中仅起作用，会静默覆盖已删除的设置 ([#25086](https://github.com/anthropics/claude-code/issues/25086)) |
| `SCOPE_CONFLICT` | warning | 插件在一个作用域中启用，而在另一个作用域中禁用。 |
| `STOP_CONTINUE_LOOP` | error | Stop 钩子输出 `continue:true`，导致无限循环 ([#1288](https://github.com/anthropics/claude-code/issues/1288)) |
| `DISABLE_ALL_HOOKS_ACTIVE` | warning/error | `disableAllHooks: true` 会禁用所有钩子（如果存在受管设置，则升级为错误）。 |
| `BROKEN_SETTINGS_JSON` | error | 无效的 JSON 会静默禁用该文件中的所有设置。 |
| `LARGE_SETTINGS_FILE` | warning | 设置文件大小 > 100KB（可能导致启动缓慢）。 |
| `PLUGIN_HOOKS_INVISIBLE` | info | 没有用户钩子，但插件已启用——插件钩子对检查不可见。 |

## 设置作用域

该工具会读取 Claude Code 加载顺序中的所有四个设置作用域：

| 作用域 | 路径 | 优先级 |
|-------|------|------------|
| managed | `~/.claude/managed-settings.json` | 最高 |
| user | `~/.claude/settings.json` | |
| project | `.claude/settings.json` | |
| local | `.claude/settings.local.json` | 最低（最后写入的内容生效） |

## 库的使用

```typescript
import { debug } from '@mcptoolshop/claude-hook-debug';

const report = debug({ projectRoot: '/path/to/project' });

console.log(report.diagnostics);
// [{ id: 'GHOST_HOOK_PREVIEW', severity: 'error', title: '...', ... }]

console.log(report.plugins);
// [{ pluginId: 'claude-preview@...', mergedEnabled: false, scopes: [...] }]
```

## 安全与威胁模型

**它会访问的文件：** Claude Code 的设置文件 (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/managed-settings.json`)。所有读取操作均为只读操作，该工具绝不会修改任何文件。

**它不会访问的文件：** 不会读取或记录任何 API 密钥、令牌、环境变量值或凭据。设置中的 `env` 块将被完全忽略。不会访问 Claude Code 设置路径之外的任何文件。

**所需权限：** 访问 `~/.claude/` 目录和项目中的 `.claude/` 目录的读权限。不需要任何提升权限、网络访问或 shell 执行权限。

**无遥测。** 无分析。无任何形式的数据收集。零生产依赖。

---

由 [MCP Tool Shop](https://mcp-tool-shop.github.io/) 构建。
