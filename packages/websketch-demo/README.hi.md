<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-demo/readme.png" width="400" alt="WebSketch">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-demo/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

[WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) के लिए इंटरैक्टिव डेमो साइट - व्याकरण-आधारित यूआई प्रतिनिधित्व को देखें।

## शुरुआत कैसे करें

1. [लाइव डेमो](https://mcp-tool-shop-org.github.io/websketch-demo/) पर जाएं।
2. इनपुट पैनल में एक WebSketch कैप्चर JSON पेस्ट करें।
3. ट्री और एएससीआई व्यू देखने के लिए **विज़ुअलाइज़** पर क्लिक करें।
4. दो कैप्चर की तुलना करने के लिए **तुलना** मोड पर स्विच करें।
5. साझा करने योग्य `.ws.json` फ़ाइल डाउनलोड करने के लिए **एक्सपोर्ट बंडल** पर क्लिक करें।

कैप्चर [क्रोम एक्सटेंशन](https://github.com/mcp-tool-shop-org/websketch-extension) के साथ बनाए जाते हैं। पूरा [कार्यप्रणाली गाइड](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started) देखें।

## विशेषताएं

- WebSketch IR व्याकरण का इंटरैक्टिव विज़ुअलाइज़ेशन।
- सिंटैक्स सत्यापन के साथ लाइव JSON एडिटर।
- भूमिका बैज, सिमेंटिक संकेत और बाउंडिंग बॉक्स जानकारी के साथ ट्री व्यू।
- एएससीआई वायरफ्रेम रेंडरिंग।
- साइड-बाय-साइड एएससीआई और अंतर सारांश के साथ तुलना मोड।
- कैप्चर साझा करने के लिए एक्सपोर्ट बंडल।
- ट्रंकेटेड कैप्चर के लिए एम्बेडेड चेतावनी प्रदर्शन।
- तेज़, हल्का, मूल टाइपस्क्रिप्ट कार्यान्वयन।
- सभी डिवाइसों के लिए रिस्पॉन्सिव डिज़ाइन।

## त्वरित शुरुआत

### डेवलपर्स के लिए

#### आवश्यकताएं

- Node.js 20+
- npm या yarn

#### इंस्टॉलेशन

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-demo.git
cd websketch-demo

npm ci
npm run dev
```

ऐप `http://localhost:3000` पर खुलेगा।

#### उपलब्ध स्क्रिप्ट

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

## परियोजना संरचना

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

## तकनीकी स्टैक

- **फ्रेमवर्क**: मूल टाइपस्क्रिप्ट (कोई फ्रेमवर्क ओवरहेड नहीं)
- **बिल्ड टूल**: Vite
- **परीक्षण**: Vitest
- **लिंटिंग**: ESLint + TypeScript ESLint
- **फॉर्मेटिंग**: Prettier
- **CI/CD**: GitHub Actions

## लिंक

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **समस्याएं**: [github.com/mcp-tool-shop-org/websketch-demo/issues](https://github.com/mcp-tool-shop-org/websketch-demo/issues)

## लाइसेंस

MIT - [LICENSE](LICENSE) देखें।

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा निर्मित।
