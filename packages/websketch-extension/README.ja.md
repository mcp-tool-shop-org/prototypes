<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-extension

**Chrome拡張機能で、ウェブページを[WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir)形式でキャプチャします。**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-extension/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

---

## はじめに

1. 拡張機能をビルドしてインストールします（[インストール](#installation)を参照）。
2. 任意のウェブページに移動し、WebSketchアイコンをクリックします。
3. 「現在のページをキャプチャ」をクリックすると、キャプチャされたJSONデータがクリップボードにコピーされます。
4. 検証：`websketch validate capture.json`を実行するか、[デモ](https://mcptoolshop.com)に貼り付けます。
5. 可視化：`websketch render capture.json`を実行するか、デモのツリー表示またはASCII表示を使用します。

設定（ポップアップ内の歯車アイコン）から制限を設定します。詳細については、[ワークフローガイド](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started)を参照してください。

## 機能

- ワンクリックでのページキャプチャ
- 自動クリップボードへのコピー
- スタイル付きの完全なDOMツリーのキャプチャ
- 要素の境界線と位置情報
- 設定可能な制限（maxDepth、maxNodes、maxStringLength）
- キャプチャが途中で終わった場合に表示される警告
- 高速で軽量、外部依存性なし

## インストール

### ソースコードから（開発用）

1. **リポジトリをクローンします**
```bash
git clone https://github.com/mcp-tool-shop-org/websketch-extension.git
cd websketch-extension
```

2. **依存関係をインストールします**
```bash
npm ci
```

3. **拡張機能をビルドします**
```bash
npm run build
```

4. **Chromeにロードします**
- `chrome://extensions/`を開きます。
- 「開発者モード」を有効にします。
- 「アンパックした拡張機能を読み込む」をクリックします。
- `dist/`ディレクトリを選択します。

### Chromeウェブストア（近日公開予定）

この拡張機能は、近日中にChromeウェブストアで利用可能になります。

## 使い方

1. 任意のウェブページに**移動します**。
2. ツールバーにあるWebSketch拡張機能のアイコンを**クリックします**。
3. 「現在のページをキャプチャ」を**クリックします**。
4. キャプチャされたデータを**コピーします**（自動的にクリップボードにコピーされます）。
5. WebSketch IRデータを他のツールで使用します。

## 開発

### 前提条件

- Node.js 18以上
- npm
- ChromeまたはEdgeブラウザ

### セットアップ

```bash
npm ci
npm run typecheck
npm run lint
npm test
```

### ビルド

```bash
npm run build       # Production build
npm run dev         # Development build with watch mode
```

ビルドされた拡張機能は、`dist/`ディレクトリにあります。

### プロジェクト構成

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

### スクリプト

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

## WebSketch IR形式

この拡張機能は、ページをWebSketch IR形式でキャプチャします。

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

## トラブルシューティング

**ビルドがアセットが見つからないために失敗する場合：**
```bash
npm run build -- --allow-missing
```

**拡張機能がロードされない場合：** `dist/manifest.json`が存在することを確認してください。`chrome://extensions/`でエラーがないか確認してください。`npm run clean && npm run build`を試してください。

**キャプチャが機能しない場合：** ブラウザのコンソールでエラーがないか確認してください。通常のウェブページ（`chrome://`ページではない）にいることを確認してください。拡張機能を再ビルドした後、再読み込みしてください。

## 貢献

ガイドラインについては、[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。

## ライセンス

MIT — 詳細については、[LICENSE](LICENSE)を参照してください。

## リンク

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Issue**: [github.com/mcp-tool-shop-org/websketch-extension/issues](https://github.com/mcp-tool-shop-org/websketch-extension/issues)
