<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/sovereignty/readme.png" width="400" alt="sovereignty" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/sovereignty"><img src="https://img.shields.io/npm/v/@mcptoolshop/sovereignty" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-sovereignty/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/sovereignty/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

एक रणनीति गेम जो शासन, विश्वास और व्यापार के बारे में है — ऑफ़लाइन टेबलटॉप + एक्सआरपीएल ऑनलाइन सत्यापन।

**पायथन की आवश्यकता नहीं है।** यह पैकेज एक पहले से तैयार किए गए बाइनरी को डाउनलोड करता है और उसे स्थानीय रूप से चलाता है।

## इंस्टॉल करें और चलाएं

```bash
npx @mcptoolshop/sovereignty tutorial
```

बस इतना ही। कोई पायथन नहीं, कोई पिप नहीं, कोई वर्चुअल एनवायरनमेंट नहीं।

## क्या होता है

1. पहली बार चलाने पर, प्लेटफ़ॉर्म-विशिष्ट बाइनरी (~25 एमबी) [GitHub रिलीज़](https://github.com/mcp-tool-shop-org/sovereignty/releases) से डाउनलोड होती है।
2. SHA256 चेकसम का सत्यापन किया जाता है।
3. स्थानीय रूप से कैश किया जाता है (`~/.cache/mcptoolshop/sovereignty/`)।
4. सभी तर्कों के साथ चलाया जाता है।

बाद में चलने पर, यह तुरंत कैश से शुरू होता है।

## कमांड

```bash
npx @mcptoolshop/sovereignty tutorial    # learn the rules
npx @mcptoolshop/sovereignty new         # start a new game
npx @mcptoolshop/sovereignty status      # check game state
npx @mcptoolshop/sovereignty --help      # see all commands
```

## समर्थित प्लेटफ़ॉर्म

- लिनक्स x64
- macOS ARM64 (एप्पल सिलिकॉन)
- macOS x64 (इंटेल)
- विंडोज x64

## सुरक्षा

सभी बाइनरी को निष्पादन से पहले SHA256 चेकसम के विरुद्ध सत्यापित किया जाता है। कोई टेलीमेट्री नहीं। GitHub से प्रारंभिक डाउनलोड के अलावा कोई नेटवर्क एक्सेस नहीं।

[@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) द्वारा संचालित।

## वैकल्पिक: पायथन के माध्यम से इंस्टॉल करें

यदि आप पायथन पसंद करते हैं:

```bash
pipx install sovereignty-game
sov tutorial
```

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा निर्मित।
