<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/xrpl-camp/readme.png" width="400" alt="xrpl-camp" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/xrpl-camp"><img src="https://img.shields.io/npm/v/@mcptoolshop/xrpl-camp" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-xrpl-camp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/xrpl-camp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

एक बार में ही XRP लेजर सीखें – वॉलेट, भुगतान, सत्यापन, और प्रमाणपत्र, ये सब 10 मिनट में।

**पायथन की आवश्यकता नहीं है।** यह पैकेज एक पहले से तैयार बाइनरी फ़ाइल डाउनलोड करता है और उसे स्थानीय रूप से चलाता है।

## इंस्टॉल करें और चलाएं

```bash
npx @mcptoolshop/xrpl-camp start
```

बस इतना ही। कोई पायथन नहीं, कोई 'पिप' नहीं, और कोई वर्चुअल एनवायरनमेंट भी नहीं।

## क्या होता है

1. पहली बार चलाने पर, यह प्लेटफ़ॉर्म के अनुसार एक बाइनरी फ़ाइल (~20 एमबी) [GitHub रिलीज़](https://github.com/mcp-tool-shop-org/xrpl-camp/releases) से डाउनलोड करता है।
2. SHA256 चेकसम की जांच करता है।
3. इसे स्थानीय रूप से कैश करता है (`~/.cache/mcptoolshop/xrpl-camp/`)।
4. सभी तर्कों के साथ इसे चलाता है।

बाद में, यह कैश से तुरंत शुरू हो जाता है।

## कमांड

```bash
npx @mcptoolshop/xrpl-camp start      # begin the training
npx @mcptoolshop/xrpl-camp status     # check progress
npx @mcptoolshop/xrpl-camp --help     # see all commands
```

## समर्थित प्लेटफ़ॉर्म

- लिनक्स x64
- macOS ARM64 (एप्पल सिलिकॉन)
- macOS x64 (इंटेल)
- विंडोज x64

## सुरक्षा

सभी बाइनरी फ़ाइलों को निष्पादन से पहले SHA256 चेकसम के विरुद्ध सत्यापित किया जाता है। कोई टेलीमेट्री नहीं। GitHub से प्रारंभिक डाउनलोड के अलावा कोई नेटवर्क एक्सेस नहीं।

[@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) द्वारा संचालित।

## वैकल्पिक: पायथन के माध्यम से इंस्टॉल करें

यदि आप पायथन पसंद करते हैं:

```bash
pipx install xrpl-camp
xrpl-camp start
```

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा निर्मित।
