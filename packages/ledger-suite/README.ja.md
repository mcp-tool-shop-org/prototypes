<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ledger-suite/readme.png" width="400" alt="Ledger Suite">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/ledger-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

暗号化されたトレーサビリティを管理するための統合型モノレポ。

## プロジェクト

| プロジェクト | 説明 | テスト |
| --------- | ------------- | ------- |
| `src/ClaimLedger/` | 科学的データのトレーサビリティと検証 | 371 |
| `src/CreatorLedger/` | 作成者の認証証明 | 219 |
| `src/CreatorLedger/Shared.Crypto/` | 共有されるEd25519暗号化基盤 | - |

## クイックスタート

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/ledger-suite.git
cd ledger-suite

# Build all
dotnet build ledger-suite.sln

# Test all
dotnet test ledger-suite.sln

# Run ClaimLedger CLI
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- --help

# Run CreatorLedger CLI
dotnet run --project src/CreatorLedger/CreatorLedger.Cli -- --help
```

## 構造

```
ledger-suite/
├── ledger-suite.sln          # Root solution
├── src/
│   ├── ClaimLedger/          # Scientific claims
│   │   ├── ClaimLedger.Domain/
│   │   ├── ClaimLedger.Application/
│   │   ├── ClaimLedger.Infrastructure/
│   │   ├── ClaimLedger.Cli/
│   │   └── ClaimLedger.Tests/
│   └── CreatorLedger/        # Creator proofs
│       ├── CreatorLedger.Domain/
│       ├── CreatorLedger.Application/
│       ├── CreatorLedger.Infrastructure/
│       ├── CreatorLedger.Cli/
│       ├── CreatorLedger.Tests/
│       └── Shared.Crypto/    # Shared crypto
```

## ClaimLedgerの機能

- Ed25519署名による**主張の表明**
- 暗号化された証明と連携する**引用**
- **認証**（ピアレビュー、再現、機関の承認）
- 署名者の合意による**取り消し**
- 不服申し立てを防ぐための**RFC 3161タイムスタンプ**
- 配布可能な**ClaimPacks**
- オフラインでの引用解決のための**ローカルレジストリ**
- ワンクリックで配布できる**公開コマンド**

## CreatorLedgerの機能

- デジタル資産の**作成者の認証証明**
- **コンテンツハッシュの検証**
- **複数当事者による認証チェーン**
- 持ち運び可能な検証のための**証明バンドル**

## ライセンス

MIT

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>によって作成されました。
