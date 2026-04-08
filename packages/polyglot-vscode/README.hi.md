<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="media/icon.png" width="400" alt="Polyglot">
</p>

<p><strong>Translate text, files, and READMEs directly in VS Code — powered by your local GPU. 55 languages, zero cloud dependency.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.polyglot-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.polyglot-vscode" alt="VS Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/polyglot-vscode"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/polyglot-vscode" alt="Coverage"></a>
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/polyglot-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## यह क्या करता है

पॉलिग्लॉट आपके स्थानीय जीपीयू पर [Ollama](https://ollama.com) के माध्यम से [TranslateGemma 12B](https://ai.google.dev/gemma/docs/core/translategemma) चलाता है। इसमें कोई एपीआई कुंजी, कोई क्लाउड सेवाएं, और आपका कोई डेटा आपके मशीन से बाहर नहीं जाता है।

- **टेक्स्ट का अनुवाद करें** — टेक्स्ट का चयन करें, `Ctrl+Alt+T` दबाएं, और एक भाषा चुनें। काम हो गया।
- **फ़ाइल का अनुवाद करें** — पूरी फ़ाइल को एक नई `file.ja.ext` फ़ाइल में अनुवाद करें, जो मूल फ़ाइल के साथ रहेगी।
- **README का अनुवाद करें** — अपने `README.md` फ़ाइल को 7 भाषाओं में बैच में अनुवाद करें, जिसमें कोड ब्लॉक, टेबल और बैज बरकरार रहें।
- **साइडबार पैनल** — एक्टिविटी बार में ग्लोब आइकन, जिसमें एक्शन बटन और Ollama की लाइव स्थिति दिखाई देती है।

## आवश्यकताएं

- [Ollama](https://ollama.com) स्थापित और चल रहा होना चाहिए।
- एक जीपीयू जिसकी वीआरएएम मॉडल के लिए पर्याप्त हो (`translategemma:12b` के लिए 12GB, `translategemma:2b` के लिए 2GB)।
- मॉडल पहली बार उपयोग करने पर स्वचालित रूप से डाउनलोड हो जाता है।

## शुरुआत कैसे करें

1. एक्सटेंशन स्थापित करें।
2. एक्टिविटी बार (बाएं साइडबार) में ग्लोब आइकन पर क्लिक करें।
3. **चेक स्टेटस** पर क्लिक करें — पॉलीग्लॉट Ollama को शुरू करेगा और यदि आवश्यक हो तो मॉडल डाउनलोड करेगा।
4. कुछ टेक्स्ट का चयन करें और `Ctrl+Alt+T` (या मैक पर `Cmd+Alt+T`) दबाएं।

## कमांड

| कमांड | शॉर्टकट | विवरण |
|---------|----------|-------------|
| **Polyglot: टेक्स्ट का अनुवाद करें** | `Ctrl+Alt+T` | चयनित टेक्स्ट का सीधे अनुवाद करें। |
| **Polyglot: Translate File** | — | वर्तमान फ़ाइल का एक नई फ़ाइल में अनुवाद करें। |
| **Polyglot: README का अनुवाद करें** | — | `README.md` फ़ाइल को कई भाषाओं में बैच में अनुवाद करें। |
| **Polyglot: Check Status** | — | Ollama कनेक्शन और मॉडल की उपलब्धता की जांच करें। |
| **Polyglot: Help** | — | सेटिंग, ट्यूटोरियल और लिंक तक त्वरित पहुंच। |

## पहुंच बिंदु

- **साइडबार पैनल** — एक्टिविटी बार में ग्लोब आइकन, जिसमें स्टाइलिश एक्शन बटन होते हैं।
- **एडिटर टाइटल बार** — जब टेक्स्ट का चयन किया जाता है तो ग्लोब आइकन दिखाई देता है।
- **राइट-क्लिक मेनू** — एडिटर के संदर्भ मेनू में "टेक्स्ट का अनुवाद करें"।
- **कमांड पैलेट** — `Ctrl+Shift+P` → "Polyglot" टाइप करें।
- **कीबोर्ड शॉर्टकट** — चयनित टेक्स्ट के साथ `Ctrl+Alt+T`।

## सेटिंग

| सेटिंग | डिफ़ॉल्ट | विवरण |
|---------|---------|-------------|
| `polyglot.ollamaUrl` | `http://localhost:11434` | Ollama सर्वर यूआरएल |
| `polyglot.model` | `translategemma:12b` | अनुवाद मॉडल (कम वीआरएएम के लिए `2b` का प्रयास करें) |
| `polyglot.defaultSourceLanguage` | `en` | अनुवाद के लिए स्रोत भाषा |
| `polyglot.defaultLanguages` | 7 भाषाएँ | README अनुवाद के लिए लक्षित भाषाएँ |

## समर्थित भाषाएँ

अरबी, बंगाली, बल्गेरियाई, कैटलन, चीनी (सरलीकृत और पारंपरिक), क्रोएशियाई, चेक, डैनिश, डच, अंग्रेजी, एस्टोनियाई, फिनिश, फ्रेंच, जर्मन, ग्रीक, गुजराती, हिब्रू, हिंदी, हंगेरियन, इंडोनेशियाई, इतालवी, जापानी, कन्नड़, कोरियाई, लातवियाई, लिथुआनियाई, मैसेडोनियाई, मलय, मलयालम, मराठी, नार्वेजियन, फारसी, पोलिश, पुर्तगाली, रोमानियाई, रूसी, सर्बियाई, स्लोवाक, स्लोवेनियाई, स्पेनिश, स्वाहिली, स्वीडिश, तमिल, तेलुगु, थाई, तुर्की, यूक्रेनी, उर्दू, वियतनामी और वेल्श।

## यह कैसे काम करता है

पॉलिग्लॉट [@mcptoolshop/polyglot-mcp](https://www.npmjs.com/package/@mcptoolshop/polyglot-mcp), एक स्थानीय अनुवाद इंजन को शामिल करता है जो:

1. यदि यह चल नहीं रहा है तो Ollama को स्वचालित रूप से शुरू करता है।
2. पहली बार उपयोग करने पर TranslateGemma मॉडल को स्वचालित रूप से डाउनलोड करता है।
3. लंबे टेक्स्ट को पैराग्राफ/वाक्य सीमाओं पर विभाजित करता है।
4. सटीक तकनीकी शब्दों के लिए एक सॉफ्टवेयर शब्दावली लागू करता है।
5. सामान्य मॉडल की कमियों को ठीक करता है (डुप्लिकेट विकल्प, अंतिम अवधि)।

README अनुवाद के लिए, यह बुद्धिमान विभाजन का उपयोग करता है — कोड ब्लॉक, HTML बैज और URL अपरिवर्तित रहते हैं, जबकि हेडिंग, पैराग्राफ और टेबल सामग्री का अनुवाद किया जाता है।

## सुरक्षा और डेटा दायरा

**डेटा जिन पर प्रभाव पड़ता है:** सक्रिय एडिटर में मौजूद टेक्स्ट (चयन के लिए केवल पढ़ने की अनुमति, प्रतिस्थापन के लिए लिखने की अनुमति), "अनुवाद फ़ाइल" या "रीडमी फ़ाइल का अनुवाद" के लिए वर्कस्पेस में मौजूद फ़ाइलें (ये मूल फ़ाइलों के साथ नई फ़ाइलें बनाती हैं)। **डेटा जिन पर कोई प्रभाव नहीं पड़ता:** वर्कस्पेस के बाहर की कोई भी फ़ाइल, कोई भी ऑपरेटिंग सिस्टम क्रेडेंशियल, कोई भी ब्राउज़र डेटा। **नेटवर्क:** यह केवल स्थानीय ओलामा से जुड़ता है (`localhost:11434` डिफ़ॉल्ट रूप से) — **कोई भी डेटा क्लाउड पर नहीं भेजा जाता है।** कोई भी टेलीमेट्री डेटा एकत्र या भेजा नहीं जाता है।

## लाइसेंस

एमआईटी

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
