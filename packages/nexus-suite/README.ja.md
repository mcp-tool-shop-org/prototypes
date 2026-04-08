<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nexus-suite/readme.png" alt="Nexus Suite" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nexus-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/nexus-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nexus-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**MCPツールエコシステムのためのガバナンス、認証、およびルーティングインフラストラクチャ。**

---

## 概要

- **認証:** `nexus-attest`を使用して、ツールの出力に署名および検証を行います。
- **ガバナンス:** `nexus-control`を使用して、ポリシーを定義および適用します。
- **ルーティング:** `nexus-router`を使用して、プラグイン可能なアダプターを介してリクエストを転送します。
- **モジュール性:** 6つの独立したパッケージで構成されており、必要なものだけを使用できます。
- **Pythonネイティブ:** 標準的な`pip install -e .`のワークフローを使用し、テストには`pytest`を使用します。

---

## プロジェクト

| パッケージ | 説明 |
| --------- | ------------- |
| `nexus-attest` | 認証の署名と検証 |
| `nexus-control` | ガバナンスポリシーのための制御面 |
| `nexus-router` | リクエストのルーティングと転送 |
| `nexus-router-adapter-stdout` | 標準出力（stdout）転送用のルーターアダプター |
| `nexus-router-adapter-http` | HTTP転送用のルーターアダプター |
| `nexus-router-adapter-template` | カスタムアダプターを構築するためのテンプレート |

---

## クイックスタート

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/nexus-suite.git
cd nexus-suite

# Install a component
cd src/nexus-router
pip install -e .

# Run tests
pytest
```

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     nexus-control                            │
│              (governance policies, config)                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     nexus-router                             │
│              (request dispatch + routing)                    │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   stdout    │      │    http     │      │  (custom)   │
│   adapter   │      │   adapter   │      │   adapter   │
└─────────────┘      └─────────────┘      └─────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     nexus-attest                             │
│              (signature verification)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## ライセンス

[MIT](LICENSE)
