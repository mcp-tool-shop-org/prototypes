<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/game-dev-mcp/readme.png" alt="Game Dev MCP" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/game-dev-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/game-dev-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/game-dev-mcp"><img src="https://img.shields.io/npm/v/@mcptoolshop/game-dev-mcp" alt="npm version"></a>
  <a href="https://mcp-tool-shop-org.github.io/game-dev-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  Talk to your game engine. Spawn actors, build levels, tweak properties — all through natural conversation with any LLM.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#what-can-it-do">44 Tools</a> &middot;
  <a href="#knowledge-library">Knowledge Library</a> &middot;
  <a href="HANDBOOK.md">Handbook</a>
</p>

---

目前支持 **Unreal Engine 5**，通过内置的远程控制 API 实现。无需任何第三方插件。无需进行 C++ 编译。只需启用 API 并开始交互即可。

## 使用体验如何？

> **您：** 在桌子上方生成一个点光源，并使其发出暖光。

LLM 会调用 `ue_spawn_actor`，设置变换，并通过 `ue_set_property` 调整颜色温度，然后，该光源就会出现在您的视口中。您继续对话，它持续构建。

## 快速开始

### 1. 在 UE5 中启用远程控制 API

1. 打开您的 UE5 项目（5.4+）。
2. **编辑 > 插件** → 搜索 "Remote Control API" → 启用。
3. 重新启动编辑器。

此插件已经包含在 UE5 中，您只需启用它。

### 2. 安装和配置

```bash
npx @mcptoolshop/game-dev-mcp
```

将以下内容添加到您的 MCP 客户端配置文件（例如 Claude Desktop 的 `claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "gamedev": {
      "command": "npx",
      "args": ["@mcptoolshop/game-dev-mcp"]
    }
  }
}
```

### 3. 测试

让您的 LLM 询问：**"Ping Unreal Engine"**，它会调用 `ue_ping` 并确认连接。

## 它可以做什么？

### Actor（9 个工具）
在关卡中生成、删除、复制、变换、列出、查找和选择 Actor。适用于任何 Actor 类，包括网格体、光源、相机和体积。

### 属性（4 个工具）
读取和写入任何 UPROPERTY，应用于任何 UObject。使用 `ue_describe_object` 发现可用的属性，然后获取或设置您需要的属性。

### 资源（8 个工具）
搜索内容浏览器，列出目录，检查是否存在，复制、重命名、删除和保存资源。

### 关卡（4 个工具）
保存当前关卡，加载不同的关卡，获取关卡信息，或一次性保存所有未保存的文件。

### 蓝图（5 个工具）
从头开始创建蓝图类，添加组件，配置其属性，编译并生成实例，所有操作都通过对话进行。

### 编辑器（4 个工具）
测试连接，运行控制台命令，获取引擎信息，并将视口对齐到任何 Actor。

### 知识库（1 个工具）
按需搜索 35 个内置的 UE5 教程，以便您的 LLM 可以在对话过程中查找 Nanite 的工作原理，或者了解什么是行为树。

### 项目（7 个工具）
将项目特定的约定、注释和上下文存储在 `.game-dev-mcp/` 目录中，这些信息将跨会话持久保存。

### 任务（2 个工具）
跟踪多步骤操作的进度。与 [mcp-aside](https://github.com/mcp-tool-shop-org/mcp-aside) 集成，以提供实时通知。

**总计：44 个工具**

## 知识库

服务器将 35 个教程作为 MCP 资源打包。您的 LLM 会根据需要读取这些教程，避免不必要的上下文加载：

| 分类 | 涵盖内容 |
| ---------- | -------- |
| **Getting Started** | 设置、首次命令、项目结构 |
| **Actors** | 生成、变换、类型引用、组件 |
| **Assets** | 内容浏览器、搜索模式、导入 |
| **Blueprints** | 基础、创建、组件配置 |
| **Levels** | 管理、世界组合 |
| **Materials** | 基础、材质实例 |
| **Lighting** | 光源类型、工作流程 |
| **Physics** | 模拟、碰撞、约束 |
| **Audio** | 声音提示、衰减、空间音频 |
| **Animation** | 骨骼网格体、动画蓝图、蒙太奇 |
| **Visual Effects** | Niagara 粒子、GPU 模拟 |
| **Rendering** | Nanite、Lumen、虚拟阴影贴图 |
| **AI & Navigation** | 导航网、行为树、EQS |
| **Cinematics** | 序列器、相机、电影渲染 |
| **Virtual Assistant** | MetaHuman 助手、LLM 集成 |
| **API Reference** | 远程控制 API、子系统引用 |
| **Patterns** | 常见工作流程、错误处理、性能 |

## 项目知识

您的 LLM 可以存储和回忆与项目相关的上下文信息：

```
ue_project_init(name: "My Game", ueVersion: "5.4")
ue_project_set_convention(convention: "All Blueprints use BP_ prefix")
ue_project_add_note(title: "Level Layout", content: "Main hall is 2000x1000 cm")
```

存储在 `.game-dev-mcp/` 目录下，并且在不同会话之间保持一致，这样 AI 就能从您上次停止的地方继续工作。

## 配置

| 变量 | 默认值 | 描述 |
| ---------- | --------- | ------------- |
| `GAMEDEV_MCP_HOST` | `127.0.0.1` | 游戏引擎编辑器的主机名 |
| `GAMEDEV_MCP_PORT` | `30010` | 远程 API 端口 |
| `GAMEDEV_MCP_TIMEOUT` | `10000` | 请求超时时间（毫秒） |
| `GAMEDEV_MCP_LOG_LEVEL` | `info` | 日志级别（错误/警告/信息/调试） |

## 系统要求

- Node.js 18+
- Unreal Engine 5.4+，并且启用了远程控制 API 插件

## 使用手册

要了解完整的安装步骤、实用技巧、故障排除方法以及每个工具的详细说明，请阅读 **[使用手册](HANDBOOK.md)**。

## 许可证

MIT 协议 — 由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
