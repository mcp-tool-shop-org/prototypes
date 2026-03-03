<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-demo/readme.png" width="400" alt="WebSketch">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-demo/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

[WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) のインタラクティブなデモサイト — 文法ベースのUI表現を視覚化します。

## 始め方

1. [ライブデモ](https://mcp-tool-shop-org.github.io/websketch-demo/) にアクセスします。
2. 入力欄に、WebSketchでキャプチャしたJSONデータを貼り付けます。
3. **Visualize（視覚化）**をクリックして、ツリービューとASCIIビューを表示します。
4. **Compare（比較）**モードに切り替えて、2つのキャプチャを並べて比較します。
5. **Export Bundle（バンドルエクスポート）**をクリックして、共有可能な`.ws.json`ファイルをダウンロードします。

キャプチャは、[Chrome拡張機能](https://github.com/mcp-tool-shop-org/websketch-extension)を使用して作成されます。詳細については、[ワークフローガイド](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started)を参照してください。

## 機能

- WebSketch IRの文法をインタラクティブに視覚化
- 構文チェック付きのライブJSONエディタ
- ロールバッジ、意味情報、バウンディングボックス情報を含むツリービュー
- ASCIIワイヤーフレームレンダリング
- 左右に並べて表示する比較モードと、差分サマリー
- キャプチャを共有するためのバンドルエクスポート機能
- 途中で切り捨てられたキャプチャに対する警告表示
- 高速で軽量な、標準的なTypeScriptによる実装
- すべてのデバイスに対応したレスポンシブデザイン

## クイックスタート

### 開発者向け

#### 前提条件

- Node.js 20以上
- npmまたはyarn

#### インストール

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-demo.git
cd websketch-demo

npm ci
npm run dev
```

アプリケーションは`http://localhost:3000`で起動します。

#### 利用可能なスクリプト

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

## プロジェクト構造

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

## 技術スタック

- **フレームワーク**: 標準的なTypeScript (フレームワークのオーバーヘッドなし)
- **ビルドツール**: Vite
- **テスト**: Vitest
- **Linting（コードチェック）**: ESLint + TypeScript ESLint
- **フォーマット**: Prettier
- **CI/CD**: GitHub Actions

## リンク

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Issue（問題点）**: [github.com/mcp-tool-shop-org/websketch-demo/issues](https://github.com/mcp-tool-shop-org/websketch-demo/issues)

## ライセンス

MIT — [LICENSE](LICENSE) を参照してください。

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> が作成しました。
