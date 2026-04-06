<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-extension

**一个 Chrome 扩展程序，用于将网页内容以 [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) 格式进行捕获。**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-extension/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

---

## 入门

1. 构建并加载扩展程序（请参见 [安装](#installation)）
2. 导航到任何网页，然后单击 WebSketch 图标
3. 单击“捕获当前页面”——捕获的 JSON 数据将被复制到剪贴板
4. 验证：`websketch validate capture.json` 或将数据粘贴到 [演示](https://mcptoolshop.com) 中
5. 可视化：`websketch render capture.json` 或使用演示中的树形/ASCII 视图

通过“设置”（弹出窗口中的齿轮图标）配置限制。 详细信息请参见完整的 [工作流程指南](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started)。

## 功能

- 一键页面捕获
- 自动复制到剪贴板
- 完整 DOM 树捕获，包括样式
- 元素边界和位置信息
- 可配置的限制（maxDepth、maxNodes、maxStringLength）
- 当捕获数据被截断时，会显示警告提示
- 快速、轻量级，无外部依赖

## 安装

### 从源代码（开发版）

1. **克隆仓库**
```bash
git clone https://github.com/mcp-tool-shop-org/websketch-extension.git
cd websketch-extension
```

2. **安装依赖项**
```bash
npm ci
```

3. **构建扩展程序**
```bash
npm run build
```

4. **在 Chrome 中加载**
- 打开 `chrome://extensions/`
- 启用“开发者模式”
- 单击“加载已解压的扩展程序”
- 选择 `dist/` 目录

### Chrome 网上应用商店（即将推出）

该扩展程序即将上线 Chrome 网上应用商店。

## 使用方法

1. **导航**到任何网页
2. **单击**工具栏中的 WebSketch 扩展程序图标
3. **单击**“捕获当前页面”
4. **复制**捕获数据（自动复制到剪贴板）
5. **使用** WebSketch IR 数据与其他工具

## 开发

### 先决条件

- Node.js 18+
- npm
- Chrome 或 Edge 浏览器

### 设置

```bash
npm ci
npm run typecheck
npm run lint
npm test
```

### 构建

```bash
npm run build       # Production build
npm run dev         # Development build with watch mode
```

构建好的扩展程序位于 `dist/` 目录中。

### 项目结构

```
websketch-extension/
├── src/
│   ├── content.ts         # Content script (captures pages)
│   ├── popup.ts           # Popup UI script
│   └── static/
│       ├── popup.html     # Popup HTML
│       └── icons/         # Extension icons
├── tests/
│   └── capture.test.ts    # Tests
├── build.js               # Build script
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### 脚本

```bash
npm run build           # Build for production
npm run dev             # Watch mode for development
npm run clean           # Remove dist/ directory
npm run typecheck       # Run TypeScript type checking
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm test                # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:coverage   # Generate coverage report
npm run validate        # Run all checks (typecheck, lint, test, build)
```

## WebSketch IR 格式

该扩展程序以 WebSketch IR 格式捕获页面：

```json
{
  "root": {
    "type": "HTML",
    "id": "...",
    "classes": ["..."],
    "children": [...]
  },
  "metadata": {
    "url": "https://example.com",
    "title": "Page Title",
    "timestamp": "2026-01-29T...",
    "viewport": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

## 故障排除

**构建失败，缺少资源：**
```bash
npm run build -- --allow-missing
```

**扩展程序无法加载：** 确保 `dist/manifest.json` 存在。 检查 `chrome://extensions/` 是否有错误。 尝试 `npm run clean && npm run build`。

**捕获功能无法使用：** 检查浏览器控制台是否有错误。 确保您正在访问一个正常的网页（而不是 `chrome://` 页面）。 重新构建后重新加载扩展程序。

## 贡献

请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解指南。

## 许可证

MIT — 详情请参阅 [LICENSE](LICENSE)。

## 链接

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **问题**: [github.com/mcp-tool-shop-org/websketch-extension/issues](https://github.com/mcp-tool-shop-org/websketch-extension/issues)
