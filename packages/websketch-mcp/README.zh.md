<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-mcp

**一个 MCP 服务器，它暴露了 [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) 工具，供 LLM 代理使用。**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/websketch-mcp"><img src="https://img.shields.io/npm/v/websketch-mcp?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

一个 MCP 服务器，它暴露了 [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) 工具，供 LLM 代理使用。

## 入门

```bash
# Install
npm install -g websketch-mcp

# Add to Claude Desktop config:
# { "mcpServers": { "websketch": { "command": "websketch-mcp" } } }

# The MCP server exposes 4 tools:
# 1. websketch_validate - preflight check (always call first)
# 2. websketch_render   - ASCII wireframe
# 3. websketch_diff     - compare two captures
# 4. websketch_fingerprint - structural hash
```

请参阅 websketch-ir 中的完整 [工作流程指南](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started)。

## 特性

- 🛡️ **websketch_validate**: 预检验证（不会抛出错误，返回 `{ ok: true/false }`）
- 🎨 **websketch_render**: 将 WebSketch IR 捕获结果渲染为 ASCII 示意图
- 🔍 **websketch_diff**: 计算 UI 捕获结果之间的差异
- 🔑 **websketch_fingerprint**: 为捕获结果生成确定性指纹

## 安装

### npm

```bash
npm install -g websketch-mcp
```

### 从源代码构建

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp
npm ci
npm run build
npm link
```

## 使用方法

### Claude Desktop

添加到您的 `claude_desktop_config.json` 文件中：

```json
{
  "mcpServers": {
    "websketch": {
      "command": "websketch-mcp"
    }
  }
}
```

### 程序化方式

```bash
# Run as stdio server
websketch-mcp
```

或者，在 Node.js 中以编程方式使用：

```typescript
import { spawn } from 'child_process';

const server = spawn('websketch-mcp', [], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Send MCP protocol messages via stdin/stdout
```

## 工具

### websketch_render

将 WebSketch IR 捕获结果渲染为 ASCII 示意图。

**输入：**
```json
{
  "capture": {
    "root": {
      "type": "Frame",
      "id": "root",
      "children": [...]
    }
  }
}
```

**输出：**
```
┌─────────────────────┐
│ Frame (root)        │
│ ├── Button (#btn1)  │
│ └── Text (#text1)   │
└─────────────────────┘
```

### websketch_diff

计算两个 WebSketch IR 捕获结果之间的差异。

**输入：**
```json
{
  "before": { "root": {...} },
  "after": { "root": {...} }
}
```

**输出：**
```json
{
  "added": [...],
  "removed": [...],
  "modified": [...]
}
```

### websketch_fingerprint

为捕获结果生成确定性指纹。

**输入：**
```json
{
  "capture": { "root": {...} }
}
```

**输出：**
```
abc123def456...
```

## 开发

### 先决条件

- Node.js 18+
- npm

### 设置

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp

# Install dependencies
npm ci

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

### 脚本

```bash
npm run build         # Compile TypeScript to dist/
npm run dev           # Watch mode compilation
npm run start         # Run the compiled server
npm run typecheck     # Type checking without emit
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Generate coverage report
npm run clean         # Remove dist/ folder
```

### 项目结构

```
websketch-mcp/
├── src/
│   └── index.ts          # Main server implementation
├── tests/
│   └── smoke.test.ts     # Test files
├── scripts/
│   └── add-shebang.js    # Post-build script
├── .github/
│   ├── workflows/
│   │   ├── ci.yml        # CI pipeline (includes security scanning)
│   │   └── publish.yml   # npm publish (release + dispatch)
│   └── dependabot.yml    # Dependency updates
├── dist/                 # Compiled output (gitignored)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── vitest.config.ts      # Test configuration
└── .eslintrc.cjs         # ESLint configuration
```

## 测试

```bash
# Run all tests
npm test

# Run tests once (for CI)
npm run test:run

# Generate coverage report
npm run test:coverage
```

测试使用 Vitest 编写。请参阅 `tests/` 目录中的示例。

## 发布

该软件包配置了发布前安全检查。

```bash
# This will automatically:
# 1. Run type checking
# 2. Run linting
# 3. Run tests
# 4. Build the package
npm publish
```

手动发布步骤：

```bash
# Bump version
npm version patch|minor|major

# Publish to npm
npm publish

# Push tags
git push --follow-tags
```

## 故障排除

### 安装后找不到 CLI

```bash
# Ensure global bin directory is in PATH
npm config get prefix

# Or use npx
npx websketch-mcp
```

### 构建失败

```bash
# Clean and rebuild
npm run clean
npm ci
npm run build
```

### 在 Unix 系统上出现权限错误

构建脚本会自动使 `dist/index.js` 文件可执行。如果遇到问题：

```bash
chmod +x dist/index.js
```

## 贡献

请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 文件以获取指南。

## 许可证

MIT - 详情请参阅 [LICENSE](LICENSE) 文件。

## 链接

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Model Context Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **问题**: [github.com/mcp-tool-shop-org/websketch-mcp/issues](https://github.com/mcp-tool-shop-org/websketch-mcp/issues)

## 支持

如果您有任何问题或疑虑，请在 GitHub 上提交一个 issue。
