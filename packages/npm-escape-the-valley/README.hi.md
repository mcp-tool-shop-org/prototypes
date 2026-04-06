<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/escape-the-valley/readme.png" width="400" alt="Escape the Valley">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/escape-the-valley"><img src="https://img.shields.io/npm/v/@mcptoolshop/escape-the-valley" alt="npm version"></a>
  <a href="https://pypi.org/project/escape-the-valley/"><img src="https://img.shields.io/pypi/v/escape-the-valley" alt="PyPI"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-escape-the-valley/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/escape-the-valley/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

ओरेगन ट्रेल-शैली का सर्वाइवल गेम, जिसमें एआई द्वारा कथा सुनाई जाती है और एक वैकल्पिक एक्सआरपीएल लेजर बैकपैक उपलब्ध है।

**पायथन की आवश्यकता नहीं है।** यह पैकेज एक पहले से तैयार किए गए बाइनरी को डाउनलोड करता है और उसे स्थानीय रूप से चलाता है।

## इंस्टॉल करें और चलाएं

```bash
npx @mcptoolshop/escape-the-valley tui --seed 42
```

बस इतना ही। कोई पायथन नहीं, कोई पिप नहीं, कोई वर्चुअल एनवायरनमेंट नहीं।

### सेव किए गए गेम को जारी रखें

```bash
npx @mcptoolshop/escape-the-valley tui --continue
```

यह ठीक वहीं से शुरू होता है जहां आपने छोड़ा था - गेम हर चेकपॉइंट पर ऑटो-सेव होता है।

## क्या होता है

1. पहली बार चलाने पर, प्लेटफॉर्म-विशिष्ट बाइनरी (~15 एमबी) [GitHub रिलीज़](https://github.com/mcp-tool-shop-org/escape-the-valley/releases) से डाउनलोड होती है।
2. SHA256 चेकसम की जांच की जाती है।
3. स्थानीय रूप से कैश किया जाता है (`~/.cache/mcptoolshop/escape-the-valley/`)।
4. सभी आर्गुमेंट्स के साथ चलाया जाता है।

बाद में चलने पर, यह कैश से तुरंत शुरू हो जाता है।

## यह गेम

बस्तवासियों के एक समूह को एक प्रक्रियात्मक रूप से उत्पन्न जंगल से गुजारें। भोजन, पानी, गाड़ी की स्थिति और मनोबल का प्रबंधन करें, जबकि घटनाओं, खतरों और कठिन विकल्पों का सामना करें। घाटी कठोर लेकिन निष्पक्ष है - एक कुशल खिलाड़ी लगभग 3 में से 1 बार जीतता है।

एक वैकल्पिक **एआई गेम मास्टर** (ओलामा द्वारा संचालित) तीन अलग-अलग आवाजों के साथ आपकी यात्रा का वर्णन करता है। एक वैकल्पिक **एक्सआरपीएल टेस्टनेट लेजर बैकपैक** हर आपूर्ति परिवर्तन को ऑन-चेन रसीदों के रूप में ट्रैक करता है।

### कैंप गतिविधियाँ

| क्रिया | यह क्या करता है |
|--------|-------------|
| **Travel** | निकास की ओर बढ़ें - हर मोड़ पर आगे न बढ़ने से अनावश्यक रूप से आपूर्ति खत्म होती है। |
| **Rest** | स्वास्थ्य और मनोबल को पुनः प्राप्त करें, बीमारियों को ठीक करने की संभावना। |
| **Hunt** | भोजन के लिए खोज करें (जंगलों और मैदानों में सबसे अच्छा)। |
| **Repair** | गाड़ी को ठीक करें ताकि वह खराब न हो जाए। |
| **Ration** | जब भोजन की कमी हो तो राशन को आधा कर दें (इससे मनोबल कम होता है)। |
| **Abandon** | गति बढ़ाने के लिए कार्गो का वजन कम करें (अंतिम उपाय)। |

### जीएम प्रोफाइल

| प्रोफाइल | आवाज |
|---------|-------|
| **Chronicler** | सूखी, तथ्यात्मक, ऐतिहासिक टोन। |
| **Fireside** | गर्म, लोकगीत शैली की कहानीकार। |
| **Lantern-Bearer** | अजीब, वायुमंडलीय, भयावह। |

## कमांड

```bash
npx @mcptoolshop/escape-the-valley tui                    # start a new game
npx @mcptoolshop/escape-the-valley tui --seed 42          # seeded world gen
npx @mcptoolshop/escape-the-valley tui --continue         # resume saved game
npx @mcptoolshop/escape-the-valley tui --gm chronicler    # choose GM voice
npx @mcptoolshop/escape-the-valley tui --callouts minimal # fewer warnings
npx @mcptoolshop/escape-the-valley ledger                 # print trail ledger
npx @mcptoolshop/escape-the-valley --help                 # see all commands
```

## समर्थित प्लेटफॉर्म

- लिनक्स x64
- macOS ARM64 (एप्पल सिलिकॉन)
- विंडोज x64

## समस्या निवारण

```bash
npx @mcptoolshop/escape-the-valley --print-cache-path  # show cached binary location
npx @mcptoolshop/escape-the-valley --clear-cache       # force fresh re-download
```

यदि नवीनतम संस्करण में कोई समस्या है, तो **किसी विशिष्ट संस्करण पर पिन करें:**

```bash
npx @mcptoolshop/escape-the-valley@1.0.0 tui --seed 42
```

## सुरक्षा

निष्पादन से पहले सभी बाइनरी को SHA256 चेकसम के विरुद्ध सत्यापित किया जाता है। कोई टेलीमेट्री नहीं। GitHub से प्रारंभिक डाउनलोड के अलावा कोई नेटवर्क एक्सेस नहीं।

[@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) द्वारा संचालित।

## वैकल्पिक: पायथन के माध्यम से इंस्टॉल करें

यदि आप पायथन पसंद करते हैं:

```bash
pip install escape-the-valley
trail tui --seed 42
```

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा बनाया गया।
