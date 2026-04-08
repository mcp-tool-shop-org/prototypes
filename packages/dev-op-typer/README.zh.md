<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# Dev-Op-Typer

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/dev-op-typer/readme.png" alt="Dev-Op-Typer" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml/badge.svg" alt="Build"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/dev-op-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**一款面向开发者的打字练习应用程序，适用于 Windows 系统——每个练习都是真实的代码。**

> 同样适用于 Linux/macOS：[linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) (使用 Avalonia UI)

## 功能

### 真实代码练习
- 在 **Python、JavaScript、C#、Java、SQL 和 Bash** 中输入真实的代码片段。
- 逐个字符跟踪准确度，并使用高亮显示差异。
- 精确符号匹配：`{ } [ ] ( ) < > ; : , . " ' \``
- 换行符和缩进很重要。

### 自适应学习
- 根据您的技能水平智能选择代码片段。
- 针对每种语言的类似 Elo 评分系统。
- 学习计划：目标 (50%) / 复习 (30%) / 挑战 (20%) 的组合。
- 每个字符的错误热图，显示薄弱环节。
- 引导模式：可选的、以薄弱环节为导向的选择，并提供微型练习。
- 难度等级 (D1–D7)，并检测舒适区。

### 实时统计
- 实时显示每分钟输入字数 (WPM)、准确率和错误计数。
- 完成练习后提供回顾性分析。
- 跟踪趋势：每种语言的滚动 WPM 和准确率。
- 检测疲劳，并提供休息建议。
- 显示薄弱环节面板，提供字符级别的分析。

### 教学与社区
- 提示：提供逐步的上下文提示，并提供“更多上下文”的层级。
- 演示：显示替代实现，作为同等水平的示例。
- 社区提示：仅显示提示和难度评级。
- 来自共享内容包的指导说明。
- 技能层级面板，用于理解代码结构。

### 内容系统
- 包含 168 多个用于校准的代码片段，涵盖 6 种语言。
- 用户代码片段包：将 JSON 文件放入“packs”文件夹中。
- 粘贴代码：将任何代码从剪贴板粘贴为练习内容。
- 导入文件/文件夹：索引源代码文件，并自动检测语言。
- 导出/导入 `.ldtpack` 包，用于共享内容。
- 内容寻址 ID (使用 SHA-256 进行去重)。

### 音频
- 包含多种主题的环境音效。
- 机械键盘按键声音 (5 种主题，每种主题 8 种变体)。
- 每个通道的音量控制 (环境音、键盘声音、UI)。
- 从标题栏静音/取消静音。

### 辅助功能
- 完全支持键盘导航。
- 支持高对比度主题。
- 减少动画效果选项。
- 所有交互元素的辅助属性。

### 持久性
- 包含经验值 (XP)、等级和每种语言的评级的个人资料。
- 保存设置和语言选择，并在不同会话之间生效。
- 会话历史记录 (最多 500 条记录)，并每月进行压缩。
- 练习配置：命名参数集，用于调整引擎。

## 安装

### Microsoft Store (推荐)
即将推出 — 待 Store 认证。

### 从源代码构建

**要求：**
- Windows 10 版本 1809 或更高版本，或 Windows 11
- .NET 10.0 SDK
- Visual Studio 2022 (包含 Windows App SDK 工作负载) — 或命令行工具

```bash
git clone https://github.com/mcp-tool-shop-org/dev-op-typer.git
cd dev-op-typer
dotnet build DevOpTyper/DevOpTyper.csproj -c Release -p:Platform=x64
```

运行构建好的可执行文件：
```
DevOpTyper\bin\x64\Release\net10.0-windows10.0.19041.0\DevOpTyper.exe
```

## 项目结构

```
DevOpTyper/
├── Assets/
│   ├── Icons/         # App icons and Store tile assets
│   ├── Snippets/      # JSON snippet packs by language
│   └── Sounds/        # Ambient and SFX audio files
├── Controls/          # Custom controls (CodeRenderer, TypingPresenter)
├── Models/            # Data models (Profile, Snippet, AppSettings, etc.)
├── Panels/            # UI panels (Typing, Stats, Settings, Explanation, etc.)
├── Services/          # Core services (Audio, Typing, Persistence, Content)
├── Themes/            # Color and high-contrast themes
├── MainWindow.xaml    # Main application window
└── Package.appxmanifest  # MSIX packaging manifest
external/
└── meta-content-system/  # Shared content library (submodule)
```

## 键盘快捷键

| Key | 操作 |
|-----| -------- |
| Tab / Shift+Tab | 导航控件 |
| Enter | 开始新的练习 |
| Escape | 重置当前练习 |

## 添加您自己的代码

有三种方法可以练习您自己的代码：

### 选项 1：粘贴代码 (最简单)

1. 打开 **设置** 面板 (点击标题栏中的 ⚙ 符号)
2. 滚动到 **粘贴代码**
3. 将任何代码片段粘贴到文本框中
4. 点击 **添加** — 自动检测语言
5. 您的代码会立即出现在代码片段的循环中

### 选项 2：导入文件或文件夹

1. 打开 **设置** → 滚动到 **导入**
2. 点击 **导入文件** 以添加单个源文件，或点击 **导入文件夹** 以扫描整个项目。
3. 该应用程序会自动检测文件扩展名（`.py`, `.js`, `.cs`, `.java`, `.sql`, `.sh`）所使用的编程语言。
4. 导入的代码会根据内容哈希进行去重，相同的代码不会被重复添加。

### 选项 3：创建代码片段包（JSON）

用于精心设计的练习代码片段集合：

1. 打开您的用户代码片段文件夹：
```
%LocalAppData%\DevOpTyper\UserSnippets\
```
（或者点击 **打开代码片段文件夹** 在设置中）

2. 创建一个以编程语言命名的 JSON 文件（例如 `python.json`）：
```json
{
"language": "python",
"snippets": [
{
"id": "my_list_comp",
"title": "列表推导式",
"difficulty": 3,
"topics": ["列表", "推导式"],
"code": "squares = [x**2 for x in range(10)]\n"
},
{
"id": "my_dict_comp",
"title": "字典推导式",
"difficulty": 4,
"topics": ["字典", "推导式"],
"code": "counts = {word: len(word) for word in words}\n"
}
]
}
```

3. 重新启动应用程序 — 您的代码片段将与内置的代码片段一起显示。

**提示：**
- `id` 必须在所有代码片段包中是唯一的。
- `difficulty` 的范围是 1（简单）到 7（困难）。
- `code` 应该以 `\n` 结尾。
- 您可以将代码片段包组织在最多一层深度的子目录中。

### 内容分享

将您的自定义代码片段导出为可移植的 `.ldtpack` 文件：

1. 打开 **设置** → 点击 **导出包**
2. 与其他人分享 `.ldtpack` 文件。
3. 他们可以通过 **设置** → **导入包** 来导入它。

只有用户创建的内容会被传输，不会包含练习历史或设置。

## 隐私

Dev-Op-Typer 完全离线运行。不会收集、传输或共享任何数据。请参阅 [PRIVACY.md](PRIVACY.md)。

## 许可证

[MIT](LICENSE)
