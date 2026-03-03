<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-demo/readme.png" width="400" alt="WebSketch">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-demo/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

[WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) 的交互式演示站点，用于可视化基于语法的用户界面表示。

## 入门

1. 访问[在线演示](https://mcp-tool-shop-org.github.io/websketch-demo/)
2. 将 WebSketch 捕获的 JSON 粘贴到输入区域
3. 点击“可视化”按钮，查看树状图和 ASCII 视图
4. 切换到“比较”模式，并排比较两个捕获结果
5. 点击“导出包”，下载可共享的 `.ws.json` 文件

捕获数据由 [Chrome 扩展程序](https://github.com/mcp-tool-shop-org/websketch-extension) 创建。请参阅完整的[工作流程指南](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started)。

## 特性

- 交互式可视化 WebSketch IR 语法
- 实时 JSON 编辑器，带语法验证
- 树状视图，带有角色标签、语义提示和边界框信息
- ASCII 骨架图渲染
- 比较模式，并排显示 ASCII 视图和差异摘要
- 导出包，用于共享捕获数据
- 内嵌警告显示，用于截断的捕获数据
- 快速、轻量级的原生 TypeScript 实现
- 响应式设计，适用于所有设备

## 快速开始

### 面向开发者

#### 先决条件

- Node.js 20+
- npm 或 yarn

#### 安装

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-demo.git
cd websketch-demo

npm ci
npm run dev
```

应用程序将在 `http://localhost:3000` 启动。

#### 可用脚本

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build

npm run typecheck        # Run TypeScript type checking
npm run lint             # Check code with ESLint
npm run format           # Format code with Prettier

npm test                 # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## 项目结构

```
websketch-demo/
├── src/
│   ├── __tests__/          # Test files
│   ├── main.ts             # Application entry point
│   └── styles.css          # Global styles
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD pipeline
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── vitest.config.ts        # Vitest configuration
```

## 技术栈

- **框架**: 原生 TypeScript (无框架负担)
- **构建工具**: Vite
- **测试**: Vitest
- **代码检查**: ESLint + TypeScript ESLint
- **代码格式化**: Prettier
- **CI/CD**: GitHub Actions

## 链接

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **问题反馈**: [github.com/mcp-tool-shop-org/websketch-demo/issues](https://github.com/mcp-tool-shop-org/websketch-demo/issues)

## 许可证

MIT — 参见 [LICENSE](LICENSE)。

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
