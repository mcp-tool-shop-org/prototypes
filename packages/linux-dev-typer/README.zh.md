<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/linux-dev-typer/readme.png" alt="Linux Dev Typer logo" width="400"></p>

# linux-dev-typer

> [MCP Tool Shop](https://mcptoolshop.com) 的一部分

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/linux-dev-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/linux-dev-typer/actions/workflows/build.yml/badge.svg" alt="CI"></a>
  <a href="https://www.nuget.org/packages/LinuxDevTyper.Core"><img src="https://img.shields.io/nuget/v/LinuxDevTyper.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/linux-dev-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**面向开发者的代码练习工具——Avalonia UI 界面，自适应难度，趋势跟踪，疲劳检测。**

> 也可以作为原生 Windows 应用程序使用：[dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) (WinUI 3, Microsoft Store)

---

## 为什么选择 Linux Dev Typer？

- **练习真实的的代码，而不是简单的文字。** 每一个代码片段都是来自 Python、Rust、JavaScript、C# 或 Java 的真实应用场景，而不是“the quick brown fox”。
- **自适应难度。** 基于 Elo 评分系统的等级调整，根据您对每种语言的掌握程度进行调整，并具有防止反复和检测舒适区的功能。
- **关注弱点。** 每个字符的错误热图和容易混淆的代码片段，引导您练习您真正感到困难的部分。
- **关注疲劳。** 引擎会检测到性能下降，并在不良习惯形成之前建议您休息。
- **跨平台。** 基于 Avalonia UI 构建，可在 Linux、macOS 和 Windows 上运行，且代码库统一。
- **完全离线。** 没有任何遥测数据，不需要注册账号，也不需要网络连接。您的输入数据保存在您的本地设备上。
- **可扩展。** 核心引擎以独立的 NuGet 包的形式发布，不依赖任何用户界面组件。

---

## NuGet 包

| 包 | 描述 |
| --------- | ------------- |
| [`LinuxDevTyper.Core`](https://www.nuget.org/packages/LinuxDevTyper.Core) | 一个便携的代码练习引擎，具有 Elo 评分、自适应难度、弱点热图、疲劳检测、会话计划和微练习功能。不依赖任何用户界面组件。 |

核心引擎是一个独立的库，不依赖 Avalonia 或任何平台。实现 `IStorage`、`IAudioService` 和 `IAssetProvider` 接口，即可为您的平台创建一个完整的代码练习工具。

---

## 功能

### 核心代码练习引擎
- 每个字符的反馈：正确（浅绿色），错误（红色 + 下划线），未输入（灰色）
- 实时统计：每分钟输入字数 (WPM)、准确率、错误计数、经验值 (XP)
- 基于 Elo 的每种语言的评分系统
- 通过经验值和难度递增的等级提升
- 包含代码片段解释的完成卡片
- 可配置：字体大小、空格规则、行尾规范

### 自适应学习
- 跟踪每个字符的错误，并对符号进行分类（10 个类别）
- 通过自适应代码片段选择进行跨会话的弱点分析
- 跟踪每种语言的滚动 WPM 和准确率趋势
- 自适应难度，具有舒适区检测和防止反复的功能
- 会话后的洞察：个人最佳记录、里程碑、趋势信号
- 疲劳检测，并提供休息建议
- 极限模式：在继续之前，修复每个错误

### 反馈与反思
- 练习意图选择器：将会话标记为热身、练习、探索或挑战
- 会话笔记和会话浏览器，支持搜索/过滤
- 欢迎回来检测，提供情境化的问候语和自动难度调整
- 覆盖系统建议：取消反复锁、洞察类型和疲劳警报
- 每月压缩超过 200 个会话的历史记录
- 提供引导：在会话开始前，根据内容提供建议
- 检测瓶颈，并提供鼓励
- 个性化控制：冻结学习、重置偏好设置

### 内容系统
- 用户代码片段包：将 JSON 文件放入 `~/.config/linux-dev-typer/packs/` 目录
- 练习配置文件：命名参数集，用于调整引擎行为
- 导入/导出 `.ldtpack` 包，用于共享内容
- 粘贴代码、导入文件、导入文件夹，并自动检测语言
- 内容寻址 ID (SHA-256 算法进行去重)
- 统一的规范流水线：所有内容都以代码项的形式进入，并根据指标进行难度分级 (D1–D7)

### 教学与社区
- 学习框架：具有可选更深层次结构的渐进式学习环境。
- 变体：以平等方式展示的替代实现。
- 社区提示：可选的提示和见解，包含在 `.ldtpack` 文件包中。
- 社区难度：仅用于显示，表示社区贡献的难度等级。
- 默认匿名：导入的内容与本地内容无法区分。
- 所有教学和社区功能都是可选的，仅用于显示。

### 结构化练习
- 168 个校准片段，涵盖 5 种语言（D1–D7 覆盖）。
- 练习计划器：目标（50%）/ 复习（30%）/ 挑战（20%）的组合。
- 滚动检测弱点，使用时间衰减窗口。
- 选择透明度：“为什么选择这个片段”解释每个选择。
- 每个字符的错误热图，包含混淆对。
- 弱点轨迹：每日快照跟踪改进情况。

### 引导式练习
- 引导模式：可选择的开关，允许弱点信号影响选择。
- 弱点偏差：类别级别的偏差范围（+0 到 +3，难度等级不会改变）。
- 微练习：5 个项目的专注练习，针对最突出的弱点。
- 策略：基于特性标志的架构，具有主开关和每个特性的子标志。
- 存储限制：热图限制在 200 个字符，混淆对限制在 20 个，快照限制在 90 个。
- 默认关闭：除非明确启用，否则保留所有之前的行为。

### 音频
- 5 种键盘声音主题（每种 8 种变体）。
- 4 种环境声音类别（共 15 个音轨）。
- 每个通道的音量控制和静音功能。

### 辅助功能
- 键盘优先的用户体验，带有可见的焦点轮廓。
- 降低感官模式（降低音频音量）。
- 高对比度深色主题。

---

## 快速开始

**要求：** [.NET SDK 8.x](https://dotnet.microsoft.com/download/dotnet/8.0)

```bash
git clone https://github.com/mcp-tool-shop-org/linux-dev-typer.git
cd linux-dev-typer
dotnet restore
dotnet build -c Release
dotnet run --project src/LinuxDevTyper.App/LinuxDevTyper.App.csproj
```

---

## 运行测试

```bash
dotnet test
```

817 个测试，覆盖所有核心引擎模块。

---

## 项目结构

| Path | 目的 |
| ------ | --------- |
| `src/LinuxDevTyper.Core` | 可移植引擎：包含打字、评分、趋势、难度、配置文件、社区、教学、校准、计划器、弱点、热图、引导模式等功能。 |
| `src/LinuxDevTyper.Core.Tests` | xUnit 测试（817 个测试） |
| `src/LinuxDevTyper.App` | Avalonia 桌面界面：UI、平台服务、导入/导出。 |
| `assets/snippets` | 内置的 JSON 片段包。 |
| `assets/sounds` | WAV 文件（环境音 + 键盘音效）。 |
| `lib/meta-content-system` | 共享内容库。 |
| `docs/` | 架构、模式文档、阶段计划、扩展指南。 |

---

## 持久化

状态文件：`~/.config/linux-dev-typer/state.json` (版本 v12)

重置方法：`rm -rf ~/.config/linux-dev-typer`

---

## 添加您自己的代码

有三种方法可以练习您自己的代码：

### 选项 1：粘贴代码（最简单）

1. 打开侧边栏（点击齿轮图标）。
2. 找到“粘贴代码”部分。
3. 将任何代码片段粘贴到文本框中。
4. 点击“添加”——会自动检测语言。
5. 您的代码会立即出现在片段轮换中。

### 选项 2：导入文件或文件夹

1. 打开侧边栏 → 找到“导入”。
2. 点击“导入文件”以添加单个源文件，或点击“导入文件夹”以扫描整个项目。
3. 应用程序会自动检测文件扩展名（`.py`、`.rs`、`.js`、`.cs`、`.java`、`.sh`）来确定语言。
4. 导入的代码通过内容哈希进行去重——相同的代码永远不会被添加两次。

### 选项 3：创建片段包（JSON）

对于精心策划的练习片段集合：

1. 在您的包文件夹中创建一个 JSON 文件：
```
~/.config/linux-dev-typer/packs/
```

2.  以编程语言命名文件（例如：`python.json`）：
```json
{
"language": "python",
"snippets": [
{
"id": "my_list_comp",
"title": "列表推导式",
"difficulty": 3,
"topics": ["lists", "comprehension"],
"code": "squares = [x**2 for x in range(10)]\n"
},
{
"id": "my_dict_comp",
"title": "字典推导式",
"difficulty": 4,
"topics": ["dicts", "comprehension"],
"code": "counts = {word: len(word) for word in words}\n"
}
]
}
```

3.  重启应用程序——您的代码片段将被合并到内置的代码片段中，并且可以在侧边栏中启用/禁用。

**提示：**
- `id` 必须在所有代码包中是唯一的。
- `difficulty` 的范围是 1（简单）到 7（困难）。
- `code` 应该以 `\n` 结尾。
- 用户代码包可以被启用/禁用，而无需删除文件。

### 内容分享

将您的自定义代码片段导出为可移植的 `.ldtpack` 文件：

1.  打开侧边栏 → 点击 **导出**。
2.  与其他人分享 `.ldtpack` 文件。
3.  他们可以通过侧边栏导入它 → **导入**。

只有用户创建的内容会被传输——不会包含任何历史记录或设置。

---

## 隐私

linux-dev-typer 完全离线。不会收集、传输或共享任何数据。

## 许可证

[MIT](LICENSE)
