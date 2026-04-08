<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/ai-ui/main/assets/logo-ai-ui.png" alt="AI-UI" width="600" />
</p>

**用于单页应用 (SPA) 的自动化设计诊断。** AI-UI 会抓取您的正在运行的应用，读取您的文档，并准确地告诉您哪些已记录的功能没有可发现的 UI 入口点，以及哪些 UI 界面根本没有被记录。

它不会进行猜测。它会根据真实的浏览器交互构建触发器图，将功能与触发器进行确定性匹配，并生成一个设计图，其中包含可执行的判断结果：必须显示、降级、保留、合并。然后，它会验证修复结果。

## 它能做什么

```
README says "ambient soundscapes"  →  atlas extracts the feature
Probe clicks every button           →  "Audio Settings" trigger found
Diff matches feature to trigger     →  coverage: 64%
Design-map says: must-surface 0     →  all documented features are discoverable
```

AI-UI 弥合了文档承诺和 UI 现实之间的差距。

## 安装

```bash
git clone https://github.com/mcp-tool-shop-org/ai-ui.git
cd ai-ui
npm install
```

需要 Node.js 20+，以及一个正在运行的开发服务器，用于 `probe/runtime-effects` 命令。

## 快速开始

```bash
# 1. Parse your docs into a feature catalog
ai-ui atlas

# 2. Crawl your running app
ai-ui probe

# 3. Match features to triggers
ai-ui diff

# Or run all three in sequence:
ai-ui stage0
```

输出结果保存在 `ai-ui-output/` 目录下。差异报告会告诉您哪些内容已匹配，哪些内容缺失，以及哪些内容未被记录。

## 命令

| 命令 | 它能做什么 |
|---------|-------------|
| `atlas` | 将文档（README、CHANGELOG 等）解析为功能目录 |
| `probe` | 抓取正在运行的 UI，记录每个交互触发器 |
| `surfaces` | 从 WebSketch 捕获中提取界面元素 |
| `diff` | 将 atlas 功能与探测触发器进行匹配 |
| `graph` | 根据探测结果、界面元素和差异构建触发器图 |
| `design-map` | 生成界面元素清单、功能地图、任务流程、信息架构建议 |
| `compose` | 根据差异和图生成界面显示计划 |
| `verify` | 判断流水线构建产物，为 CI 提供通过/失败的判断结果 |
| `baseline` | 保存/比较验证基线 |
| `pr-comment` | 从构建产物生成可用于 PR 的 Markdown 注释 |
| `runtime-effects` | 在真实的浏览器中点击触发器，捕获观察到的副作用 |
| `runtime-coverage` | 每个触发器的覆盖矩阵（已探测/已显示/已观察） |
| `replay-pack` | 将所有构建产物打包成可重现的重放包 |
| `replay-diff` | 比较两个重放包，显示哪些内容发生了变化以及原因 |
| `ai-suggest` | 使用 Ollama (大脑) 将文档特征与用户界面元素进行匹配。 |
| `ai-eyes` | 使用 LLaVA (眼睛) 视觉识别仅包含图标或文本内容较少的界面元素。 |
| `ai-hands` | 使用 qwen2.5-coder (双手) 生成可直接提交的代码补丁，用于修复界面上的缺失部分。 |
| `stage0` | 按顺序运行 atlas + probe + diff |
| `init-memory` | 创建用于决策跟踪的空内存文件 |

## 配置

在您的项目根目录下创建 `ai-ui.config.json`：

```json
{
  "docs": { "globs": ["README.md", "CHANGELOG.md", "docs/*.md"] },
  "probe": {
    "baseUrl": "http://localhost:5173",
    "routes": ["/", "/settings", "/dashboard"]
  },
  "featureAliases": {
    "dark-mode-support": ["Theme", "Dark mode"]
  },
  "goalRules": [
    { "id": "settings_open", "label": "Open Settings", "kind": "domEffect", "dom": { "textRegex": "Settings" }, "score": 2 }
  ]
}
```

所有字段都是可选的，会应用合理的默认值。有关完整模式，请参阅 `cli/src/config.mjs`。

### 目标规则

对于 URL 不会改变的 SPA，基于路由的目标规则是无用的。目标规则允许您定义成功为可观察到的效果：

| 类型 | 匹配项 | 示例 |
|------|---------|---------|
| `storageWrite` | localStorage/sessionStorage 写入 | `{ "keyRegex": "^user\\.prefs\\." }` |
| `fetch` | HTTP 请求（按方法/URL/状态） | `{ "method": ["POST"], "urlRegex": "/api/save" }` |
| `domEffect` | DOM 变动（模态框打开、提示等） | `{ "textRegex": "saved" }` |
| `composite` | 多种类型的组合 | `storage + dom` 用于“设置已保存” |

规则需要运行时证据（`ai-ui runtime-effects` + `ai-ui graph --with-runtime`）才能产生目标命中。如果没有证据，目标将保持未评估状态，不会产生误报。

## 设计图输出

`design-map` 命令会生成四个构建产物：

