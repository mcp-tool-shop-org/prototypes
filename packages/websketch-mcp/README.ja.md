<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-mcp

**LLMエージェント向けの[WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir)ツールを提供するMCPサーバー。**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/websketch-mcp"><img src="https://img.shields.io/npm/v/websketch-mcp?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

LLMエージェント向けの[WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir)ツールを提供するMCPサーバー。

## はじめに

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

詳細な[セットアップガイド](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started)は、websketch-irを参照してください。

## 機能

- 🛡️ **websketch_validate**: 事前検証（エラーは発生せず、`{ ok: true/false }`を返します）
- 🎨 **websketch_render**: WebSketch IRのキャプチャをASCIIのワイヤーフレームに変換
- 🔍 **websketch_diff**: UIキャプチャ間の差分を計算
- 🔑 **websketch_fingerprint**: キャプチャの決定的なフィンガープリントを生成

## インストール

### npm

```bash
npm install -g websketch-mcp
```

### ソースコードから

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp
npm ci
npm run build
npm link
```

## 使用方法

### Claude Desktop

`claude_desktop_config.json`に追加してください。

```json
{
  "mcpServers": {
    "websketch": {
      "command": "websketch-mcp"
    }
  }
}
```

### プログラムによる設定

```bash
# Run as stdio server
websketch-mcp
```

または、Node.jsでプログラム的に設定します。

```typescript
import { spawn } from 'child_process';

const server = spawn('websketch-mcp', [], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Send MCP protocol messages via stdin/stdout
```

## ツール

### websketch_render

WebSketch IRのキャプチャをASCIIワイヤーフレームに変換します。

**入力:**
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

**出力:**
```
┌─────────────────────┐
│ Frame (root)        │
│ ├── Button (#btn1)  │
│ └── Text (#text1)   │
└─────────────────────┘
```

### websketch_diff

2つのWebSketch IRキャプチャ間の差分を計算します。

**入力:**
```json
{
  "before": { "root": {...} },
  "after": { "root": {...} }
}
```

**出力:**
```json
{
  "added": [...],
  "removed": [...],
  "modified": [...]
}
```

### websketch_fingerprint

キャプチャの決定的なフィンガープリントを生成します。

**入力:**
```json
{
  "capture": { "root": {...} }
}
```

**出力:**
```
abc123def456...
```

## 開発

### 前提条件

- Node.js 18以上
- npm

### セットアップ

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

### スクリプト

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

### プロジェクトの構成

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

## テスト

```bash
# Run all tests
npm test

# Run tests once (for CI)
npm run test:run

# Generate coverage report
npm run test:coverage
```

テストはVitestを使用して記述されています。例については、`tests/`ディレクトリを参照してください。

## 公開

このパッケージは、公開前の安全チェックが設定されています。

```bash
# This will automatically:
# 1. Run type checking
# 2. Run linting
# 3. Run tests
# 4. Build the package
npm publish
```

手動での公開手順:

```bash
# Bump version
npm version patch|minor|major

# Publish to npm
npm publish

# Push tags
git push --follow-tags
```

## トラブルシューティング

### インストール後にCLIが見つからない

```bash
# Ensure global bin directory is in PATH
npm config get prefix

# Or use npx
npx websketch-mcp
```

### ビルドの失敗

```bash
# Clean and rebuild
npm run clean
npm ci
npm run build
```

### Unix環境での権限エラー

ビルド後のスクリプトは、`dist/index.js`を自動的に実行可能にします。問題が発生した場合は、以下の点を確認してください。

```bash
chmod +x dist/index.js
```

## 貢献

ガイドラインについては、[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。

## ライセンス

MIT - 詳細については、[LICENSE](LICENSE)ファイルを参照してください。

## リンク

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Model Context Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Issue**: [github.com/mcp-tool-shop-org/websketch-mcp/issues](https://github.com/mcp-tool-shop-org/websketch-mcp/issues)

## サポート

ご質問や問題がある場合は、GitHubでIssueを作成してください。
