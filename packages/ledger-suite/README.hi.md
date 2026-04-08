<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ledger-suite/readme.png" width="400" alt="Ledger Suite">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/ledger-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

एकाकी मोनोरिपो, जो क्रिप्टोग्राफिक प्रमाण आधारित लेज़र के लिए है।

## परियोजनाएं

| परियोजना | विवरण | परीक्षण |
| --------- | ------------- | ------- |
| `src/ClaimLedger/` | वैज्ञानिक दावों की उत्पत्ति और सत्यापन | 371 |
| `src/CreatorLedger/` | निर्माता द्वारा प्रमाण | 219 |
| `src/CreatorLedger/Shared.Crypto/` | साझा Ed25519 क्रिप्टोग्राफिक बुनियादी तत्व | - |

## शुरुआत कैसे करें

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

## संरचना

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

## ClaimLedger की विशेषताएं

- Ed25519 हस्ताक्षर के साथ **दावों की पुष्टि**
- क्रिप्टोग्राफिक प्रमाण के साथ दावों को जोड़ने वाले **उद्धरण**
- **प्रमाणीकरण** (पीयर रिव्यू, पुनरुत्पादन, संस्थागत अनुमोदन)
- गवाहों के सह-हस्ताक्षर के साथ **रद्दीकरण**
- गैर-अस्वीकरण के लिए **RFC 3161 टाइमस्टैम्प**
- वितरण के लिए तैयार बंडलों के लिए **ClaimPacks**
- ऑफ़लाइन उद्धरण समाधान के लिए **स्थानीय रजिस्ट्री**
- एक-क्लिक वितरण के लिए **प्रकाशित करें कमांड**

## CreatorLedger की विशेषताएं

- डिजिटल संपत्तियों के लिए **निर्माता द्वारा प्रमाण**
- **सामग्री हैश सत्यापन**
- **बहु-पक्षीय प्रमाणीकरण श्रृंखलाएं**
- पोर्टेबल सत्यापन के लिए **प्रमाण बंडल**

## लाइसेंस

MIT

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा निर्मित।