- **界面元素清单**：按位置（主要导航、设置、工具栏、内联）分组的每个交互元素。
- **功能地图**：每个已记录的功能，包含可发现性评分、入口点和推荐操作。
- **任务流程**：推断出的导航链，包含循环检测和目标跟踪。
- **信息架构建议**：主要导航、次要导航、必须显示、已记录但未显示的界面元素、转化路径。

### 推荐操作

| 操作 | 含义 |
|--------|---------|
| `promote` | 功能已记录，但被隐藏，需要更易于发现的入口点。 |
| `keep` | 功能设计经过良好平衡，文档完善且易于发现。 |
| `demote` | 功能突出但存在风险或价值较低，应移至高级设置。 |
| `merge` | 不同路径中存在重复的功能名称，应进行整合。 |
| `skip` | 这并非真正的功能（名称类似于句子，缺乏实际意义）。 |

## 流水线

完整的流水线流程：

```
atlas → probe → diff → graph → design-map → ai-suggest → ai-eyes → ai-hands
                 ↓                                                      ↓
          runtime-effects → graph --with-runtime                  hands.plan.md
                                    ↓                             hands.patch.diff
                              design-map (with goals)             hands.files.json
                                    ↓                             hands.verify.md
                              replay-pack → replay-diff
```

每个阶段读取前一个阶段的输出，输出文件位于 `ai-ui-output/` 目录下。该流水线是确定性的，相同的输入产生相同的输出。

## AI 命令 (本地 Ollama)

这三个命令使用本地 Ollama 模型，以超越简单的匹配。它们需要安装并运行本地的 [Ollama](https://ollama.com) —— 您的数据不会离开您的机器。

### ai-suggest (大脑)

使用通用大型语言模型 (LLM) 在已记录的特征和用户界面元素之间进行语义匹配。

```bash
ai-ui ai-suggest                        # default model
ai-ui ai-suggest --model qwen2.5:14b    # specify model
ai-ui ai-suggest --eyes ai-ui-output/eyes.json  # enrich with Eyes data
```

输出别名补丁，这些补丁告诉差异引擎哪些特征映射到哪些触发器，从而弥补模糊字符串匹配可能遗漏的部分。

### ai-eyes (眼睛)

使用视觉模型 (LLaVA) 对用户界面元素进行视觉增强。它可以识别仅包含图标的按钮、文本内容较少的控件以及视觉上存在歧义的界面元素。

```bash
ai-ui ai-eyes                           # default: llava:13b
ai-ui ai-eyes --model llava:7b          # lighter model
```

为界面元素添加 `icon_guess`、`visible_text` 和 `nearby_context` 注释，这些上下文信息供后续命令 (ai-suggest, ai-hands) 用于精确的目标定位。

### ai-hands (双手)

使用代码模型 (qwen2.5-coder) 生成可直接提交的代码补丁。它读取完整的设计映射流水线输出，并生成查找/替换编辑，以修复界面上的缺失部分。

```bash
ai-ui ai-hands                          # all tasks, default model
ai-ui ai-hands --tasks surface-settings,goal-hooks  # specific tasks
ai-ui ai-hands --repo /path/to/project  # target a different repo
ai-ui ai-hands --min-rank 0.50          # only high/medium confidence edits
```

**任务类型：**
- `add-aiui-hooks`：为非破坏性交互元素添加 `data-aiui-safe` 属性。
- `surface-settings`：提高已记录但未充分展示的特征的可发现性。
- `goal-hooks`：为任务完成检测添加 `data-aiui-goal` 属性。
- `copy-fix`：使用户界面标签与文档术语保持一致。

**输出：** `hands.plan.md` (排序后的编辑组)，`hands.patch.diff` (按可信度排序的代码块)，`hands.files.json` (包含排序元数据的清单)，`hands.verify.md` (验证清单)。

每个编辑都根据其可信度（验证强度、锚点质量、局部性、来源、安全性）进行排名，并分为高/中/低置信度类别。编辑绝不会自动应用——输出始终是供人工审查的建议。

## CI 集成

```bash
# Run pipeline + verify in CI
ai-ui stage0
ai-ui graph
ai-ui verify --strict --gate minimum --min-coverage 60

# Exit code 0 = pass, 1 = user error, 2 = runtime error
```

使用 `--json` 参数获取机器可读的输出。使用 `baseline --write` 命令锁定阈值。

## 安全模型

AI-UI 在您的开发服务器上本地运行。它不会：
- 将数据发送到外部服务（AI 命令仅使用本地 Ollama）。
- 修改您的源代码或配置文件（ai-hands 输出建议，绝不应用）。
- 访问 `baseUrl` 和文档目录范围之外的内容。
- 需要网络连接（所有分析都是本地进行的）。

`runtime-effects` 命令会在 Playwright 浏览器中模拟点击实际按钮。它遵循安全规则：
- 跳过与匹配的禁止模式（例如：delete、remove、destroy 等）相关的操作。
- `data-aiui-safe` 属性可以覆盖已知安全操作的安全性。
- `--dry-run` 模式仅模拟悬停，不进行实际点击。

## 测试

```bash
npm test
```

使用 Node.js 原生测试运行器进行 877 次测试。不使用任何外部测试框架。

## 许可证

MIT 协议，详情请参见 [LICENSE](LICENSE)。

---

由 [MCP Tool Shop](https://mcp-tool-shop.github.io/) 构建。
