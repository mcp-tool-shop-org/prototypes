<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-extension

**क्रोम एक्सटेंशन जो वेब पेजों को [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) के रूप में कैप्चर करता है।**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-extension/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

---

## शुरुआत कैसे करें

1. एक्सटेंशन को बनाएं और लोड करें (इंस्टॉलेशन देखें)।
2. किसी भी वेब पेज पर जाएं और WebSketch आइकन पर क्लिक करें।
3. "कैप्चर करंट पेज" पर क्लिक करें - कैप्चर JSON डेटा क्लिपबोर्ड पर कॉपी हो जाएगा।
4. सत्यापन करें: `websketch validate capture.json` या डेमो में पेस्ट करें ([https://mcptoolshop.com](https://mcptoolshop.com))।
5. विज़ुअलाइज़ करें: `websketch render capture.json` या डेमो के ट्री/ASCII व्यू का उपयोग करें।

सेटिंग्स (पॉपअप में गियर आइकन) के माध्यम से सीमाओं को कॉन्फ़िगर करें। पूर्ण [कार्यप्रणाली गाइड](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started) देखें।

## विशेषताएं

- एक क्लिक में पेज कैप्चर
- स्वचालित क्लिपबोर्ड कॉपी
- शैलियों के साथ पूर्ण DOM ट्री कैप्चर
- तत्वों की सीमाएं और स्थिति
- कॉन्फ़िगर करने योग्य सीमाएं (maxDepth, maxNodes, maxStringLength)
- जब कैप्चर ट्रंकेट हो जाता है तो चेतावनी संदेश
- तेज़, हल्का, कोई बाहरी निर्भरता नहीं

## इंस्टॉलेशन

### स्रोत से (डेवलपमेंट)

1. **रिपॉजिटरी को क्लोन करें**
```bash
git clone https://github.com/mcp-tool-shop-org/websketch-extension.git
cd websketch-extension
```

2. **निर्भरताएँ स्थापित करें**
```bash
npm ci
```

3. **एक्सटेंशन बनाएं**
```bash
npm run build
```

4. **क्रोम में लोड करें**
- `chrome://extensions/` खोलें
- "डेवलपर मोड" सक्षम करें
- "लोड अनपैक्ड" पर क्लिक करें
- `dist/` डायरेक्टरी का चयन करें

### क्रोम वेब स्टोर (जल्द ही उपलब्ध)

यह एक्सटेंशन जल्द ही क्रोम वेब स्टोर पर उपलब्ध होगा।

## उपयोग

1. किसी भी वेब पेज पर **जाएं**
2. अपने टूलबार में WebSketch एक्सटेंशन आइकन पर **क्लिक करें**
3. "कैप्चर करंट पेज" पर **क्लिक करें**
4. कैप्चर डेटा को **कॉपी करें** (स्वचालित रूप से क्लिपबोर्ड पर कॉपी हो जाता है)
5. अन्य उपकरणों के साथ WebSketch IR डेटा का **उपयोग करें**

## डेवलपमेंट

### आवश्यकताएं

- Node.js 18+
- npm
- क्रोम या एज ब्राउज़र

### सेटअप

```bash
npm ci
npm run typecheck
npm run lint
npm test
```

### बिल्ड

```bash
npm run build       # Production build
npm run dev         # Development build with watch mode
```

बनाया गया एक्सटेंशन `dist/` डायरेक्टरी में होगा।

### परियोजना संरचना

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

### स्क्रिप्ट्स

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

## WebSketch IR प्रारूप

यह एक्सटेंशन वेब पेजों को WebSketch IR प्रारूप में कैप्चर करता है:

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

## समस्या निवारण

**बिल्ड विफल हो जाता है और एसेट्स गायब होते हैं:**
```bash
npm run build -- --allow-missing
```

**एक्सटेंशन लोड नहीं हो रहा है:** सुनिश्चित करें कि `dist/manifest.json` मौजूद है। त्रुटियों के लिए `chrome://extensions/` की जांच करें। `npm run clean && npm run build` का प्रयास करें।

**कैप्चर काम नहीं कर रहा है:** त्रुटियों के लिए ब्राउज़र कंसोल की जांच करें। सुनिश्चित करें कि आप एक सामान्य वेबपेज पर हैं (क्रोम:// पेज नहीं)। पुनर्निर्माण के बाद एक्सटेंशन को पुनः लोड करें।

## योगदान

मार्गदर्शिका के लिए [CONTRIBUTING.md](CONTRIBUTING.md) देखें।

## लाइसेंस

MIT — विवरण के लिए [LICENSE](LICENSE) देखें।

## लिंक

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **समस्याएं**: [github.com/mcp-tool-shop-org/websketch-extension/issues](https://github.com/mcp-tool-shop-org/websketch-extension/issues)
