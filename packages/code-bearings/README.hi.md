<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/code-bearings/readme.png" width="400" alt="Code Bearings">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/actions"><img src="https://github.com/mcp-tool-shop-org/code-bearings/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@code-bearings/cli"><img src="https://img.shields.io/npm/v/@code-bearings/cli" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/code-bearings/"><img src="https://img.shields.io/badge/Landing_Page-blue" alt="Landing Page"></a>
</p>

**अपने कोड में चीजों को फिर से व्यवस्थित करें।**

कोड बेयरिंग एक ऐसा टूल है जो आधुनिक कोडबेस के लिए स्रोत-आधारित नियंत्रण सतह प्रदान करता है। यह आपके टाइपस्क्रिप्ट प्रोजेक्ट को फ़ाइलों, प्रतीकों, मॉड्यूल और निर्भरताओं के एक ग्राफ में व्यवस्थित करता है, और फिर उस जानकारी को उन सभी स्थानों पर प्रदर्शित करता है जहाँ आपको इसकी आवश्यकता होती है: कमांड-लाइन इंटरफ़ेस (CLI), VS कोड, CI।

जानकारी हमेशा सटीक और विश्वसनीय रहती है। कृत्रिम बुद्धिमत्ता (AI) स्पष्टीकरण, शिक्षण और जानकारी प्रदर्शित करने में मदद करती है। मनुष्य हमेशा नियंत्रण में रहता है।

## यह क्या करता है

| उपयोगिता | आपको क्या मिलता है |
|---------|-------------|
| **CLI** | `code-bearings analyze` आपके प्रोजेक्ट का विश्लेषण करता है। `code-bearings review` किसी भी गिट बदलाव (diff) से बदलावों का सारांश उत्पन्न करता है - जोखिम के स्तर के साथ, प्रमाणों के साथ, और समीक्षक के मार्गदर्शन के साथ। |
| **VS Code** | गतिविधि बार में ट्री दृश्य, इंटरैक्टिव समीक्षा पैनल, होवर टूलटिप्स, कोडलेंस एनोटेशन, गटर सजावट, स्टेटस बार संदर्भ - ये सभी एक ही विश्वसनीय स्रोत से प्राप्त होते हैं। |
| **CI** | `code-bearings ci` समीक्षा रिपोर्ट (मार्कडाउन, JSON, HTML) उत्पन्न करता है और वैकल्पिक रूप से जोखिम सीमा पार होने पर विफल हो सकता है। |

## स्थापना

```bash
# CLI (global)
npm install -g @code-bearings/cli

# Or run directly
npx @code-bearings/cli analyze

# VS Code extension (from marketplace or local)
# Search "Code Bearings" in the VS Code extensions panel
```

## शुरुआत कैसे करें

```bash
# 1. Index your project
code-bearings analyze

# 2. Review your changes
code-bearings review

# 3. Explore the graph
code-bearings modules
code-bearings module store
code-bearings function generateChangeBrief

# 4. Compare branches
code-bearings compare main feature-branch

# 5. Generate CI artifacts
code-bearings ci --fail-on-risk high
```

## आर्किटेक्चर

कोड बेयरिंग एक मोनोरेपो है जिसमें तीन पैकेज हैं जो एक सख्त लेयरिंग अनुबंध साझा करते हैं:

```
@code-bearings/core    ← Shared product logic (extraction, graph, review, rendering)
@code-bearings/cli     ← Thin CLI consuming core
@code-bearings/vscode  ← Thin editor surface consuming core
```

**कोर (Core) सत्य को नियंत्रित करता है।** CLI (कमांड-लाइन इंटरफ़ेस) सरल है। एक्सटेंशन सरल है। कोई अलग उत्पाद नहीं है।

### सत्य की तीन परतें

| परत | क्या | उदाहरण |
|-------|------|---------|
| **A. Extracted Truth** | स्रोत कोड से प्राप्त तथ्य | "फ़ंक्शन X, फ़ंक्शन Y को कॉल करता है" |
| **B. Derived Structure** | परत A से गणना की गई | "मॉड्यूल M में 7 इनपुट हैं, जोखिम स्कोर 25" |
| **C. Human Narration** | A+B से स्पष्टीकरण | "यह बदलाव उच्च-ट्रैफ़िक पथ से त्रुटि हैंडलिंग को हटाता है" |

### पांच उद्देश्य मोड

सामान्य समीक्षा सत्य बताती है। अन्य मोड मनुष्यों को उस सत्य के साथ सोचने में मदद करते हैं।

| मोड | दृष्टिकोण |
|------|------|
| **General** | सटीक बदलावों का सारांश - क्या बदला, जोखिम, प्रमाण |
| **Bug Hunter** | विफलता की संभावनाएँ, कमज़ोरियाँ, निरीक्षण के लिए संकेत |
| **Learning** | सिंटैक्स अनुवाद, पहले/बाद के स्पष्टीकरण |
| **Architecture** | मॉड्यूल भूमिकाएँ, सीमा स्वास्थ्य, सिस्टम स्थिति |
| **Exploration** | अपरिचित कोडबेस के लिए निर्देशित प्रश्न |

## पैकेज

| पैकेज | विवरण | npm |
|---------|-------------|-----|
| [`@code-bearings/core`](packages/core/) | साझा निष्कर्षण, ग्राफ, समीक्षा और रेंडरिंग लॉजिक | [![npm](https://img.shields.io/npm/v/@code-bearings/core)](https://www.npmjs.com/package/@code-bearings/core) |
| [`@code-bearings/cli`](packages/cli/) | कमांड-लाइन इंटरफ़ेस | [![npm](https://img.shields.io/npm/v/@code-bearings/cli)](https://www.npmjs.com/package/@code-bearings/cli) |
| [`@code-bearings/vscode`](packages/vscode/) | VS कोड एक्सटेंशन | — |

## आवश्यकताएँ

- Node.js >= 20
- एक `tsconfig.json` के साथ टाइपस्क्रिप्ट प्रोजेक्ट
- Git (समीक्षा/तुलना कमांड के लिए)

## सुरक्षा और विश्वास

- **कोई नेटवर्क एक्सेस नहीं।** कोई टेलीमेट्री नहीं। कोई एनालिटिक्स नहीं। कोई डेटा संग्रह नहीं।
- **केवल-पढ़ने योग्य स्रोत एक्सेस।** कोड बेयरिंग आपके स्रोत फ़ाइलों को AST (Abstract Syntax Tree) पार्सिंग के माध्यम से पढ़ता है। यह उन्हें कभी नहीं बदलता है।
- **केवल स्थानीय डेटाबेस।** `.code-bearings/bearings.db` SQLite फ़ाइल आपके प्रोजेक्ट में ही रहती है।
- **कोई कोड निष्पादन नहीं।** केवल स्थैतिक विश्लेषण।

पूर्ण खतरे के मॉडल के लिए [SECURITY.md](SECURITY.md) देखें।

## लाइसेंस

[MIT](LICENSE)

---

द्वारा निर्मित <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
